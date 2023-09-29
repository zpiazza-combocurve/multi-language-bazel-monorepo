from cloud_runs.econ_export.tests.test_data.handle_one_liner_test_data import (RUN_DOC, CUSTOM_CONFIGURATION,
                                                                               BIGQUERY_ONE_LINER_DATA,
                                                                               ONE_LINER_BASIC_HEADER_EXPORT,
                                                                               ONE_LINER_ALL_HEADER_EXPORT,
                                                                               ONE_LINER_SCENARIO_TABLE_HEADER_EXPORT)
from cloud_runs.econ_export.api.csv_export import handle_one_liner
from cloud_runs.econ_export.api.csv_export.helpers import handle_one_liner_helper
from cloud_runs.econ_export.api.csv_export.handler import update_output_column_type
from combocurve.services.econ.econ_service import EconService
import pytest
import pandas as pd
from typing import Optional
from pydantic import BaseModel
import datetime
from freezegun import freeze_time
import csv
import os
from bson import ObjectId

MODULE_PATH = 'cloud_runs.econ_export.api.csv_export.handle_one_liner.'


class MockContext():
    # mock context for testing
    def __init__(self):
        self.custom_fields_service = MockCustomFieldsService()
        self.big_query_client = MockBigQueryClient()
        self.econ_runs_collection = MockEconRunsCollection()
        self.economic_data_collection = MockEconomicDataCollection()
        self.economic_collection = MockEconomicCollection()
        self.econ_output_service = MockEconOutputService()


class MockColumn(BaseModel):
    label: Optional[str]
    keyType: Optional[str]
    key: Optional[str]


class MockEconOutputService():
    # mock econ output service for testing
    def get_dataset(self):
        return 'test_dataset'


class MockBigQueryClient():
    # mock bigquery client for testing
    def get_query_df(self, query_str):
        return pd.DataFrame(index=[0])


class MockCustomFieldsService():
    # mock custom fields service for testing
    def get_custom_fields(self, field):
        return {field: 'custom_field'}


class MockEconomicCollection():
    # mock economic collection for testing
    def find_one(self, run):
        return None


class MockEconRunsCollection:
    # mock econ runs collection for testing
    def find_one(self, run):
        return None


