import logging
import datetime

from google.cloud import bigquery
from combocurve.services.econ.econ_columns import QUALIFIER_NAME_HEADER, SPECIAL_COL_DICT, WELL_COUNT_HEADER

from combocurve.services.econ.econ_output_fields import WELL_HEADER_NAME_MAP
from combocurve.services.econ.econ_big_query_schema import AGGREGATION_ECON_SCHEMA
from combocurve.science.econ.post_process import PostProcess
from combocurve.services.econ.econ_output_service import METADATA_TABLE_NAME
from combocurve.shared.date import py_date_change_time_zone
from combocurve.shared.parquet_types import MAX_NUMERIC_DIGIT


def _log_error(message, error):
    logging.error(message, extra={'metadata': {'error': str(error)}})


COMBO_NAME = 'combo_name'
SQL_RESERVED_WORDS = ['range']
AGG_METADATA_COLS = ['project_name', 'scenario_name', 'user_name']
AGG_COMBO_COLS = ['combo_name'] + list(QUALIFIER_NAME_HEADER.keys())
AGGREGATION_RELATED_COLS = ['aggregation_group', 'date']

ECON_RES_CAT = ['econ_prms_reserves_category', 'econ_prms_reserves_sub_category']

JOINED_TABLE_NAME = 'joined_table'

QUERY_GROUPS_DICT = {
    'all_wells': {
        'group_name_str': '"all wells"',
        'where_str': 'error IS NULL',
        'group_by_str': 'combo_name, date',
        'group_by_items': [COMBO_NAME, 'date']
    },
    'cat': {
        'group_name_str': 'LOWER(econ_prms_reserves_category)',
        'where_str': 'error IS NULL',
        'group_by_str': 'combo_name, econ_prms_reserves_category, date',
        'group_by_items': [COMBO_NAME, 'econ_prms_reserves_category', 'date']
    },
    'cat_sub_cat': {
        'group_name_str':
        'CASE WHEN econ_prms_reserves_category="" AND econ_prms_reserves_sub_category="" THEN "uncategorized" ELSE (LOWER(econ_prms_reserves_category) || ", " || LOWER(econ_prms_reserves_sub_category)) END',  # noqa
        'where_str': 'error IS NULL',
        'group_by_str': 'combo_name, econ_prms_reserves_category, econ_prms_reserves_sub_category, date',
        'group_by_items': [COMBO_NAME, 'econ_prms_reserves_category', 'econ_prms_reserves_sub_category', 'date']
    },
}

RES_GROUPS_DICT = ['all_wells', 'un_cat', 'cat', 'cat_sub_cat']


def _get_bq_aggregation_query(group_key, target_group_key, query_groups, group_by_cols, run_id_str,
                              aggregation_date_str, bq_run_date, all_monthly_key_list, reporting_units, table_path):
    group_name_str = query_groups[group_key]['group_name_str']
    group_by_str = query_groups[group_key]['group_by_str']

    # query the sum
    col_select_str = get_col_aggregation_str(all_monthly_key_list, group_name_str, group_by_str, group_by_cols,
                                             reporting_units)

    if group_key == target_group_key:
        where_str = query_groups[group_key]['where_str']
        where_str += f' AND date >= "{aggregation_date_str}"'
        where_str += f' AND run_id="{run_id_str}" AND run_date="{bq_run_date}"'
        sub_query = f'`{table_path}` WHERE {where_str}'
    else:
        if group_key == 'cat':
            # special case in handling res group aggregation
            sub_query = f'{target_group_key} WHERE econ_prms_reserves_category > ""'
        else:
            sub_query = target_group_key
    query = f'{group_key} AS (SELECT {col_select_str} FROM {sub_query} GROUP BY {group_by_str})'  # noqa E501

    return query


