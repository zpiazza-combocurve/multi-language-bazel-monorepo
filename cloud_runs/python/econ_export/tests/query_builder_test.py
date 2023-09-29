from cloud_runs.econ_export.api.csv_export.query_builder import QueryBuilder
import pytest
from datetime import datetime
import unittest
from combocurve.science.econ.big_query import datetime_to_local_time_str
from cloud_runs.econ_export.tests.mock_context import MockContext


@pytest.fixture
def query_builder_instance():
    context = MockContext()
    run_id = '62e94b4d39c6ab0012778a8c'
    project_id = '62e94b4d39c6ab0012778ac9'
    run_date = datetime.now()
    number_of_wells = 5
    main_options = {
        'aggregation_date': '2000-01-01',
        'currency': 'USD',
        'reporting_period': 'fiscal',
        'fiscal': '5-4',
        'income_tax': 'no',
        'project_type': 'primary_recovery'
    }
    reporting_units = {
        'oil': 'MBBL',
        'gas': 'MMCF',
        'ngl': 'MBBL',
        'drip_condensate': 'MBBL',
        'water': 'MBBL',
        'pressure': 'PSI',
        'cash': 'M$',
        'water_cut': 'BBL/BOE',
        'gor': 'CF/BBL',
        'condensate_gas_ratio': 'BBL/MMCF',
        'drip_condensate_yield': 'BBL/MMCF',
        'ngl_yield': 'BBL/MMCF'
    }
    return QueryBuilder(context, run_id, project_id, run_date, number_of_wells, main_options, reporting_units)


@pytest.mark.unittest
def test_add_item_to_list(query_builder_instance: QueryBuilder):
    initial_list = ['a', 'b', 'c']
    list_to_add = ['b', 'c', 'd']
    expected_response = ['a', 'b', 'c', 'd']
    response = query_builder_instance.add_item_to_list(initial_list, list_to_add)
    assert response == expected_response


@pytest.mark.unittest
def test_add_independent_columns(query_builder_instance: QueryBuilder):
    bq_keys_input = [
        'oil_loss', 'gas_loss', 'gas_flare', 'ngl_yield', 'drip_condensate_yield', 'lease_nri', 'state_tax_rate',
        'federal_tax_rate'
    ]
    for phase in ['oil', 'gas', 'water', 'ngl', 'drip_condensate']:
        bq_keys_input.append(f'{phase}_risk')
        bq_keys_input.append(f'{phase}_differentials_')
        bq_keys_input.append(f'{phase}_price')
        bq_keys_input.append(f'wi_{phase}')
        bq_keys_input.append(f'nri_{phase}')
        bq_keys_input.append(f'{phase}_shrinkage')

    response = [
        'oil_loss', 'gas_loss', 'gas_flare', 'ngl_yield', 'drip_condensate_yield', 'lease_nri', 'state_tax_rate',
        'federal_tax_rate', 'oil_risk', 'oil_differentials_', 'oil_price', 'wi_oil', 'nri_oil', 'oil_shrinkage',
        'gas_risk', 'gas_differentials_', 'gas_price', 'wi_gas', 'nri_gas', 'gas_shrinkage', 'water_risk',
        'water_differentials_', 'water_price', 'wi_water', 'nri_water', 'water_shrinkage', 'ngl_risk',
        'ngl_differentials_', 'ngl_price', 'wi_ngl', 'nri_ngl', 'ngl_shrinkage', 'drip_condensate_risk',
        'drip_condensate_differentials_', 'drip_condensate_price', 'wi_drip_condensate', 'nri_drip_condensate',
        'drip_condensate_shrinkage', 'gross_oil_well_head_volume', 'pre_risk_oil_volume', 'net_oil_sales_volume',
        'gross_oil_sales_volume', 'wi_oil_sales_volume', 'unshrunk_oil_volume', 'gross_gas_well_head_volume',
        'pre_risk_gas_volume', 'net_gas_sales_volume', 'gross_gas_sales_volume', 'wi_gas_sales_volume',
        'unshrunk_gas_volume', 'gross_water_well_head_volume', 'pre_risk_water_volume', 'net_water_sales_volume',
        'gross_water_sales_volume', 'wi_water_sales_volume', 'unshrunk_water_volume', 'gross_ngl_sales_volume',
        'pre_risk_ngl_volume', 'net_ngl_sales_volume', 'wi_ngl_sales_volume', 'unshrunk_ngl_volume',
        'gross_drip_condensate_sales_volume', 'pre_risk_drip_condensate_volume', 'net_drip_condensate_sales_volume',
        'wi_drip_condensate_sales_volume', 'unshrunk_drip_condensate_volume', 'pre_flare_gas_volume',
        'pre_yield_gas_volume_ngl', 'pre_yield_gas_volume_drip_condensate', 'taxable_income'
    ]

    expected_response = query_builder_instance.add_independent_columns(bq_keys_input)
    unittest.TestCase().assertCountEqual(response, expected_response)


