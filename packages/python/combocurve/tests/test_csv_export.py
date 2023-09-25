import pytest

from combocurve.services.econ.csv_export import ONE_LINER_BASIC_HEADERS
from combocurve.services.econ import csv_export

PATH_TO_MODULE = "combocurve.services.econ.csv_export."

CF_OPTIONS = 'cashflowOptions'
REPORT_TYPE = 'type'


class MockContext(object):
    # mock the context
    def __init__(self, custom_header_configurations_collection):
        self.custom_fields_service = custom_header_configurations_collection


class MockCustomHeaderCollection(object):
    # mock the custom_header_configurations_collection
    def __init__(self, find_one_response):
        self.find_one_response = find_one_response

    def get_custom_fields(self, sub=None):
        return self.find_one_response


@pytest.mark.unittest
def test_get_one_column_template_default():
    response = csv_export.get_one_column_template('key', 'label', 'column')
    expected_response = {
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None,
    }
    assert response == expected_response


@pytest.mark.unittest
def test_get_one_column_template_sorting_option():
    response = csv_export.get_one_column_template('key', 'label', 'column', sorting_options='sorting_options')
    expected_response = {
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': 'sorting_options',
    }
    assert response == expected_response


@pytest.mark.unittest
def test_get_one_column_template_selected():
    response = csv_export.get_one_column_template('key', 'label', 'column', selected=False)
    expected_response = {
        'key': 'key',
        'label': 'label',
        'selected': False,
        'keyType': 'column',
        'sortingOptions': None,
    }
    assert response == expected_response


@pytest.mark.unittest
def test_generate_econ_columns_one_liner():
    run = {
        'outputParams': {
            'columns': [{
                'key': 'key',
                'selected_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True,
                }
            }],
            'columnFields': {
                'key': {
                    'label': 'label'
                }
            }
        }
    }

    response = csv_export.generate_econ_columns(run)
    expected_response = ([], [{
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }])

    assert response == expected_response


@pytest.mark.unittest
def test_generate_econ_columns_monthly():
    run = {
        'outputParams': {
            'columns': [{
                'key': 'key',
                'selected_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False,
                }
            }],
            'columnFields': {
                'key': {
                    'label': 'label'
                }
            }
        }
    }

    response = csv_export.generate_econ_columns(run)
    expected_response = ([{
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }], [])

    assert response == expected_response


@pytest.mark.unittest
def test_generate_econ_columns_monthly_and_one_liner():
    run = {
        'outputParams': {
            'columns': [{
                'key': 'key',
                'selected_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True,
                }
            }],
            'columnFields': {
                'key': {
                    'label': 'label'
                }
            }
        }
    }

    response = csv_export.generate_econ_columns(run)
    expected_response = ([{
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }], [{
        'key': 'key',
        'label': 'label',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }])

    assert response == expected_response


@pytest.mark.unittest
def test_generate_econ_columns_monthly_and_one_liner_multiple_columns():
    run = {
        'outputParams': {
            'columns': [{
                'key': 'key1',
                'selected_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True,
                }
            }, {
                'key': 'key2',
                'selected_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False,
                }
            }, {
                'key': 'key3',
                'selected_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True,
                }
            }, {
                'key': 'gross_oil_well_head_volume',
                'selected_options': {
                    'monthly': False,
                    'aggregate': True,
                    'one_liner': False,
                }
            }],
            'columnFields': {
                'key1': {
                    'label': 'label1'
                },
                'key2': {
                    'label': 'label2'
                },
                'key3': {
                    'label': 'label3'
                },
                'gross_oil_well_head_volume': {
                    'label': 'Gross Oil Well Head Volume'
                }
            }
        }
    }

    response = csv_export.generate_econ_columns(run)
    expected_response = ([{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'cum_gross_oil_well_head_volume',
        'label': 'Cum Gross Oil Well Head Volume',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }], [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key3',
        'label': 'label3',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }])

    assert response == expected_response


@pytest.mark.unittest
def test_fill_in_setting_template():
    template_name = 'template_name'
    columns = [{'key': 'key1', 'label': 'label1', 'selected': True, 'keyType': 'column', 'sortingOptions': None}]
    report_type = 'report_type'

    response = csv_export.fill_in_setting_template(template_name, columns, report_type)
    expected_response = {
        'name': 'template_name',
        'columns': [{
            'key': 'key1',
            'label': 'label1',
            'selected': True,
            'keyType': 'column',
            'sortingOptions': None
        }],
        REPORT_TYPE: 'report_type',
        CF_OPTIONS: None,
    }

    assert response == expected_response


