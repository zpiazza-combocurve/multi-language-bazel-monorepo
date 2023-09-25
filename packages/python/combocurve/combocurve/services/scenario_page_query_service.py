from typing import TYPE_CHECKING
from bson.objectid import ObjectId
import numpy as np
import pandas as pd
from copy import deepcopy
from combocurve.utils.constants import USER_NOTIFICATION_UPDATE_EVENT_NAME

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext

ECON_FUNCTION = 'econ_function'
NAME = 'name'
UNIQUE = 'unique'
ASSUMPTION_KEY = 'assumptionKey'
OPTIONS = 'options'
SUM_ITEMS = 'subItems'
ESCALATION_MODEL = 'escalation_model'
DEPRECIATION_MODEL = 'depreciation_model'
PRODUCTION_TAXES = "production_taxes"
VALUE = 'value'
PRICE_MODEL = 'price_model'
DIFFERENTIALS_MODEL = "differentials"
VARIABLE_EXPENSES = 'variable_expenses'
FIXED_EXPENSES = 'fixed_expenses'
WATER_DISPOSAL = 'water_disposal'
CARBON_EXPENSES = 'carbon_expenses'
OTHER_CAPEX = 'other_capex'
DRILLING_COST = 'drilling_cost'
COMPLETION_COST = 'completion_cost'
ROW_VIEW = 'row_view'
ROWS = 'rows'
HEADERS = 'headers'
NONE = 'none'
CRITERIA = 'criteria'
SEV_TAX = 'severance_tax'
AD_VAL_TAX = 'ad_valorem_tax'


