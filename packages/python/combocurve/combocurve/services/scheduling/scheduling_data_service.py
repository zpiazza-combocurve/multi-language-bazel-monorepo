import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Iterable, Optional, Union
import pandas as pd
from bson import ObjectId
from pymongo import UpdateOne
from combocurve.services.lookup_table_service import evaluate_lookup_table
from combocurve.utils.constants import TASK_STATUS_COMPLETED, TASK_STATUS_FAILED
from combocurve.science.scheduling.scheduling_data_models import OutputModel, ScheduleSettings, ScheduleWellInfo
from combocurve.science.scheduling.utils import build_empty_events, create_chunks, parse_schedule

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext

# Should match fields from the new-schedule-config migration in combocurve-utils-js
V1_STEP_FIELDS = {'Pad Preparation': 'preparation', 'Spud': 'spud', 'Drill': 'drill', 'Completion': 'complete'}

SCHEDULE_SUCCESS = {'FEASIBLE', 'OPTIMAL'}
WRITE_STATUS = SCHEDULE_SUCCESS | {None}
ASSUMPTIONS = {
    'dates',
    'ownership_reversion',
    'expenses',
    'capex',
    'production_taxes',
    'pricing',
    'reserves_category',
    'depreciation',
    'escalation',
    'risking',
    'stream_properties',
    'differentials',
}  #TODO: Need to find out if there's a single source of truth for these fields.
P_SERIES_KEY = 'p_series'


def column_type(column_header: str):
    return f'{column_header}_type'


class AssumptionIdType(str, Enum):
    MODEL_KEY = 'model'
    LOOKUP_KEY = 'lookup'
    FORECAST_KEY = 'forecast'