@pytest.mark.unittest
def test_fill_in_setting_template_cash_flow_report():
    template_name = 'template_name'
    columns = [{'key': 'key1', 'label': 'label1', 'selected': True, 'keyType': 'column', 'sortingOptions': None}]
    report_type = 'cashflow'

    response = csv_export.fill_in_setting_template(template_name,
                                                   columns,
                                                   report_type,
                                                   cf_report_type='cash_flow_report',
                                                   cf_report_time_periods='time_periods',
                                                   cf_report_hybrid_year_type='hybrid_year_type',
                                                   cf_report_months='months')
    expected_response = {
        'name': 'template_name',
        'columns': [{
            'key': 'key1',
            'label': 'label1',
            'selected': True,
            'keyType': 'column',
            'sortingOptions': None
        }],
        REPORT_TYPE: 'cashflow',
        CF_OPTIONS: {
            'type': 'cash_flow_report',
            'timePeriods': 'time_periods',
            'hybridOptions': {
                'yearType': 'hybrid_year_type',
                'months': 'months',
            }
        },
    }

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_one_liner_basic_headers():
    report_type = 'oneLiner'
    template = ONE_LINER_BASIC_HEADERS
    columns = [{'key': 'key1', 'label': 'label1', 'selected': True, 'keyType': 'column', 'sortingOptions': None}]

    response = csv_export.append_columns_to_headers(columns, [], report_type, template)
    expected_response = [
        {
            'key': 'well_index',
            'keyType': 'column',
            'label': 'Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api14',
            'keyType': 'header',
            'label': 'API 14',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'inptID',
            'keyType': 'header',
            'label': 'INPT ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenID',
            'keyType': 'header',
            'label': 'Chosen ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'incremental_index',
            'keyType': 'column',
            'label': 'Incremental Index',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 3
            }
        },
        {
            'key': 'well_number',
            'keyType': 'header',
            'label': 'Well Number',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'econ_prms_resources_class',
            'keyType': 'column',
            'label': 'Econ PRMS Resources Class',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_sub_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Sub Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'state',
            'keyType': 'header',
            'label': 'State',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'county',
            'keyType': 'header',
            'label': 'County/Parish',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator',
            'keyType': 'header',
            'label': 'Current Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_alias',
            'keyType': 'header',
            'label': 'Current Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'type_curve_area',
            'keyType': 'header',
            'label': 'Type Curve Area',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'econ_group',
            'keyType': 'column',
            'label': 'Econ Group',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'key1',
            'keyType': 'column',
            'label': 'label1',
            'selected': True,
            'sortingOptions': None
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_one_liner_all_columns_with_custom():
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]
    custom_headers = [
        {
            'key': 'custom_header_1',
            'keyType': 'header',
            'label': 'Custom Header 1',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'custom_header_2',
            'keyType': 'header',
            'label': 'Custom Header 2',
            'selected': True,
            'sortingOptions': None
        },
    ]
    report_type = 'oneLiner'
    template = 'All Headers'

    response = csv_export.append_columns_to_headers(columns, custom_headers, report_type, template)
    expected_response = [
        {
            'key': 'well_index',
            'keyType': 'column',
            'label': 'Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api14',
            'keyType': 'header',
            'label': 'API 14',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'inptID',
            'keyType': 'header',
            'label': 'INPT ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenID',
            'keyType': 'header',
            'label': 'Chosen ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'incremental_index',
            'keyType': 'column',
            'label': 'Incremental Index',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 3
            }
        },
        {
            'key': 'well_number',
            'keyType': 'header',
            'label': 'Well Number',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'econ_prms_resources_class',
            'keyType': 'column',
            'label': 'Econ PRMS Resources Class',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_sub_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Sub Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'state',
            'keyType': 'header',
            'label': 'State',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'county',
            'keyType': 'header',
            'label': 'County/Parish',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator',
            'keyType': 'header',
            'label': 'Current Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_alias',
            'keyType': 'header',
            'label': 'Current Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'type_curve_area',
            'keyType': 'header',
            'label': 'Type Curve Area',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'abstract',
            'keyType': 'header',
            'label': 'Abstract',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'acre_spacing',
            'keyType': 'header',
            'label': 'Acre Same Zone Spacing',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'allocation_type',
            'keyType': 'header',
            'label': 'Allocation Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api10',
            'keyType': 'header',
            'label': 'API 10',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api12',
            'keyType': 'header',
            'label': 'API 12',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'aries_id',
            'keyType': 'header',
            'label': 'Aries ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'azimuth',
            'keyType': 'header',
            'label': 'Azimuth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'basin',
            'keyType': 'header',
            'label': 'Basin',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'block',
            'keyType': 'header',
            'label': 'Block',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'casing_id',
            'keyType': 'header',
            'label': 'Casing ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'choke_size',
            'keyType': 'header',
            'label': 'Choke Size',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenKeyID',
            'keyType': 'header',
            'label': 'Chosen ID Key',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_design',
            'keyType': 'header',
            'label': 'Completion Design',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_end_date',
            'keyType': 'header',
            'label': 'Completion End Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_start_date',
            'keyType': 'header',
            'label': 'Completion Start Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'copied',
            'keyType': 'header',
            'label': 'Copied Well',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'country',
            'keyType': 'header',
            'label': 'Country',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_code',
            'keyType': 'header',
            'label': 'Current Operator Code',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_ticker',
            'keyType': 'header',
            'label': 'Current Operator Ticker',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dataSource',
            'keyType': 'header',
            'label': 'Data Source',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dataPool',
            'keyType': 'header',
            'label': 'Data Pool',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'date_rig_release',
            'keyType': 'header',
            'label': 'Date Rig Release',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'distance_from_base_of_zone',
            'keyType': 'header',
            'label': 'Distance From Base Of Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'distance_from_top_of_zone',
            'keyType': 'header',
            'label': 'Distance From Top Of Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'district',
            'keyType': 'header',
            'label': 'District',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'drill_end_date',
            'keyType': 'header',
            'label': 'Drill End Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'drill_start_date',
            'keyType': 'header',
            'label': 'Drill Start Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'elevation',
            'keyType': 'header',
            'label': 'Elevation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'elevation_type',
            'keyType': 'header',
            'label': 'Elevation Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'field',
            'keyType': 'header',
            'label': 'Field',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_cluster_count',
            'keyType': 'header',
            'label': 'Cluster Count  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_frac_vendor',
            'keyType': 'header',
            'label': 'Frac Vendor (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_max_injection_pressure',
            'keyType': 'header',
            'label': 'Max Injection Pressure  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_max_injection_rate',
            'keyType': 'header',
            'label': 'Max Injection Rate  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date',
            'keyType': 'header',
            'label': 'First Prod Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date_daily_calc',
            'keyType': 'header',
            'label': 'First Daily Prod Date Calc',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date_monthly_calc',
            'keyType': 'header',
            'label': 'First Monthly Prod Date Calc',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_stage_count',
            'keyType': 'header',
            'label': 'Stage Count  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_flow_tbg_press',
            'keyType': 'header',
            'label': 'First Test Flow TBG Press',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_gas_vol',
            'keyType': 'header',
            'label': 'First Test Gas Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_gor',
            'keyType': 'header',
            'label': 'First Test Gor',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_oil_vol',
            'keyType': 'header',
            'label': 'First Test Oil Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_water_vol',
            'keyType': 'header',
            'label': 'First Test Water Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_treatment_type',
            'keyType': 'header',
            'label': 'Treatment Type (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'flow_path',
            'keyType': 'header',
            'label': 'Flow Path',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'fluid_type',
            'keyType': 'header',
            'label': 'Fluid Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'footage_in_landing_zone',
            'keyType': 'header',
            'label': 'Footage In Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'formation_thickness_mean',
            'keyType': 'header',
            'label': 'Formation Thickness Mean',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'gas_gatherer',
            'keyType': 'header',
            'label': 'Gas Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'gas_specific_gravity',
            'keyType': 'header',
            'label': 'Gas Specific Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'generic',
            'keyType': 'header',
            'label': 'Created Well',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ground_elevation',
            'keyType': 'header',
            'label': 'Ground Elevation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'has_daily',
            'keyType': 'header',
            'label': 'Has Daily Data',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'has_monthly',
            'keyType': 'header',
            'label': 'Has Monthly Data',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hole_direction',
            'keyType': 'header',
            'label': 'Hole Direction',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hz_well_spacing_any_zone',
            'keyType': 'header',
            'label': 'Hz Well Spacing Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hz_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Hz Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'initial_respress',
            'keyType': 'header',
            'label': 'Initial Respress',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'initial_restemp',
            'keyType': 'header',
            'label': 'Initial Restemp',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone',
            'keyType': 'header',
            'label': 'Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone_base',
            'keyType': 'header',
            'label': 'Landing Zone Base',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone_top',
            'keyType': 'header',
            'label': 'Landing Zone Top',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lateral_length',
            'keyType': 'header',
            'label': 'Lateral Length',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lease_name',
            'keyType': 'header',
            'label': 'Lease Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lease_number',
            'keyType': 'header',
            'label': 'Lease Number',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lower_perforation',
            'keyType': 'header',
            'label': 'Lower Perforation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'matrix_permeability',
            'keyType': 'header',
            'label': 'Matrix Permeability',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'measured_depth',
            'keyType': 'header',
            'label': 'Measured Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'num_treatment_records',
            'keyType': 'header',
            'label': 'Num Treatment Records',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_api_gravity',
            'keyType': 'header',
            'label': 'Oil API Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_gatherer',
            'keyType': 'header',
            'label': 'Oil Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_specific_gravity',
            'keyType': 'header',
            'label': 'Oil Specific Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pad_name',
            'keyType': 'header',
            'label': 'Pad Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'parent_child_any_zone',
            'keyType': 'header',
            'label': 'Parent Child Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'parent_child_same_zone',
            'keyType': 'header',
            'label': 'Parent Child Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'percent_in_zone',
            'keyType': 'header',
            'label': 'Percent In Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'perf_lateral_length',
            'keyType': 'header',
            'label': 'Perf Lateral Length',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'permit_date',
            'keyType': 'header',
            'label': 'Permit Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'phdwin_id',
            'keyType': 'header',
            'label': 'PhdWin ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'play',
            'keyType': 'header',
            'label': 'Play',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'porosity',
            'keyType': 'header',
            'label': 'Porosity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator',
            'keyType': 'header',
            'label': 'Previous Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_alias',
            'keyType': 'header',
            'label': 'Previous Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_code',
            'keyType': 'header',
            'label': 'Previous Operator Code',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_ticker',
            'keyType': 'header',
            'label': 'Previous Operator Ticker',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'primary_product',
            'keyType': 'header',
            'label': 'Primary Product',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_method',
            'keyType': 'header',
            'label': 'Production Method',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'proppant_mesh_size',
            'keyType': 'header',
            'label': 'Prop Mesh Size',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'proppant_type',
            'keyType': 'header',
            'label': 'Prop Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'range',
            'keyType': 'header',
            'label': 'Range',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'recovery_method',
            'keyType': 'header',
            'label': 'Recovery Method',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_cluster_count',
            'keyType': 'header',
            'label': 'Cluster Count (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_date',
            'keyType': 'header',
            'label': 'Refrac Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_frac_vendor',
            'keyType': 'header',
            'label': 'Frac Vendor (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_max_injection_pressure',
            'keyType': 'header',
            'label': 'Max Injection Pressure (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_max_injection_rate',
            'keyType': 'header',
            'label': 'Max Injection Rate (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_stage_count',
            'keyType': 'header',
            'label': 'Stage Count (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_treatment_type',
            'keyType': 'header',
            'label': 'Treatment Type (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'rig',
            'keyType': 'header',
            'label': 'Rig Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'section',
            'keyType': 'header',
            'label': 'Section',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'sg',
            'keyType': 'header',
            'label': 'Sg',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'so',
            'keyType': 'header',
            'label': 'So',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'spud_date',
            'keyType': 'header',
            'label': 'Spud Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stage_spacing',
            'keyType': 'header',
            'label': 'Stage Spacing',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'status',
            'keyType': 'header',
            'label': 'Status',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'subplay',
            'keyType': 'header',
            'label': 'Subplay',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLatitude',
            'keyType': 'header',
            'label': 'Surface Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLongitude',
            'keyType': 'header',
            'label': 'Surface Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'survey',
            'keyType': 'header',
            'label': 'Survey',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'sw',
            'keyType': 'header',
            'label': 'Sw',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'target_formation',
            'keyType': 'header',
            'label': 'Target Formation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'thickness',
            'keyType': 'header',
            'label': 'Thickness',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'til',
            'keyType': 'header',
            'label': 'TIL',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLatitude',
            'keyType': 'header',
            'label': 'Toe Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLongitude',
            'keyType': 'header',
            'label': 'Toe Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toe_in_landing_zone',
            'keyType': 'header',
            'label': 'Toe In Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toe_up',
            'keyType': 'header',
            'label': 'Toe Up',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_cluster_count',
            'keyType': 'header',
            'label': 'Total Cluster (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_stage_count',
            'keyType': 'header',
            'label': 'Total Stages (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'township',
            'keyType': 'header',
            'label': 'Township',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'true_vertical_depth',
            'keyType': 'header',
            'label': 'True Vertical Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'tubing_depth',
            'keyType': 'header',
            'label': 'Tubing Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'tubing_id',
            'keyType': 'header',
            'label': 'Tubing ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'upper_perforation',
            'keyType': 'header',
            'label': 'Upper Perforation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'vt_well_spacing_any_zone',
            'keyType': 'header',
            'label': 'Vt Well Spacing Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'vt_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Vt Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_type',
            'keyType': 'header',
            'label': 'Well Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'mostRecentImportDesc',
            'keyType': 'header',
            'label': 'Import Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'econ_group',
            'keyType': 'column',
            'label': 'Econ Group',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'custom_header_1',
            'keyType': 'header',
            'label': 'Custom Header 1',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'custom_header_2',
            'keyType': 'header',
            'label': 'Custom Header 2',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_one_liner_all_columns_no_custom():
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]
    report_type = 'oneLiner'
    template = 'All Headers'

    response = csv_export.append_columns_to_headers(columns, [], report_type, template)
    expected_response = [
        {
            'key': 'well_index',
            'keyType': 'column',
            'label': 'Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api14',
            'keyType': 'header',
            'label': 'API 14',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'inptID',
            'keyType': 'header',
            'label': 'INPT ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenID',
            'keyType': 'header',
            'label': 'Chosen ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'incremental_index',
            'keyType': 'column',
            'label': 'Incremental Index',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 3
            }
        },
        {
            'key': 'well_number',
            'keyType': 'header',
            'label': 'Well Number',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'econ_prms_resources_class',
            'keyType': 'column',
            'label': 'Econ PRMS Resources Class',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_sub_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Sub Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'state',
            'keyType': 'header',
            'label': 'State',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'county',
            'keyType': 'header',
            'label': 'County/Parish',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator',
            'keyType': 'header',
            'label': 'Current Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_alias',
            'keyType': 'header',
            'label': 'Current Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'type_curve_area',
            'keyType': 'header',
            'label': 'Type Curve Area',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'abstract',
            'keyType': 'header',
            'label': 'Abstract',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'acre_spacing',
            'keyType': 'header',
            'label': 'Acre Same Zone Spacing',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'allocation_type',
            'keyType': 'header',
            'label': 'Allocation Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api10',
            'keyType': 'header',
            'label': 'API 10',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api12',
            'keyType': 'header',
            'label': 'API 12',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'aries_id',
            'keyType': 'header',
            'label': 'Aries ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'azimuth',
            'keyType': 'header',
            'label': 'Azimuth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'basin',
            'keyType': 'header',
            'label': 'Basin',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'block',
            'keyType': 'header',
            'label': 'Block',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'casing_id',
            'keyType': 'header',
            'label': 'Casing ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'choke_size',
            'keyType': 'header',
            'label': 'Choke Size',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenKeyID',
            'keyType': 'header',
            'label': 'Chosen ID Key',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_design',
            'keyType': 'header',
            'label': 'Completion Design',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_end_date',
            'keyType': 'header',
            'label': 'Completion End Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'completion_start_date',
            'keyType': 'header',
            'label': 'Completion Start Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'copied',
            'keyType': 'header',
            'label': 'Copied Well',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'country',
            'keyType': 'header',
            'label': 'Country',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_code',
            'keyType': 'header',
            'label': 'Current Operator Code',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_ticker',
            'keyType': 'header',
            'label': 'Current Operator Ticker',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dataSource',
            'keyType': 'header',
            'label': 'Data Source',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dataPool',
            'keyType': 'header',
            'label': 'Data Pool',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'date_rig_release',
            'keyType': 'header',
            'label': 'Date Rig Release',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'distance_from_base_of_zone',
            'keyType': 'header',
            'label': 'Distance From Base Of Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'distance_from_top_of_zone',
            'keyType': 'header',
            'label': 'Distance From Top Of Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'district',
            'keyType': 'header',
            'label': 'District',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'drill_end_date',
            'keyType': 'header',
            'label': 'Drill End Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'drill_start_date',
            'keyType': 'header',
            'label': 'Drill Start Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'elevation',
            'keyType': 'header',
            'label': 'Elevation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'elevation_type',
            'keyType': 'header',
            'label': 'Elevation Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'field',
            'keyType': 'header',
            'label': 'Field',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_cluster_count',
            'keyType': 'header',
            'label': 'Cluster Count  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_frac_vendor',
            'keyType': 'header',
            'label': 'Frac Vendor (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_max_injection_pressure',
            'keyType': 'header',
            'label': 'Max Injection Pressure  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_max_injection_rate',
            'keyType': 'header',
            'label': 'Max Injection Rate  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date',
            'keyType': 'header',
            'label': 'First Prod Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date_daily_calc',
            'keyType': 'header',
            'label': 'First Daily Prod Date Calc',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date_monthly_calc',
            'keyType': 'header',
            'label': 'First Monthly Prod Date Calc',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_stage_count',
            'keyType': 'header',
            'label': 'Stage Count  (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_flow_tbg_press',
            'keyType': 'header',
            'label': 'First Test Flow TBG Press',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_gas_vol',
            'keyType': 'header',
            'label': 'First Test Gas Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_gor',
            'keyType': 'header',
            'label': 'First Test Gor',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_oil_vol',
            'keyType': 'header',
            'label': 'First Test Oil Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_test_water_vol',
            'keyType': 'header',
            'label': 'First Test Water Vol',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_treatment_type',
            'keyType': 'header',
            'label': 'Treatment Type (1st Job)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'flow_path',
            'keyType': 'header',
            'label': 'Flow Path',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'fluid_type',
            'keyType': 'header',
            'label': 'Fluid Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'footage_in_landing_zone',
            'keyType': 'header',
            'label': 'Footage In Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'formation_thickness_mean',
            'keyType': 'header',
            'label': 'Formation Thickness Mean',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'gas_gatherer',
            'keyType': 'header',
            'label': 'Gas Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'gas_specific_gravity',
            'keyType': 'header',
            'label': 'Gas Specific Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'generic',
            'keyType': 'header',
            'label': 'Created Well',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ground_elevation',
            'keyType': 'header',
            'label': 'Ground Elevation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'has_daily',
            'keyType': 'header',
            'label': 'Has Daily Data',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'has_monthly',
            'keyType': 'header',
            'label': 'Has Monthly Data',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hole_direction',
            'keyType': 'header',
            'label': 'Hole Direction',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hz_well_spacing_any_zone',
            'keyType': 'header',
            'label': 'Hz Well Spacing Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hz_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Hz Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'initial_respress',
            'keyType': 'header',
            'label': 'Initial Respress',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'initial_restemp',
            'keyType': 'header',
            'label': 'Initial Restemp',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone',
            'keyType': 'header',
            'label': 'Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone_base',
            'keyType': 'header',
            'label': 'Landing Zone Base',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone_top',
            'keyType': 'header',
            'label': 'Landing Zone Top',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lateral_length',
            'keyType': 'header',
            'label': 'Lateral Length',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lease_name',
            'keyType': 'header',
            'label': 'Lease Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lease_number',
            'keyType': 'header',
            'label': 'Lease Number',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'lower_perforation',
            'keyType': 'header',
            'label': 'Lower Perforation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'matrix_permeability',
            'keyType': 'header',
            'label': 'Matrix Permeability',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'measured_depth',
            'keyType': 'header',
            'label': 'Measured Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'num_treatment_records',
            'keyType': 'header',
            'label': 'Num Treatment Records',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_api_gravity',
            'keyType': 'header',
            'label': 'Oil API Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_gatherer',
            'keyType': 'header',
            'label': 'Oil Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_specific_gravity',
            'keyType': 'header',
            'label': 'Oil Specific Gravity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pad_name',
            'keyType': 'header',
            'label': 'Pad Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'parent_child_any_zone',
            'keyType': 'header',
            'label': 'Parent Child Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'parent_child_same_zone',
            'keyType': 'header',
            'label': 'Parent Child Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'percent_in_zone',
            'keyType': 'header',
            'label': 'Percent In Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'perf_lateral_length',
            'keyType': 'header',
            'label': 'Perf Lateral Length',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'permit_date',
            'keyType': 'header',
            'label': 'Permit Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'phdwin_id',
            'keyType': 'header',
            'label': 'PhdWin ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'play',
            'keyType': 'header',
            'label': 'Play',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'porosity',
            'keyType': 'header',
            'label': 'Porosity',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator',
            'keyType': 'header',
            'label': 'Previous Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_alias',
            'keyType': 'header',
            'label': 'Previous Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_code',
            'keyType': 'header',
            'label': 'Previous Operator Code',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'previous_operator_ticker',
            'keyType': 'header',
            'label': 'Previous Operator Ticker',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'primary_product',
            'keyType': 'header',
            'label': 'Primary Product',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_method',
            'keyType': 'header',
            'label': 'Production Method',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'proppant_mesh_size',
            'keyType': 'header',
            'label': 'Prop Mesh Size',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'proppant_type',
            'keyType': 'header',
            'label': 'Prop Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'range',
            'keyType': 'header',
            'label': 'Range',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'recovery_method',
            'keyType': 'header',
            'label': 'Recovery Method',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_cluster_count',
            'keyType': 'header',
            'label': 'Cluster Count (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_date',
            'keyType': 'header',
            'label': 'Refrac Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_frac_vendor',
            'keyType': 'header',
            'label': 'Frac Vendor (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_max_injection_pressure',
            'keyType': 'header',
            'label': 'Max Injection Pressure (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_max_injection_rate',
            'keyType': 'header',
            'label': 'Max Injection Rate (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_stage_count',
            'keyType': 'header',
            'label': 'Stage Count (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'refrac_treatment_type',
            'keyType': 'header',
            'label': 'Treatment Type (Refrac)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'rig',
            'keyType': 'header',
            'label': 'Rig Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'section',
            'keyType': 'header',
            'label': 'Section',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'sg',
            'keyType': 'header',
            'label': 'Sg',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'so',
            'keyType': 'header',
            'label': 'So',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'spud_date',
            'keyType': 'header',
            'label': 'Spud Date',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stage_spacing',
            'keyType': 'header',
            'label': 'Stage Spacing',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'status',
            'keyType': 'header',
            'label': 'Status',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'subplay',
            'keyType': 'header',
            'label': 'Subplay',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLatitude',
            'keyType': 'header',
            'label': 'Surface Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLongitude',
            'keyType': 'header',
            'label': 'Surface Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'survey',
            'keyType': 'header',
            'label': 'Survey',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'sw',
            'keyType': 'header',
            'label': 'Sw',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'target_formation',
            'keyType': 'header',
            'label': 'Target Formation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'thickness',
            'keyType': 'header',
            'label': 'Thickness',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'til',
            'keyType': 'header',
            'label': 'TIL',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLatitude',
            'keyType': 'header',
            'label': 'Toe Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLongitude',
            'keyType': 'header',
            'label': 'Toe Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toe_in_landing_zone',
            'keyType': 'header',
            'label': 'Toe In Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toe_up',
            'keyType': 'header',
            'label': 'Toe Up',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_additive_volume',
            'keyType': 'header',
            'label': 'Additive Vol (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_cluster_count',
            'keyType': 'header',
            'label': 'Total Cluster (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_fluid_volume',
            'keyType': 'header',
            'label': 'Total Fluid (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_prop_weight',
            'keyType': 'header',
            'label': 'Total Prop (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_proppant_per_fluid',
            'keyType': 'header',
            'label': 'Total Prop/Fluid (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_stage_count',
            'keyType': 'header',
            'label': 'Total Stages (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'township',
            'keyType': 'header',
            'label': 'Township',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'true_vertical_depth',
            'keyType': 'header',
            'label': 'True Vertical Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'tubing_depth',
            'keyType': 'header',
            'label': 'Tubing Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'tubing_id',
            'keyType': 'header',
            'label': 'Tubing ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'upper_perforation',
            'keyType': 'header',
            'label': 'Upper Perforation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'vt_well_spacing_any_zone',
            'keyType': 'header',
            'label': 'Vt Well Spacing Any Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'vt_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Vt Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_type',
            'keyType': 'header',
            'label': 'Well Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'mostRecentImportDesc',
            'keyType': 'header',
            'label': 'Import Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'econ_group',
            'keyType': 'column',
            'label': 'Econ Group',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_monthly():
    report_type = 'cashflow-csv'
    template = 'By Well'
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]

    response = csv_export.append_columns_to_headers(columns, [], report_type, template)
    expected_response = [
        {
            'key': 'well_index',
            'keyType': 'column',
            'label': 'Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api14',
            'keyType': 'header',
            'label': 'API 14',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'inptID',
            'keyType': 'header',
            'label': 'INPT ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenID',
            'keyType': 'header',
            'label': 'Chosen ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'incremental_index',
            'keyType': 'column',
            'label': 'Incremental Index',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 4
            }
        },
        {
            'key': 'well_number',
            'keyType': 'header',
            'label': 'Well Number',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 3
            }
        },
        {
            'key': 'econ_prms_resources_class',
            'keyType': 'column',
            'label': 'Econ PRMS Resources Class',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_sub_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Sub Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'state',
            'keyType': 'header',
            'label': 'State',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'county',
            'keyType': 'header',
            'label': 'County/Parish',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator',
            'keyType': 'header',
            'label': 'Current Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_alias',
            'keyType': 'header',
            'label': 'Current Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'type_curve_area',
            'keyType': 'header',
            'label': 'Type Curve Area',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'econ_group',
            'keyType': 'column',
            'label': 'Econ Group',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'warning',
            'keyType': 'column',
            'label': 'Warning',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'date',
            'keyType': 'column',
            'label': 'Date',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 5
            }
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'api',
            'keyType': 'header',
            'label': 'API',
            'selected': True,
            'sortingOptions': None
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_aggregate_monthly():
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
    ]
    report_type = 'cashflow-agg-csv'
    template = 'Aggregate Monthly'

    response = csv_export.append_columns_to_headers(columns, [], report_type, template)
    expected_response = [
        {
            'key': 'well_index',
            'keyType': 'column',
            'label': 'Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'api14',
            'keyType': 'header',
            'label': 'API 14',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'inptID',
            'keyType': 'header',
            'label': 'INPT ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'chosenID',
            'keyType': 'header',
            'label': 'Chosen ID',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'incremental_index',
            'keyType': 'column',
            'label': 'Incremental Index',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_number',
            'keyType': 'header',
            'label': 'Well Number',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_resources_class',
            'keyType': 'column',
            'label': 'Econ PRMS Resources Class',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'econ_prms_reserves_sub_category',
            'keyType': 'column',
            'label': 'Econ PRMS Reserves Sub Category',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'state',
            'keyType': 'header',
            'label': 'State',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'county',
            'keyType': 'header',
            'label': 'County/Parish',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator',
            'keyType': 'header',
            'label': 'Current Operator',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'current_operator_alias',
            'keyType': 'header',
            'label': 'Current Operator Alias',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'type_curve_area',
            'keyType': 'header',
            'label': 'Type Curve Area',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'basin',
            'keyType': 'header',
            'label': 'Basin',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pad_name',
            'keyType': 'header',
            'label': 'Pad Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hole_direction',
            'keyType': 'header',
            'label': 'Hole Direction',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'landing_zone',
            'keyType': 'header',
            'label': 'Landing Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'target_formation',
            'keyType': 'header',
            'label': 'Target Formation',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLatitude',
            'keyType': 'header',
            'label': 'Surface Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'surfaceLongitude',
            'keyType': 'header',
            'label': 'Surface Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLatitude',
            'keyType': 'header',
            'label': 'Toe Latitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'toeLongitude',
            'keyType': 'header',
            'label': 'Toe Longitude',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_prod_date_monthly_calc',
            'keyType': 'header',
            'label': 'First Monthly Prod Date Calc',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'perf_lateral_length',
            'keyType': 'header',
            'label': 'Perf Lateral Length',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_proppant_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Prop/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_fluid_per_perforated_interval',
            'keyType': 'header',
            'label': 'Total Fluid/Perf LL (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'true_vertical_depth',
            'keyType': 'header',
            'label': 'True Vertical Depth',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'hz_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Hz Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'vt_well_spacing_same_zone',
            'keyType': 'header',
            'label': 'Vt Well Spacing Same Zone',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stage_spacing',
            'keyType': 'header',
            'label': 'Stage Spacing',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'total_stage_count',
            'keyType': 'header',
            'label': 'Total Stages (All Jobs)',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_type',
            'keyType': 'header',
            'label': 'Well Type',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'status',
            'keyType': 'header',
            'label': 'Status',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'oil_gatherer',
            'keyType': 'header',
            'label': 'Oil Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'gas_gatherer',
            'keyType': 'header',
            'label': 'Gas Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ngl_gatherer',
            'keyType': 'header',
            'label': 'NGL Gatherer',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'warning',
            'keyType': 'column',
            'label': 'Warning',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_aggregation_header',
            'keyType': 'header',
            'label': 'First Aggregation Header',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'second_aggregation_header',
            'keyType': 'header',
            'label': 'Second Aggregation Header',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'aggregation_group',
            'keyType': 'header',
            'label': 'Group',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'date',
            'keyType': 'column',
            'label': 'Date',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'gross_well_count',
            'keyType': 'column',
            'label': 'Gross Well Count',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'wi_well_count',
            'keyType': 'column',
            'label': 'WI Well Count',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'nri_well_count',
            'keyType': 'column',
            'label': 'NRI Well Count',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_append_columns_to_headers_aggregate_yearly():
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
    ]
    report_type = 'cashflow-agg-csv'
    template = 'Aggregate Yearly'

    response = csv_export.append_columns_to_headers(columns, [], report_type, template)
    expected_response = [
        {
            'key': 'project_name',
            'keyType': 'column',
            'label': 'Project Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'scenario_name',
            'keyType': 'column',
            'label': 'Scenario Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'user_name',
            'keyType': 'column',
            'label': 'User Name',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'combo_name',
            'keyType': 'column',
            'label': 'Combo Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
        {
            'key': 'reserves_category_qualifier',
            'keyType': 'column',
            'label': 'Reserves Category Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'ownership_reversion_qualifier',
            'keyType': 'column',
            'label': 'Ownership and Reversion Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'dates_qualifier',
            'keyType': 'column',
            'label': 'Dates Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_qualifier',
            'keyType': 'column',
            'label': 'Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'forecast_p_series_qualifier',
            'keyType': 'column',
            'label': 'Forecast P Series Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'schedule_qualifier',
            'keyType': 'column',
            'label': 'Schedule Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'capex_qualifier',
            'keyType': 'column',
            'label': 'CAPEX Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'pricing_qualifier',
            'keyType': 'column',
            'label': 'Pricing Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'differentials_qualifier',
            'keyType': 'column',
            'label': 'Differentials Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'stream_properties_qualifier',
            'keyType': 'column',
            'label': 'Stream Properties Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'expenses_qualifier',
            'keyType': 'column',
            'label': 'Expenses Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_taxes_qualifier',
            'keyType': 'column',
            'label': 'Production Taxes Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'production_vs_fit_qualifier',
            'keyType': 'column',
            'label': 'Actual or Forecast Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'risking_qualifier',
            'keyType': 'column',
            'label': 'Risking Qualifier',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'created_at',
            'keyType': 'column',
            'label': 'Created At',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'error',
            'keyType': 'column',
            'label': 'Error',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'warning',
            'keyType': 'column',
            'label': 'Warning',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'first_aggregation_header',
            'keyType': 'header',
            'label': 'First Aggregation Header',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'second_aggregation_header',
            'keyType': 'header',
            'label': 'Second Aggregation Header',
            'selected': True,
            'sortingOptions': None
        },
        {
            'key': 'aggregation_group',
            'keyType': 'header',
            'label': 'Group',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 1
            }
        },
        {
            'key': 'date',
            'keyType': 'column',
            'label': 'Date',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 2
            }
        },
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
    ]

    assert response == expected_response