class MockEconomicDataCollection():
    # mock economic data collection for testing
    def aggregate(self, pipeline):
        if 'well' in pipeline[0]['$match']['$and'][0]:
            return [{
                '_id': ObjectId('6476539a84ee1564c6379a78'),
                'reservesCategory': {
                    'econ_prms_resources_class': '',
                    'econ_prms_reserves_category': '',
                    'econ_prms_reserves_sub_category': ''
                },
                'incrementalIndex': 1,
                'project': ObjectId('62daf40532ef7b0013610f42'),
                'run': ObjectId('6476538eeb4e3086a82b991e'),
                'scenario': ObjectId('62daf47232ef7b00136114ed'),
                'user': ObjectId('62616c86ffaef500121f295c'),
                'comboName': '01-Default 1',
                'well': {
                    '_id': ObjectId('5e272d51b78910dd2a1c68a2'),
                    'chosenID': '42185305440000',
                    'dataSource': 'di',
                    'abstract': '218',
                    'api14': '42185305440000',
                    'basin': 'GULF COAST CENTRAL',
                    'chosenKeyID': 'API14',
                    'completion_end_date': datetime.datetime(1995, 11, 21, 0, 0),
                    'county': 'GRIMES (TX)',
                    'current_operator_alias': 'JUNEAU ENERGY, LLC',
                    'dataPool': 'external',
                    'elevation': 256,
                    'elevation_type': 'KB EST',
                    'field': 'GIDDINGS',
                    'first_fluid_volume': None,
                    'first_prod_date': datetime.datetime(1995, 11, 1, 0, 0),
                    'first_prod_date_daily_calc': None,
                    'first_prod_date_monthly_calc': datetime.datetime(1995, 11, 15, 0, 0),
                    'first_prop_weight': None,
                    'gas_gatherer': 'ENERGY TRANSFER COMPANY',
                    'ground_elevation': 233,
                    'has_daily': False,
                    'has_monthly': True,
                    'hole_direction': 'H',
                    'inptID': 'INPT.tww1PpQlXo',
                    'landing_zone': 'Austin Chalk',
                    'lateral_length': None,
                    'lease_name': 'DENMAN',
                    'lease_number': '22931',
                    'lower_perforation': 14485,
                    'measured_depth': 14485,
                    'oil_api_gravity': 38.6,
                    'oil_gatherer': 'SUNOCO PTNRS. MKTG.&TERMINALS LP',
                    'perf_lateral_length': 4176,
                    'play': 'EAGLEBINE',
                    'primary_product': None,
                    'refrac_fluid_per_perforated_interval': None,
                    'refrac_proppant_per_fluid': None,
                    'refrac_proppant_per_perforated_interval': None,
                    'spud_date': datetime.datetime(1995, 10, 4, 0, 0),
                    'state': 'TX',
                    'status': 'ACTIVE',
                    'surfaceLatitude': 30.6195958,
                    'surfaceLongitude': -96.1635097,
                    'survey': 'AMOS GATES',
                    'toeLatitude': 30.6302317,
                    'toeLongitude': -96.166243,
                    'total_fluid_per_perforated_interval': None,
                    'total_fluid_volume': None,
                    'total_prop_weight': None,
                    'total_proppant_per_fluid': None,
                    'total_proppant_per_perforated_interval': None,
                    'true_vertical_depth': 10597.9,
                    'upper_perforation': 10309,
                    'well_name': 'DENMAN',
                    'well_number': '1H',
                    'well_type': 'OIL',
                    'total_additive_volume': None,
                    'total_cluster_count': None,
                    'total_stage_count': None,
                    'first_fluid_per_perforated_interval': None,
                    'first_proppant_per_fluid': None,
                    'first_proppant_per_perforated_interval': None,
                    'section': None,
                    'copied': False,
                    'custom_string_1': 'H',
                    'custom_string_7': 'SCOUT A',
                    'custom_string_11': 'ETXT 12',
                    'custom_bool_0': False,
                    'custom_bool_4': True
                },
                'group': None
            }, {
                '_id': ObjectId('6476539a84ee1564c6379a77'),
                'reservesCategory': {
                    'econ_prms_resources_class': '',
                    'econ_prms_reserves_category': '',
                    'econ_prms_reserves_sub_category': ''
                },
                'incrementalIndex': 0,
                'project': ObjectId('62daf40532ef7b0013610f42'),
                'run': ObjectId('6476538eeb4e3086a82b991e'),
                'scenario': ObjectId('62daf47232ef7b00136114ed'),
                'user': ObjectId('62616c86ffaef500121f295c'),
                'comboName': '01-Default 1',
                'well': {
                    '_id': ObjectId('5e272d51b78910dd2a1c68a2'),
                    'chosenID': '42185305440000',
                    'dataSource': 'di',
                    'abstract': '218',
                    'api14': '42185305440000',
                    'basin': 'GULF COAST CENTRAL',
                    'chosenKeyID': 'API14',
                    'completion_end_date': datetime.datetime(1995, 11, 21, 0, 0),
                    'county': 'GRIMES (TX)',
                    'current_operator_alias': 'JUNEAU ENERGY, LLC',
                    'dataPool': 'external',
                    'elevation': 256,
                    'elevation_type': 'KB EST',
                    'field': 'GIDDINGS',
                    'first_fluid_volume': None,
                    'first_prod_date': datetime.datetime(1995, 11, 1, 0, 0),
                    'first_prod_date_daily_calc': None,
                    'first_prod_date_monthly_calc': datetime.datetime(1995, 11, 15, 0, 0),
                    'first_prop_weight': None,
                    'gas_gatherer': 'ENERGY TRANSFER COMPANY',
                    'ground_elevation': 233,
                    'has_daily': False,
                    'has_monthly': True,
                    'hole_direction': 'H',
                    'inptID': 'INPT.tww1PpQlXo',
                    'landing_zone': 'Austin Chalk',
                    'lateral_length': None,
                    'lease_name': 'DENMAN',
                    'lease_number': '22931',
                    'lower_perforation': 14485,
                    'measured_depth': 14485,
                    'oil_api_gravity': 38.6,
                    'oil_gatherer': 'SUNOCO PTNRS. MKTG.&TERMINALS LP',
                    'perf_lateral_length': 4176,
                    'play': 'EAGLEBINE',
                    'primary_product': None,
                    'refrac_fluid_per_perforated_interval': None,
                    'refrac_proppant_per_fluid': None,
                    'refrac_proppant_per_perforated_interval': None,
                    'spud_date': datetime.datetime(1995, 10, 4, 0, 0),
                    'state': 'TX',
                    'status': 'ACTIVE',
                    'surfaceLatitude': 30.6195958,
                    'surfaceLongitude': -96.1635097,
                    'survey': 'AMOS GATES',
                    'toeLatitude': 30.6302317,
                    'toeLongitude': -96.166243,
                    'total_fluid_per_perforated_interval': None,
                    'total_fluid_volume': None,
                    'total_prop_weight': None,
                    'total_proppant_per_fluid': None,
                    'total_proppant_per_perforated_interval': None,
                    'true_vertical_depth': 10597.9,
                    'upper_perforation': 10309,
                    'well_name': 'DENMAN',
                    'well_number': '1H',
                    'well_type': 'OIL',
                    'total_additive_volume': None,
                    'total_cluster_count': None,
                    'total_stage_count': None,
                    'first_fluid_per_perforated_interval': None,
                    'first_proppant_per_fluid': None,
                    'first_proppant_per_perforated_interval': None,
                    'section': None,
                    'copied': False,
                    'custom_string_1': 'H',
                    'custom_string_7': 'SCOUT A',
                    'custom_string_11': 'ETXT 12',
                    'custom_bool_0': False,
                    'custom_bool_4': True
                },
                'group': None
            }]
        elif 'group' in pipeline[0]['$match']['$and'][0]:
            return []


