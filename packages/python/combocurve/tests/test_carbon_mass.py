from combocurve.science.econ.econ_calculations.carbon_mass import CarbonMass
from combocurve.science.econ.econ_calculations.econ_calculations_test.test_data.carbon_mass_test_data import (
    carbon_production_generator,
    date_dict,
    ownership_dict_by_phase_generator,
)
import deepdiff
import pytest
import numpy as np

ADJUST_ARRAY_ZERO = (
    'combocurve.science.econ.econ_calculations.carbon_mass.adjust_array_zero'
)


@pytest.mark.unittest
def test_carbon_mass_on_fpd(mocker):
    mocker.patch(ADJUST_ARRAY_ZERO, return_value=np.ones(5) * 100)

    carbon_production = carbon_production_generator['on_fpd']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['normal']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(0, ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {
                own: ownership_dict_by_phase['original'][own] * np.ones(5) * 100
                for own in ownership_dict_by_phase['original']
            }
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_carbon_mass_before_fpd(mocker):
    mocker.patch(ADJUST_ARRAY_ZERO, return_value=np.ones(5) * 100)

    carbon_production = carbon_production_generator['before_fpd']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['normal']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(0, ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {
                own: ownership_dict_by_phase['original'][own] * np.ones(5) * 100
                for own in ownership_dict_by_phase['original']
            }
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_carbon_mass_after_fpd(mocker):
    mocker.patch(ADJUST_ARRAY_ZERO, return_value=np.ones(5) * 100)

    carbon_production = carbon_production_generator['after_fpd']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['normal']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(0, ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {
                own: ownership_dict_by_phase['original'][own] * np.ones(5) * 100
                for own in ownership_dict_by_phase['original']
            }
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_carbon_mass_no_carbon():
    carbon_production = carbon_production_generator['no_carbon']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['normal']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(np.zeros(5), ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {own: np.zeros(5) for own in ownership_dict_by_phase['original']}
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_carbon_mass_zero_ownership(mocker):
    mocker.patch(ADJUST_ARRAY_ZERO, return_value=np.ones(5) * 100)

    carbon_production = carbon_production_generator['on_fpd']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['zeros']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(0, ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {
                own: ownership_dict_by_phase['original'][own] * np.ones(5) * 100
                for own in ownership_dict_by_phase['original']
            }
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)


@pytest.mark.unittest
def test_carbon_mass_one_ownership(mocker):
    mocker.patch(ADJUST_ARRAY_ZERO, return_value=np.ones(5) * 100)

    carbon_production = carbon_production_generator['on_fpd']
    ownership_dict_by_phase = ownership_dict_by_phase_generator['ones']

    model = CarbonMass(date_dict, carbon_production)

    response = model.result(0, ownership_dict_by_phase)

    expected_response = {
        'carbon_ownership_mass_dict': {
            phase: {
                own: ownership_dict_by_phase['original'][own] * np.ones(5) * 100
                for own in ownership_dict_by_phase['original']
            }
            for phase in ['co2e', 'co2', 'ch4', 'n2o']
        }
    }

    assert not deepdiff.DeepDiff(response, expected_response, significant_digits=6)