@pytest.mark.unittest
def test_create_setting_template(mocker):
    spy_append_columns_to_headers = mocker.patch(PATH_TO_MODULE + 'append_columns_to_headers',
                                                 return_value='test_columns')
    spy_fill_in_setting_template = mocker.patch(PATH_TO_MODULE + 'fill_in_setting_template', return_value='test')

    template_name = 'Aggregate Yearly'
    columns = [
        {
            'key': 'well_name',
            'keyType': 'header',
            'label': 'Well Name',
            'selected': True,
            'sortingOptions': {
                'direction': 'ASC',
                'priority': 0
            }
        },
    ]
    custom_columns = []
    report_type = 'cashflow-agg-csv'
    cf_report_type = 'cashflow'
    cf_report_time_periods = 'yearly'
    cf_report_hybrid_year_type = 'calendar'
    cf_report_months = 'all'

    response = csv_export.create_setting_template(template_name, columns, report_type, custom_columns, cf_report_type,
                                                  cf_report_time_periods, cf_report_hybrid_year_type, cf_report_months)
    expected_response = 'test'

    assert response == expected_response
    spy_append_columns_to_headers.assert_called_once_with(columns, custom_columns, report_type, template_name)
    spy_fill_in_setting_template.assert_called_once_with(template_name, 'test_columns', report_type, cf_report_type,
                                                         cf_report_time_periods, cf_report_hybrid_year_type,
                                                         cf_report_months)