@pytest.mark.unittest
def test_populate_missing_headers_with_conversion():
    econ_run_data = [{
        'well': {
            '_id': 'A',
            'chosenID': 'cat',
            'headerB': 'dog'
        }
    }, {
        'well': {
            '_id': 'B',
            'chosenID': 'hamster',
            'headerB': 'mouse'
        }
    }]

    one_liner_df = pd.DataFrame([['A', 'cat', 'moose'], ['B', 'hamster', 'gorilla']],
                                columns=['well_id', 'chosen_id', 'headerC'])

    response = handle_one_liner.populate_missing_headers(one_liner_df, econ_run_data)

    expected_response = pd.DataFrame(
        [['A', 'cat', 'moose', 'cat', 'dog'], ['B', 'hamster', 'gorilla', 'hamster', 'mouse']],
        columns=['well_id', 'chosen_id', 'headerC', 'chosen_id_from_db', 'headerB'])

    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_create_econ_column_map():
    econ_run_document = {
        'outputParams': {
            'columnFields': {
                'a': {
                    'label': 'Alpha',
                    'unit': ''
                },
                'b': {
                    'label': 'Bravo',
                    'unit_key': 'boe'
                },
                'c': {
                    'label': 'Charlie',
                    'unit': 'def'
                },
                'unused': {
                    'label': 'Delta',
                    'unit': ''
                }
            }
        }
    }

    reporting_units = {'abc': 'bde', 'oil': '$/bbl', 'gas': '$/mcf'}
    original_cols = [{
        'key': 'a',
        'label': 'Alpha',
        'keyType': 'header'
    }, {
        'key': 'b',
        'label': 'Bravo',
        'keyType': 'column'
    }, {
        'key': 'c',
        'label': 'Charlie',
        'keyType': 'column'
    }]

    response = handle_one_liner.create_econ_column_map(econ_run_document, reporting_units, original_cols)
    expected_response = ({
        'a': 'Alpha',
        'b': 'Bravo ($/bbl)',
        'c': 'Charlie (def)'
    }, [{
        'key': 'a',
        'label': 'Alpha',
        'keyType': 'header'
    }, {
        'key': 'b',
        'label': 'Bravo ($/bbl)',
        'keyType': 'column'
    }, {
        'key': 'c',
        'label': 'Charlie (def)',
        'keyType': 'column'
    }])

    assert response == expected_response


