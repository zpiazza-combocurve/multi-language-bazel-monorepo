from bson import ObjectId
from ..utils.assumption_fields import ASSUMPTION_FIELDS

NON_ASSUMPTION_FIELDS = ['forecast', 'forecast_p_series', 'schedule', 'network']
QUALIFIER_FIELDS = ASSUMPTION_FIELDS + NON_ASSUMPTION_FIELDS

DEFAULT_VALUES = {
    'forecast_p_series': 'P50',
}

# for roll up only using the active qualifier
# it's ok to assume that 0 is the active qualifier 'cause the assignment comes from `get_qualifier_path`
# https://github.com/insidepetroleum/python-combocurve/pull/528#discussion_r524660924
ACTIVE_QUALIFIER = 0


def get_assignment_field(assignment, field):
    if field in assignment and assignment[field]:
        field_assign = assignment[field]
        qualifier_key = list(field_assign.keys())[ACTIVE_QUALIFIER]
        qualifier_assign = field_assign[qualifier_key]
        if qualifier_assign.get('model') or qualifier_assign.get('lookup') or qualifier_assign.get('tcLookup'):
            return field_assign
        elif field in DEFAULT_VALUES:
            # only for forecast_p_series now
            default_value = DEFAULT_VALUES[field]
            return {qualifier_key: {'model': default_value}}
    return {'default': {'model': None}}


def apply_defaults(assignment):
    qualifier_fields = {field: get_assignment_field(assignment, field) for field in QUALIFIER_FIELDS}
    return {**assignment, **qualifier_fields}


def get_qualifier_path(columns, field):
    active = columns[field]['activeQualifier']
    return {active: f'${field}.{active}'}


def get_qualifier_projection(field, combos_transform):
    qualifiers = combos_transform[field]
    return {qualifier: 1 for qualifier in qualifiers}


def remove_qualifier_level(assignments):
    for assign in assignments:
        for field in QUALIFIER_FIELDS:
            if field in assign and assign[field]:
                field_assign = assign[field]
                qualifier_key = list(field_assign.keys())[ACTIVE_QUALIFIER]
                assign[field] = field_assign[qualifier_key]
            else:
                continue
    return assignments


def fetch_lookup_table(lookup_table_service, assignments, eval_type_curve_lookup_tables=False):
    lookup_tables = lookup_table_service.batch_get_lookup_tables(
        assignments, include_type_curve_lookup_tables=eval_type_curve_lookup_tables)
    assignments = lookup_table_service.evaluate_scenario_well_assignments(assignments, lookup_tables,
                                                                          eval_type_curve_lookup_tables)
    return assignments