def _get_fill_rows_query(context, group_by_cols, run_id_str, run_date_str):
    dataset_id = context.econ_output_service.get_dataset()
    except_str = 'EXCEPT (min_date, max_date), '

    # find the columns that are unique to each combo by group
    qualifier_columns = list(QUALIFIER_NAME_HEADER.keys())
    combo_group_unique_cols = qualifier_columns + group_by_cols
    except_from_result_table_str = 'EXCEPT(' + ', '.join(combo_group_unique_cols) + ')'
    select_for_group_table_str = ', '.join(list(map(lambda s: f'MAX({s}) AS {s}', combo_group_unique_cols)))

    # aggregation table only needs these meta data cols
    metadata_table_path = context.big_query_client.table_path(dataset_id, METADATA_TABLE_NAME)
    all_dates_clause = (
        f', all_dates AS (SELECT date FROM '
        f'{dataset_id}.create_full_table({dataset_id}.get_min_date("{run_id_str}", "{run_date_str}"), {dataset_id}.get_max_date("{run_id_str}", "{run_date_str}"), "{run_id_str}") '  # noqa
        f'LEFT JOIN `{metadata_table_path}` USING (run_id))')  # noqa

    all_dates_clause = (f', all_dates AS (SELECT date FROM '
                        f'(SELECT date, "{run_id_str}" AS run_id,'
                        'FROM ( SELECT MIN(DATE(TIMESTAMP(date))) min_dt, MAX(DATE(TIMESTAMP(date))) max_dt,'
                        'FROM joined_table ), UNNEST(GENERATE_DATE_ARRAY(min_dt, max_dt, INTERVAL 1 MONTH)) date )'
                        f'LEFT JOIN `{metadata_table_path}` USING (run_id))')

    all_dates_table_clause = (', all_dates_table AS ('
                              f'SELECT * {except_str} '
                              f'"{run_id_str}" AS run_id,'
                              f'"{run_date_str}" AS run_date,'
                              'FROM (SELECT * FROM'
                              '(SELECT '
                              'combo_name,'
                              'aggregation_group,'
                              'MIN(date) AS min_date,'
                              f'MAX(date) AS max_date, {select_for_group_table_str} '
                              'FROM result_table '
                              f'GROUP BY combo_name, aggregation_group'
                              ') AS group_table '
                              'CROSS JOIN all_dates'
                              ' WHERE all_dates.date BETWEEN group_table.min_date AND group_table.max_date'
                              ') AS full_group_table '
                              f'LEFT JOIN (SELECT * {except_from_result_table_str} FROM result_table) '
                              f'USING (combo_name, date, aggregation_group))')
    econ_cols_select_clause = _get_econ_cols_select_clause(group_by_cols)
    select_query = f'SELECT {econ_cols_select_clause} FROM all_dates_table'
    return all_dates_clause + all_dates_table_clause + select_query


def _get_econ_cols_select_clause(group_by_cols):
    select_clause = ''
    for col_dict in AGGREGATION_ECON_SCHEMA:
        col_name, col_type = col_dict['name'], col_dict['type']
        if col_type == 'NUMERIC':
            select_clause += f'IFNULL({col_name}, 0) AS {col_name}, '
        else:
            # include qualifier columns
            select_clause += f'{col_name} AS {col_name}, '
    group_by_col_select_clause = ''
    for col in group_by_cols:
        group_by_col_select_clause += f'{col} AS {col}, '
    select_clause += group_by_col_select_clause
    select_clause += ('run_id AS run_id,'
                      'date(run_date) AS run_date, '
                      'combo_name AS combo_name,'
                      'date AS date,'
                      'CURRENT_TIMESTAMP() AS created_at, '
                      'aggregation_group AS aggregation_group, ')
    return select_clause[:-2]


def get_bq_query(context, run_id_str, aggregation_date_str, query_groups, group_by_cols, bq_run_date,
                 all_monthly_key_list, reporting_units, table_path):

    # the first table to be aggreagted on
    if 'well_header_aggregation' in query_groups:
        target_key = 'well_header_aggregation'
    elif 'cat_sub_cat' in query_groups:
        target_key = 'cat_sub_cat'
    else:
        target_key = 'all_wells'

    # initialize query string
    prefix_query = _get_bq_aggregation_query(target_key, target_key, query_groups, group_by_cols, run_id_str,
                                             aggregation_date_str, bq_run_date, all_monthly_key_list, reporting_units,
                                             table_path) + ', '
    if target_key == 'all_wells':
        # for getting all_wells df
        postfix_query = f'result_table AS (SELECT * FROM {target_key}'
    else:
        postfix_query = f', result_table AS (SELECT * FROM {target_key} UNION ALL '
    # run query and save result to bigquery and storage
    key_list = list(query_groups.keys())
    key_list.remove(target_key)
    for key in key_list:
        core_query = _get_bq_aggregation_query(key, target_key, query_groups, group_by_cols, run_id_str,
                                               aggregation_date_str, bq_run_date, all_monthly_key_list, reporting_units,
                                               table_path)
        if key != key_list[-1]:
            prefix_query += f'{core_query}, '
            postfix_query += f'SELECT * FROM {key} UNION ALL '
        else:
            # for the last group key
            prefix_query += core_query
            postfix_query += f'SELECT * FROM {key}'
    postfix_query += ')'
    fill_rows_query = _get_fill_rows_query(context, group_by_cols, run_id_str, bq_run_date)
    query = prefix_query + postfix_query + fill_rows_query
    return query


