import pytest
from math import isclose
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService

mass_modify_well_life_service = MassModifyWellLifeService('fake_context')

forecast_segments_cases = [({
    'end_idx':
    48533,
    'q_final':
    0.1,
    'segments': [{
        'D': 0.007439574642451289,
        'D_eff': 0.6057797675906641,
        'b': 2,
        'end_idx': 48717,
        'name': 'arps',
        'q_end': 20.783220866054474,
        'q_start': 158.40481732768507,
        'slope': -1,
        'start_idx': 44880
    }, {
        'D': 0.00012804146441518948,
        'D_eff': 0.044385351785524114,
        'D_exp': 0.00012804146441518948,
        'D_exp_eff': 0.045690412403891933,
        'b': 1.3000676824714958,
        'end_idx': 66794,
        'name': 'arps_modified',
        'q_end': 2.0386415739501533,
        'q_start': 20.63030686554486,
        'q_sw': 20.63030686554486,
        'realized_D_eff_sw': 0.045690412403891933,
        'slope': -1,
        'start_idx': 48718,
        'sw_idx': 48718.0,
        'target_D_eff_sw': 0.08
    }]
}, ([{
    'D': 0.007439574642451289,
    'D_eff': 0.6057797675906641,
    'b': 2,
    'end_idx': 48533,
    'name': 'arps',
    'q_end': 21.29098308359558,
    'q_start': 158.40481732768507,
    'slope': -1,
    'start_idx': 44880
}], '')), ({
    'end_idx': 48533,
    'q_final': 0.1,
    'segments': []
}, ([], 'No forecast data.'))]


@pytest.mark.unittest
@pytest.mark.parametrize("test_input,expected", forecast_segments_cases)
def test_change_forecast_segment_end_date(test_input, expected):
    segments, msg = mass_modify_well_life_service.change_forecast_segment_end_date(**test_input)

    for i in range(len(segments)):
        for key in segments[i]:
            if type(segments[i][key]) == float:
                assert isclose(segments[i][key], expected[0][i][key])
            else:
                assert (segments[i][key] == expected[0][i][key])

    assert msg == expected[1]