@pytest.mark.unittest
def test_refine_output_dataframe(mocker):
    mocker.patch(MODULE_PATH + 'get_discount_map', return_value={})
    base_one_liner_df = pd.DataFrame([['A', 'cat', 'moose'], ['B', 'hamster', 'gorilla']], columns=['F', 'G', 'H'])

    original_df = base_one_liner_df.reindex(columns=list('FGH'))
    column_map = {'F': 'f', 'G': 'g'}
    original_columns = [{
        'key': 'G',
        'label': 'g',
        'sortingOptions': None
    }, {
        'key': 'F',
        'label': 'f',
        'sortingOptions': None
    }]
    time_zone = None
    response = handle_one_liner.refine_output_dataframe(original_df, column_map, original_columns, {}, {}, time_zone)

    expected_response = pd.DataFrame([['cat', 'A'], ['hamster', 'B']], columns=['g', 'f'])

    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_refine_output_dataframe_created_at(mocker):
    mocker.patch(MODULE_PATH + 'get_discount_map', return_value={})
    base_one_liner_df = pd.DataFrame([['A', 'cat', datetime.datetime(2023, 5, 1, 8, 0, 0)],
                                      ['B', 'hamster', datetime.datetime(2023, 6, 1, 20, 0, 0)]],
                                     columns=['F', 'G', 'created_at'])

    original_df = base_one_liner_df.reindex(columns=['F', 'G', 'created_at'])
    column_map = {'F': 'f', 'created_at': 'Created At'}
    original_columns = [{
        'key': 'F',
        'label': 'f',
        'sortingOptions': None
    }, {
        'key': 'created_at',
        'label': 'Created At',
        'sortingOptions': None
    }]
    time_zone = 'America/Chicago'
    response = handle_one_liner.refine_output_dataframe(original_df, column_map, original_columns, {}, {}, time_zone)

    expected_response = pd.DataFrame([['A', '2023-05-01 03:00:00 CDT'], ['B', '2023-06-01 15:00:00 CDT']],
                                     columns=['f', 'Created At'])

    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_refine_output_dataframe_sorted(mocker):
    mocker.patch(MODULE_PATH + 'get_discount_map', return_value={})
    base_one_liner_df = pd.DataFrame([['A', 'cat', 'moose'], ['B', 'hamster', 'gorilla']], columns=['F', 'G', 'H'])

    original_df = base_one_liner_df.reindex(columns=list('FGH'))
    column_map = {'F': 'f', 'G': 'g'}
    original_columns = [{
        'key': 'G',
        'label': 'g',
        'sortingOptions': {
            'priority': 1,
            'direction': 'DESC'
        }
    }, {
        'key': 'F',
        'label': 'f',
        'sortingOptions': None
    }]
    time_zone = None
    response = handle_one_liner.refine_output_dataframe(original_df, column_map, original_columns, {}, {}, time_zone)

    expected_response = pd.DataFrame([['hamster', 'B'], ['cat', 'A']], columns=['g', 'f'])

    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_refine_output_dataframe_discount_table_column():
    base_one_liner_df = pd.DataFrame(
        [['A', 'cat', 'moose', 'banana'], ['B', 'hamster', 'gorilla', 'apple']],
        columns=['F', 'G', 'discount_table_cash_flow_1', 'afit_discount_table_cash_flow_2'])

    original_df = base_one_liner_df.reindex(
        columns=['F', 'G', 'discount_table_cash_flow_1', 'afit_discount_table_cash_flow_2'])
    column_map = {
        'F': 'f',
        'G': 'g',
        'discount_table_cash_flow_1': 'Discount Table Cum CF 1 (M$)',
        'afit_discount_table_cash_flow_2': 'AFIT Discount Table Cum CF 2 (M$)'
    }
    original_columns = [{
        'key': 'G',
        'label': 'g',
        'sortingOptions': {
            'priority': 1,
            'direction': 'DESC'
        }
    }, {
        'key': 'F',
        'label': 'f',
        'sortingOptions': None
    }, {
        'key': 'discount_table_cash_flow_1',
        'label': 'Discount Table Cum CF 1 (M$)',
        'sortingOptions': None
    }, {
        'key': 'afit_discount_table_cash_flow_2',
        'label': 'AFIT Discount Table Cum CF 2 (M$)',
        'sortingOptions': None
    }]
    time_zone = None
    discount_values = {'first_discount': '15%', 'second_discount': '20%', 'rows': [5, 10] + [0] * 14}
    reporting_units = {'cash': 'M$'}
    response = handle_one_liner.refine_output_dataframe(original_df, column_map, original_columns, discount_values,
                                                        reporting_units, time_zone)

    expected_response = pd.DataFrame(
        [['hamster', 'B', 'gorilla', 'apple'], ['cat', 'A', 'moose', 'banana']],
        columns=['g', 'f', '5% Discount Cash Flow (M$)', 'AFIT 10% Discount Cash Flow (M$)'])
    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_initialize_forecast_param_columns():
    original_columns = [{
        'key': 'oil_p10_first_segment',
        'label': 'Oil P10 First Segment'
    }, {
        'key': 'a',
        'label': 'Alpha'
    }]

    response = handle_one_liner.initialize_forecast_param_columns(original_columns)
    expected_response = [{
        'forecast_param': True,
        'key': 'oil_p10_first_segment_segment_type',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Type',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_start_date',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Start Date',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_end_date',
        'keyType': 'column',
        'label': 'Oil P10 First Segment End Date',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_q_start',
        'keyType': 'column',
        'label': 'Oil P10 First Segment q Start',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_q_end',
        'keyType': 'column',
        'label': 'Oil P10 First Segment q End',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_di_eff_sec',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Di Eff-Sec',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_d1_nominal',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Di Nominal',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_b',
        'keyType': 'column',
        'label': 'Oil P10 First Segment b',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_realized_d_sw_eff_sec',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Realized D Sw-Eff-Sec',
        'selected': True,
        'sortingOptions': None
    }, {
        'forecast_param': True,
        'key': 'oil_p10_first_segment_sw_date',
        'keyType': 'column',
        'label': 'Oil P10 First Segment Sw-Date',
        'selected': True,
        'sortingOptions': None
    }, {
        'key': 'a',
        'label': 'Alpha'
    }]

    assert response == expected_response