def import_to_bigquery(bq_client, dataset_id, table_name, bucket_name, schema_json, run_id_str):

    dataset_ref = bq_client.dataset(dataset_id)

    job_config = bigquery.LoadJobConfig()

    job_config_schema = []
    for item in schema_json:
        job_config_schema += [bigquery.SchemaField(item['name'], item['type'], item['mode'], item['description'])]

    job_config.schema = job_config_schema
    job_config.skip_leading_rows = 1

    job_config.source_format = bigquery.SourceFormat.CSV
    uri = f'gs://{bucket_name}/econ-runs/{run_id_str}/final-*.csv'

    load_job = bq_client.load_table_from_uri(uri, dataset_ref.table(table_name), job_config=job_config)

    try:
        load_job.result()
    except Exception as e:
        _log_error('BigQuery load job error', load_job.errors)
        raise e


def get_db_bq_key_map():
    '''
    some keys are different in mongo and bigquery, need to do a mapping for those
    '''
    db_to_bq_key = {}
    for bq_key, well_field in WELL_HEADER_NAME_MAP.items():
        db_to_bq_key[well_field] = bq_key
    return db_to_bq_key


def datetime_to_local_time_str(input_date: datetime.datetime, time_zone=None):
    if time_zone is None:

        local_run_date = input_date
    else:
        local_run_date = py_date_change_time_zone(input_date, time_zone)
    local_run_time_str = local_run_date.strftime("%Y-%m-%d %H:%M:%S %Z")
    return local_run_time_str


def get_wh_select_string(well_header_list,
                         db_to_bq_key,
                         run_date: datetime.datetime,
                         time_zone,
                         date_resolution_str=''):
    local_run_time_str = datetime_to_local_time_str(run_date, time_zone)

    select_string = ''
    for col_key in well_header_list:
        if col_key == 'date':
            if date_resolution_str == '':
                add_str = 'year, '
            else:
                add_str = date_resolution_str
        elif col_key in [COMBO_NAME, 'aggregation_group', 'incremental_index']:  # columns used in GROUP BY
            add_str = f'{col_key}, '
        elif col_key == 'created_at':
            add_str = f'"{local_run_time_str}" AS created_at, '
        else:
            if col_key in db_to_bq_key:
                col_key_bq = db_to_bq_key[col_key]
            else:
                col_key_bq = col_key
            add_str = f'ANY_VALUE({col_key_bq}) AS {col_key}, '

        select_string = select_string + add_str

    return select_string


def get_one_col_aggregation_str(col_key, special_keys, reporting_units):
    cash_unit = reporting_units['cash']

    if col_key not in special_keys:
        add_str = f'ROUND(SUM({col_key}), {MAX_NUMERIC_DIGIT}) AS {col_key}, '
    else:
        method = SPECIAL_COL_DICT[col_key].get('method', 'divide')
        if method == 'divide':
            num_key = SPECIAL_COL_DICT[col_key]['numerator']
            den_key = SPECIAL_COL_DICT[col_key]['denominator']
            if 'price' in col_key:
                phase = col_key.replace('_price', '')
                phase_vol_unit = reporting_units[phase]
                multiplier = PostProcess.unit_to_multiplier(phase_vol_unit) / PostProcess.unit_to_multiplier(cash_unit)

                multiply_str = f' * {multiplier}'
            else:
                multiply_str = ' * 100'
            add_str = f'ROUND(CASE WHEN SUM({den_key}) = 0 THEN AVG({col_key}) ELSE (SUM({num_key})/SUM({den_key}){multiply_str}) END, {MAX_NUMERIC_DIGIT}) AS {col_key}, '  # noqa E501

        elif method == 'average':
            weight = SPECIAL_COL_DICT[col_key]['weight']
            add_str = f'ROUND(CASE WHEN SUM({weight}) = 0 THEN AVG({col_key}) ELSE sum({col_key} * {weight}) / SUM({weight}) END, {MAX_NUMERIC_DIGIT}) AS {col_key}, '  # noqa E501

    return add_str


def get_col_aggregation_str(ordered_key_list, group_name_str, group_by_str, group_by_cols, reporting_units):
    ret_str = ''

    for key in AGG_METADATA_COLS + AGG_COMBO_COLS:
        if key == COMBO_NAME:
            # always goup by combo name
            ret_str += f'{key}, '
        else:
            ret_str += f'ANY_VALUE({key}) AS {key}, '

    for key in group_by_cols:
        if key in group_by_str:
            ret_str += f'{key}, '
        else:
            '''
            needed for group all wells and res cat group by 1 col
            to make it have same columns selected as other groups
            '''
            ret_str += f'"" AS {key},'

    ret_str += f'{group_name_str} AS `aggregation_group`, date, '
    special_keys = list(SPECIAL_COL_DICT.keys())

    for col_key in list(WELL_COUNT_HEADER.keys()) + ordered_key_list:
        '''
        hard coded well count columns to be aggregated due to they are not in column selection on FE
        '''
        add_str = get_one_col_aggregation_str(col_key, special_keys, reporting_units)
        ret_str = ret_str + add_str

    return ret_str


