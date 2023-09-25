import datetime
import pandas as pd
from bson import ObjectId
import logging
from combocurve.services.econ.econ_and_roll_up_batch_query import roll_up_batch_input
from combocurve.services.rollUp.roll_up_calculation import (
    single_well_volume,
    single_well_volume_daily,
    sum_up_volume,
    calculate_well_count,
    ASSUMPTION_KEYS,
)
from combocurve.services.rollUp.batch_table_schema import (FORECAST_BATCH_TABLE_SCHEMA, SCENARIO_BATCH_TABLE_SCHEMA,
                                                           WELL_TABLE_SCHEMA)
from combocurve.utils.exceptions import get_exception_info
from combocurve.services.rollUp.roll_up_forecast import roll_up_forecast_batch_input
from combocurve.services.econ.econ_output_service import process_output_type
from combocurve.services.econ.econ_and_roll_up_batch_query import DEFAULT_ASSUMPTION
from combocurve.shared.parquet_types import build_pyarrow_schema
from collections import defaultdict
from combocurve.services.econ.econ_input_batch import update_econ_input_for_ecl_linked_wells, prepare_assignment_ids

DELIMITER = '+-*'
ROLL_UP_GROUPS_SCHEMA = {
    'run': None,
    'groupName': None,
    'groupData': None,
}

ONLY_PRODUCTION = 'onlyProduction'
ONLY_FORECAST = 'onlyForecast'
STITCH = 'stitch'
ROLL_UP_TYPE = [ONLY_FORECAST, ONLY_PRODUCTION, STITCH]

ROLL_UP_VOLUME_TYPE_DEFAULT = {
    ONLY_PRODUCTION: False,
    ONLY_FORECAST: False,
    STITCH: True,
}

NONE_BY_PHASE = {'oil': None, 'gas': None, 'water': None}

STREAM_TYPE_NAME = {
    ONLY_PRODUCTION: 'only_production',
    ONLY_FORECAST: 'only_forecast',
    STITCH: 'stitch',
}

RESOLUTION = {'monthly': ['monthly'], 'daily': ['daily'], 'both': ['monthly', 'daily']}

FORECAST_ROLL_UP_STREAMS = [
    'gross_well_count',
    'gross_oil_well_head_volume',
    'gross_gas_well_head_volume',
    'gross_water_well_head_volume',
    'gross_boe_well_head_volume',
    'gross_mcfe_well_head_volume',
]

SCENARIO_ROLL_UP_STREAMS = FORECAST_ROLL_UP_STREAMS + [
    'gross_oil_sales_volume',
    'gross_gas_sales_volume',
    'gross_ngl_sales_volume',
    'gross_drip_condensate_sales_volume',
    'gross_boe_sales_volume',
    'gross_mcfe_sales_volume',
    'wi_oil_sales_volume',
    'wi_gas_sales_volume',
    'wi_ngl_sales_volume',
    'wi_drip_condensate_sales_volume',
    'wi_boe_sales_volume',
    'wi_mcfe_sales_volume',
    'net_oil_sales_volume',
    'net_gas_sales_volume',
    'net_ngl_sales_volume',
    'net_drip_condensate_sales_volume',
    'net_boe_sales_volume',
    'net_mcfe_sales_volume',
]

ROLLUP_CHUNK_SIZE = 10485760  # 10MB

ROLLUP_SKIP_TYPES = {'DATE'}


def get_key(this_input, groups):
    if not groups or len(groups) == 0:
        return 'total'

    well_headers = this_input['well']
    keys = []

    for g in groups:
        if g == 'tc_name':
            tc_name = this_input.get('tc_name', 'No Type Curve')
            keys.append(tc_name)
        elif g == 'well_year':
            number_of_year = this_input.get('well_year', 'No Year Data')
            keys.append(str(number_of_year))
        else:
            sub_key = str(well_headers.get(g))
            keys.append(sub_key)

    return DELIMITER.join(keys)


def get_table_path(context, table_name):
    dataset_id = context.tenant_info['big_query_dataset']
    table_path = context.big_query_client.table_path(dataset_id, table_name)
    return table_path


