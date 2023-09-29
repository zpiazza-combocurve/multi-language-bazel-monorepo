import pandas as pd
import pytest
import uuid
from api.cc_to_cc.carbon.development_node import development_node_export, development_node_import
from combocurve.science.network_module.nodes.shared.utils import DRILLING_KEY, COMPLETION_KEY, FLOWBACK_KEY

node_keys = [COMPLETION_KEY, DRILLING_KEY, FLOWBACK_KEY]

models = [
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '9defc068-998e-4c6f-9c84-e6c10d9e00e6',
        'type': 'completion',
        'name': 'Completion',
        'params': {
            'time_series': {
                'fuel_type':
                'natural_gas',
                'rows': [{
                    'start_date_window': 'Start',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -30,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 15
                }, {
                    'start_date_window': '05/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -30,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 15
                }, {
                    'start_date_window': '06/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -20,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_completion_end',
                    'end_value': None
                }, {
                    'start_date_window': '07/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -20,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_completion_end_date',
                    'end_value': None
                }, {
                    'start_date_window': '08/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_completion_mob_start',
                    'start_value': None,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 7
                }, {
                    'start_date_window': '09/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_spud_mob_start',
                    'start_value': None,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 3
                }, {
                    'start_date_window': '10/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_pad_preparation_start',
                    'start_value': None,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_pad_preparation_end',
                    'end_value': None
                }, {
                    'start_date_window': '11/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_pad_preparation_mob_start',
                    'start_value': None,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_permit_date',
                    'end_value': None
                }, {
                    'start_date_window': '12/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_completion_start_date',
                    'start_value': None,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 1
                }, {
                    'start_date_window': '01/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_spud_date',
                    'start_value': None,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 0
                }, {
                    'start_date_window': '02/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_refrac_date',
                    'start_value': None,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_spud_end',
                    'end_value': None
                }, {
                    'start_date_window': '03/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_refrac_date',
                    'start_value': None,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_til',
                    'end_value': None
                }]
            }
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '4cb0a6b3-052f-40fa-aba6-f26e03d4428a',
        'type': 'drilling',
        'name': 'Drilling',
        'params': {
            'time_series': {
                'fuel_type':
                'distillate_fuel_oil_number_2',
                'rows': [{
                    'start_date_window': 'Start',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -30,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 15
                }, {
                    'start_date_window': '05/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -30,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 15
                }, {
                    'start_date_window': '06/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -20,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_drill_end',
                    'end_value': None
                }, {
                    'start_date_window': '07/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': -20,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_drill_end_date',
                    'end_value': None
                }, {
                    'start_date_window': '08/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_drill_mob_start',
                    'start_value': None,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 7
                }, {
                    'start_date_window': '09/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_spud_mob_start',
                    'start_value': None,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 3
                }, {
                    'start_date_window': '10/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_pad_preparation_start',
                    'start_value': None,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_pad_preparation_end',
                    'end_value': None
                }, {
                    'start_date_window': '11/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'schedule',
                    'start_criteria_option': 'offset_to_pad_preparation_mob_start',
                    'start_value': None,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_permit_date',
                    'end_value': None
                }, {
                    'start_date_window': '12/01/2023',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_drill_start_date',
                    'start_value': None,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 1
                }, {
                    'start_date_window': '01/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_spud_date',
                    'start_value': None,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 0
                }, {
                    'start_date_window': '02/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_refrac_date',
                    'start_value': None,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_spud_end',
                    'end_value': None
                }, {
                    'start_date_window': '03/01/2024',
                    'consumption_rate': 0,
                    'start_criteria': 'headers',
                    'start_criteria_option': 'offset_to_refrac_date',
                    'start_value': None,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_til',
                    'end_value': None
                }]
            }
        },
        'description': ''
    },
    {
        'shape': {
            'position': {
                'x': 100,
                'y': 100
            }
        },
        'id': '5f0644a1-2c2b-423b-8d38-5dc0dead1165',
        'type': 'flowback',
        'name': 'Flowback',
        'params': {
            'time_series': {
                'rows': [{
                    'start_date_window': 'Start',
                    'flowback_rate': 20,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': 0,
                    'end_criteria': 'duration',
                    'end_criteria_option': None,
                    'end_value': 3
                }, {
                    'start_date_window': '05/01/2023',
                    'flowback_rate': 50,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': 0,
                    'end_criteria': 'schedule',
                    'end_criteria_option': 'offset_to_pad_preparation_mob_start',
                    'end_value': None
                }, {
                    'start_date_window': '06/01/2023',
                    'flowback_rate': 70,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': 0,
                    'end_criteria': 'headers',
                    'end_criteria_option': 'offset_to_refrac_date',
                    'end_value': None
                }, {
                    'start_date_window': '07/01/2023',
                    'flowback_rate': 90,
                    'start_criteria': 'FPD',
                    'start_criteria_option': None,
                    'start_value': 0,
                    'end_criteria': 'FPD',
                    'end_criteria_option': None,
                    'end_value': 5
                }]
            }
        },
        'description': ''
    },
]