def get_econ_select_string(econ_key_list,
                           cum_col_keys,
                           cum_col_additional_keys,
                           reporting_units,
                           order_by_str='date',
                           partition_by_str='combo_name, aggregation_group'):
    '''
    return the whole select string for an econ column. The optional parameter order_by_str is for yearly csv reports,
    and partition_by_str is for by well reports
    '''
    select_string = ''
    special_keys = list(SPECIAL_COL_DICT.keys())

    for col_key in econ_key_list:
        if col_key not in cum_col_additional_keys:
            # exclude columns that are only selected for cum
            add_str = get_one_col_aggregation_str(col_key, special_keys, reporting_units)
            select_string = select_string + add_str
        if col_key in cum_col_keys:
            # query the cumulative sum for the column
            cum_col_name = 'cum_' + col_key
            cum_add_str = f'SUM (ROUND(SUM({col_key}), 9)) OVER (PARTITION BY {partition_by_str} ORDER BY {order_by_str}) AS {cum_col_name}, '  # noqa
            select_string = select_string + cum_add_str
    return select_string


def get_grouped_monthly_query(table_path, run_id_str, run_date: datetime.datetime, econ_key_list, cum_col_keys,
                              cum_col_additional_keys, db_to_bq_key, reporting_units, time_zone, group_select_string,
                              group_by_cols):
    '''
    now shared by
    1. get_all_wells_sum_df for query agg result for FE nested output
    no aggregation needed since already aggregated result (ANY_VALUE or SUM will give same result)
    should update this function to remove GROUP BY, but need to verify if the PARTITION BY part of cum col need it
    '''
    well_header_list = AGG_METADATA_COLS + AGG_COMBO_COLS + ['created_at'] + group_by_cols + [
        'aggregation_group', 'date'
    ] + list(WELL_COUNT_HEADER.keys())
    select_string = get_wh_select_string(well_header_list,
                                         db_to_bq_key,
                                         run_date,
                                         time_zone,
                                         date_resolution_str='date, ')
    select_string += get_econ_select_string(econ_key_list, cum_col_keys, cum_col_additional_keys, reporting_units)

    query_str = f'SELECT {select_string} FROM `{table_path}` WHERE run_id="{run_id_str}" {group_select_string} GROUP BY combo_name, aggregation_group, date ORDER BY combo_name, aggregation_group, date ASC'  # noqa E501

    return query_str


def get_grouped_yearly_query(
    table_path,
    run_id_str,
    run_date: datetime.datetime,
    econ_key_list,
    cum_col_keys,
    cum_col_additional_keys,
    group_by_cols,
    db_to_bq_key,
    reporting_units,
    time_zone=None,
):
    well_header_list = AGG_METADATA_COLS + AGG_COMBO_COLS + ['created_at', *group_by_cols, 'aggregation_group', 'date']

    select_string = get_wh_select_string(
        well_header_list,
        db_to_bq_key,
        run_date,
        time_zone,
    )

    select_string += get_econ_select_string(econ_key_list,
                                            cum_col_keys,
                                            cum_col_additional_keys,
                                            reporting_units,
                                            order_by_str='year')

    query_str = f'SELECT {select_string} FROM `{table_path}` WHERE run_id="{run_id_str}" GROUP BY combo_name, aggregation_group, year ORDER BY combo_name, aggregation_group, year ASC'  # noqa

    return query_str


def get_joined_monthly_table_bq(context, run_id: str, run_date: str):
    '''
    calls the table function defined in the dataset
    '''
    dataset_id = context.econ_output_service.get_dataset()
    table_join_query = (f'WITH {JOINED_TABLE_NAME} AS '
                        f'(SELECT * FROM `{dataset_id}`.create_monthly_joined_table("{run_id}", "{run_date}"))')
    return table_join_query


def get_joined_one_liner_table_bq(context, run_id: str, run_date: str):
    '''
    calls the table function defined in the dataset
    '''
    dataset_id = context.econ_output_service.get_dataset()
    table_join_query = (f'WITH {JOINED_TABLE_NAME} AS '
                        f'(SELECT * FROM `{dataset_id}`.create_one_liner_joined_table("{run_id}", "{run_date}"))')
    return table_join_query


def get_joined_agg_table_bq(context, run_id: str, run_date: str):
    '''
    calls the table function defined in the dataset
    '''
    dataset_id = dataset_id = context.econ_output_service.get_dataset()
    table_join_query = (f'WITH {JOINED_TABLE_NAME} AS '
                        f'(SELECT * FROM `{dataset_id}`.create_aggregation_joined_table("{run_id}", "{run_date}"))')
    return table_join_query
