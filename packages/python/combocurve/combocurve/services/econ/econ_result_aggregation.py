from bson import ObjectId
import pandas as pd
from combocurve.science.econ.general_functions import get_py_date
from combocurve.services.econ.econ_columns import WELL_COUNT_HEADER
from combocurve.science.econ.big_query import (get_bq_query, get_joined_monthly_table_bq, get_joined_agg_table_bq,
                                               get_db_bq_key_map, get_grouped_monthly_query, QUERY_GROUPS_DICT,
                                               AGG_METADATA_COLS, AGG_COMBO_COLS, AGGREGATION_RELATED_COLS,
                                               JOINED_TABLE_NAME)
from combocurve.services.econ.econ_output_service import AGGREGATION_TABLE_NAME
from combocurve.science.econ.post_process import PostProcess

from combocurve.shared.parquet_types import to_date


def get_flat_query_result(query_df):
    query_df = query_df.drop(columns=AGG_METADATA_COLS + AGG_COMBO_COLS, errors='ignore')
    if 'date' in query_df.columns:
        query_df['date'] = query_df['date'].astype(str)

    float_columns = [c for c in query_df.columns if c not in AGGREGATION_RELATED_COLS]
    query_df[float_columns] = query_df[float_columns].astype(float)

    group_list = pd.unique(query_df['aggregation_group'])

    group_dict = {}
    for g in group_list:
        group_key = 'all' if g == 'all wells' else g
        group_dict[group_key] = query_df[query_df.aggregation_group == g].drop(['aggregation_group'],
                                                                               axis=1).to_dict('list')

    return group_dict


def get_aggregation_date_str(db_aggregation_date):
    input_aggregation_date = get_py_date(db_aggregation_date)
    adj_aggregation_date = input_aggregation_date.replace(day=1)
    return adj_aggregation_date.strftime('%Y-%m-%d')


def get_group_df(query_df, key, is_res_cat):
    if key == 'all_wells':
        this_key_df = query_df.loc[query_df['aggregation_group'] == 'all wells']
    else:
        # get specific df for group
        if is_res_cat:
            if key == 'all_wells':
                this_key_df = query_df.loc[query_df['aggregation_group'] == 'all wells']
            elif key == 'cat':
                this_key_df = query_df.loc[(query_df['prms_reserves_category'] != '')
                                           & (~query_df['aggregation_group'].str.contains(','))]
            elif key == 'un_cat':
                this_key_df = query_df.loc[query_df['aggregation_group'] == ', ']
                this_key_df.aggregation_group = 'uncatgorized'
            elif key == 'cat_sub_cat':
                this_key_df = query_df.loc[(query_df['aggregation_group'].str.contains(','))
                                           & (query_df['aggregation_group'] != ', ')]
        else:
            this_key_df = query_df.loc[(query_df['aggregation_group'] != 'all wells')]

    return this_key_df


def get_aggregate_groups(group_by_cols, is_res_cat):
    if is_res_cat:
        return QUERY_GROUPS_DICT

    groups = {
        'all_wells': {
            'group_name_str': '"all wells"',
            'where_str': 'error IS NULL',
            'group_by_str': 'combo_name, date',
            'group_by_items': ['combo_name', 'date']
        },
    }
    # check there are two columns to be aggregated by
    if len(group_by_cols) > 2 or len(group_by_cols) == 0:
        return groups

    agg_col_str = ', '.join(group_by_cols)

    groups['well_header_aggregation'] = {
        'group_name_str': ' || ", " || '.join([f'LOWER(COALESCE({g}, \'NULL\'))' for g in group_by_cols]),
        'where_str': 'error IS NULL',
        'group_by_str': f'combo_name, {agg_col_str}, date',
        'group_by_items': ['combo_name', *group_by_cols, 'date']
    }

    return groups