@pytest.mark.unittest
def test_create_scenario_table_header_template_cashflow_no_sorting():
    well_headers = [
        {
            'key': 'well_name',
            'label': 'Well Name'
        },
        {
            'key': 'well_type',
            'label': 'Well Type'
        },
    ]

    econ_cols = [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }]

    report_type = 'cashflow-csv'

    response = csv_export.create_scenario_table_header_template(well_headers, report_type, econ_cols, [])
    expected_response = {
        'name':
        'Scenario Table Headers',
        'columns': [
            {
                'key': 'combo_name',
                'keyType': 'column',
                'label': 'Combo Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 0
                }
            },
            {
                'key': 'well_name',
                'keyType': 'header',
                'label': 'Well Name',
                'selected': True,
                'sortingOptions': None
            },
            {
                'key': 'well_type',
                'keyType': 'header',
                'label': 'Well Type',
                'selected': True,
                'sortingOptions': None
            },
            {
                'key': 'date',
                'keyType': 'column',
                'label': 'Date',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 1
                }
            },
            {
                'key': 'key1',
                'label': 'label1',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
            {
                'key': 'key2',
                'label': 'label2',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
        ],
        REPORT_TYPE:
        report_type,
        CF_OPTIONS: {
            'type': 'monthly',
            'timePeriods': None,
            'hybridOptions': {
                'yearType': None,
                'months': None,
            }
        },
    }

    assert response == expected_response


