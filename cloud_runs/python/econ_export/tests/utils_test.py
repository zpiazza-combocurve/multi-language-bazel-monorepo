import pytest
from cloud_runs.econ_export.api.csv_export.utils import (
    get_sorted_order_by_columns, convert_bq_to_csv_headers, get_db_header_equivalent_for_aggregation_headers,
    add_bq_keys, get_mapping_from_output_columns, get_order_by_string, create_well_header_projection, split_columns,
    mongo_econ_run_data_query, construct_all_headers_schema, create_all_headers_table,
    get_mongo_project_custom_header_query, add_mongo_project_custom_header_query,
    split_non_project_headers_from_project_headers, get_schema_for_project_custom_headers, BQ_TYPE_MAP)
from bson import ObjectId
import unittest
from google.cloud import bigquery
import pandas as pd
from cloud_runs.econ_export.tests.mock_context import MockContext


@pytest.mark.unittest
def test_get_sorted_order_by_columns():
    output_columns = [
        {
            'key': 'well',
            'sortingOptions': {
                'direction': 'asc',
                'priority': 2
            }
        },
        {
            'key': 'group',
            'sortingOptions': {
                'direction': 'desc',
                'priority': 1
            }
        },
        {
            'key': 'group'
        },
    ]

    expected_response = [
        {
            'key': 'group',
            'sortingOptions': {
                'direction': 'desc',
                'priority': 1
            }
        },
        {
            'key': 'well',
            'sortingOptions': {
                'direction': 'asc',
                'priority': 2
            }
        },
    ]
    response = get_sorted_order_by_columns(output_columns)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize('report_type', ['cashflow-agg-csv', 'cashflow-csv'])
def test_get_db_header_equivalent_for_aggregation_headers(report_type):
    aggregation_headers = ['res_cat']
    output_columns = [{
        'key': 'first_aggregation_header',
        'label': 'First Aggregation Header'
    }, {
        'key': 'second_aggregation_header',
        'label': 'Second Aggregation Header'
    }, {
        'key': 'group',
        'label': 'Group'
    }]

    expected_response = [{
        'key': 'econ_prms_reserves_category',
        'label': 'Econ PRMS Reserves Category'
    }, {
        'key': 'econ_prms_reserves_sub_category',
        'label': 'Econ PRMS Reserves Sub Category'
    }, {
        'key': 'group',
        'label': 'Group'
    }]

    response = get_db_header_equivalent_for_aggregation_headers(report_type, output_columns, aggregation_headers)

    if report_type == 'cashflow-agg-csv':
        assert response == expected_response
    else:
        assert response == output_columns


@pytest.mark.unittest
def test_add_bq_keys():
    output_columns = [
        {
            'key': 'chosenID',
        },
        {
            'key': 'chosenKeyID',
        },
        {
            'key': 'group'
        },
    ]

    expected_response = [
        {
            'key': 'chosenID',
            'bq_key': 'chosen_id'
        },
        {
            'key': 'chosenKeyID',
            'bq_key': 'chosen_key_id'
        },
        {
            'key': 'group',
            'bq_key': 'group'
        },
    ]
    response = add_bq_keys(output_columns)
    assert response == expected_response


@pytest.mark.unittest
def test_convert_bq_to_csv_headers():
    context = MockContext()
    column_fields = {
        'gross_oil_well_head_volume': {
            'type': 'number',
            'label': 'Gross Oil Well Head Volume',
            'category': 'Gross Volumes',
            'hide': False,
            'options': {
                'monthly': True,
                'aggregate': True,
                'one_liner': True
            },
            'default_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            },
            'unit_key': 'oil'
        }
    }
    expected_response = {
        'gross_oil_well_head_volume': 'Gross Oil Well Head Volume (MBBL)',
        'well_name': 'Well Name',
        'incremental_index': 'Incremental Index',
        '_project_custom_header_1': 'Project Custom Header 1',
    }
    response = convert_bq_to_csv_headers(
        bq_headers=['gross_oil_well_head_volume', 'well_name', 'incremental_index', '_project_custom_header_1'],
        reporting_units={
            'oil': 'MBBL',
            'gas': 'MMCF'
        },
        column_fields=column_fields,
        extra_mapping={
            'well_name': 'Well Name',
            'incremental_index': 'Incremental Index'
        },
        custom_fields_service=context.custom_fields_service,
    )
    assert response == expected_response


@pytest.mark.unittest
def test_get_mapping_from_output_columns():
    output_columns = [
        {
            'key': 'gross_gas_well_head_volume',
            'label': 'Gross Gas Well Head Volume',
            'keyType': 'column',
            'forecast_param': True,
        },
        {
            'key': 'aggregation_group',
            'label': 'Aggregation Group',
            'keyType': 'header',
        },
        {
            'key': 'gross_oil_well_head_volume',
            'label': 'Gross Oil Well Head Volume',
            'keyType': 'column',
        },
    ]

    expected_response = {
        'gross_gas_well_head_volume': 'Gross Gas Well Head Volume',
        'aggregation_group': 'Group',
    }

    response = get_mapping_from_output_columns(output_columns)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize('output_columns, expected_response', [([{
    'key': 'well',
    'sortingOptions': {
        'direction': 'asc',
        'priority': 2
    }
}, {
    'key': 'group',
    'sortingOptions': {
        'direction': 'desc',
        'priority': 1
    }
}], ' ORDER BY group desc, well asc'), ([], '')])
def test_get_order_by_string(output_columns, expected_response):
    response = get_order_by_string(output_columns)
    assert response == expected_response


