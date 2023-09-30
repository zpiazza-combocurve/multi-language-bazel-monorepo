import pandas as pd
import pytest
import datetime
from api.cc_to_cc.emission import emission_export, emission_import


@pytest.fixture
def model():
    model = {
        'name': "All 1's",
        'unique': False,
        'econ_function': {
            'table': [{
                'selected': True,
                'category': 'associated_gas',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mmcf',
                'escalation_model': '6374a6bc96546926d0657f83'
            }, {
                'selected': True,
                'category': 'acid_gas_removal_units',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mmcf',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'centrifugal_compressor',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'eor_hydrocarbon_liquids',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mbbl',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'eor_injection_pumps',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mbbl',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'liquids_unloading',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mmcf',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'pneumatic_device',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'dehydrators',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mmcf',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'equipment_leaks',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'atmospheric_tank',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mbbl',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'reciprocating_compressor',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'completions_with_fracturing',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_new_well',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'completions_without_fracturing',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_new_well',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'drilling',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_new_well',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'completion',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_new_well',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'combustion',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'pneumatic_pump',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'well_testing',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mboe',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'blowdown_vent_stacks',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'flare',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_mmcf',
                'escalation_model': 'none'
            }, {
                'selected': True,
                'category': 'scope2',
                'co2e': 0,
                'co2': 1,
                'ch4': 1,
                'n2o': 1,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }, {
                'selected': False,
                'category': 'scope3',
                'co2e': 1,
                'co2': 0,
                'ch4': 0,
                'n2o': 0,
                'unit': 'mt_per_well_per_year',
                'escalation_model': 'none'
            }]
        },
        'updatedAt': datetime.datetime(2023, 5, 10, 0, 17, 38, 161000),
    }
    return model


@pytest.fixture
def esca_id_to_name():
    esca_id_to_name = {'6374a6bc96546926d0657f83': 'Associated Gas Escalation'}
    return esca_id_to_name


@pytest.fixture
def expected_response_model_rows():
    expected_response_model_rows = [
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Associated Gas',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MMCF',
            'Escalation': 'Associated Gas Escalation',
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Acid Gas Removal Units',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MMCF',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Centrifugal Compressor',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'EOR Hydrocarbon Liquids',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MBBL',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'EOR Injection Pumps',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MBBL',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Liquids Unloading',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MMCF',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Pneumatic Device',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Dehydrators',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MMCF',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Equipment Leaks',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Atmospheric Tank',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MBBL',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Reciprocating Compressor',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Completions With Fracturing',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/New Well',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Completions Without Fracturing',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/New Well',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Drilling Combustion',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/New Well',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Completion Combustion',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/New Well',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Combustion',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Pneumatic Pump',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Well Testing',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MBOE',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Blowdown Vent Stacks',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Flare',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/MMCF',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': True,
            'Category': 'Scope 2',
            'CO2e': 0,
            'CO2': 1,
            'CH4': 1,
            'N2O': 1,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38',
        },
        {
            'Model Type': 'project',
            'Model Name': "All 1's",
            'Selected': False,
            'Category': 'Scope 3',
            'CO2e': 1,
            'CO2': 0,
            'CH4': 0,
            'N2O': 0,
            'Unit': 'MT/Well/Year',
            'Escalation': None,
            'Last Update': '05/10/2023 00:17:38'
        },
    ]
    return expected_response_model_rows


# test emission_export with escalation_model, all categories, and all units
@pytest.mark.unittest
def test_emission_export_with_escalation_model_all_categories_all_units(model, esca_id_to_name,
                                                                        expected_response_model_rows):
    response_model_rows = emission_export(model, esca_id_to_name)

    assert response_model_rows == expected_response_model_rows


# test emission_import with escalation_model, all categories, and all units
@pytest.mark.unittest
def test_emission_import_with_escalation_model_all_categories_all_units(model, esca_id_to_name,
                                                                        expected_response_model_rows):
    model_df = pd.DataFrame(expected_response_model_rows)
    model_array = model_df.values
    header = list(model_df.columns)

    esca_name_dict = {v: {'_id': k} for k, v in esca_id_to_name.items()}

    response_econ_model, response_error_list = emission_import(model_array, header, esca_name_dict)

    assert response_econ_model == model['econ_function']
    assert response_error_list == []


# test emission_import with CO2e and (CO2, CH4, N2O) used together
@pytest.mark.unittest
def test_emission_import_with_co2e_and_co2_ch4_n2o_used_together(model, expected_response_model_rows):
    model_df = pd.DataFrame([expected_response_model_rows[1]])  # use the second row
    model_df['CO2'] = 1
    model_array = model_df.values
    header = list(model_df.columns)

    esca_name_dict = {}

    expected_response_econ_model = {'table': [model['econ_function']['table'][1]]}
    expected_response_econ_model['table'][0]['co2'] = 1

    response_econ_model, response_error_list = emission_import(model_array, header, esca_name_dict)

    assert response_econ_model == expected_response_econ_model
    assert response_error_list == [{
        'error_message': 'CO2e and (CO2, CH4, N2O) can not be used together',
        'row_index': 0
    }]