@pytest.mark.unittest
def test_create_scenario_table_header_template_cashflow_with_sorting():
    well_headers = [
        {
            'key': 'well_name',
            'label': 'Well Name',
            'direction': 'ASC',
            'priority': 1
        },
        {
            'key': 'well_type',
            'label': 'Well Type',
            'direction': 'ASC',
            'priority': 2
        },
    ]

    econ_cols = [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }]

    report_type = 'cashflow-csv'

    response = csv_export.create_scenario_table_header_template(well_headers, report_type, econ_cols, [])
    expected_response = {
        'name':
        'Scenario Table Headers',
        'columns': [
            {
                'key': 'combo_name',
                'keyType': 'column',
                'label': 'Combo Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 0
                }
            },
            {
                'key': 'well_name',
                'keyType': 'header',
                'label': 'Well Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 1
                }
            },
            {
                'key': 'well_type',
                'keyType': 'header',
                'label': 'Well Type',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 2
                }
            },
            {
                'key': 'date',
                'keyType': 'column',
                'label': 'Date',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 3
                }
            },
            {
                'key': 'key1',
                'label': 'label1',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
            {
                'key': 'key2',
                'label': 'label2',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
        ],
        REPORT_TYPE:
        report_type,
        CF_OPTIONS: {
            'type': 'monthly',
            'timePeriods': None,
            'hybridOptions': {
                'yearType': None,
                'months': None,
            }
        },
    }

    assert response == expected_response