def get_aggregation_args(context, run_id_str):
    run = context.econ_runs_collection.find_one({'_id': ObjectId(run_id_str)})
    output_params = run['outputParams']
    general_options = output_params['generalOptions']
    aggregation_date_str = get_aggregation_date_str(general_options['main_options']['aggregation_date'])
    reporting_units = general_options['reporting_units']
    column_fields = output_params['columnFields']
    run_date = run['runDate']
    bq_run_date = to_date(run_date)

    all_monthly_key_list = [k for k in column_fields if column_fields[k]['options']['monthly'] is True]
    all_monthly_key_list.remove('date')
    return aggregation_date_str, bq_run_date, all_monthly_key_list, reporting_units


def get_one_well_grouped_sum_df(monthly_df, well_header_df, metadata_df):
    grouped_df = pd.concat([monthly_df, well_header_df, metadata_df], join='outer', ignore_index=True)
    if 'date' in grouped_df.columns:
        grouped_df = grouped_df[grouped_df['date'].notna()]
    return grouped_df


def save_grouped_sums_to_bq(context, run_id_str, run_date_str, group_by_cols, isResCat):
    dataset_id = context.econ_output_service.get_dataset()
    # always use bq key names in query
    query_groups = get_aggregate_groups(group_by_cols, isResCat)

    aggregation_date_str, bq_run_date, all_monthly_key_list, reporting_units = get_aggregation_args(context, run_id_str)
    aggregation_table_path = context.big_query_client.table_path(dataset_id, AGGREGATION_TABLE_NAME)

    # join the tables
    table_join_query = get_joined_monthly_table_bq(context, run_id_str, run_date_str)
    query = table_join_query + ', ' + get_bq_query(
        context,
        run_id_str,
        aggregation_date_str,
        query_groups,
        group_by_cols,
        bq_run_date,
        all_monthly_key_list,
        reporting_units,
        JOINED_TABLE_NAME,
    )
    context.big_query_client.append_query_result_to_table(query, aggregation_table_path)


def get_all_wells_sum_df(context, run_id_str):
    '''
    get df for created nested econ output for FE
    '''
    run = context.econ_runs_collection.find_one({'_id': ObjectId(run_id_str)})
    run_date = run['runDate']

    output_params = run['outputParams']
    columns = output_params['columns']
    column_fields = output_params['columnFields']
    general_options = output_params['generalOptions']
    reporting_units = general_options['reporting_units']
    group_select_string = 'AND aggregation_group="all wells"'

    # find columns to be queried
    (_, _, selected_key_list, additional_key_list, cum_col_keys,
     cum_col_additional_keys) = PostProcess.get_econ_file_header(columns,
                                                                 column_fields,
                                                                 general_options, [],
                                                                 include_cum=True)
    db_to_bq_key = get_db_bq_key_map()
    '''
    query selected_key_list + additional_key_list for generate nested output for FE
    generate_all_well_results calls after will remove those cols: nested_output_paras['ignore_columns']
    '''
    updated_cum_col_add_keys = list(set(cum_col_additional_keys) - set(additional_key_list))
    '''
    selected_key_list and additional_key_list may have overlap
    can't use set to remove duplication because set change the order and order matters
    '''
    selected_and_additional_key = selected_key_list + [k for k in additional_key_list if k not in selected_key_list]

    query = get_grouped_monthly_query(JOINED_TABLE_NAME, run_id_str, run_date, selected_and_additional_key,
                                      cum_col_keys, updated_cum_col_add_keys, db_to_bq_key, reporting_units, None,
                                      group_select_string, [])
    table_join_query = get_joined_agg_table_bq(context, run_id_str, str(run_date.date()))
    all_wells_query = table_join_query + ' ' + query

    # save query result to df
    all_wells_df = context.big_query_client.get_query_df(all_wells_query)

    # drop columns that are not needed in front-end display
    all_wells_df.drop(columns=['created_at'] + list(WELL_COUNT_HEADER.keys()), inplace=True)
    return all_wells_df
