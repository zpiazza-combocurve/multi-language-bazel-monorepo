import datetime
import pandas as pd
from typing import Callable, Optional, List, Dict, Tuple, Union
from decimal import Decimal

from combocurve.services.econ.econ_big_query_schema import ONE_LINER_SCHEMA
from combocurve.services.econ.econ_output_fields import WELL_HEADER_NAME_MAP
from combocurve.services.econ.econ_columns import QUALIFIER_NAME_HEADER
from combocurve.science.econ.general_functions import FORECAST_PARAMS_DETAIL_COLUMNS, FORECAST_PARAMS_ONE_LINER_KEYS
from combocurve.science.econ.big_query import (get_joined_one_liner_table_bq, get_db_bq_key_map, JOINED_TABLE_NAME,
                                               datetime_to_local_time_str)
from combocurve.services.display_templates.custom_fields_service import CustomFieldsService
from cloud_runs.econ_export.context import EconExportContext
from cloud_runs.econ_export.api.csv_export.utils import (convert_bq_to_csv_headers, mongo_econ_run_data_query,
                                                         get_mapping_from_output_columns)
from cloud_runs.econ_export.api.csv_export.helpers.handle_one_liner_helper import get_discount_map

# this OTHER_HEADER is different with it in econ_columns.py
OTHER_HEADER = {
    'project_name': 'Project Name',
    'scenario_name': 'Scenario Name',
    'user_name': 'User Name',
    'combo_name': 'Combo Name',
    'econ_group': 'Econ Group',
    **QUALIFIER_NAME_HEADER,
    'created_at': 'Created At',
    'error': 'Error',
}

NUMERIC_COLUMNS = [col['name'] for col in ONE_LINER_SCHEMA if col['type'] == 'NUMERIC']


def handle_one_liner(context: EconExportContext, export_params: Dict, notify_progress: Callable) -> str:
    run_specs: Dict = export_params['run_specs']
    output_columns = export_params['output_columns']
    run_id = str(run_specs['_id'])
    time_zone = run_specs['outputParams']['timeZone']
    general_options = run_specs['outputParams']['generalOptions']
    reporting_units = general_options['reporting_units']
    discount_values = {
        'first_discount': f"{general_options['discount_table']['first_discount']}%",
        'second_discount': f"{general_options['discount_table']['second_discount']}%",
        'rows': [row['discount_table'] for row in general_options['discount_table']['rows']]
    }

    notify_progress(progress=50)

    gcp_name = f'{run_id}--one-liner--{datetime.datetime.utcnow().isoformat()}.csv'

    notify_progress(progress=70)

    one_liner_csv_str = gen_econ_file(context, run_specs, output_columns, reporting_units, discount_values, time_zone)

    notify_progress(progress=90)

    upload_csv_gcp(context, gcp_name, one_liner_csv_str)

    return gcp_name


def upload_csv_gcp(context: EconExportContext, gcp_name: str, one_liner_csv_str: str):
    bucket_name = context.files_bucket
    bucket = context.cloud_storage_client.client.bucket(bucket_name)
    blob = bucket.blob(gcp_name)
    blob.upload_from_string(one_liner_csv_str, content_type='application/CSV')


def one_liner_table_run_bq_query(run_date, run_id_str):
    run_date = f"{run_date.year}-{run_date.month}-{run_date.day}"

    where_str = f'run_id="{run_id_str}" AND run_date="{run_date}"'
    query_str = f'SELECT * FROM `{JOINED_TABLE_NAME}` WHERE {where_str}'

    return query_str


def get_run_datas(context: EconExportContext, run: Dict, time_zone: Union[str, None]) -> pd.DataFrame:
    run_id_str, run_date = str(run['_id']), run['runDate']

    query_str = one_liner_table_run_bq_query(run_date, run_id_str)
    table_join_query = get_joined_one_liner_table_bq(context, run_id_str, run_date)
    query_str = table_join_query + ' ' + query_str

    one_liner_df = context.big_query_client.get_query_df(query_str)
    one_liner_df['created_at'] = datetime.datetime.utcnow()

    return one_liner_df


def create_econ_column_map(econ_run_document: Dict,
                           reporting_units: Dict,
                           original_cols: List[Dict],
                           custom_fields_service: Optional[CustomFieldsService] = None) -> Tuple[Dict, List[Dict]]:
    column_fields = econ_run_document['outputParams']['columnFields']
    bq_headers = [col['key'] for col in original_cols]

    unitless_to_unit_map = convert_bq_to_csv_headers(
        bq_headers,
        reporting_units,
        column_fields,
        extra_mapping=get_mapping_from_output_columns(original_cols),
        custom_fields_service=custom_fields_service,
    )

    for column in original_cols:
        column['label'] = unitless_to_unit_map.get(column['key'], column['key'])

    return unitless_to_unit_map, original_cols