@pytest.mark.unittest
def test_create_scenario_table_header_template_one_liner():
    well_headers = [
        {
            'key': 'well_name',
            'label': 'Well Name',
            'direction': 'ASC',
            'priority': 1
        },
        {
            'key': 'well_type',
            'label': 'Well Type',
            'direction': 'ASC',
            'priority': 2
        },
    ]

    econ_cols = [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }]

    report_type = 'oneLiner'

    response = csv_export.create_scenario_table_header_template(well_headers, report_type, econ_cols, [])
    expected_response = {
        'name':
        'Scenario Table Headers',
        'columns': [
            {
                'key': 'combo_name',
                'keyType': 'column',
                'label': 'Combo Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 0
                }
            },
            {
                'key': 'well_name',
                'keyType': 'header',
                'label': 'Well Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 1
                }
            },
            {
                'key': 'well_type',
                'keyType': 'header',
                'label': 'Well Type',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 2
                }
            },
            {
                'key': 'key1',
                'label': 'label1',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
            {
                'key': 'key2',
                'label': 'label2',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
        ],
        REPORT_TYPE:
        report_type,
        CF_OPTIONS:
        None,
    }

    assert response == expected_response


@pytest.mark.unittest
def test_create_scenario_table_header_template_one_liner_custom_headers():
    well_headers = [
        {
            'key': 'well_name',
            'label': 'Well Name',
            'direction': 'ASC',
            'priority': 1
        },
        {
            'key': 'well_type',
            'label': 'Well Type',
            'direction': 'ASC',
            'priority': 2
        },
        {
            'key': 'custom_string_1',
            'label': 'CUSTOM STRING',
        },
        {
            'key': 'custom_number_10',
            'label': 'CUSTOM NUMBER',
        },
    ]

    econ_cols = [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }]

    custom_headers = [{
        'key': 'custom_string_1',
        'label': 'CUSTOM STRING',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None
    }, {
        'key': 'custom_number_10',
        'label': 'CUSTOM NUMBER',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None
    }]

    report_type = 'oneLiner'

    response = csv_export.create_scenario_table_header_template(well_headers, report_type, econ_cols, custom_headers)
    expected_response = {
        'name':
        'Scenario Table Headers',
        'columns': [
            {
                'key': 'combo_name',
                'keyType': 'column',
                'label': 'Combo Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 0
                }
            },
            {
                'key': 'well_name',
                'keyType': 'header',
                'label': 'Well Name',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 1
                }
            },
            {
                'key': 'well_type',
                'keyType': 'header',
                'label': 'Well Type',
                'selected': True,
                'sortingOptions': {
                    'direction': 'ASC',
                    'priority': 2
                }
            },
            {
                'key': 'custom_string_1',
                'label': 'CUSTOM STRING',
                'selected': True,
                'keyType': 'header',
                'sortingOptions': None
            },
            {
                'key': 'custom_number_10',
                'label': 'CUSTOM NUMBER',
                'selected': True,
                'keyType': 'header',
                'sortingOptions': None
            },
            {
                'key': 'key1',
                'label': 'label1',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
            {
                'key': 'key2',
                'label': 'label2',
                'selected': True,
                'keyType': 'column',
                'sortingOptions': None
            },
        ],
        REPORT_TYPE:
        report_type,
        CF_OPTIONS:
        None,
    }

    assert response == expected_response