@pytest.mark.unittest
def test_get_headers_from_columns():
    columns = [{
        'key': 'a',
        'keyType': 'header'
    }, {
        'key': 'b',
        'keyType': 'header'
    }, {
        'key': 'c',
        'keyType': 'column'
    }, {
        'key': 'd',
        'keyType': 'column'
    }]

    response = handle_one_liner.get_headers_from_columns(columns)
    expected_response = ['a', 'b']

    assert response == expected_response


@pytest.mark.unittest
def test_all_functions_called_gen_econ_file(mocker):
    spy_initialize_forecast_param_columns = mocker.patch(MODULE_PATH + 'initialize_forecast_param_columns')
    spy_get_headers_from_columns = mocker.patch(MODULE_PATH + 'get_headers_from_columns')
    spy_create_econ_column_map = mocker.patch(MODULE_PATH + 'create_econ_column_map', return_value=({}, [{}]))
    spy_get_run_datas = mocker.patch(MODULE_PATH + 'get_run_datas')
    spy_populate_missing_headers = mocker.patch(MODULE_PATH + 'populate_missing_headers')
    spy_refine_output_dataframe = mocker.patch(MODULE_PATH + 'refine_output_dataframe')

    handle_one_liner.gen_econ_file(MockContext(), {'_id': None, 'project': None}, [], {}, {})

    spy_initialize_forecast_param_columns.assert_called_once()
    spy_get_headers_from_columns.assert_called_once()
    spy_create_econ_column_map.assert_called_once()
    spy_get_run_datas.assert_called_once()
    spy_populate_missing_headers.assert_called_once()
    spy_refine_output_dataframe.assert_called_once()


@pytest.mark.unittest
def test_one_liner_table_run_bq_query():
    # Mock date class
    class MockDate():
        # Mock date class
        def __init__(self):
            self.year = 2000
            self.month = 1
            self.day = 1

    run_date = MockDate()
    run_id_str = 'ABC'

    response = handle_one_liner.one_liner_table_run_bq_query(run_date, run_id_str)
    expected_response = 'SELECT * FROM `joined_table` WHERE run_id="ABC" AND run_date="2000-1-1"'
    assert response == expected_response