class ScenarioPageQueryService(object):
    '''
    required collections/services:
    pusher
    scenarios_collection
    assumptions_collection
    schedule_well_outputs_collection
    scenario_well_assignments_collection
    '''
    def __init__(self, context: 'APIContext'):
        self.context = context

    def get_general_options(self, scenario_id, assignment_ids=[]):
        scenario = self.context.scenarios_collection.find_one({'_id': scenario_id}, {
            'general_options': 1,
            'modular': 1,
        })

        if scenario.get('modular', False) is True:
            if len(assignment_ids):
                assignment_id = assignment_ids[0]
                general_options_id = self.context.scenario_well_assignments_collection.find_one({
                    '_id': assignment_id
                }, {
                    'general_options': 1
                }).get('general_options')
        else:
            general_options_id = scenario.get('general_options')

        if general_options_id is None:
            return None
        else:
            general_options = self.context.assumptions_collection.find_one({'_id': general_options_id},
                                                                           {ECON_FUNCTION: 1})
            if general_options is None:
                return None
            else:
                return general_options[ECON_FUNCTION]

    def get_sort_schedules(self, assignment_df, sort_well_schedule_pair):
        if 'schedule' not in list(assignment_df):
            return [{}] * len(sort_well_schedule_pair)

        schedule = self.context.scheduling_data_service.batch_get_schedule_v1(assignment_df)

        schedule_array = np.array(schedule)
        well_id_array = np.array([d['well'] for d in schedule])
        schedule_id_array = np.array([d['schedule'] for d in schedule])

        sort_schedules = []
        for pair in sort_well_schedule_pair:
            well_id = pair['well']
            schedule = pair['schedule']

            this_schedule_list = schedule_array[(well_id_array == well_id) & (schedule_id_array == schedule)]

            if len(this_schedule_list) == 1:
                sort_schedules.append(this_schedule_list[0]['output'])
            else:
                sort_schedules.append({})

        return sort_schedules

    def get_networks(self, assignment_df):
        networks_map = self.context.carbon_service.get_networks_map(assignment_df)

        return {(str(row[1]['well']), row[1]['incremental_index'], row[1]['combo_name']):
                networks_map[row[1]['network']]
                for row in assignment_df.iterrows() if row[1]['network'] != 'not_valid'}

    @staticmethod
    def get_assumption_ids(ass_df, assumption_keys):
        use_assumption = deepcopy(assumption_keys)
        for k in assumption_keys:
            if k not in ass_df.columns:
                use_assumption.remove(k)

        unique_assump_id_list = []
        assumption_key_list = []
        for assump_key in use_assumption:
            col_assump_list = ass_df[assump_key].to_numpy()
            col_assump_list = col_assump_list[col_assump_list != 'not_valid']  # noqa: E711

            # convert all ids to ObjectId to prevent unique fail on array of different data type
            col_unique_assump = np.unique([ObjectId(id) for id in col_assump_list]).tolist()

            unique_assump_id_list += col_unique_assump
            assumption_key_list += [assump_key] * len(col_unique_assump)

        return unique_assump_id_list, assumption_key_list, ass_df[use_assumption]

    def batch_get_assumptions(self, assumption_ids, need_options=False):
        project_dict = {ASSUMPTION_KEY: 1, ECON_FUNCTION: 1, NAME: 1, UNIQUE: 1, 'embeddedLookupTables': 1}
        if need_options:
            project_dict[OPTIONS] = 1
        return list(self.context.assumptions_collection.find({'_id': {'$in': assumption_ids}}, project_dict))

    def process_capex(self, econ_function, options, append_to_escalation_ids):
        # drilling_cost and completion_cost
        for sub_model_key in [DRILLING_COST, COMPLETION_COST]:
            if econ_function.get(sub_model_key):
                for field in [ESCALATION_MODEL, DEPRECIATION_MODEL]:
                    model_value = options[sub_model_key][field][VALUE]
                    econ_function[sub_model_key][field] = model_value
                    append_to_escalation_ids(model_value)

        # other_capex
        for i, row in enumerate(options[OTHER_CAPEX][ROW_VIEW][ROWS]):
            for field in [ESCALATION_MODEL, DEPRECIATION_MODEL]:
                model_value = row[field][VALUE]
                econ_function[OTHER_CAPEX][ROWS][i][field] = model_value
                append_to_escalation_ids(model_value)

    def process_escalation_depreciation_production_taxes(self, assumption, append_to_escalation_ids):
        econ_function = assumption[ECON_FUNCTION]
        options = assumption.get(OPTIONS)
        # severance tax
        mapper = {"escalation_model_1": "severance_tax", "escalation_model_2": "severance_tax_2"}
        for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
            if phase in econ_function[SEV_TAX]:
                if ESCALATION_MODEL not in econ_function[SEV_TAX][phase]:
                    # old models
                    econ_function[SEV_TAX][phase][ESCALATION_MODEL] = {}
                for esc_model in ['escalation_model_1', 'escalation_model_2']:
                    try:
                        escalation_value = options[SEV_TAX][phase][SUM_ITEMS][ESCALATION_MODEL][SUM_ITEMS][ROW_VIEW][
                            HEADERS][esc_model][VALUE]
                    except Exception:
                        escalation_value = NONE
                    econ_function[SEV_TAX][phase][ESCALATION_MODEL][esc_model] = escalation_value
                    append_to_escalation_ids(escalation_value)
                    # add rows to escalation
                    sev_tax_rows = []
                    for item in options[SEV_TAX][phase][SUM_ITEMS][ROW_VIEW][ROWS]:
                        row_header = options[SEV_TAX][phase][SUM_ITEMS][ROW_VIEW][HEADERS][mapper[esc_model]][VALUE]
                        criteria_header = options[SEV_TAX][phase][SUM_ITEMS][ROW_VIEW][HEADERS][CRITERIA][VALUE]
                        sev_tax_rows.append({row_header: item[mapper[esc_model]], criteria_header: item[CRITERIA]})
                    econ_function[SEV_TAX][phase][ESCALATION_MODEL][mapper[esc_model]] = sev_tax_rows
        # ad valorem tax
        mapper = {"escalation_model_1": "ad_valorem_tax", "escalation_model_2": "ad_valorem_tax_2"}
        if ESCALATION_MODEL not in econ_function[AD_VAL_TAX]:
            # old models
            econ_function[AD_VAL_TAX][ESCALATION_MODEL] = {}
        for esc_model in ['escalation_model_1', 'escalation_model_2']:
            try:
                escalation_value = options[AD_VAL_TAX][ESCALATION_MODEL][SUM_ITEMS][ROW_VIEW][HEADERS][esc_model][VALUE]
            except Exception:
                escalation_value = NONE
            econ_function[AD_VAL_TAX][ESCALATION_MODEL][esc_model] = escalation_value
            append_to_escalation_ids(escalation_value)
            # add rows to escalation
            ad_val_rows = []
            for item in options[AD_VAL_TAX][ROW_VIEW][ROWS]:
                row_header = options[AD_VAL_TAX][ROW_VIEW][HEADERS][mapper[esc_model]][VALUE]
                criteria_header = options[AD_VAL_TAX][ROW_VIEW][HEADERS][CRITERIA][VALUE]
                ad_val_rows.append({row_header: item[mapper[esc_model]], criteria_header: item[CRITERIA]})
            econ_function[AD_VAL_TAX][ESCALATION_MODEL][mapper[esc_model]] = ad_val_rows

    def process_escalation_depreciation(self, assumptions):  # noqa: C901
        '''
        this function will get escalation_id from options and put it in econ_function to:
        1. make it consistent with FE selection
        2. try to make sure it is in string format
        '''
        def append_to_escalation_ids(escalation_value):
            if escalation_value != NONE:
                escalation_ids.append(ObjectId(escalation_value))

        escalation_ids = []
        depreciation_ids = []

        for assumption in assumptions:
            assumption_key = assumption[ASSUMPTION_KEY]
            options = assumption.get(OPTIONS)
            econ_function = assumption[ECON_FUNCTION]

            if assumption_key == 'pricing':
                for phase in econ_function[PRICE_MODEL]:
                    try:
                        escalation_value = options[PRICE_MODEL][phase][SUM_ITEMS][ESCALATION_MODEL][VALUE]
                    except Exception:
                        escalation_value = NONE
                    econ_function[PRICE_MODEL][phase][ESCALATION_MODEL] = escalation_value
                    append_to_escalation_ids(escalation_value)

            elif assumption_key == PRODUCTION_TAXES:
                # to avoid complexity error of flake 8, a function was created.
                self.process_escalation_depreciation_production_taxes(assumption, append_to_escalation_ids)

            elif assumption_key == 'differentials':
                for diff in econ_function[DIFFERENTIALS_MODEL]:
                    for phase in econ_function[DIFFERENTIALS_MODEL][diff]:
                        try:
                            escalation_value = options[DIFFERENTIALS_MODEL][diff][SUM_ITEMS][phase][SUM_ITEMS][
                                ESCALATION_MODEL][VALUE]
                        except Exception:
                            escalation_value = NONE
                        econ_function[DIFFERENTIALS_MODEL][diff][phase][ESCALATION_MODEL] = escalation_value
                        append_to_escalation_ids(escalation_value)

            elif assumption_key == 'expenses':
                # variable_expenses
                for phase in econ_function[VARIABLE_EXPENSES]:
                    for cat in econ_function[VARIABLE_EXPENSES][phase]:
                        try:
                            escalation_value = options[VARIABLE_EXPENSES][phase][SUM_ITEMS][cat][SUM_ITEMS][
                                ESCALATION_MODEL][VALUE]
                        except Exception:
                            escalation_value = NONE
                        econ_function[VARIABLE_EXPENSES][phase][cat][ESCALATION_MODEL] = escalation_value
                        append_to_escalation_ids(escalation_value)

                # fixed_expenses
                for cat in econ_function[FIXED_EXPENSES]:
                    try:
                        escalation_value = options[FIXED_EXPENSES][cat][SUM_ITEMS][ESCALATION_MODEL][VALUE]
                    except Exception:
                        escalation_value = NONE
                    econ_function[FIXED_EXPENSES][cat][ESCALATION_MODEL] = escalation_value
                    append_to_escalation_ids(escalation_value)

                # carbon_expenses
                for comp in econ_function[CARBON_EXPENSES]:
                    if comp == 'category':
                        continue
                    try:
                        escalation_value = options[CARBON_EXPENSES][comp][SUM_ITEMS][ESCALATION_MODEL][VALUE]
                    except Exception:
                        escalation_value = NONE
                    econ_function[CARBON_EXPENSES][comp][ESCALATION_MODEL] = escalation_value
                    append_to_escalation_ids(escalation_value)

                # water_disposal
                try:
                    escalation_value = options[WATER_DISPOSAL][ESCALATION_MODEL][VALUE]
                except Exception:
                    escalation_value = NONE
                econ_function[WATER_DISPOSAL][ESCALATION_MODEL] = escalation_value
                append_to_escalation_ids(escalation_value)

            elif assumption_key == 'capex':
                if len(econ_function[OTHER_CAPEX][ROWS]) == 0:
                    continue
                self.process_capex(econ_function, options, append_to_escalation_ids)
            elif assumption_key == 'emission':
                for _values in econ_function['table']:
                    append_to_escalation_ids(_values[ESCALATION_MODEL])

        return escalation_ids, depreciation_ids

    def fetch_escalation_depreciation(self, assumptions):  # noqa: C901
        escalation_ids, depreciation_ids = self.process_escalation_depreciation(assumptions)
        escalation_depreciation_models = self.batch_get_assumptions(escalation_ids + depreciation_ids)

        id_to_model = {str(model['_id']): model[ECON_FUNCTION] for model in escalation_depreciation_models}
        id_to_model[NONE] = NONE

        for assumption in assumptions:
            assumption_key = assumption[ASSUMPTION_KEY]
            econ_function = assumption[ECON_FUNCTION]

            if assumption_key == 'pricing':
                for phase in econ_function[PRICE_MODEL]:
                    econ_function[PRICE_MODEL][phase][ESCALATION_MODEL] = id_to_model.get(
                        str(econ_function[PRICE_MODEL][phase][ESCALATION_MODEL]), NONE)

            elif assumption_key == PRODUCTION_TAXES:
                # severance tax
                for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
                    if phase in econ_function[SEV_TAX]:
                        for esc_model in ['escalation_model_1', 'escalation_model_2']:
                            econ_function[SEV_TAX][phase][ESCALATION_MODEL][esc_model] = \
                                id_to_model[econ_function[SEV_TAX][phase][ESCALATION_MODEL].get(esc_model, NONE)]
                # ad valorem tax
                for esc_model in ['escalation_model_1', 'escalation_model_2']:
                    econ_function[AD_VAL_TAX][ESCALATION_MODEL][esc_model] = \
                        id_to_model[econ_function[AD_VAL_TAX][ESCALATION_MODEL].get(esc_model, NONE)]

            elif assumption_key == DIFFERENTIALS_MODEL:
                for diff in econ_function[DIFFERENTIALS_MODEL]:
                    for phase in econ_function[DIFFERENTIALS_MODEL][diff]:
                        econ_function[DIFFERENTIALS_MODEL][diff][phase][ESCALATION_MODEL] = \
                            id_to_model[econ_function[DIFFERENTIALS_MODEL][diff][phase].get(ESCALATION_MODEL, NONE)]

            elif assumption_key == 'expenses':
                # variable_expenses
                for phase in econ_function[VARIABLE_EXPENSES]:
                    for cat in econ_function[VARIABLE_EXPENSES][phase]:
                        econ_function[VARIABLE_EXPENSES][phase][cat][ESCALATION_MODEL] = id_to_model.get(
                            str(econ_function[VARIABLE_EXPENSES][phase][cat][ESCALATION_MODEL]), NONE)

                # fixed_expenses
                for cat in econ_function[FIXED_EXPENSES]:
                    econ_function[FIXED_EXPENSES][cat][ESCALATION_MODEL] = id_to_model.get(
                        str(econ_function[FIXED_EXPENSES][cat][ESCALATION_MODEL]), NONE)

                # water_disposal
                econ_function[WATER_DISPOSAL][ESCALATION_MODEL] = id_to_model.get(
                    str(econ_function[WATER_DISPOSAL][ESCALATION_MODEL]), NONE)

                # carbon_disposal
                for comp in econ_function[CARBON_EXPENSES]:
                    if comp == 'category':
                        continue
                    econ_function[CARBON_EXPENSES][comp][ESCALATION_MODEL] = id_to_model.get(
                        str(econ_function[CARBON_EXPENSES][comp][ESCALATION_MODEL]), NONE)

            elif assumption_key == 'capex':
                # drilling_cost and completion_cost
                for sub_model_key in [DRILLING_COST, COMPLETION_COST]:
                    if econ_function.get(sub_model_key):
                        for field in [ESCALATION_MODEL, DEPRECIATION_MODEL]:
                            econ_function[sub_model_key][field] = id_to_model.get(
                                str(econ_function[sub_model_key][field]), NONE)

                if len(econ_function[OTHER_CAPEX][ROWS]) == 0:
                    continue

                # other_capex
                for row in econ_function[OTHER_CAPEX][ROWS]:
                    for field in [ESCALATION_MODEL, DEPRECIATION_MODEL]:
                        row[field] = id_to_model.get(str(row[field]), NONE)
            elif assumption_key == 'emission':
                for row_data in econ_function['table']:
                    row_data[ESCALATION_MODEL] = id_to_model.get(row_data[ESCALATION_MODEL], NONE)

    def fill_in_elu_escalation_and_depreciation(self, batch_input):
        elu_escalation_ids_set = set()
        escalation_indices = []

        for batch_idx, one_input in enumerate(batch_input):
            for assumption_key, assumption in one_input['assumptions'].items():
                if assumption.get('fetched_embedded'):
                    for elu_idx, lines in enumerate(assumption['fetched_embedded']):
                        for line_idx, line in enumerate(lines):
                            for field_idx, field in enumerate(line):
                                if (field['key'] in ('escalation_model', 'depreciation_model')
                                        and field['value'].lower() not in {'none', ''}):
                                    escalation_id = field['value']
                                    escalation_indices.append(
                                        (batch_idx, assumption_key, elu_idx, line_idx, field_idx, escalation_id))
                                    elu_escalation_ids_set.add(escalation_id)

        elu_escalation_models = self.batch_get_assumptions([ObjectId(_id) for _id in elu_escalation_ids_set])

        elu_escalation_id_to_model = {str(model['_id']): model[ECON_FUNCTION] for model in elu_escalation_models}

        for idx_tuple in escalation_indices:
            batch_idx, assumption_key, elu_idx, line_idx, field_idx, escalation_id = idx_tuple
            batch_input[batch_idx]['assumptions'][assumption_key]['fetched_embedded'][elu_idx][line_idx][field_idx][
                'value'] = deepcopy(elu_escalation_id_to_model[escalation_id])

    def get_sort_econ_function(self, assignment_df, assumption_keys, pusher_info=None):
        assumption_ids, assumption_keys, assumption_selection = self.get_assumption_ids(assignment_df, assumption_keys)
        assumption_id_to_key = dict(zip(assumption_ids, assumption_keys))

        assumptions = self.batch_get_assumptions(assumption_ids, True)

        self.fetch_escalation_depreciation(assumptions)

        sort_assumption = [a['_id'] for a in assumptions]
        sort_econ_function = [{
            **{
                UNIQUE: a[UNIQUE]
            },
            **{
                NAME: a[NAME]
            },
            **a[ECON_FUNCTION],
            'embedded': a.get('embeddedLookupTables', []),
        } for a in assumptions]

        assumption_selection_idx = np.ones(assumption_selection.shape, dtype=int) * -1
        col_names = list(assumption_selection)

        if pusher_info:
            user_id = pusher_info['user_id']
            notification_id = pusher_info['notification_id']
            progress_range = pusher_info['progress_range']

            prog_start = progress_range[0]
            prog_end = progress_range[1]

            assump_len = len(sort_assumption)
            update_freq = max(round(assump_len / 5), 1)

        for i, ass in enumerate(sort_assumption):
            this_assumption_key = assumption_id_to_key[ass]

            # use string comparison to prevent assigned model id been stored as str
            col_mask = np.array(assumption_selection[this_assumption_key].astype(str) == str(ass))

            col_assumption_selection_idx = assumption_selection_idx[:, col_names.index(this_assumption_key)]
            col_assumption_selection_idx[col_mask] = i

            if pusher_info and (i + 1) % update_freq == 0:
                '''
                only flex (CC to Aries) is updating the progress now,
                the context.pusher is the name on flex, the python is context.pusher_client
                need to unify them when need to use the progress on python
                '''
                well_prog = prog_start + round((prog_end - prog_start) * (i + 1) / assump_len)
                self.context.pusher.trigger_user_channel(self.context.subdomain, user_id,
                                                         USER_NOTIFICATION_UPDATE_EVENT_NAME, {
                                                             '_id': notification_id,
                                                             'progress': well_prog
                                                         })

        assumption_selection_idx = pd.DataFrame(assumption_selection_idx, columns=assumption_selection.columns)
        return sort_econ_function, assumption_selection_idx
