from typing import List, Mapping, Iterable, Optional
from io import TextIOBase
from datetime import datetime, timedelta

from bson import ObjectId

from combocurve.shared.csv_writer import CsvWriter
from combocurve.shared.str_helpers import titleize
from combocurve.shared.helpers import get_nested, split_in_chunks, ordered_values
from combocurve.shared.progress_notifier import WeightedProgressNotifier

from combocurve.utils.assumption_fields import ASSUMPTION_FIELDS
from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_FAILED


class ScenarioTableExporter:
    extra_columns_mapping = {
        'forecast': 'Forecast',
        'forecast_p_series': 'P-Series',
        'schedule': 'Schedule',
    }

    assumption_keys_not_in_assignment = set(['general_options'])

    well_headers_columns_order = [
        'well_name',
        'api14',
        'county',
    ]
    extra_columns_order = [
        'forecast',
        'forecast_p_series',
        'schedule',
    ]

    assumptions_column_order = ASSUMPTION_FIELDS

    def __init__(self, context, scenario_id: str, assignment_ids: List[str], assumption_keys_mapping: Mapping[str, str],
                 well_headers_mapping: Mapping[str, str], user_id: str, project: str, notification_id: str):
        self.special_columns_text = {
            'forecast': self._get_forecast_text,
            'forecast_p_series': self._get_p_series_text,
            'schedule': self._get_schedule_text,
            'ownership_reversion': self._get_ownership_reversion_text,
            'reserves_category': self._get_reserves_category_text,
            'general_options': self._get_general_options_text
        }

        self.context = context
        self.scenario_id = scenario_id
        self.assignment_ids = assignment_ids
        self.assumption_keys_mapping = assumption_keys_mapping
        self.well_headers_mapping = well_headers_mapping
        self.user_id = user_id
        self.project = project
        self.notification_id = notification_id

        self.general_options_name: Optional[str] = None

        weights = {'build_file': 9, 'upload': 1}
        self.progress_notifier = WeightedProgressNotifier(weights, self.context.pusher, self.notification_id,
                                                          self.context.subdomain, self.user_id)

    def export_with_lookup(self, batch_size=1000):
        try:
            scenario = self.context.scenarios_collection.find_one({'_id': ObjectId(self.scenario_id)},
                                                                  projection=['name', 'general_options'])

            general_options_id = scenario.get('general_options')
            if 'general_options' in self.assumption_keys_mapping and general_options_id:
                general_options = self.context.assumptions_collection.find_one({'_id': general_options_id},
                                                                               projection=['name'])
                if general_options:
                    self.general_options_name = general_options['name']

            csv_writer = CsvWriter(self._get_columns())

            for batch in split_in_chunks(self.assignment_ids, batch_size):
                self._write_batch_to_file(batch, csv_writer)
                self.progress_notifier.add_partial_progress('build_file', len(batch) / len(self.assignment_ids))

            csv_file = csv_writer.finish()
            file_url = self._upload_file(csv_file, scenario)
            self.progress_notifier.add_partial_progress('upload', 1)

            self._trigger_final_notification(file_url)

            return file_url
        except Exception as e:
            self._trigger_failed_notification()
            raise e

    def _write_batch_to_file(self, assignment_ids_batch: Iterable[str], writer: CsvWriter):
        assignments = self._get_assignments_with_lookup(assignment_ids_batch)

        # TODO: can be optimized with a projection to get only the necessary fields
        wells = list(
            self.context.wells_collection.find(
                {'_id': {
                    '$in': [ObjectId(id) for id in set([element['well'] for element in assignments])]
                }}))

        populated_assignments = self._populate_assignments(assignments, wells)
        rows = (self._to_row(asgmt) for asgmt in populated_assignments)

        writer.write_rows(rows)

    def _get_columns(self):
        well_headers_columns = ordered_values(self.well_headers_mapping, self.well_headers_columns_order)
        extra_columns = ordered_values(self.extra_columns_mapping, self.extra_columns_order)
        assumptions_columns = ordered_values(self.assumption_keys_mapping, self.assumptions_column_order)

        return [*well_headers_columns, *extra_columns, *assumptions_columns]

    def _get_assignments_with_lookup(self, assignment_ids: Iterable[str]):
        assignment_service = self.context.scenario_well_assignments_service
        assignment_assumption_keys = [
            key for key in self.assumption_keys_mapping.keys() if key not in self.assumption_keys_not_in_assignment
        ]
        return assignment_service.get_assignments(self.scenario_id,
                                                  assignment_ids=assignment_ids,
                                                  assumption_keys=assignment_assumption_keys,
                                                  fetch_lookup=True,
                                                  eval_type_curve_lookup_tables=True)

    def _get_forecast(self, forecast_data):
        return forecast_data if isinstance(forecast_data, ObjectId) else None

    def _get_type_curve(self, forecast_data):
        return forecast_data.get('typeCurve') if isinstance(forecast_data, dict) else None

    def _get_forecast_ids(self, assignments: Iterable[dict]):
        forecast_ids = (self._get_forecast(asgmt.get('forecast')) for asgmt in assignments)
        filtered_forecast_ids = [f for f in forecast_ids if f]
        type_curve_ids = (self._get_type_curve(asgmt.get('forecast')) for asgmt in assignments)
        filtered_type_curve_ids = [tc for tc in type_curve_ids if tc]
        return (filtered_forecast_ids, filtered_type_curve_ids)

    def _get_forecast_value(self, forecast_data, forecast_dict, type_curve_dict):
        forecast_id = self._get_forecast(forecast_data)
        if forecast_id:
            return forecast_dict[forecast_id]
        type_curve_id = self._get_type_curve(forecast_data)
        if type_curve_id:
            return type_curve_dict[type_curve_id]
        return None

    def _populate_assignments(self, assignments: Iterable[dict], wells: List[dict]):
        assignments_lst = list(assignments)

        assumption_ids = (asgmt.get(key) for asgmt in assignments_lst for key in self.assumption_keys_mapping.keys())
        valid_assumption_ids = [id for id in assumption_ids if id]
        assumptions_query = {'_id': {'$in': valid_assumption_ids}}
        assumptions = self.context.assumptions_collection.find(assumptions_query, projection=['name', 'econ_function'])

        (forecast_ids, type_curve_ids) = self._get_forecast_ids(assignments_lst)
        forecasts = self.context.forecasts_collection.find({'_id': {'$in': forecast_ids}}, projection=['name'])
        type_curves = self.context.type_curves_collection.find({'_id': {'$in': type_curve_ids}}, projection=['name'])

        schedule_ids = [asgmt.get('schedule') for asgmt in assignments_lst if asgmt.get('schedule')]
        schedules = self.context.schedule_collection.find({'_id': {'$in': schedule_ids}}, projection=['name'])

        assumptions_dict = {asm['_id']: asm for asm in assumptions}
        forecasts_dict = {f['_id']: f for f in forecasts}
        type_curves_dict = {tc['_id']: tc for tc in type_curves}
        schedules_dict = {s['_id']: s for s in schedules}
        wells_dict = {w['_id']: w for w in wells}

        return ({
            **asgmt,
            **{key: assumptions_dict.get(asgmt[key])
               for key in self.assumption_keys_mapping.keys() if key in asgmt},
            'forecast': self._get_forecast_value(asgmt.get('forecast'), forecasts_dict, type_curves_dict),
            'schedule': schedules_dict.get(asgmt.get('schedule')),
            'well': wells_dict.get(asgmt['well']),
        } for asgmt in assignments_lst)

    def _to_row(self, assignment: dict):
        well_values = {display: self._get_text(assignment, key) for key, display in self.well_headers_mapping.items()}
        extra_values = {display: self._get_text(assignment, key) for key, display in self.extra_columns_mapping.items()}
        assumptions_values = {
            display: self._get_text(assignment, key)
            for key, display in self.assumption_keys_mapping.items()
        }
        return {**well_values, **extra_values, **assumptions_values}

    def _get_text(self, assignment: dict, key: str):
        if key in self.well_headers_mapping:
            return assignment['well'].get(key)

        special_get_text = self.special_columns_text.get(key)
        if special_get_text:
            return special_get_text(assignment)

        assumption = assignment.get(key)
        return assumption['name'] if assumption else None

    def _upload_file(self, csv_file: TextIOBase, scenario: dict):
        file_name = f'{scenario["name"]}_table_lookup_{datetime.utcnow():%Y-%m-%dT%H:%M:%S}.csv'
        file_data = {
            'name': file_name,
            'gcpName': file_name,
            'type': 'text/csv',
            'user': self.user_id,
        }

        self.context.file_service.upload_file(csv_file, file_data, self.user_id, self.project)

        return self.context.file_service.get_url(file_name, {
            'expiration': datetime.utcnow() + timedelta(minutes=30),
            'method': 'GET'
        })

    def _trigger_final_notification(self, file_name: str):
        self.context.notification_service.update_notification_with_notifying_target(self.notification_id, {
            'status': TASK_STATUS_COMPLETED,
            'description': 'Exported',
            'extra.output': {
                'file': {
                    'url': file_name
                }
            }
        })

    def _trigger_failed_notification(self):
        self.context.notification_service.update_notification_with_notifying_target(self.notification_id, {
            'status': TASK_STATUS_FAILED,
            'description': 'Failed'
        })

    @staticmethod
    def _get_p_series_text(assignment: dict):
        return assignment.get('forecast_p_series') or 'None'

    @staticmethod
    def _get_forecast_text(assignment: dict):
        assumption = assignment.get('forecast')
        return assumption['name'] if assumption else 'None'

    @staticmethod
    def _get_schedule_text(assignment: dict):
        assumption = assignment.get('schedule')
        return assumption['name'] if assumption else 'None'

    @staticmethod
    def _get_ownership_reversion_text(assignment: dict):
        ownership = get_nested(assignment, 'ownership_reversion', 'econ_function', 'ownership', 'initial_ownership')
        if not ownership:
            return None
        wi = ownership.get('working_interest')
        nri = get_nested(ownership, 'original_ownership', 'net_revenue_interest')

        return f'WI: {wi}% — NRI: {nri}%'

    @staticmethod
    def _get_reserves_category_text(assignment: dict):
        reserves_category = get_nested(assignment, 'reserves_category', 'econ_function', 'reserves_category')
        if not reserves_category:
            return None
        res_cat = reserves_category.get('prms_reserves_category')
        res_sub = reserves_category.get('prms_reserves_sub_category')
        res_class = reserves_category.get('prms_resources_class')

        formatted_res_class = str(res_class)[0].upper()
        formatted_res_cat = titleize(str(res_cat))
        formatted_res_sub = titleize(str(res_sub))

        return f'{formatted_res_class}, {formatted_res_cat}, {formatted_res_sub}'

    def _get_general_options_text(self, assignment: dict):
        return self.general_options_name