class SchedulingDataService():
    def __init__(self, context: 'APIContext'):
        self.context = context

    def write_scheduling_results(
        self,
        df_assignments: Optional[pd.DataFrame],
        unscheduled_wells: list[ObjectId],
        construction: ObjectId,
        schedule: ObjectId,
        project: ObjectId,
        resource_names: dict[int, str],
        activity_step_names: dict[int, str],
        scheduler_status: Optional[str],
        instant_fpd_wells: Optional[list[ObjectId]],
        frozen_wells: Optional[set[ObjectId]],
        start_program: Optional[int],
    ) -> dict:
        """Write the output of the OrToolsScheduler to the database.

        Args:
            df_assignmnets: The DataFrame produced from the OrToolsScheduler.orchestrator() method
                required fields are:
                job: The well ids as ObjectId.
                task: The step ids as int.
                machine: The resource ids as int.
                subtask: strings mob, main, or demob.
                start: The start of the subtask as int.
                end: The end of subtask as int.
            unscheduled_wells: Wells within that schedule that weren't scheduled, e.g., because they
                have a status of producing.
            construction: The id of the schedule-constructions document.
            schedule: The id of the schedules document.
            project: The id of the project.
            resource_names: A mapping from the resource index to its name. The resource index
                should be the position of the resource in the resources arry of the schedule-settings
                document.
            activity_step_names: A mapping from the activity step index to its name. The activity
                step index should be the value of the stepIdx field in the associated document within
                the activitySteps array of the schedule-settings document.
            scheduler_status: The resulting status from running the scheduler.
            instant_fpd_wells: Wells within the schedule whose status is the last task
            frozen_wells: Wells for which the user has fixed the schedule
            start_program: Schedule start date
        Returns:
            dict(): construction_output
        """

        if scheduler_status in WRITE_STATUS:
            updates = []
            for well, output in build_empty_events(unscheduled_wells, activity_step_names):
                update_filter = {'construction': construction, 'project': project, 'schedule': schedule, 'well': well}
                updates.append(UpdateOne(update_filter, {"$set": {'output': output.dict()}}, upsert=True))

            for well, output in build_empty_events(instant_fpd_wells, activity_step_names):
                update_filter = {'construction': construction, 'project': project, 'schedule': schedule, 'well': well}
                output.FPD = start_program + 1
                updates.append(UpdateOne(update_filter, {"$set": {'output': output.dict()}}, upsert=True))

            if scheduler_status in SCHEDULE_SUCCESS:
                parsed_output = parse_schedule(df_assignments, resource_names, activity_step_names)
                for well, output in parsed_output:
                    update_filter = {
                        'construction': construction,
                        'project': project,
                        'schedule': schedule,
                        'well': well,
                        'method': 'auto' if well not in frozen_wells else 'manual'
                    }
                    updates.append(UpdateOne(update_filter, {"$set": {'output': output.dict()}}, upsert=True))

            for chunk in create_chunks(updates):
                self.context.schedule_well_outputs_collection.bulk_write(chunk)

            self.context.schedule_constructions_collection.find_one_and_update(
                {'_id': construction},
                {'$set': {
                    'run.status': 'succeeded',
                    'run.finish': datetime.datetime.utcnow().isoformat(),
                }})

            self.context.schedules_collection.update_one({'_id': schedule},
                                                         {'$set': {
                                                             'constructed': True,
                                                             'modified': False,
                                                         }})

            schedule_status = TASK_STATUS_COMPLETED

        else:
            schedule_status = TASK_STATUS_FAILED
            self.write_failure(schedule, construction, error={'message': 'scheduler status not FEASIBLE or OPTIMAL'})

        return schedule_status

    def write_failure(self, schedule: ObjectId, construction: ObjectId, error: dict[str, Any]):
        self.context.schedules_collection.update_one({'_id': schedule},
                                                     {'$set': {
                                                         'constructed': False,
                                                         'modified': False,
                                                     }})
        self.context.schedule_constructions_collection.find_one_and_update(
            {'_id': construction}, {'$set': {
                'run.status': 'failed',
                'run.error': error,
            }})

    def schedule_well_info(self, schedule: ObjectId) -> list[ScheduleWellInfo]:
        '''Fetch well info needed for scheduler.

        Args:
        -----
            schedule: The id of the schedule to fetch the wells for.

        Returns:
        --------
            list[dict[str, Union[str, ObjectId, int]]]: A list of well information int the format:
            {
                'pad_name': Optional[str],
                'rank': Optional[int],
                'status': str,
                'well': ObjectId,
            }
        '''
        pipeline = [
            {
                '$match': {
                    '_id': schedule
                }
            },
            {
                '$unwind': '$inputData'
            },
            {
                '$lookup': {
                    'localField': 'inputData.well',
                    'from': 'wells',
                    'foreignField': '_id',
                    'as': 'pad_info'
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'pad_name': {
                        '$first': '$pad_info.pad_name'
                    },
                    'rank': '$inputData.priority',
                    'status': '$inputData.status',
                    'well': '$inputData.well',
                }
            },
            {
                '$fill': {
                    'output': {
                        'pad_name': {
                            'value': None
                        }
                    }
                }
            },
        ]
        return [ScheduleWellInfo(**doc) for doc in self.context.schedules_collection.aggregate(pipeline)]

    def schedule_frozen_well_info(self, schedule: ObjectId) -> list:
        '''Fetch frozen well info needed for scheduler from previous scheduling run.

        Args:
        -----
            schedule: The id of the schedule to fetch the frozen well outputs for.

        Returns:
        --------
            list[dict]: A list of frozen well outputs from the previous run. The shape of the output data is:
            {
                'well': ObjectId,
                'output': {
                    'events: {
                        [
                            {
                                'activityStepIdx': int,
                                'activityStepName': str,
                                'demob': {'start': int, 'end': int},
                                'mob': {'start': int, 'end': int},
                                'resourceIdx': int,
                                'resourceName': str,
                                'work': {'start': int, 'end': int},
                            },
                        ],
                    },
                    'FPD: int,
                },
            }
        '''
        pipeline = [{
            '$match': {
                '$and': [{
                    'schedule': schedule
                }, {
                    'method': "manual"
                }]
            }
        }, {
            '$project': {
                'well': 1,
                'output': 1
            }
        }]
        frozen_wells_info = self.context.schedule_well_outputs_collection.aggregate(pipeline)
        return [doc for doc in frozen_wells_info]

    def schedule_model_validation_info(self, schedule: ObjectId, well_ids: list[str]) -> list:
        '''Fetch the inputData filtered by the provided well ids

        Args:
        -----
            schedule: The id of the schedule to fetch the wells for.
            well_ids: The user-provided list of well ids to filter the return by.

        Returns:
        --------
            inputData: the filtered inputData associated with the schedule
        '''
        pipeline = [{
            '$match': {
                '_id': schedule,
            }
        }, {
            '$unwind': '$inputData'
        }, {
            '$match': {
                'inputData.well': {
                    '$in': [ObjectId(w) for w in well_ids]
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'inputData': 1
            }
        }]
        return [doc for doc in self.context.schedules_collection.aggregate(pipeline)]

    @staticmethod
    def schedule_settings(schedule_settings: dict[str, Any]) -> ScheduleSettings:
        '''Parse schedule settings required for scheduler.

        Args:
        -----
            schedule_settings: Parse the data into a ScheduleSettings object.

        Returns:
        --------

        '''
        return ScheduleSettings.from_db_record(schedule_settings)

    def batch_get_schedule_v1(self, batch_assignment_df: pd.DataFrame):
        '''*DEPRECATED* Fetch schedule ouputs and formats like V1 outputs.

        This method is built for compatability between the new scheduling output data
        format and functions downstream of the scenario_page_query_service. If you
        need to interface with the scheduling data moving forward, use schedule_outputs()
        below.

        Args:
        -----
            batch_assignment_df: Should include a `'well'` column and a `'schedule'` column.
            The values of the columns are ObjectIds used to indentify a document in
            the `schedule-well-outputs` collection

        Returns:
        --------
            list[dict]: A list of schedule-well-outputs in the V1 format. The shape of
            the output data is:
                {
                    'well': ObjectId,
                    'schedule': ObjectId,
                    'output': {
                        FPD: int,
                        completeDemobEnd: Optional[int],
                        completeDemobStart: Optional[int],
                        completeMobEnd: Optional[int],
                        completeMobStart: Optional[int],
                        completeWorkEnd: Optional[int],
                        completeWorkStart: Optional[int],
                        drillDemobEnd: Optional[int],
                        drillDemobStart: Optional[int],
                        drillMobEnd: Optional[int],
                        drillMobStart: Optional[int],
                        drillWorkEnd: int,
                        drillWorkStart: int,
                        preparationDemobEnd: Optional[int],
                        preparationDemobStart: Optional[int],
                        preparationMobEnd: Optional[int],
                        preparationMobStart: Optional[int],
                        preparationWorkEnd: Optional[int],
                        preparationWorkStart: Optional[int],
                        spudDemobEnd: Optional[int],
                        spudDemobStart: Optional[int],
                        spudMobEnd: Optional[int],
                        spudMobStart: Optional[int],
                        spudWorkEnd: Optional[int],
                        spudWorkStart: Optional[int],
                    }
                }
        '''
        schedule_well_combination = batch_assignment_df[['well', 'schedule']].to_dict('records')
        pipeline = [{
            '$match': {
                '$or': schedule_well_combination
            }
        }, {
            '$project': {
                '_id': 0,
                'well': 1,
                'schedule': 1,
                'output': 1
            }
        }, {
            '$sort': {
                'well': 1
            }
        }]
        well_outputs = self.context.schedule_well_outputs_collection.aggregate(pipeline)
        ret = []
        for well_output in well_outputs:
            v1_well_doc = {k: well_output[k] for k in ('well', 'schedule')}
            output = well_output['output']
            v1_output = _build_default_v1_output(output['FPD'])
            for event in output['events']:
                if (name := event['activityStepName']) in V1_STEP_FIELDS:
                    for activity in ('demob', 'mob', 'work'):
                        dates = event.get(activity, {'start': None, 'end': None})
                        for timestap in ('start', 'end'):
                            activity_key = f'{V1_STEP_FIELDS[name]}{activity.capitalize()}{timestap.capitalize()}'
                            v1_output[activity_key] = dates[timestap]
            v1_well_doc['output'] = v1_output
            ret.append(v1_well_doc)
        return ret

    def schedule_outputs(self, schedule: Union[ObjectId, list[ObjectId]],
                         wells: Union[ObjectId, list[ObjectId]]) -> dict[tuple[ObjectId, ObjectId], OutputModel]:
        '''Fetch schedule outputs.

        The preferred, current way to access schedule outputs from the database.

        Args:
        -----
            schedule: If given as an `ObjectId`, uses the same schedule for all wells.
            If given as a `list[ObjectId]`, the list length should be the same as that of the wells.
            Uses a given schedule for the equivalent index position in the wells list.
            wells: a list of well Ids.

        Returns:
        --------
            dict[tuple[ObjectId, ObjectId], OutputModel]: A dictionary of outputs for each well, keyed
            on (schedule, well)-ids.
        '''
        if isinstance(schedule, ObjectId):
            if isinstance(wells, list):
                match_stage = {'$match': {'schedule': schedule, 'well': {'$in': wells}}}
            elif isinstance(wells, ObjectId):
                match_stage = {'$match': {'schedule': schedule, 'well': wells}}
        elif len(schedule) == len(wells):
            match_stage = {'$match': {'$or': [{'schedule': s, 'well': w} for s, w in zip(schedule, wells)]}}

        try:
            pipeline = [
                match_stage,
                {
                    '$project': {
                        '_id': 0,
                        'well': 1,
                        'schedule': 1,
                        'output': 1,
                    }
                },
            ]
        except NameError:
            raise ValueError('Available input types for (schedule, wells) are '
                             '(ObjectId, ObjectId), (ObjectId, list[ObjectId]), '
                             'or (list[ObjectId], list[ObjectId])')

        docs = self.context.schedule_well_outputs_collection.aggregate(pipeline)

        return {(d['schedule'], d['well']): OutputModel.parse_obj(d['output']) for d in docs}

    def schedule_input_table(self, input_table: pd.DataFrame, project_id: ObjectId):
        '''Fetch the input data for fpd ranking by well.'''
        headers = self.context.project_custom_headers_service.get_well_headers_with_custom_headers(
            project_id, input_table.index.values.tolist())

        assumptions_in_table = ASSUMPTIONS.intersection(input_table)
        filled_table = input_table.copy()
        self._fill_lookups(filled_table, assumptions_in_table, headers)

        unique_assumption_models = self._get_unique_ids_by_key(
            filled_table,
            assumptions_in_table,
            AssumptionIdType.MODEL_KEY,
        )

        assumptions_by_id = self._get_assumptions(unique_assumption_models)

        forecasts = self._get_table_forecast_data(input_table)

        for k, v in assumptions_by_id.items():
            filled_table.replace({k: v}, inplace=True)
        for well, forecast in forecasts.items():
            filled_table.at[well, AssumptionIdType.FORECAST_KEY] = forecast

        return headers, filled_table

    def _fill_lookups(self, table: pd.DataFrame, columns: Iterable[str], headers: dict[ObjectId, Any]):
        unique_lookup_tables = self._get_unique_ids_by_key(
            table,
            columns,
            AssumptionIdType.LOOKUP_KEY,
        )
        unique_lookup_tables = {
            doc['_id']: doc
            for doc in self.context.lookup_tables_collection.find({'_id': {
                '$in': list(unique_lookup_tables)
            }})
        }
        for assumption in columns:
            type_key = column_type(assumption)
            for well, _ in table[table[type_key] == AssumptionIdType.LOOKUP_KEY].iterrows():
                _id = evaluate_lookup_table(unique_lookup_tables[table.at[well, assumption]], headers[well], assumption,
                                            'lookup')
                table.at[well, assumption] = _id
                if _id is None:
                    table.at[well, type_key] = None
                elif assumption == AssumptionIdType.FORECAST_KEY:
                    table.at[well, type_key] = AssumptionIdType.FORECAST_KEY
                else:
                    table.at[well, type_key] = AssumptionIdType.MODEL_KEY

    def _get_unique_ids_by_key(self, input_table: pd.DataFrame, columns: Iterable[str], group_key: AssumptionIdType):
        unique_group = set()
        for assumption in columns:
            assumption_column = input_table[assumption]
            unique_group.update(assumption_column[input_table[column_type(assumption)] == group_key].dropna().unique())
        return unique_group

    def _get_assumptions(self, unique_assumption_models: Iterable[ObjectId]):
        assumptions_pipeline = [{
            '$match': {
                '_id': {
                    '$in': list(unique_assumption_models)
                }
            }
        }, {
            '$project': {
                'assumption_key': '$assumptionKey',
                'econ_function': 1,
                'embedded': '$embeddedLookupTables',
                'name': 1,
                'unique': 1,
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': ['$econ_function', '$$ROOT']
                }
            }
        }, {
            '$unset': 'econ_function'
        }]
        return {doc.pop('_id'): [doc] for doc in self.context.assumptions_collection.aggregate(assumptions_pipeline)}

    def _get_table_forecast_data(self, input_table: pd.DataFrame):
        well_forecast_pairs = []
        for well, row in input_table[input_table[column_type(AssumptionIdType.FORECAST_KEY)] ==
                                     AssumptionIdType.FORECAST_KEY].iterrows():
            if (forecast := row[AssumptionIdType.FORECAST_KEY]) is not None:
                well_forecast_pairs.append({'well': well, 'forecast': forecast})
        forecasts = {}
        for collection in (self.context.deterministic_forecast_datas_collection,
                           self.context.forecast_datas_collection):
            for doc in collection.aggregate([{
                    '$match': {
                        '$or': well_forecast_pairs
                    }
            }, {
                    '$project': {
                        '_id': 0,
                        'ratio': 1,
                        'data_freq': 1,
                        'forecasted': 1,
                        'phase': 1,
                        'forecastType': 1,
                        'forecastSubType': 1,
                        'typeCurve': 1,
                        'forecast': 1,
                        'P_dict': 1,
                        'well': 1
                    }
            }]):
                well = doc['well']
                if doc['forecasted']:
                    phase_data = {doc['phase']: doc}
                else:
                    phase_data = {doc['phase']: None}
                forecasts[well] = forecasts.get(well, {}) | phase_data

        return forecasts

    def econ_input_for_schedule(self, headers: dict[ObjectId, Any], filled_schedule_table: pd.DataFrame):
        '''Fill in the lookup tables and munge into the shape of the ouput from `econ_batch_input`.'''
        result = []
        #TODO: Might need to sort this on... something?
        for well, row in filled_schedule_table.iterrows():
            result.append({
                'assignment_id': None,  #TODO: Is this needed?
                'production_data': {
                    'oil': None,
                    'gas': None,
                    'water': None
                },
                'forecast_data': row[AssumptionIdType.FORECAST_KEY],
                'p_series': row[P_SERIES_KEY],
                'well': headers[well],
                'incremental_index': 0,  #TODO: Is this needed?
                'combo_name': None,  #TODO: Is this needed?
                'assumptions': {
                    assumption_key: {k: v
                                     for k, v in assumption.items() if k != 'assumption_key'}
                    for assumption_key in ASSUMPTIONS.intersection(filled_schedule_table)
                    if not pd.isnull(assumption := row[assumption_key])
                },
                'oil_tc_risking': None,  #TODO: Is this needed?
                'forecast_name': None,  #TODO: Is this needed?
                'gas_tc_risking': None,  #TODO: Is this needed?
                'water_tc_risking': None,  #TODO: Is this needed?
                'apply_normalization': None,  #TODO: Is this needed?
                'network': None,  #TODO: Is this needed?
                'ghg': None,  #TODO: Is this needed?
                'schedule': {},  #TODO: Is this needed?
            })

        self.context.embedded_lookup_table_service.fill_in_embedded_lookup(result)
        return result


def _build_default_v1_output(FPD: int):
    return {
        'FPD': FPD,
        'completeDemobEnd': None,
        'completeDemobStart': None,
        'completeMobEnd': None,
        'completeMobStart': None,
        'completeWorkEnd': None,
        'completeWorkStart': None,
        'drillDemobEnd': None,
        'drillDemobStart': None,
        'drillMobEnd': None,
        'drillMobStart': None,
        'drillWorkEnd': None,
        'drillWorkStart': None,
        'preparationDemobEnd': None,
        'preparationDemobStart': None,
        'preparationMobEnd': None,
        'preparationMobStart': None,
        'preparationWorkEnd': None,
        'preparationWorkStart': None,
        'spudDemobEnd': None,
        'spudDemobStart': None,
        'spudMobEnd': None,
        'spudMobStart': None,
        'spudWorkEnd': None,
        'spudWorkStart': None,
    }