expected_response_model_rows = [
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': 'Start',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -30,
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 15,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '05/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -30,
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 15,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '06/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -20,
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Completion End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '07/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -20,
        'End Criteria': 'From Headers',
        'End Criteria Option': 'Completion End Date',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '08/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Completion Mob Start',
        'Start Value': '',
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 7,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '09/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Spud Mob Start',
        'Start Value': '',
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 3,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '10/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Pad Preparation Start',
        'Start Value': '',
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Pad Preparation End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '11/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Pad Preparation Mob Start',
        'Start Value': '',
        'End Criteria': 'From Headers',
        'End Criteria Option': 'Permit Date',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '12/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Completion Start Date',
        'Start Value': '',
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 1,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '01/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Spud Date',
        'Start Value': '',
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 0,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '02/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Refrac Date',
        'Start Value': '',
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Spud End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'completion_1',
        'Model Type': 'unique',
        'Model Name': 'Completion',
        'Description': '',
        'Fuel Type': 'Natural gas (pipeline quality)',
        'Start Date Window': '03/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Refrac Date',
        'Start Value': '',
        'End Criteria': 'From Headers',
        'End Criteria Option': 'TIL',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': 'Start',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -30,
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 15,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '05/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -30,
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 15,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '06/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -20,
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Drill End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '07/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': -20,
        'End Criteria': 'From Headers',
        'End Criteria Option': 'Drill End Date',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '08/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Drill Mob Start',
        'Start Value': '',
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 7,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '09/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Spud Mob Start',
        'Start Value': '',
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 3,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '10/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Pad Preparation Start',
        'Start Value': '',
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Pad Preparation End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '11/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Schedule',
        'Start Criteria Option': 'Pad Preparation Mob Start',
        'Start Value': '',
        'End Criteria': 'From Headers',
        'End Criteria Option': 'Permit Date',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '12/01/2023',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Drill Start Date',
        'Start Value': '',
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 1,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '01/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Spud Date',
        'Start Value': '',
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 0,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '02/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Refrac Date',
        'Start Value': '',
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Spud End',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'drilling_1',
        'Model Type': 'unique',
        'Model Name': 'Drilling',
        'Description': '',
        'Fuel Type': 'Petroleum products: distillate fuel oil No. 2',
        'Start Date Window': '03/01/2024',
        'Consumption Rate': 0,
        'Start Criteria': 'From Headers',
        'Start Criteria Option': 'Refrac Date',
        'Start Value': '',
        'End Criteria': 'From Headers',
        'End Criteria Option': 'TIL',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }],
    [{
        'Created At': '',
        'Created By': '',
        'Model ID': 'flowback_1',
        'Model Type': 'unique',
        'Model Name': 'Flowback',
        'Description': '',
        'Start Date Window': 'Start',
        'Flowback Rate (MCF/D)': 20,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': 0,
        'End Criteria': 'Duration',
        'End Criteria Option': '',
        'End Value': 3,
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'flowback_1',
        'Model Type': 'unique',
        'Model Name': 'Flowback',
        'Description': '',
        'Start Date Window': '05/01/2023',
        'Flowback Rate (MCF/D)': 50,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': 0,
        'End Criteria': 'From Schedule',
        'End Criteria Option': 'Pad Preparation Mob Start',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'flowback_1',
        'Model Type': 'unique',
        'Model Name': 'Flowback',
        'Description': '',
        'Start Date Window': '06/01/2023',
        'Flowback Rate (MCF/D)': 70,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': 0,
        'End Criteria': 'From Headers',
        'End Criteria Option': 'Refrac Date',
        'End Value': '',
        'Last Update': '',
        'Updated By': '',
    }, {
        'Created At': '',
        'Created By': '',
        'Model ID': 'flowback_1',
        'Model Type': 'unique',
        'Model Name': 'Flowback',
        'Description': '',
        'Start Date Window': '07/01/2023',
        'Flowback Rate (MCF/D)': 90,
        'Start Criteria': 'FPD',
        'Start Criteria Option': '',
        'Start Value': 0,
        'End Criteria': 'FPD',
        'End Criteria Option': '',
        'End Value': 5,
        'Last Update': '',
        'Updated By': '',
    }],
]

expected_response_model_ids = ['completion_1', 'drilling_1', 'flowback_1']

node_dfs = [pd.DataFrame(model) for model in expected_response_model_rows]


# test each development node export with different start and end criteria
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, model, expected_response_model_rows, expected_response_model_id',
                         zip(node_keys, models, expected_response_model_rows, expected_response_model_ids))
def test_development_node_export(node_key, model, expected_response_model_rows, expected_response_model_id):
    response_model_rows, response_model_id = development_node_export(node_key, model, [])
    assert response_model_rows == expected_response_model_rows
    assert response_model_id == expected_response_model_id


