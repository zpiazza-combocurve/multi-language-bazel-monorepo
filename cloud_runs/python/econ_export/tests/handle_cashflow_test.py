from cloud_runs.econ_export.tests.mock_context import MockContext
from cloud_runs.econ_export.api.csv_export.handle_cashflow import handle_cashflow
import pytest
from bson import ObjectId
from datetime import datetime


def mock_notify_progress(progress):
    return progress


class CashFlowReportOptions():
    # create cashflow object
    def __init__(self, cashflow_report_type, time_periods, hybrid_options, use_time_periods):
        self.type = cashflow_report_type
        self.timePeriods = time_periods
        self.hybridOptions = hybrid_options
        self.useTimePeriods = use_time_periods

    def dict(self):
        return {
            'type': self.type,
            'timePeriods': self.timePeriods,
            'hybridOptions': self.hybridOptions,
            'useTimePeriods': self.useTimePeriods,
        }


def get_export_params(report_type, cashflow_report_type, time_periods, hybrid_options, use_time_periods):
    return {
        'run_specs': {
            '_id': ObjectId('646e1e2a4986061eaa8d33e1'),
            'project': ObjectId('62e94b4d39c6ab0012778a8c'),
            'runDate': datetime(2023, 5, 24, 14, 24, 42, 27000),
            'scenarioWellAssignments': ['a', 'b', 'c'],
            'outputParams': {
                'timeZone': 'America/Toronto',
                'generalOptions': {
                    'main_options': {
                        'reporting_period': 'fiscal',
                        'fiscal': '5-4'
                    },
                    'discount_table': {
                        'first_discount': 11,
                        'second_discount': 15
                    },
                    'reporting_units': {
                        'oil': 'MBBL',
                        'gas': 'MMCF'
                    },
                },
                'columnFields': {
                    'pre_risk_gas_volume': {
                        'type': 'number',
                        'label': 'Pre Risk Gas Volume',
                        'category': '',
                        'hide': True,
                        'options': {
                            'monthly': True,
                            'aggregate': True,
                            'one_liner': True
                        },
                        'default_options': {
                            'monthly': False,
                            'aggregate': False,
                            'one_liner': False
                        },
                        'unit_key': 'gas'
                    },
                    'first_discount_cash_flow': {
                        'label': 'First Discount Cash Flow',
                    },
                    'second_discount_cash_flow': {
                        'label': 'Second Discount Cash Flow',
                    },
                    'afit_first_discount_cash_flow': {
                        'label': 'AFIT First Discount Cash Flow',
                    },
                    'afit_second_discount_cash_flow': {
                        'label': 'AFIT Second Discount Cash Flow',
                    },
                    'first_discounted_capex': {
                        'label': 'First Discounted Capex',
                    },
                    'second_discounted_capex': {
                        'label': 'Second Discounted Capex',
                    },
                    'first_discount_net_income': {
                        'label': 'First Discount Net Income',
                    },
                    'second_discount_net_income': {
                        'label': 'Second Discount Net Income',
                    },
                }
            }
        },
        'report_type':
        report_type,
        'cashflow_report':
        CashFlowReportOptions(cashflow_report_type, time_periods, hybrid_options, use_time_periods),
        'output_columns': [{
            'key': 'pre_risk_gas_volume',
            'label': 'Pre Risk Gas Volume',
            'selected': True,
            'keyType': 'header',
            'sortingOptions': None,
        }],
    }


@pytest.mark.unittest
@pytest.mark.parametrize('report_type, cashflow_report_type, time_periods, hybrid_options, use_time_periods', [
    ('cashflow-csv', 'monthly', None, None, None),
    ('cashflow-agg-csv', 'monthly', 0, None, None),
    ('cashflow-agg-csv', 'yearly', 100, None, False),
    ('cashflow-agg-csv', 'yearly', 100, None, True),
    ('cashflow-csv', 'hybrid', None, {
        'months': 1,
        'yearType': 'calendar'
    }, False),
    ('cashflow-agg-csv', 'hybrid', 10, {
        'months': 4,
        'yearType': 'fiscal'
    }, False),
])
def test_handle_cashflow(report_type, cashflow_report_type, time_periods, hybrid_options, use_time_periods):
    context = MockContext()
    export_params = get_export_params(report_type, cashflow_report_type, time_periods, hybrid_options, use_time_periods)
    response = handle_cashflow(context, export_params, mock_notify_progress)
    assert response == 'dummy_gcp_file_name'