def get_table_name(rollup_type, data_freq, aggregation=False, by_well=False, run_id=None):
    if aggregation:
        return f'volumes_v2_{rollup_type}_{data_freq}_rollup'
    if not by_well:
        # temparory table
        return f'rollup-batch-{run_id}-{rollup_type}-{data_freq}'
    return f'volumes_v2_{rollup_type}_{data_freq}_by_well'


def get_gcs_folder_path(run_id, rollup_type, data_freq):
    return f'rollup-{rollup_type}/{run_id}/{data_freq}'


def iso_str_to_datetime(iso_string):
    return datetime.datetime.strptime(iso_string, "%Y-%m-%dT%H:%M:%S.%fZ")


class RollUpService(object):
    def __init__(self, context):
        self.context = context
        self.roll_up_forecast_schema = self.get_schema_from_bigquery(FORECAST_BATCH_TABLE_SCHEMA)
        self.roll_up_scenario_schema = self.get_schema_from_bigquery(SCENARIO_BATCH_TABLE_SCHEMA)
        self.roll_up_well_schema = self.get_schema_from_bigquery(WELL_TABLE_SCHEMA)

    def get_schema_from_bigquery(self, bq_schema):
        schema = {}
        for schema_field in bq_schema:
            schema[schema_field.name] = schema_field.field_type
        return schema

    def bigquery_grand_total(self, run_id_str, bq_run_date, type, data_freq, by_well=False):
        table_name = get_table_name(type, data_freq, by_well=by_well, run_id=run_id_str)
        table_path = get_table_path(self.context, table_name)

        type_to_streams = {'forecast': FORECAST_ROLL_UP_STREAMS, 'scenario': SCENARIO_ROLL_UP_STREAMS}
        streams = type_to_streams[f'{type}']

        col_select_str = 'rollup_type, date, '
        for key in streams:
            col_select_str += f'SUM({key}) as {key}, '
        where_str = f'run_id="{run_id_str}" AND DATE(run_at)="{bq_run_date}"'
        group_by_str = 'rollup_type, date'

        query = f'''
        SELECT {col_select_str}
        FROM `{table_path}`
        WHERE {where_str}
        GROUP BY {group_by_str}
        ORDER BY {group_by_str} ASC
        '''

        query_result = self.context.big_query_client.query_rows(query)
        query_df = query_result.to_dataframe(create_bqstorage_client=False)
        query_df.date = query_df.date.astype(str)
        query_df[streams] = query_df[streams].astype(float)
        query_df.rename(columns={"gross_well_count": 'well_count_curve'}, inplace=True)

        data = {}

        for rollup_type in ROLL_UP_TYPE:
            type_df = query_df[query_df.rollup_type == STREAM_TYPE_NAME[rollup_type]]
            type_df.drop(columns=['rollup_type'], inplace=True)

            if len(type_df) > 0:
                data[rollup_type] = type_df.to_dict('list')
            else:
                data[rollup_type] = False

        return data

    def create_batch_table(self, run_id_str, rollup_type, data_freq, expiration_time=None):
        table_name = get_table_name(rollup_type, data_freq, run_id=run_id_str)
        table_path = get_table_path(self.context, table_name)

        type_to_schema = {'forecast': FORECAST_BATCH_TABLE_SCHEMA, 'scenario': SCENARIO_BATCH_TABLE_SCHEMA}

        self.context.big_query_client.create_table(type_to_schema[rollup_type], table_path, expiration_time)
        return table_path

    def load_batch_result_to_bigquery(self, run_id_str, type, data_freq, by_well=False):
        '''
        type: scenario_monthly, scenario_daily, forecast_monthly, forecast_daily
        '''
        # load batch file to bigquery
        bucket_name = self.context.tenant_info['batch_storage_bucket']
        folder_path = get_gcs_folder_path(run_id_str, type, data_freq)
        uri = f'gs://{bucket_name}/{folder_path}/*'

        table_name = get_table_name(type, data_freq, by_well=by_well, run_id=run_id_str)
        table_path = get_table_path(self.context, table_name)
        table = self.context.big_query_client.get_table(table_path)
        self.context.big_query_client.load_batch_result_from_storage(table_path, table.schema, uri)

    def group_roll_up(self, roll_up_inputs, params, rollup_module='scenario', data_freq='monthly'):
        columns_selected = params['columns_selected']
        dates = params['dates']
        groups = params['groups']
        volume_type = params.get('volume_type', ROLL_UP_VOLUME_TYPE_DEFAULT)
        run_id = params['run_id']
        batch_index = params.get('batch_index', 1)
        by_well = params.get('by_well', False)
        is_api = params.get('is_api', False)

        error_log = []  # not used right now

        if by_well:
            df_roll_up = pd.DataFrame()
            roll_up_schema = self.roll_up_well_schema
        else:
            ret = defaultdict(lambda: defaultdict(list))
            roll_up_schema = {}

        for this_input in roll_up_inputs:
            this_input['dates'] = dates
            this_input['columns_selected'] = columns_selected

            if rollup_module == 'forecast':
                this_input.update(
                    assumptions=DEFAULT_ASSUMPTION)

            key = get_key(this_input, groups)

            for roll_up_type in ROLL_UP_TYPE:
                if roll_up_type == ONLY_PRODUCTION:
                    this_input_updated = {**this_input, 'forecast_data': NONE_BY_PHASE}
                elif roll_up_type == ONLY_FORECAST:
                    this_input_updated = {**this_input, 'production_data': NONE_BY_PHASE}
                else:
                    this_input_updated = {**this_input}
                if by_well:
                    well_data = {
                        'well_id': str(this_input['well'].get('_id')),
                        'group_key': key,
                        'well_name': str(this_input['well'].get('well_name')),
                        'well_number': this_input['well'].get('well_number'),
                        'inpt_id': this_input['well'].get('inptID'),
                        'chosen_id': this_input['well'].get('chosenID'),
                        'api14': this_input['well'].get('api14'),
                    }

                    if volume_type[roll_up_type]:
                        try:
                            well_data['rollup_type'] = STREAM_TYPE_NAME[roll_up_type]
                            if data_freq == 'monthly':
                                this_well_volume = calculate_well_count(single_well_volume(this_input_updated))
                            else:
                                this_well_volume = calculate_well_count(single_well_volume_daily(this_input_updated))

                            df_one_group = pd.DataFrame(this_well_volume)
                            well_data_df = pd.DataFrame([well_data] * len(df_one_group))
                            all_df = pd.concat([well_data_df, df_one_group], axis=1)
                            df_roll_up = df_roll_up.append(all_df)

                        except Exception as e:
                            error_log.append({'well_id': this_input['well']['_id'], 'error': get_exception_info(e)})
                else:
                    if volume_type[roll_up_type]:
                        try:
                            if data_freq == 'monthly':
                                this_well_volume = calculate_well_count(single_well_volume(this_input_updated))
                            else:
                                this_well_volume = calculate_well_count(single_well_volume_daily(this_input_updated))

                            ret[key][roll_up_type] += [this_well_volume]
                            if groups and is_api:
                                ret['total'][roll_up_type] += [this_well_volume]
                        except Exception as e:
                            error_log.append({'well_id': this_input['well']['_id'], 'error': get_exception_info(e)})
                            error_info = get_exception_info(e)
                            logging.error(error_info['message'], extra={'metadata': {'error': error_info}})

        if not by_well:
            ret_by_group = {group: {t: sum_up_volume(l) for t, l in types.items()} for group, types in ret.items()}
            df_roll_up = self.group_result_to_df(ret_by_group)
            df_roll_up['batch_id'] = batch_index

        self.process_group_roll_up_df(params, df_roll_up, rollup_module, roll_up_schema)

        if is_api:
            self.roll_up_api(ret_by_group, df_roll_up, rollup_module, data_freq, run_id)
        else:
            self.roll_up_cf(roll_up_schema, df_roll_up, rollup_module, data_freq, batch_index, run_id)

    def process_group_roll_up_df(self, params, df_roll_up, rollup_module, roll_up_schema):
        df_roll_up['project_id'] = params['project_id']
        df_roll_up['user_id'] = params['user_id']
        df_roll_up['project_name'] = params['project_name']
        df_roll_up['user_name'] = params['user_name']
        df_roll_up['run_at'] = iso_str_to_datetime(params['created_at'])
        df_roll_up['run_id'] = params['run_id']

        if rollup_module == 'forecast':
            df_roll_up['forecast_id'] = params['forecast_id']
            df_roll_up['forecast_name'] = params['forecast_name']
            roll_up_schema.update(self.roll_up_forecast_schema)
        else:
            df_roll_up['scenario_id'] = params['scenario_id']
            df_roll_up['scenario_name'] = params['scenario_name']
            roll_up_schema.update(self.roll_up_scenario_schema)

        # the well_count_curve field can be float if aggregate by batch
        df_roll_up.rename(columns={"well_count_curve": "gross_well_count"}, inplace=True)

        for col in df_roll_up.columns:
            if roll_up_schema[col] in ROLLUP_SKIP_TYPES:
                continue
            df_roll_up[col] = process_output_type(df_roll_up[col], roll_up_schema[col])

    def roll_up_cf(self, roll_up_schema, df_roll_up, rollup_module, data_freq, batch_index, run_id):
        pa_schema = build_pyarrow_schema(roll_up_schema, df_roll_up)
        folder_path = get_gcs_folder_path(str(run_id), rollup_module, data_freq)
        file_name = '{}/{:08d}_*.parquet'.format(folder_path, batch_index)

        self.context.econ_output_service.upload_df_to_batch_bucket(
            file_name,
            df_roll_up,
            pa_schema,
            chunk_size=ROLLUP_CHUNK_SIZE,
            timeout=180,
        )

    def roll_up_api(self, ret_by_group, df_roll_up, rollup_module, data_freq, run_id):
        data = ret_by_group['total']

        for rollup_type in data:
            for key in data[rollup_type]:
                if key == 'date':
                    data[rollup_type][key] = [str(d) for d in data[rollup_type][key]]

        set_dict = {
            'batches': [],
            'runDate': datetime.datetime.utcnow(),
            'running': False,
        }
        set_dict[f'data.{data_freq}'] = data
        if rollup_module == 'forecast':
            self.context.forecast_roll_up_runs_collection.update_one({'_id': ObjectId(run_id)}, {'$set': set_dict})
        else:
            self.context.scen_roll_up_runs_collection.update_one({'_id': ObjectId(run_id)}, {'$set': set_dict})

        table_name = get_table_name(rollup_module, data_freq, aggregation=True)
        table_path = get_table_path(self.context, table_name)
        table_id = self.context.big_query_client.get_table(table_path)

        self.context.big_query_client.insert_rows_df(table_id, df_roll_up.drop(['batch_id'], axis=1))

    def group_result_to_df(self, ret_by_group):
        group_dict = defaultdict(list)

        for group in ret_by_group:
            for roll_up_type in ret_by_group[group]:
                for col in ret_by_group[group][roll_up_type]:
                    n = len(ret_by_group[group][roll_up_type][col])
                    group_dict[col] += ret_by_group[group][roll_up_type][col]

                group_dict['group_key'] += [group] * n
                group_dict['rollup_type'] += [STREAM_TYPE_NAME[roll_up_type]] * n

        df_roll_up = pd.DataFrame.from_dict(group_dict)

        return df_roll_up

    def update_roll_up_input_for_ecl_linked_wells(self, params, roll_up_inputs, assignment_ids):
        updated_assignment_ids, _ = prepare_assignment_ids(self.context, params['scenario_id'], assignment_ids)
        combo_name = params['combos'][0]['name']
        for roll_up_input in roll_up_inputs:
            roll_up_input['combo_name'] = combo_name
        return update_econ_input_for_ecl_linked_wells(
            assignment_ids=updated_assignment_ids,
            econ_inputs=roll_up_inputs,
            context=self.context,
            project_id=params['project_id'],
            scenario_id=params['scenario_id'],
            combos=params['combos'],
        )

    def _calculate(self, params):
        scenario_id = params['scenario_id']
        assignment_ids = params['assignment_ids']

        try:
            roll_up_inputs = roll_up_batch_input(self.context, ObjectId(scenario_id),
                                                 [ObjectId(id) for id in assignment_ids], ASSUMPTION_KEYS)
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
            raise Exception('Error happened in batch query!')

        # TODO: ignore incremental for now, may update in future
        roll_up_inputs = [input_ for input_ in roll_up_inputs if input_['incremental_index'] == 0]

        # solve ecl links
        roll_up_inputs = self.update_roll_up_input_for_ecl_linked_wells(params, roll_up_inputs, assignment_ids)
        error_msg = []
        for assignment_id, roll_up_input in zip(assignment_ids, roll_up_inputs):
            fpd_source_hierarchy = roll_up_input['assumptions']['dates']['dates_setting'].get(
                'fpd_source_hierarchy', {})
            for fpd_source in fpd_source_hierarchy:
                if 'link_to_wells_ecl_error' in fpd_source_hierarchy[fpd_source]:
                    this_msg = fpd_source_hierarchy[fpd_source]['link_to_wells_ecl_error']
                    error_msg.append(f"{' '.join(fpd_source.split('_'))}: {this_msg} (Assignment ID={assignment_id})")
        if error_msg:
            logging.error(', '.join(error_msg))
            raise Exception(', '.join(error_msg))

        self._get_type_curve_data(params, roll_up_inputs, False)
        self._get_year_data(params, roll_up_inputs)

        resolution = params.get('resolution', 'monthly')
        for data_freq in RESOLUTION[resolution]:
            self.group_roll_up(roll_up_inputs, params, 'scenario', data_freq=data_freq)

    def _calculate_forecast(self, params):
        try:
            roll_up_inputs = roll_up_forecast_batch_input(self.context, params)
        except Exception as e:
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
            raise Exception('Error happened in batch query!')
        self._get_type_curve_data(params, roll_up_inputs, True)
        self._get_year_data(params, roll_up_inputs)

        resolution = params.get('resolution', 'monthly')

        for data_freq in RESOLUTION[resolution]:
            self.group_roll_up(roll_up_inputs, params, 'forecast', data_freq=data_freq)

    def _get_year_data(self, params, roll_up_inputs):
        groups = params['groups']
        has_well_year = 'well_year' in groups

        if not has_well_year:
            return roll_up_inputs

        for roll_up in roll_up_inputs:
            well_fpd_info = roll_up.get('well', {}).get('first_prod_date')
            try:
                fpd_year = well_fpd_info.year
                roll_up['well_year'] = fpd_year
            except AttributeError:
                roll_up['well_year'] = 'No Year Data'

    def _get_type_curve_data(self, params, roll_up_inputs, is_forecast):
        groups = params['groups']
        phase_preference = params.get('phase_preference', ['oil', 'gas', 'water'])
        has_tc = 'tc_name' in groups

        if not has_tc:
            return roll_up_inputs

        tc_id_list = []

        for roll_up in roll_up_inputs:
            this_forecast = roll_up['forecast_data']
            for phase in phase_preference:
                this_forecast_phase = this_forecast.get(phase)
                if this_forecast_phase and (this_forecast_phase.get('forecastSubType') == 'typecurve'
                                            or this_forecast_phase.get('forecastType') == 'typecurve'):
                    tc_id_list.append(ObjectId(this_forecast_phase.get('typeCurve')))
                    this_forecast['tc_id'] = this_forecast_phase.get('typeCurve')
                    break

        project_dict = {
            '_id': 1,
            'name': 1,
        }
        match = {'_id': {'$in': tc_id_list}}

        tc_data_list = list(self.context.type_curves_collection.find(match, project_dict))
        tc_id_name_dict = {}

        for tc in tc_data_list:
            tc_id_name_dict[tc['_id']] = tc['name']

        for roll_up in roll_up_inputs:
            this_forecast = roll_up['forecast_data']

            if this_forecast.get('tc_id') in tc_id_name_dict:
                roll_up['tc_name'] = tc_id_name_dict[this_forecast.get('tc_id')]
            else:
                roll_up['tc_name'] = 'No Type Curve'

    def roll_up(self, params):
        if 'scenario_id' in params:
            self._calculate(params)
        else:
            self._calculate_forecast(params)