def populate_missing_headers(one_liner_df: pd.DataFrame, econ_run_data: List[Dict]) -> pd.DataFrame:
    db_to_bq_map = get_db_bq_key_map()
    well_headers = {str(well['well'].pop('_id')): well['well'] for well in econ_run_data}
    well_header_df = pd.DataFrame(well_headers).T.rename(columns=db_to_bq_map)

    return one_liner_df.join(well_header_df, 'well_id', rsuffix='_from_db')


def sort_index_based_on_columns(selected_df: pd.DataFrame, original_cols: List[Dict]) -> pd.DataFrame:
    sorted_columns = sorted(original_cols, key=lambda x: x['sortingOptions']['priority'] if x['sortingOptions'] else 0)
    sorted_columns = [col for col in sorted_columns if col['sortingOptions']]

    if sorted_columns:
        sorted_column_labels = [col['label'] for col in sorted_columns]
        sorted_asc_or_desc = [True if col['sortingOptions']['direction'] == 'ASC' else False for col in sorted_columns]
        selected_df = selected_df.sort_values(by=sorted_column_labels, ascending=sorted_asc_or_desc, ignore_index=True)

    return selected_df


def correct_column_typing(selected_df: pd.DataFrame, time_zone: Optional[str]) -> pd.DataFrame:
    if 'Created At' in selected_df.columns:
        selected_df['Created At'] = selected_df['Created At'].apply(lambda x: datetime_to_local_time_str(x, time_zone))
    selected_df[[c for c in selected_df.columns if 'Boolean' in c
                 ]] = selected_df[[c for c in selected_df.columns if 'Boolean' in c]].replace([False, True],
                                                                                              ['FALSE', 'TRUE'])
    selected_df = selected_df.applymap(lambda x: 0 if (x == Decimal(0) and type(x) != bool) else x)

    # change datetime columns format
    selected_df = selected_df.applymap(lambda x: x.strftime('%m/%d/%Y') if type(x) == datetime.date else x)

    return selected_df


def change_discount_names(selected_df: pd.DataFrame, discount_values: Dict[str, float],
                          reporting_units: Dict) -> pd.DataFrame:
    selected_df.rename(columns=get_discount_map(discount_values, reporting_units), inplace=True)

    return selected_df


def refine_output_dataframe(
    one_liner_df: pd.DataFrame,
    column_map: Dict,
    original_columns: List[Dict],
    discount_values: Dict[str, float],
    reporting_units: Dict,
    time_zone: Optional[str],
) -> pd.DataFrame:
    one_liner_df.rename(columns=WELL_HEADER_NAME_MAP, inplace=True)
    one_liner_df[[col['key'] for col in original_columns if col['key'] not in one_liner_df.columns]] = None

    one_liner_df.rename(columns=column_map, inplace=True)

    selected_df = one_liner_df[[c['label'] for c in original_columns]]

    selected_df = sort_index_based_on_columns(selected_df, original_columns)

    selected_df = correct_column_typing(selected_df, time_zone)

    selected_df = change_discount_names(selected_df, discount_values, reporting_units)

    return selected_df


def get_headers_from_columns(columns: list[Dict]) -> list:
    return [c['key'] for c in columns if c['keyType'] == 'header']


def initialize_forecast_param_columns(original_columns: List[Dict]) -> List[Dict]:
    ret = []
    for column in original_columns:
        if column['key'] in FORECAST_PARAMS_ONE_LINER_KEYS:
            ret.extend([{
                'key': f"{column['key']}_{detail}",
                'label': f"{column['label']} {FORECAST_PARAMS_DETAIL_COLUMNS[detail]['label']}",
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None,
                'forecast_param': True
            } for detail in FORECAST_PARAMS_DETAIL_COLUMNS])
        else:
            ret.append(column)

    return ret


def gen_econ_file(context: EconExportContext,
                  run: Dict,
                  original_cols: List[Dict],
                  reporting_units: Dict,
                  discount_values: Dict[str, float],
                  time_zone: Optional[str] = None) -> str:
    original_cols = initialize_forecast_param_columns(original_cols)
    well_header_keys = get_headers_from_columns(original_cols)
    mongo_econ_run_data = mongo_econ_run_data_query(context, run['_id'], run['project'], well_header_keys)
    econ_column_map, original_cols = create_econ_column_map(run, reporting_units, original_cols,
                                                            context.custom_fields_service)

    one_liner_df = get_run_datas(context, run, time_zone)  # only query the needed columns
    one_liner_df = populate_missing_headers(one_liner_df, mongo_econ_run_data)
    # add columns user selected but not in bigquery nor in well's mongo document
    selected_df = refine_output_dataframe(one_liner_df, econ_column_map, original_cols, discount_values,
                                          reporting_units, time_zone)

    return selected_df.to_csv(index=False)