@pytest.mark.unittest
def test_generate_default_csv_export_settings(mocker):
    econ_cols = ([{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key2',
        'label': 'label2',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }], [{
        'key': 'key1',
        'label': 'label1',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }, {
        'key': 'key3',
        'label': 'label3',
        'selected': True,
        'keyType': 'column',
        'sortingOptions': None
    }])
    mocker.patch(PATH_TO_MODULE + 'generate_econ_columns', return_value=econ_cols)
    spy_create_setting_template = mocker.patch(PATH_TO_MODULE + 'create_setting_template',
                                               return_value='setting_template')
    spy_create_scenario_table_header_template = mocker.patch(PATH_TO_MODULE + 'create_scenario_table_header_template',
                                                             return_value='scenario_template')

    run = {}
    scenario_table_headers = [
        {
            'key': 'county',
            'label': 'County/Parish',
            'direction': 'ASC',
            'priority': 0
        },
    ]
    context = MockContext(MockCustomHeaderCollection({'test_data_1': 'Test Data'}))

    response = csv_export.generate_default_csv_export_settings(context, run, scenario_table_headers)
    expected_response = {
        'cashflow-agg-csv': ['setting_template', 'setting_template'],
        'cashflow-csv': ['setting_template', 'scenario_template'],
        'oneLiner': ['setting_template', 'setting_template', 'scenario_template']
    }

    assert response == expected_response

    custom_header_response = [{
        'key': 'test_data_1',
        'label': 'Test Data',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None
    }]

    spy_create_setting_template.assert_any_call(ONE_LINER_BASIC_HEADERS, econ_cols[1], 'oneLiner', [], None)
    spy_create_setting_template.assert_any_call('All Headers', econ_cols[1], 'oneLiner', custom_header_response, None)
    spy_create_setting_template.assert_any_call('By Well', econ_cols[0], 'cashflow-csv', [], 'monthly')
    spy_create_setting_template.assert_any_call('Aggregate Monthly', econ_cols[0], 'cashflow-agg-csv', [], 'monthly')
    spy_create_setting_template.assert_any_call('Aggregate Yearly', econ_cols[0], 'cashflow-agg-csv', [], 'yearly')
    assert spy_create_setting_template.call_count == 5

    spy_create_scenario_table_header_template.assert_any_call(scenario_table_headers, 'oneLiner', econ_cols[1],
                                                              custom_header_response)
    spy_create_scenario_table_header_template.assert_any_call(scenario_table_headers, 'cashflow-csv', econ_cols[0],
                                                              custom_header_response)
    assert spy_create_scenario_table_header_template.call_count == 2


@pytest.mark.unittest
def test_get_custom_headers():
    context = MockContext(MockCustomHeaderCollection({'test_data_1': 'Test Data'}))
    response = csv_export.get_custom_headers(context)

    expected_response = [{
        'key': 'test_data_1',
        'label': 'Test Data',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None
    }]

    assert response == expected_response


@pytest.mark.unittest
def test_get_custom_headers_with_sorting():
    context = MockContext(MockCustomHeaderCollection({'test_data_1': 'Test Data'}))
    response = csv_export.get_custom_headers(context)
    expected_response = [{
        'key': 'test_data_1',
        'label': 'Test Data',
        'selected': True,
        'keyType': 'header',
        'sortingOptions': None
    }]

    assert response == expected_response