# test each development node import with different start and end criteria
@pytest.mark.unittest
@pytest.mark.parametrize('node_key, node_df, test_index', zip(node_keys, node_dfs, range(len(node_dfs))))
def test_development_node_import(mocker, node_key, node_df, test_index):
    # mock the uuid generated in combustion_import
    mocker.patch('api.cc_to_cc.carbon.combustion.uuid.uuid4')
    internal_id = str(uuid.uuid4())
    mocker.return_value = internal_id
    expected_response_documents = [
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'completion',
            'name': 'Completion',
            'params': {
                'time_series': {
                    'fuel_type':
                    'natural_gas',
                    'rows': [{
                        'start_date_window': 'Start',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -30,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 15
                    }, {
                        'start_date_window': '05/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -30,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 15
                    }, {
                        'start_date_window': '06/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -20,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_completion_end',
                        'end_value': None
                    }, {
                        'start_date_window': '07/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -20,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_completion_end_date',
                        'end_value': None
                    }, {
                        'start_date_window': '08/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_completion_mob_start',
                        'start_value': None,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 7
                    }, {
                        'start_date_window': '09/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_spud_mob_start',
                        'start_value': None,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 3
                    }, {
                        'start_date_window': '10/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_pad_preparation_start',
                        'start_value': None,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_pad_preparation_end',
                        'end_value': None
                    }, {
                        'start_date_window': '11/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_pad_preparation_mob_start',
                        'start_value': None,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_permit_date',
                        'end_value': None
                    }, {
                        'start_date_window': '12/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_completion_start_date',
                        'start_value': None,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 1
                    }, {
                        'start_date_window': '01/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_spud_date',
                        'start_value': None,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 0
                    }, {
                        'start_date_window': '02/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_refrac_date',
                        'start_value': None,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_spud_end',
                        'end_value': None
                    }, {
                        'start_date_window': '03/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_refrac_date',
                        'start_value': None,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_til',
                        'end_value': None
                    }]
                }
            },
            'description': ''
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'drilling',
            'name': 'Drilling',
            'params': {
                'time_series': {
                    'fuel_type':
                    'distillate_fuel_oil_number_2',
                    'rows': [{
                        'start_date_window': 'Start',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -30,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 15
                    }, {
                        'start_date_window': '05/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -30,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 15
                    }, {
                        'start_date_window': '06/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -20,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_drill_end',
                        'end_value': None
                    }, {
                        'start_date_window': '07/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': -20,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_drill_end_date',
                        'end_value': None
                    }, {
                        'start_date_window': '08/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_drill_mob_start',
                        'start_value': None,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 7
                    }, {
                        'start_date_window': '09/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_spud_mob_start',
                        'start_value': None,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 3
                    }, {
                        'start_date_window': '10/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_pad_preparation_start',
                        'start_value': None,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_pad_preparation_end',
                        'end_value': None
                    }, {
                        'start_date_window': '11/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'schedule',
                        'start_criteria_option': 'offset_to_pad_preparation_mob_start',
                        'start_value': None,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_permit_date',
                        'end_value': None
                    }, {
                        'start_date_window': '12/01/2023',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_drill_start_date',
                        'start_value': None,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 1
                    }, {
                        'start_date_window': '01/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_spud_date',
                        'start_value': None,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 0
                    }, {
                        'start_date_window': '02/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_refrac_date',
                        'start_value': None,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_spud_end',
                        'end_value': None
                    }, {
                        'start_date_window': '03/01/2024',
                        'consumption_rate': 0,
                        'start_criteria': 'headers',
                        'start_criteria_option': 'offset_to_refrac_date',
                        'start_value': None,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_til',
                        'end_value': None
                    }]
                }
            },
            'description': ''
        },
        {
            'shape': {
                'position': {
                    'x': 100,
                    'y': 100
                }
            },
            'id': internal_id,
            'type': 'flowback',
            'name': 'Flowback',
            'params': {
                'time_series': {
                    'rows': [{
                        'start_date_window': 'Start',
                        'flowback_rate': 20,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': 0,
                        'end_criteria': 'duration',
                        'end_criteria_option': None,
                        'end_value': 3
                    }, {
                        'start_date_window': '05/01/2023',
                        'flowback_rate': 50,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': 0,
                        'end_criteria': 'schedule',
                        'end_criteria_option': 'offset_to_pad_preparation_mob_start',
                        'end_value': None
                    }, {
                        'start_date_window': '06/01/2023',
                        'flowback_rate': 70,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': 0,
                        'end_criteria': 'headers',
                        'end_criteria_option': 'offset_to_refrac_date',
                        'end_value': None
                    }, {
                        'start_date_window': '07/01/2023',
                        'flowback_rate': 90,
                        'start_criteria': 'FPD',
                        'start_criteria_option': None,
                        'start_value': 0,
                        'end_criteria': 'FPD',
                        'end_criteria_option': None,
                        'end_value': 5
                    }]
                }
            },
            'description': ''
        },
    ]

    expected_response_document = expected_response_documents[test_index]

    fluid_model_df = pd.DataFrame(columns=['_id', 'name'])
    shape_multipliers = {'x': 1, 'y': 1}
    error_list = []

    response_document, response_document_id, response_fluid_model_id = development_node_import(
        node_key,
        node_df,
        fluid_model_df,
        shape_multipliers,
        error_list,
    )

    assert response_document == expected_response_document
    assert response_document_id == internal_id
    assert response_fluid_model_id is None
    assert error_list == []