@pytest.mark.unittest
@freeze_time("2010-01-10")
def test_get_run_datas(mocker):
    spy_one_liner_table_run_bq_query = mocker.patch(MODULE_PATH + 'one_liner_table_run_bq_query', return_value='FIRST')
    spy_get_joined_one_liner_table_bq = mocker.patch(MODULE_PATH + 'get_joined_one_liner_table_bq',
                                                     return_value='SECOND')

    context = MockContext()
    run = {'_id': 'ABC', 'runDate': 'DEF'}
    time_zone = 'CST'

    response = handle_one_liner.get_run_datas(context, run, time_zone)
    expected_response = pd.DataFrame({'created_at': datetime.datetime.utcnow()}, index=[0])
    spy_one_liner_table_run_bq_query.assert_called_once_with('DEF', 'ABC')
    spy_get_joined_one_liner_table_bq.assert_called_once_with(context, 'ABC', 'DEF')
    pd.testing.assert_frame_equal(response, expected_response)


@pytest.mark.unittest
def test_get_discount_map_m_dollar():
    path = os.path.join(os.path.dirname(__file__) + '/test_data/discount_names_m_dollar_comparison_test.csv')
    comparison = open(path, 'r', encoding='utf-8-sig')
    post_transform, pre_transform = [], []

    for a, b in csv.reader(comparison, delimiter=','):
        post_transform.append(a)
        pre_transform.append(b)

    discount_values = {
        'first_discount': '10%',
        'second_discount': '15%',
        'rows': [0, 2, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100]
    }
    reporting_units = {'cash': 'M$'}

    discount_map = handle_one_liner_helper.get_discount_map(discount_values, reporting_units)

    compare_transform = [discount_map[column] if column in discount_map else column for column in pre_transform]
    assert compare_transform == post_transform


@pytest.mark.unittest
def test_get_discount_map_dollar():
    path = os.path.join(os.path.dirname(__file__) + '/test_data/discount_names_dollar_comparison_test.csv')
    comparison = open(path, 'r', encoding='utf-8-sig')
    post_transform, pre_transform = [], []

    for a, b in csv.reader(comparison, delimiter=','):
        post_transform.append(a)
        pre_transform.append(b)

    discount_values = {
        'first_discount': '10%',
        'second_discount': '15%',
        'rows': [0, 2, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100]
    }
    reporting_units = {'cash': '$'}

    discount_map = handle_one_liner_helper.get_discount_map(discount_values, reporting_units)

    compare_transform = [discount_map[column] if column in discount_map else column for column in pre_transform]
    assert compare_transform == post_transform


@freeze_time("06/16/2023 04:27:09 PM")
@pytest.mark.integtest
def test_entire_one_liner_basic_header_template_pipeline(mocker):

    # Function to compare output of pipeline and expected output csv file
    def compare_csv_files(a, b, file1: str):
        response = [line.split(',') for line in file1.splitlines()]
        expected_response = [line.split(',') for line in ONE_LINER_BASIC_HEADER_EXPORT.splitlines()]
        for i, j in zip(response, expected_response):
            assert i == j

    mocker.patch(MODULE_PATH + 'upload_csv_gcp', side_effect=compare_csv_files)

    #mock a function that takes 3 arguments with a function that takes 2 arguments
    def mock_notify(progress):
        pass

    context = MockContext()

    context.econ_runs_collection.find_one = lambda x: RUN_DOC
    context.custom_fields_service.get_custom_fields = lambda x: CUSTOM_CONFIGURATION
    context.big_query_client.get_query_df = lambda x: BIGQUERY_ONE_LINER_DATA

    econ_service = EconService(context)
    params = {
        'run_id':
        '6476538eeb4e3086a82b991e',
        'wellHeaders': [{
            'key': 'api14'
        }, {
            'key': 'chosenID'
        }, {
            'key': 'county'
        }, {
            'key': 'well_name'
        }, {
            'key': 'well_number'
        }]
    }
    '''
    template = {
        'oneLiner': [
            {'name': 'Basic Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'All Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'Scenario Table Headers', 'columns': ['a', 'b', 'type': 'oneLiner', 'cashflowOptions': None}
        ]
    }
    '''

    templates = econ_service.default_csv_export_settings(params)

    output_columns = output_columns = update_output_column_type(templates['oneLiner'][0]['columns'])
    report_type = templates['oneLiner'][0]['type']
    cashflow_report = templates['oneLiner'][0]['cashflowOptions']

    export_params = {
        'run_specs': RUN_DOC,
        'output_columns': output_columns,
        'report_type': report_type,
        'cashflow_report': cashflow_report,
    }

    handle_one_liner.handle_one_liner(context, export_params, mock_notify)


