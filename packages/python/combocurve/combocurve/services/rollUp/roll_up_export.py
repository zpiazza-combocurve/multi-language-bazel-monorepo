import datetime
import io
import numpy as np
from bson import ObjectId
import pandas as pd
from combocurve.shared.parquet_types import to_date
from combocurve.services.rollUp.roll_up_service import (ONLY_PRODUCTION, ONLY_FORECAST, STITCH,
                                                        ROLL_UP_VOLUME_TYPE_DEFAULT, FORECAST_ROLL_UP_STREAMS,
                                                        SCENARIO_ROLL_UP_STREAMS, DELIMITER, STREAM_TYPE_NAME,
                                                        get_table_path, get_table_name)

TYPE_TO_NAME = {
    ONLY_PRODUCTION: 'only production',
    ONLY_FORECAST: 'only forecast',
    STITCH: 'stitch',
}

HEADER_FORMAT_MONTHLY = {
    'gross_oil_well_head_volume': 'Gross Oil Well Head Volume (BBL/M)',
    'gross_gas_well_head_volume': 'Gross Gas Well Head Volume (MCF/M)',
    'gross_boe_well_head_volume': 'Gross BOE Well Head Volume (BOE/M)',
    'gross_mcfe_well_head_volume': 'Gross MCFE Well Head Volume (MCFE/M)',
    'gross_water_well_head_volume': 'Gross Water Well Head Volume (BBL/M)',
    'gross_oil_sales_volume': 'Gross Oil Sales Volume (BBL/M)',
    'gross_gas_sales_volume': 'Gross Gas Sales Volume (MCF/M)',
    'gross_ngl_sales_volume': 'Gross NGL Sales Volume (BBL/M)',
    'gross_drip_condensate_sales_volume': 'Gross Drip Condensate Sales Volume (BBL/M)',
    'gross_boe_sales_volume': 'Gross BOE Sales Volume (BOE/M)',
    'gross_mcfe_sales_volume': 'Gross MCFE Sales Volume (MCFE/M)',
    'wi_oil_sales_volume': 'WI Oil Sales Volume (BBL/M)',
    'wi_gas_sales_volume': 'WI Gas Sales Volume (MCF/M)',
    'wi_ngl_sales_volume': 'WI NGL Sales Volume (BBL/M)',
    'wi_drip_condensate_sales_volume': 'WI Drip Condensate Sales Volume (BBL/M)',
    'wi_boe_sales_volume': 'WI BOE Sales Volume (BOE/M)',
    'wi_mcfe_sales_volume': 'WI MCFE Sales Volume (MCFE/M)',
    'net_oil_sales_volume': 'Net Oil Sales Volume (BBL/M)',
    'net_gas_sales_volume': 'Net Gas Sales Volume (MCF/M)',
    'net_ngl_sales_volume': 'Net NGL Sales Volume (BBL/M)',
    'net_drip_condensate_sales_volume': 'Net Drip Condensate Sales Volume (BBL/M)',
    'net_boe_sales_volume': 'Net BOE Sales Volume (BOE/M)',
    'net_mcfe_sales_volume': 'Net MCFE Sales Volume (MCFE/M)',
    'tc_name': 'Type Curve Name',
    'well_year': 'First Production Year'
}

