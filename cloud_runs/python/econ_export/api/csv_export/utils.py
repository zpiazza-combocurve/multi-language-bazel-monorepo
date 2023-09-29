from bson import ObjectId
from google.cloud import bigquery as bq
import pandas as pd
import time
from combocurve.science.econ.big_query import get_db_bq_key_map
from combocurve.services.econ.econ_columns import BASIC_HEADER, SUGGESTED_HEADER, OTHER_HEADER_AGG
from combocurve.science.econ.post_process import PostProcess
from combocurve.services.econ.econ_output_fields import WELL_HEADER_NAME_MAP
from combocurve.services.econ.econ_output_service import get_schema, process_output_type
from combocurve.services.econ.econ_big_query_schema import NON_BQ_HEADERS

TEMP_TABLE_SCHEMA = NON_BQ_HEADERS + [{'mode': 'REQUIRED', 'name': 'well_id', 'type': 'STRING'}]
ALL_HEADERS_TABLE_EXPIRE_TIME = 600
BQ_TYPE_MAP = {
    'STRING': bq.enums.SqlTypeNames.STRING,
    'DATE': bq.enums.SqlTypeNames.DATE,
    'TIMESTAMP': bq.enums.SqlTypeNames.TIMESTAMP,
    'INTEGER': bq.enums.SqlTypeNames.INTEGER,
    'NUMERIC': bq.enums.SqlTypeNames.NUMERIC,
    'BOOLEAN': bq.enums.SqlTypeNames.BOOLEAN,
}

EXTRA_MAP = {
    'well_index': 'Well Index',
    'incremental_index': 'Incremental Index',
    'econ_prms_resources_class': 'Econ PRMS Resources Class',
    'econ_prms_reserves_category': 'Econ PRMS Reserves Category',
    'econ_prms_reserves_sub_category': 'Econ PRMS Reserves Sub Category',
}

BASE_HEADERS = {**BASIC_HEADER, **SUGGESTED_HEADER, **OTHER_HEADER_AGG}


def get_sorted_order_by_columns(output_columns: list) -> list:
    priority_columns = list(filter(lambda col: col.get('sortingOptions'), output_columns))
    return sorted(priority_columns, key=lambda col: col['sortingOptions']['priority'])


def get_db_header_equivalent_for_aggregation_headers(
    report_type: str,
    output_columns: list,
    aggregation_headers: list,
) -> list:
    if report_type == 'cashflow-agg-csv':

        if aggregation_headers == ['res_cat']:
            aggregation_headers = ['econ_prms_reserves_category', 'econ_prms_reserves_sub_category']

        label_mapper = {
            **BASE_HEADERS,
            **EXTRA_MAP,
            'prms_reserves_category': 'PRMS Reserves Category',
            'prms_reserves_sub_category': 'PRMS Reserves Sub Category',
        }
        fe_aggregation_headers_keys = ['first_aggregation_header', 'second_aggregation_header']
        key_mapper = {}
        for header, equivalent_header in zip(fe_aggregation_headers_keys, aggregation_headers):
            key_mapper[header] = equivalent_header
        for col in output_columns:
            if col['key'] in fe_aggregation_headers_keys:
                col['key'] = key_mapper.get(col['key'])  # key will be None for agg header 2 if not used
                col['label'] = label_mapper.get(col['key'], col['label'])
        # filter out agg header 2 if not used
        output_columns = list(filter(lambda col: col['key'], output_columns))
    return output_columns


def add_bq_keys(output_columns: list, ) -> list:
    db_to_bq_key = get_db_bq_key_map()
    for col in output_columns:
        col.update({'bq_key': db_to_bq_key.get(col['key'], col['key'])})
    return output_columns