@pytest.mark.unittest
def test_create_well_header_projection():
    response = create_well_header_projection(well_header_keys=['well_name', 'date'])
    assert response == {'well_name': 1, 'date': 1}


@pytest.mark.unittest
@pytest.mark.parametrize('project_keys, expected_response', [
    (['project_custom_header'], {
        ObjectId('5e6f9e11ce8c14e6f180f7d4'): {
            'project_custom_header': 'dummy_value'
        }
    }),
    ([], {}),
])
def test_get_mongo_project_custom_header_query(project_keys, expected_response):
    context = MockContext()
    project_id = '62e94b4d39c6ab0012778a8c'
    wells = [ObjectId('5e6f9e11ce8c14e6f180f7d4')]
    response = get_mongo_project_custom_header_query(context, project_id, project_keys, wells)
    assert response == expected_response


@pytest.mark.unittest
def test_add_mongo_project_custom_header_query():
    project_custom_header = {ObjectId('5e6f9e11ce8c14e6f180f7d4'): {'project_custom_header': 'dummy_value'}}
    run_datas = [{'well': {'_id': ObjectId('5e6f9e11ce8c14e6f180f7d4')}}]
    expected_response = [{
        'well': {
            '_id': ObjectId('5e6f9e11ce8c14e6f180f7d4'),
            'project_custom_header': 'dummy_value'
        }
    }]
    response = add_mongo_project_custom_header_query(run_datas, project_custom_header)
    assert response == expected_response


@pytest.mark.unittest
def test_split_non_project_headers_from_project_headers():
    well_header_keys = ['well_name', '_project_custom_header_1']
    non_project_expected = ['well_name']
    project_expected = ['_project_custom_header_1']
    non_project_response, project_response = split_non_project_headers_from_project_headers(well_header_keys)
    assert non_project_response == non_project_expected
    assert project_response == project_expected


@pytest.mark.unittest
def test_mongo_econ_run_data_query():

    context = MockContext()
    run_id = '62e94b4d39c6ab0012778a8c'
    project_id = '62e94b4d39c6ab0012778a8c'
    well_header_keys = {'abstract': 1}

    expected_response = [{
        '_id': 'dummy_id',
        'reservesCategory': {
            'econ_prms_resources_class': 'reserves',
            'econ_prms_reserves_category': 'proved',
            'econ_prms_reserves_sub_category': 'producing'
        },
        'incrementalIndex': 0,
        'project': 'dummy_id',
        'run': ObjectId(run_id),
        'scenario': 'dummy_id',
        'user': 'dummy_id',
        'comboName': '01-Default 1',
        'well': {
            '_id': 'dummy_id'
        },
        'group': None
    }]

    response = mongo_econ_run_data_query(context, run_id, project_id, well_header_keys)
    for idx, _ in enumerate(expected_response):
        unittest.TestCase().assertDictEqual(response[idx], expected_response[idx])


@pytest.mark.unittest
def test_split_columns():
    columns = [{'key': 'well_name', 'keyType': 'header'}, {'key': 'date', 'keyType': 'column'}]
    well_header_keys_expected = ['well_name']
    econ_columns_expected = ['date']

    well_header_keys_response, econ_columns_response = split_columns(columns)
    assert well_header_keys_response == well_header_keys_expected
    assert econ_columns_response == econ_columns_expected


@pytest.mark.unittest
def test_construct_all_headers_schema():
    full_schema = {'casing_id': 'NUMERIC'}
    all_headers_df = pd.DataFrame([[None], [None]], columns=['casing_id'])
    local_schema_exppected = {'casing_id': 'NUMERIC'}
    bq_schema_expected = [bigquery.SchemaField('casing_id', 'NUMERIC', 'NULLABLE', None, None, (), None)]
    local_schema_response, bq_schema_response = construct_all_headers_schema(full_schema, all_headers_df)
    assert bq_schema_expected == bq_schema_response
    assert local_schema_exppected == local_schema_response


@pytest.mark.unittest
def test_get_schema_for_project_custom_headers():
    headers_df = pd.DataFrame(
        [['dummy', 1.1, True, pd.Timestamp('2020-01-01'), 4]],
        columns=[
            '_project_custom_header',
            '_project_custom_header_1',
            '_project_custom_header_2',
            '_project_custom_header_3',
            '_project_custom_header_4',
        ],
    )
    expected_response = {
        '_project_custom_header': BQ_TYPE_MAP['STRING'],
        '_project_custom_header_1': BQ_TYPE_MAP['NUMERIC'],
        '_project_custom_header_2': BQ_TYPE_MAP['BOOLEAN'],
        '_project_custom_header_3': BQ_TYPE_MAP['DATE'],
        '_project_custom_header_4': BQ_TYPE_MAP['INTEGER'],
    }
    response = get_schema_for_project_custom_headers(headers_df)
    assert response == expected_response


@pytest.mark.unittest
def test_create_all_headers_table():
    context = MockContext()
    run_id = '62e94b4d39c6ab0012778a8c'
    project_id = '62e94b4d39c6ab0012778a8c'
    output_columns = []
    expected_response = 'dummy_table_path'
    response = create_all_headers_table(context, run_id, project_id, output_columns)
    assert response == expected_response