@freeze_time("06/16/2023 04:36:37 PM")
@pytest.mark.integtest
def test_entire_one_liner_all_header_template_pipeline(mocker):

    # Function to compare output of pipeline and expected output csv file
    def compare_csv_files(a, b, file1: str):
        response = [line.split(',') for line in file1.splitlines()]
        expected_response = [line.split(',') for line in ONE_LINER_ALL_HEADER_EXPORT.splitlines()]
        for i, j in zip(response, expected_response):
            assert i == j

    mocker.patch(MODULE_PATH + 'upload_csv_gcp', side_effect=compare_csv_files)

    def mock_notify(progress):
        pass

    context = MockContext()

    context.econ_runs_collection.find_one = lambda x: RUN_DOC
    context.custom_fields_service.get_custom_fields = lambda x: CUSTOM_CONFIGURATION
    context.big_query_client.get_query_df = lambda x: BIGQUERY_ONE_LINER_DATA

    econ_service = EconService(context)
    params = {
        'run_id':
        '6476538eeb4e3086a82b991e',
        'wellHeaders': [{
            'key': 'api14'
        }, {
            'key': 'chosenID'
        }, {
            'key': 'county'
        }, {
            'key': 'well_name'
        }, {
            'key': 'well_number'
        }]
    }
    '''
    template = {
        'oneLiner': [
            {'name': 'Basic Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'All Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'Scenario Table Headers', 'columns': ['a', 'b', 'type': 'oneLiner', 'cashflowOptions': None}
        ]
    }
    '''

    templates = econ_service.default_csv_export_settings(params)
    output_columns = output_columns = update_output_column_type(templates['oneLiner'][1]['columns'])
    report_type = templates['oneLiner'][1]['type']
    cashflow_report = templates['oneLiner'][1]['cashflowOptions']

    export_params = {
        'run_specs': RUN_DOC,
        'output_columns': output_columns,
        'report_type': report_type,
        'cashflow_report': cashflow_report,
    }

    handle_one_liner.handle_one_liner(context, export_params, mock_notify)


@freeze_time("06/16/2023 04:36:37 PM")
@pytest.mark.integtest
def test_entire_one_liner_scenario_table_header_template_pipeline(mocker):

    # Function to compare output of pipeline and expected output csv file
    def compare_csv_files(a, b, file1: str):
        response = [line.split(',') for line in file1.splitlines()]
        expected_response = [line.split(',') for line in ONE_LINER_SCENARIO_TABLE_HEADER_EXPORT.splitlines()]
        for i, j in zip(response, expected_response):
            assert i == j

    mocker.patch(MODULE_PATH + 'upload_csv_gcp', side_effect=compare_csv_files)

    def mock_notify(progress):
        pass

    context = MockContext()

    context.econ_runs_collection.find_one = lambda x: RUN_DOC
    context.custom_fields_service.get_custom_fields = lambda x: CUSTOM_CONFIGURATION
    context.big_query_client.get_query_df = lambda x: BIGQUERY_ONE_LINER_DATA

    econ_service = EconService(context)
    params = {
        'run_id':
        '6476538eeb4e3086a82b991e',
        'wellHeaders': [{
            'key': 'api14'
        }, {
            'key': 'chosenID'
        }, {
            'key': 'county'
        }, {
            'key': 'first_prod_date'
        }, {
            'key': 'flow_path'
        }, {
            'key': 'fluid_type'
        }, {
            'key': 'well_name'
        }, {
            'key': 'well_number'
        }]
    }
    '''
    template = {
        'oneLiner': [
            {'name': 'Basic Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'All Headers', 'columns': ['a', 'b'], 'type': 'oneLiner', 'cashflowOptions': None},
            {'name': 'Scenario Table Headers', 'columns': ['a', 'b', 'type': 'oneLiner', 'cashflowOptions': None}
        ]
    }
    '''

    templates = econ_service.default_csv_export_settings(params)
    output_columns = output_columns = update_output_column_type(templates['oneLiner'][2]['columns'])
    report_type = templates['oneLiner'][2]['type']
    cashflow_report = templates['oneLiner'][2]['cashflowOptions']

    export_params = {
        'run_specs': RUN_DOC,
        'output_columns': output_columns,
        'report_type': report_type,
        'cashflow_report': cashflow_report,
    }

    handle_one_liner.handle_one_liner(context, export_params, mock_notify)