@pytest.mark.unittest
@pytest.mark.parametrize('report_type, expected_response',
                         [('cashflow-agg-csv', ['combo_name', 'aggregation_group']),
                          ('cashflow-csv', ['combo_name', 'well_id', 'incremental_index'])])
def test_get_mandatory_headers_for_grouping(query_builder_instance: QueryBuilder, report_type, expected_response):
    response = query_builder_instance.get_mandatory_headers_for_grouping(report_type)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize('report_type, part_str, max_number_of_wells',
                         [('cashflow-csv', 'partition by combo_name, well_id, incremental_index order by date', 10),
                          ('cashflow-agg-csv', 'partition by combo_name, aggregation_group order by date', 10),
                          ('cashflow-csv', '', 3)])
def test_get_cumulative_column_sql_equivalent(
    query_builder_instance: QueryBuilder,
    report_type,
    part_str,
    max_number_of_wells,
):
    bq_key = ['gross_gas_well_head_volume', 'cum_gross_gas_well_head_volume']
    expected_response = ['gross_gas_well_head_volume']
    if query_builder_instance.number_of_wells > max_number_of_wells:
        expected_response.append('null as cum_gross_gas_well_head_volume')
    else:
        expected_response.append(
            f'round(sum(gross_gas_well_head_volume) over({part_str}), 9) as cum_gross_gas_well_head_volume')
    response = query_builder_instance.get_cumulative_column_sql_equivalent(bq_key, report_type, max_number_of_wells)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize(
    'report_type, cashflow_report_type, time_periods, calendar_or_fiscal, num_monthly_periods, expected_response',
    [
        (
            'cashflow-csv',
            'monthly',
            0,
            None,
            None,
            'FROM(SELECTincremental_index,well_id,combo_name,date,`range`,least(least(date_diff(date,min(date)over(),MONTH),date_diff(max(date)over(),min(date)over(),MONTH)+1)+floor(greatest(date_diff(date,MAX(date)over(),MONTH)/12,0)),0)asrow_number_new,FROMjoined_table)'  # noqa: E501
        ),
        (
            'cashflow-agg-csv',
            'yearly',
            1,
            None,
            None,
            'FROM(SELECTaggregation_group,combo_name,yearasdate,`range`,least(year-min(year)over(),1)asrow_number_new,FROMjoined_table_with_year)'  # noqa: E501
        ),
        (
            'cashflow-csv',
            'hybrid',
            None,
            'calendar',
            None,
            'FROM(SELECTincremental_index,well_id,combo_name,date,`range`,least(least(date_diff(date,min(date)over(),MONTH),0)+greatest(extract(YEARfromdate)-extract(YEARfromdate_add(min(date)over(),interval0MONTH)),0),safe_cast("Infinity"ASFLOAT64))asrow_number_new,casewhendate<date_add(min(date)over(),interval0MONTH)thendateelsedate_add(date_trunc(date,year),interval11month)endasnew_date,FROMjoined_table)'  # noqa: E501
        ),
        (
            'cashflow-agg-csv',
            'hybrid',
            None,
            'fiscal',
            3,
            'FROM(SELECTaggregation_group,combo_name,date,`range`,least(least(date_diff(date,min(date)over(),MONTH),3)+floor(greatest(date_diff(date,date_add(min(date)over(),interval3MONTH),MONTH)/12,0)),safe_cast("Infinity"ASFLOAT64))asrow_number_new,casewhendate<date_add(min(date)over(),interval3MONTH)thendateelsedate_add(date_add(date_add(min(date)over(),interval3MONTH),interval-1month),intervalcast(ceil(date_diff(date,date_sub(date_add(min(date)over(),interval3MONTH),interval1month),month)/12)asINT64)year)endasnew_date,FROMjoined_table)'  # noqa: E501
        ),
    ])
def test_get_from_string(query_builder_instance: QueryBuilder, report_type, cashflow_report_type, time_periods,
                         calendar_or_fiscal, num_monthly_periods, expected_response):
    bq_keys = ['created_at', 'date', 'range']
    response = query_builder_instance.get_from_string(
        bq_keys,
        num_monthly_periods,
        time_periods,
        report_type,
        cashflow_report_type,
        calendar_or_fiscal,
    ).replace('\n', '').replace(' ', '')
    assert response == expected_response