def convert_bq_to_csv_headers(
    bq_headers: list,
    reporting_units: list,
    column_fields: dict,
    base_headers: dict = BASE_HEADERS,
    extra_mapping: dict = {},
    custom_fields_service=None,
) -> dict:

    csv_headers_mapping = {}

    # update reporting units
    reporting_units.update({
        'oil_price': '$/BBL',
        'gas_price': '$/MCF',
        'ngl_price': '$/BBL',
        'drip_condensate_price': '$/BBL',
        'boe': reporting_units['oil'],
        'mcfe': reporting_units['gas'],
        'oil_breakeven': '$/BBL',
        'gas_breakeven': '$/MCF',
    })

    well_headers = {**base_headers, **extra_mapping}
    if custom_fields_service:
        well_headers = {**well_headers, **custom_fields_service.get_custom_fields('wells')}

    for bq_header in bq_headers:
        db_header = WELL_HEADER_NAME_MAP.get(bq_header, bq_header)
        if db_header in well_headers:
            csv_headers_mapping[bq_header] = well_headers[db_header]
        elif db_header in EXTRA_MAP:  # TODO: verify if necessary
            csv_headers_mapping[bq_header] = EXTRA_MAP[db_header]
        elif 'project_custom_header' in db_header:
            csv_headers_mapping[bq_header] = ' '.join([word.capitalize() for word in db_header.split('_') if word])
        else:
            if db_header.startswith('cum_'):
                template = column_fields[db_header.split('cum_')[1]]
                name = f"Cum {template['label']}"
            else:
                template = column_fields[db_header]
                name = template['label']

            unit = PostProcess.get_unit(reporting_units, template)
            csv_headers_mapping[bq_header] = f'{name} ({unit})' if unit else name

    return csv_headers_mapping


def get_mapping_from_output_columns(output_columns):
    return {
        c['key']: c['label'] if c['key'] != 'aggregation_group' else 'Group'
        for c in output_columns if c['keyType'] == 'header' or c.get('forecast_param')
    }


def get_order_by_string(output_columns: list) -> str:
    order_by_columns = get_sorted_order_by_columns(output_columns)
    if order_by_columns:
        order_by_string = ' ORDER BY '
        order_by_string += ', '.join([f'{col["key"]} {col["sortingOptions"]["direction"]}' for col in order_by_columns])
        return order_by_string
    return ''


def create_well_header_projection(well_header_keys):
    return dict(zip(well_header_keys, [1] * len(well_header_keys)))


def get_mongo_project_custom_header_query(context, project_id, project_keys, wells):
    if not project_keys:
        return {}

    project_custom_headers = list(
        context.project_custom_headers_datas_collection.find({
            'project': ObjectId(project_id),
            'well': {
                '$in': wells
            }
        }))
    for custom_header in project_custom_headers:
        header = custom_header.get('customHeaders', {})
        missing_headers = set(project_keys) - set(header)
        header.update({key: None for key in missing_headers})
        custom_header.update({'customHeaders': header})

    return {custom_header['well']: custom_header['customHeaders'] for custom_header in project_custom_headers}


def add_mongo_project_custom_header_query(run_datas, project_custom_header):
    for run_data in run_datas:
        run_data['well'].update(project_custom_header.get(run_data['well']['_id'], {}))
    return run_datas


def split_non_project_headers_from_project_headers(well_header_keys: list[str]):
    non_project_headers, project_headers = [], []
    for key in well_header_keys:
        if 'project_custom_header' in key:
            project_headers.append(key)
        else:
            non_project_headers.append(key)
    return non_project_headers, project_headers