class ScenarioWellAssignmentService(object):
    '''
    required collections/services:
    lookup_table_service
    scenarios_collection
    scenario_well_assignments_collection
    '''
    def __init__(self, context):
        self.context = context

    def get_assignment_agg_pipeline(
        self,
        qualifiers_projection,
        assignment_ids=None,
        scenario_id=None,
        query_sort=True,
    ):
        qualifiers_projection_modified = {}
        for key, value in qualifiers_projection.items():
            for value in value.keys():
                qualifiers_projection_modified[key + '.' + value] = 1

        if assignment_ids:
            match_dict = {'_id': {'$in': [ObjectId(_id) for _id in assignment_ids]}}
        elif scenario_id:
            match_dict = {'scenario': ObjectId(scenario_id)}
        else:
            raise Exception('assignment_ids and scenario_id can not be None at same time')

        pipeline = [
            {
                '$match': match_dict
            },
            {
                '$lookup': {
                    'from': 'wells',
                    'localField': 'well',
                    'foreignField': '_id',
                    'as': 'well_header_info'
                }
            },
            {
                '$unwind': '$well_header_info'
            },
            {
                '$project': {
                    # **qualifiers_projection,
                    **qualifiers_projection_modified,
                    'well_header_info': True,
                    'well': '$well_header_info._id',
                    'index': True,
                }
            },
        ]

        if query_sort:
            pipeline.append({'$sort': {'well': 1, 'index': 1}})

        return pipeline

    def get_combos_by_scenario_id(self, scenario_id):
        scenario = self.context.scenarios_collection.find_one({'_id': ObjectId(scenario_id)})
        columns = scenario['columns']
        qualifiers = {}
        for col in columns:
            key = columns[col]['activeQualifier']
            name = columns[col]['qualifiers'][key]['name']
            qualifiers[col] = {'key': key, 'name': name}
        combos = [{'name': 'Default', 'qualifiers': qualifiers}]
        return combos

    def get_assignments(
        self,
        scenario_id,
        assignment_ids=None,
        assumption_keys=None,
        fetch_lookup=True,
        query_sort=True,
        eval_type_curve_lookup_tables=False,
    ):
        if assumption_keys is None:
            assumption_keys = ASSUMPTION_FIELDS

        scenario = self.context.scenarios_collection.find_one({'_id': ObjectId(scenario_id)})
        columns = scenario['columns']

        qualifiers_projection = {
            field: get_qualifier_path(columns, field)
            for field in [*NON_ASSUMPTION_FIELDS, *assumption_keys] if field in columns
        }

        pipeline = self.get_assignment_agg_pipeline(qualifiers_projection, assignment_ids, scenario_id, query_sort)

        assignments = list(self.context.scenario_well_assignments_collection.aggregate(pipeline, allowDiskUse=True))
        assignments = [apply_defaults(a) for a in assignments]

        # project custom header
        project_headers_data = {}
        project = scenario.get('project')
        wells = [ObjectId(assignment['well']) for assignment in assignments]
        if project:
            project_headers = self.context.project_custom_headers_service.get_custom_headers_in_project(project)
            project_headers_data = self.context.project_custom_headers_service.get_custom_headers_data(
                project, wells, project_headers)

        for assignment in assignments:
            assignment['well_header_info'].update(project_headers_data.get(assignment['well'], dict()))

        # assignments after lookup tables evaluation
        if fetch_lookup:
            assignments = fetch_lookup_table(self.context.lookup_table_service, assignments,
                                             eval_type_curve_lookup_tables)

        assignments = remove_qualifier_level(assignments)

        for assign in assignments:
            assign['incremental_index'] = assign.get('index', 0)

        return assignments

    def get_assignments_with_combos(self,
                                    assignment_ids,
                                    project_id,
                                    assumption_keys=None,
                                    combos=None,
                                    eval_type_curve_lookup_tables=False):
        if assumption_keys is None:
            assumption_keys = ASSUMPTION_FIELDS

        combos_transform = {}
        for c in combos:
            for col in c['qualifiers']:
                combos_transform[col] = combos_transform.get(col) or []
                combos_transform[col].append(c['qualifiers'][col]['key'])

        qualifiers_projection = {
            field: get_qualifier_projection(field, combos_transform)
            for field in [*NON_ASSUMPTION_FIELDS, *assumption_keys] if field in combos_transform
        }

        pipeline = self.get_assignment_agg_pipeline(qualifiers_projection, assignment_ids)

        assignments = list(self.context.scenario_well_assignments_collection.aggregate(pipeline))

        well_ids = [i['well'] for i in assignments]

        # project custom header
        project_headers_data = {}
        if project_id:
            project_oid = ObjectId(project_id)
            project_headers = self.context.project_custom_headers_service.get_custom_headers_in_project(project_oid)
            project_headers_data = self.context.project_custom_headers_service.get_custom_headers_data(
                project_oid, well_ids, project_headers)

        for assignment in assignments:
            assignment['well_header_info'].update(project_headers_data.get(assignment['well'], dict()))

        assignments = fetch_lookup_table(self.context.lookup_table_service, assignments, eval_type_curve_lookup_tables)

        flat_assignments = []

        for assign in assignments:
            well_id = assign['well']
            well_header_info = assign['well_header_info']
            incremental_index = assign.get('index', 0)
            for combo in combos:
                qualifiers = combo['qualifiers']
                well_combo_assign = {
                    'assignment_id': assign['_id'],
                    'well': well_id,
                    'well_header_info': well_header_info,
                    'incremental_index': incremental_index,
                    'combo_name': combo['name'],
                }

                for field in [*NON_ASSUMPTION_FIELDS, *assumption_keys]:
                    if field in qualifiers:
                        qualifier = qualifiers[field]['key']
                        assigned_item = assign[field].get(qualifier) if field in assign else None
                    else:
                        assigned_item = None

                    if assigned_item is None and field in DEFAULT_VALUES:
                        assigned_item = DEFAULT_VALUES[field]

                    well_combo_assign[field] = assigned_item

                flat_assignments.append(well_combo_assign)

        return flat_assignments, project_headers_data

    def assignment_bulk_write(self, command_list):
        return self.context.scenario_well_assignments_collection.bulk_write(command_list)