@pytest.mark.unittest
def test_get_select_string(query_builder_instance: QueryBuilder):
    time_zone = 'America/Toronto'
    report_type = 'cashflow-agg-csv'
    cashflow_report_type = 'monthly'
    run_date_str = datetime_to_local_time_str(query_builder_instance.run_date, time_zone)
    bq_keys = ['created_at', 'date', 'combo_name', 'oil_differentials_1', 'ad_valorem_tax', 'range', 'county']
    expected_response = f'select "{run_date_str}" AS created_at, max(date) as date, combo_name,' +\
        ' ROUND(CASE WHEN SUM(net_oil_sales_volume) = 0 THEN AVG(oil_differentials_1) ' +\
        'ELSE sum(oil_differentials_1 * net_oil_sales_volume) / SUM(net_oil_sales_volume) END, 9) ' +\
        'AS oil_differentials_1, sum(ad_valorem_tax) as ad_valorem_tax, any_value(`range`) ' +\
        'as `range`, any_value(county) as county, '
    response = query_builder_instance.get_select_string(bq_keys, report_type, cashflow_report_type, time_zone)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize(
    'fiscal, expected_resposne',
    [('5-4', 'IF (extract(MONTH from date) >= 6, extract(YEAR from date)+1, extract(YEAR from date)) as year, '),
     (None, 'extract(YEAR from date) as year, ')])
def test_get_fiscal_year(query_builder_instance: QueryBuilder, fiscal, expected_resposne):
    response = query_builder_instance.get_fiscal_year(fiscal)
    assert response == expected_resposne


@pytest.mark.unittest
def test_get_with_string(query_builder_instance: QueryBuilder):
    cashflow_report_type = 'yearly'
    report_type = 'cashflow-csv'
    output_columns = []
    run_date_str = query_builder_instance.run_date.strftime('%Y-%m-%d')
    expected_response = 'WITH joined_table AS (SELECT * FROM dummy_table_path  LEFT JOIN  ' +\
        f'test_dataset.create_monthly_joined_table("62e94b4d39c6ab0012778a8c", "{run_date_str}") USING (well_id)), ' +\
        'joined_table_with_year as (select * , IF (extract(MONTH from date) >= 6, extract(YEAR from date)+1, ' +\
        'extract(YEAR from date)) as year,  from joined_table)'
    response = query_builder_instance.get_with_string(report_type, cashflow_report_type, output_columns)
    assert response == expected_response


@pytest.mark.unittest
def test_get_group_by_string(query_builder_instance: QueryBuilder):
    report_type = 'cashflow-csv'
    expected_response = 'GROUP BY combo_name, well_id, incremental_index, row_number_new '
    response = query_builder_instance.get_group_by_string(report_type)
    assert response == expected_response


@pytest.mark.unittest
@pytest.mark.parametrize('output_columns, expected_response', [([{
    'key': 'abstract',
    'sortingOptions': {
        'priority': 1,
        'direction': 'ASC'
    },
    'bq_key': 'abstract'
}, {
    'key': 'range',
    'sortingOptions': {
        'priority': 2,
        'direction': 'DESC'
    },
    'bq_key': 'range'
}], 'ORDER BY abstract ASC, `range` DESC'), ([{
    'key': 'abstract',
    'bq_key': 'abstract'
}], '')])
def test_get_order_by_string(query_builder_instance: QueryBuilder, output_columns, expected_response):
    response = query_builder_instance.get_order_by_string(output_columns)
    assert response == expected_response


@pytest.mark.unittest
def test_get_query(query_builder_instance: QueryBuilder):
    report_type = 'cashflow-csv'
    cashflow_report_type = 'monthly'
    time_zone = 'America/Toronto'
    output_columns = [{
        'key': 'abstract',
        'label': 'Abstract',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None,
        'bq_key': 'abstract'
    }]
    time_periods = 3
    num_monthly_periods = None
    calendar_or_fiscal = None
    run_date_str = query_builder_instance.run_date.strftime('%Y-%m-%d')
    expected_response = 'WITHjoined_tableAS(SELECT*FROMdummy_table_pathLEFTJOINtest_dataset' +\
        f'.create_monthly_joined_table("62e94b4d39c6ab0012778a8c","{run_date_str}")USING(well_id))' +\
        'selectany_value(abstract)asabstract,FROM(SELECTincremental_index,well_id,combo_name,abstract,' +\
        'least(least(date_diff(date,min(date)over(),MONTH),date_diff(max(date)over(),min(date)over(),MONTH)+1)+' +\
        'floor(greatest(date_diff(date,MAX(date)over(),MONTH)/12,0)),3)asrow_number_new,FROMjoined_table)' +\
        'GROUPBYcombo_name,well_id,incremental_index,row_number_new'
    response = query_builder_instance.get_query(
        report_type,
        cashflow_report_type,
        time_zone,
        output_columns,
        time_periods,
        num_monthly_periods,
        calendar_or_fiscal,
    ).replace('\n', '').replace(' ', '')
    assert response == expected_response