HEADER_FORMAT_DAILY = {
    'gross_oil_well_head_volume': 'Gross Oil Well Head Volume (BBL/D)',
    'gross_gas_well_head_volume': 'Gross Gas Well Head Volume (MCF/D)',
    'gross_boe_well_head_volume': 'Gross BOE Well Head Volume (BOE/D)',
    'gross_mcfe_well_head_volume': 'Gross MCFE Well Head Volume (MCFE/D)',
    'gross_water_well_head_volume': 'Gross Water Well Head Volume (BBL/D)',
    'gross_oil_sales_volume': 'Gross Oil Sales Volume (BBL/D)',
    'gross_gas_sales_volume': 'Gross Gas Sales Volume (MCF/D)',
    'gross_ngl_sales_volume': 'Gross NGL Sales Volume (BBL/D)',
    'gross_drip_condensate_sales_volume': 'Gross Drip Condensate Sales Volume (BBL/D)',
    'gross_boe_sales_volume': 'Gross BOE Sales Volume (BOE/D)',
    'gross_mcfe_sales_volume': 'Gross MCFE Sales Volume (MCFE/D)',
    'wi_oil_sales_volume': 'WI Oil Sales Volume (BBL/D)',
    'wi_gas_sales_volume': 'WI Gas Sales Volume (MCF/D)',
    'wi_ngl_sales_volume': 'WI NGL Sales Volume (BBL/D)',
    'wi_drip_condensate_sales_volume': 'WI Drip Condensate Sales Volume (BBL/D)',
    'wi_boe_sales_volume': 'WI BOE Sales Volume (BOE/D)',
    'wi_mcfe_sales_volume': 'WI MCFE Sales Volume (MCFE/D)',
    'net_oil_sales_volume': 'Net Oil Sales Volume (BBL/D)',
    'net_gas_sales_volume': 'Net Gas Sales Volume (MCF/D)',
    'net_ngl_sales_volume': 'Net NGL Sales Volume (BBL/D)',
    'net_drip_condensate_sales_volume': 'Net Drip Condensate Sales Volume (BBL/D)',
    'net_boe_sales_volume': 'Net BOE Sales Volume (BOE/D)',
    'net_mcfe_sales_volume': 'Net MCFE Sales Volume (MCFE/D)',
    'tc_name': 'Type Curve Name',
    'well_year': 'First Production Year'
}

DAYS_IN_MONTH = 30.4375