def mongo_econ_run_data_query(context, run_id, project_id, well_header_keys):
    non_project_keys, project_keys = split_non_project_headers_from_project_headers(well_header_keys)
    well_header_projection = create_well_header_projection(non_project_keys)
    run_object_id = ObjectId(run_id)

    well_datas_pipeline = [{
        '$match': {
            'run': run_object_id,
            'well': {
                '$ne': None
            }
        }
    }, {
        '$lookup': {
            'from': 'wells',
            'localField': 'well',
            'foreignField': '_id',
            'as': 'well'
        }
    }, {
        '$unwind': '$well',
    }, {
        "$project": {
            'oneLinerData': 0
        }
    }]

    group_datas_pipeline = [{
        '$match': {
            'run': run_object_id,
            'group': {
                '$ne': None
            }
        }
    }, {
        '$lookup': {
            'from': 'econ-groups',
            'localField': 'group',
            'foreignField': '_id',
            'as': 'well'
        }
    }, {
        '$unwind': '$well',
    }, {
        "$project": {
            'oneLinerData': 0
        }
    }]

    if len(well_header_projection) > 0:
        lookup_index = 1
        projection_pipeline = [{"$project": well_header_projection}]
        well_datas_pipeline[lookup_index]['$lookup']["pipeline"] = projection_pipeline
        group_datas_pipeline[lookup_index]['$lookup']["pipeline"] = projection_pipeline

    well_run_datas = list(context.economic_data_collection.aggregate(well_datas_pipeline))
    group_run_datas = list(context.economic_data_collection.aggregate(group_datas_pipeline))
    well_list = [run_data['well']['_id']
                 for run_data in well_run_datas] + [run_data['group'] for run_data in group_run_datas]
    pch_list = get_mongo_project_custom_header_query(context, project_id, project_keys, well_list)
    run_datas = add_mongo_project_custom_header_query(well_run_datas + group_run_datas, pch_list)

    return run_datas


def split_columns(columns):
    well_header_keys = [c['key'] for c in columns if c['keyType'] == 'header']
    econ_column_keys = [c['key'] for c in columns if c['keyType'] == 'column']

    return well_header_keys, econ_column_keys


def construct_all_headers_schema(full_schema, all_headers_df):
    local_schema = {k: full_schema[k] for k in all_headers_df.columns}
    bq_schema = [bq.SchemaField(col, BQ_TYPE_MAP[type]) for col, type in local_schema.items()]
    return local_schema, bq_schema


def get_schema_for_project_custom_headers(headers_df: pd.DataFrame):
    mapper = {
        'object': BQ_TYPE_MAP['STRING'],
        'float64': BQ_TYPE_MAP['NUMERIC'],
        'bool': BQ_TYPE_MAP['BOOLEAN'],
        'int64': BQ_TYPE_MAP['INTEGER'],
        'datetime64[ns]': BQ_TYPE_MAP['DATE']
    }

    # add project custom headers to schema
    schema = {}
    for col in headers_df.columns:
        if 'project_custom_header' in col:
            schema.update({col: mapper[headers_df[col].dtype.name]})
    return schema


def create_all_headers_table(context, run_id, project_id, output_columns):

    # query all headers
    well_header_keys, _ = split_columns(output_columns)
    well_header_projection = dict(zip(well_header_keys, [1] * len(well_header_keys)))
    run_datas = mongo_econ_run_data_query(context, run_id, project_id, well_header_projection)
    all_headers = [run_data['well'] for run_data in run_datas]
    all_headers_df = pd.DataFrame(all_headers)
    all_headers_df.rename(columns={'_id': 'well_id'}, inplace=True)
    # keep only 1 record for each well/group when multiple
    all_headers_df.drop_duplicates(subset=['well_id'], inplace=True)

    # drop all existing columns in econ_v2_wells table except for well_id
    full_schema = {**get_schema(TEMP_TABLE_SCHEMA), **get_schema_for_project_custom_headers(all_headers_df)}
    all_headers_df.drop(columns=[col for col in all_headers_df.columns if col not in full_schema], inplace=True)
    all_headers_df[[col for col in get_schema(NON_BQ_HEADERS) if col not in all_headers_df.columns]] = None

    # construct schema and process types
    local_schema, bq_schema = construct_all_headers_schema(full_schema, all_headers_df)
    all_headers_df = all_headers_df.apply(lambda col: process_output_type(col, local_schema[col.name]))

    # create temporary all headers table
    suffix = run_id + '_' + str(time.time()).replace('.', '_')
    dataset_id = context.tenant_info['big_query_dataset']
    table_name = f'econ_v2_wells_all_headers_{suffix}'
    table_path = context.big_query_client.table_path(dataset_id, table_name)
    context.big_query_client.create_table(bq_schema, table_path, ALL_HEADERS_TABLE_EXPIRE_TIME)

    # write all_headers_df to the table
    table_id = context.big_query_client.get_table(table_path)
    context.big_query_client.insert_rows_df(table_id, all_headers_df)

    return table_path