class RollUpExport:
    def __init__(self, context):
        self.context = context

    def get_query_with_headers(self,
                               type,
                               run_id,
                               group_names,
                               customerized_group_names,
                               volume_type,
                               bq_run_date,
                               data_freq='monthly'):
        delimiter = '"+-*"'
        query_sum = ''
        query_sum_view = ''
        query_group_view = ''

        table_name = get_table_name(type, data_freq, aggregation=True)
        table_path = get_table_path(self.context, table_name)

        volume_type_str = ''

        for v in volume_type:
            if volume_type[v]:
                volume_type_str += f'rollup_type = "{STREAM_TYPE_NAME[v]}" OR '
        volume_type_str = volume_type_str[:-4]

        if type == 'scenario':
            for item in SCENARIO_ROLL_UP_STREAMS:
                query_sum += f'SUM({item}) as {item},'
                query_sum_view += f'{item},'
        else:
            for item in FORECAST_ROLL_UP_STREAMS:
                query_sum += f'SUM({item}) as {item},'
                query_sum_view += f'{item},'

        if not group_names:
            query = f'''
                SELECT REPLACE (rollup_type, '_', ' ') as rollup_type, date, {query_sum_view}
                FROM `{table_path}`
                WHERE run_id = "{run_id}" AND ({volume_type_str}) AND DATE(run_at)="{bq_run_date}"
                ORDER BY rollup_type, date
            '''
        else:
            query_groups = ''
            for i, name in enumerate(group_names):
                query_group_view += f'group_list[OFFSET({i})] as `{name}`,'
                query_groups += f'`{name}`,'

            query = f'''
            with output as (
                SELECT
                    rollup_type,
                    date,
                    {query_sum_view}
                    SPLIT(group_key, {delimiter}) as group_list,

                FROM `{table_path}`
                WHERE run_id = "{run_id}"  AND ({volume_type_str}) AND DATE(run_at)="{bq_run_date}"
                )

            SELECT REPLACE (rollup_type, '_', ' ') as rollup_type, {query_group_view} date, {query_sum_view}
            FROM output
            ORDER BY rollup_type, {query_groups} date
            '''

        headers = ['Type']
        group_headers = []
        if query_group_view:
            for item in group_names:
                this_header = self.format_header(item, data_freq, customerized_group_names)
                headers += [this_header]
                group_headers += [this_header]

        headers += ['Date']

        for item in SCENARIO_ROLL_UP_STREAMS if type == 'scenario' else FORECAST_ROLL_UP_STREAMS:
            headers += [self.format_header(item, data_freq, customerized_group_names)]

        return query, headers, group_headers

    def format_header(self, header, data_resolution, customerized_group_names):

        if data_resolution == 'monthly':
            header_format_dict = HEADER_FORMAT_MONTHLY
        else:
            header_format_dict = HEADER_FORMAT_DAILY

        if header in header_format_dict:
            return header_format_dict[header]
        elif header in customerized_group_names:
            return header
        else:
            return header.replace('_', ' ').capitalize()

    def get_custom_header(self):

        return self.context.custom_fields_service.get_custom_fields(self.context.wells_collection.name)

    def format_group_name(self, raw_group_names):
        group_names = []
        customerized_headers = self.get_custom_header()
        customerized_group_names = set()

        for name in raw_group_names:
            if name in customerized_headers:
                group_names.append(customerized_headers[name])
                customerized_group_names.add(customerized_headers[name])
            else:
                group_names.append(name)

        return group_names, customerized_group_names

    def roll_up_export_big_query(self, params):
        type = params['type']
        run_id = str(params['run_id'])
        user_id = params['user_id']
        has_comparison = params.get('has_comparison', False)

        volume_type = params.get('volume_type')
        data_freq = params.get('data_resolution', 'monthly')
        if not volume_type:
            volume_type = ROLL_UP_VOLUME_TYPE_DEFAULT

        if type == 'scenario':
            roll_up_total = self.context.scen_roll_up_runs_collection.find_one({'_id': ObjectId(run_id)})
        else:
            roll_up_total = self.context.forecast_roll_up_runs_collection.find_one({'_id': ObjectId(run_id)})

        bq_run_date = to_date(roll_up_total['createdAt'])
        group_names, customerized_group_names = self.format_group_name(roll_up_total.get('groups'))

        query, headers, group_headers = self.get_query_with_headers(type, run_id, group_names, customerized_group_names,
                                                                    volume_type, bq_run_date, data_freq)

        run_date = datetime.datetime.utcnow().strftime("%Y_%m_%d_%H_%M_%S")
        query_result_table_name = f'{type}-roll-up-{data_freq}-{run_date}'
        combined_name = self.context.econ_file_service.load_bq_to_storage(headers, query, query_result_table_name)

        file_object_id = self.context.file_service.create_file_from_gcp_name(combined_name)

        if has_comparison:
            current_forecast = roll_up_total['forecast']
            compared_forecast = roll_up_total['comparedForecast']
            compared_roll_up_total = self.context.forecast_roll_up_runs_collection.find_one({
                'forecast':
                ObjectId(compared_forecast),
                'createdBy':
                ObjectId(user_id)
            })
            compared_run_id = str(compared_roll_up_total['_id'])
            query_result_table_name_comparison = f'{type}-roll-up2-{data_freq}-{run_date}'
            query_comparison, headers_comparison, _ = self.get_query_with_headers(type, compared_run_id, group_names,
                                                                                  customerized_group_names, volume_type,
                                                                                  bq_run_date, data_freq)
            combined_name_comparison = self.context.econ_file_service.load_bq_to_storage(
                headers_comparison, query_comparison, query_result_table_name_comparison)

            current_forecast_name = self.context.forecasts_collection.find_one({
                '_id': ObjectId(current_forecast)
            }).get('name')
            compared_forecast_name = self.context.forecasts_collection.find_one({
                '_id': ObjectId(compared_forecast)
            }).get('name')
            file_object_id = self.comparison_rollup_export(combined_name, combined_name_comparison,
                                                           current_forecast_name, compared_forecast_name, run_date,
                                                           run_id, data_freq, group_headers)

        return str(file_object_id)

    def comparison_rollup_export(self, rollup1, rollup2, current_forecast_name, compared_forecast_name, run_date,
                                 run_id, data_freq, group_headers):
        storage_client = self.context.cloud_storage_client.client
        bucket_name = self.context.tenant_info['file_storage_bucket']
        bucket = storage_client.bucket(bucket_name)
        csv_encoding = 'utf-8'

        blob_rollup1 = bucket.get_blob(rollup1)
        buffer_rollup1 = io.BytesIO()
        blob_rollup1.download_to_file(buffer_rollup1)
        buffer_rollup1.seek(0)

        blob_rollup2 = bucket.get_blob(rollup2)
        buffer_rollup2 = io.BytesIO()
        blob_rollup2.download_to_file(buffer_rollup2)
        buffer_rollup2.seek(0)

        df_rollup1 = pd.read_csv(buffer_rollup1, encoding=csv_encoding)
        df_rollup2 = pd.read_csv(buffer_rollup2, encoding=csv_encoding)

        if group_headers:
            for h in group_headers:
                df_rollup1 = df_rollup1[df_rollup1[h] == 'total']
                df_rollup2 = df_rollup2[df_rollup2[h] == 'total']

            df_rollup1.reset_index(inplace=True, drop=True)
            df_rollup2.reset_index(inplace=True, drop=True)

        comparison_columns = [
            'Gross well count', 'Gross Oil Well Head Volume (BBL/M)', 'Gross Gas Well Head Volume (MCF/M)',
            'Gross Water Well Head Volume (BBL/M)', 'Gross BOE Well Head Volume (BOE/M)',
            'Gross MCFE Well Head Volume (MCFE/M)'
        ]

        df_comparison = pd.DataFrame()

        for column in df_rollup1.columns:
            if column not in comparison_columns:
                df_comparison[f'{column}'] = df_rollup1[column]
            else:
                if column == 'Gross well count':
                    df_comparison[f'{current_forecast_name} - Gross well count'] = df_rollup1[column]
                    df_comparison[f'{compared_forecast_name} - Gross well count'] = df_rollup2[column]
                else:
                    df_comparison[f'{current_forecast_name} - {column}'] = df_rollup1[column]
                    df_comparison[f'{compared_forecast_name} - {column}'] = df_rollup2[column]
                    df_comparison[f'Delta {column}'] = df_rollup1[column] - df_rollup2[column]
                    df_comparison[f'Delta % {column}'] = ((
                        (df_rollup1[column] - df_rollup2[column]) / df_rollup1[column]).replace([np.inf, -np.inf],
                                                                                                np.nan)) * 100

        buffer_comparison = io.StringIO()
        df_comparison.to_csv(buffer_comparison, index=False)
        gcp_name = f'roll--{str(run_id)}--{run_date}.csv'
        file_name = f'forecast-roll-up-comparison-{data_freq}-{run_date}.csv'
        content_type = 'application/CSV'
        csv_file_info = {'gcpName': gcp_name, 'type': content_type, 'name': file_name, 'user': None}

        file_objectId = self.context.file_service.upload_file_from_string(string_data=buffer_comparison.getvalue(),
                                                                          file_data=csv_file_info,
                                                                          user_id=None)

        return file_objectId


def get_aggregation_query(context, type, run_id, group_names, bq_run_date, data_freq='monthly', by_well=False):
    table_name = get_table_name(type, data_freq, by_well=by_well, run_id=str(run_id))
    table_path = get_table_path(context, table_name)

    group_headers = ['run_id', 'run_at', 'project_id', 'project_name', 'user_id', 'user_name']
    if type == 'scenario':
        group_headers += ['scenario_id', 'scenario_name']
        stream_keys = SCENARIO_ROLL_UP_STREAMS
    else:
        group_headers += ['forecast_id', 'forecast_name']
        stream_keys = FORECAST_ROLL_UP_STREAMS

    header_group_select = ''
    header_select = ''
    for header in group_headers:
        header_group_select += f'ANY_VALUE({header}) as {header}, '
        header_select += f'{header}, '

    stream_group_select = ''
    stream_select = ''
    for item in stream_keys:
        stream_group_select += f'SUM({item}) as {item}, '
        stream_select += f'{item}, '

    if not group_names:
        query = f'''
        SELECT
            rollup_type,
            group_key,
            date,
            {header_group_select}
            {stream_group_select}
        FROM `{table_path}`
        WHERE run_id = "{run_id}" AND DATE(run_at)="{bq_run_date}"
        GROUP BY rollup_type, group_key, date
        '''
    else:
        total_str = DELIMITER.join(['total'] * len(group_names))
        query = f'''
        with output as (
            SELECT
                rollup_type,
                group_key,
                date,
                {header_group_select}
                {stream_group_select}
            FROM `{table_path}`
            WHERE run_id = "{run_id}" AND DATE(run_at)="{bq_run_date}"
            GROUP BY rollup_type, group_key, date
            ),

        total AS (
            SELECT
            rollup_type,
            date,
            {header_group_select}
            {stream_group_select}
            FROM output
            GROUP BY rollup_type, date
        )

        SELECT * FROM(
            SELECT {header_select} group_key, rollup_type, date, {stream_select}
                        FROM output

            UNION ALL

            SELECT {header_select} "{total_str}" AS group_key, rollup_type, date, {stream_select}
            FROM total

        )
        '''

    return query
