import pytest
from combocurve.services.forecast.forecast_service import ForecastService


class MockContext(object):
    def __init__(self):
        pass


@pytest.mark.unittest
@pytest.mark.python_apis
def test_calc_empty_eur():
    ctx = MockContext()
    service = ForecastService(ctx)
    eur, rur, res = service.calc_eur()
    assert eur is None
    assert rur is None


P_dict = {
    'best': {
        'segments': [{
            'name': 'arps_modified',
            'q_start': 73.5588982774173,
            'q_end': 0.13570963058825825,
            'slope': -1.0,
            'D_eff': 0.5273498586448097,
            'D': 0.003424917402687523,
            'b': 1.267822906209675,
            'target_D_eff_sw': 0.08,
            'realized_D_eff_sw': 0.07999999999999996,
            'sw_idx': 44327.796430480135,
            'q_sw': 8.688138595515861,
            'D_exp_eff': 0.07999999999999996,
            'D_exp': 0.0002282864036661219,
            'start_idx': 41103,
            'end_idx': 62547
        }],
        'diagnostics': {}
    }
}


@pytest.mark.unittest
@pytest.mark.python_apis
def test_calc_segments_eur():
    ctx = MockContext()
    service = ForecastService(ctx)
    eur, rur, res = service.calc_eur({}, None, 0.0, 'daily', P_dict)
    assert eur == 99408.79722287232
    assert rur == eur


P_dict_2 = {
    'best': {
        'segments': [{
            'name': 'arps_modified',
            'q_start': 78.5588982774173,
            'q_end': 0.16570963058825825,
            'slope': -1.0,
            'D_eff': 0.5273498586448097,
            'D': 0.003424917402687523,
            'b': 1.267822906209675,
            'target_D_eff_sw': 0.06,
            'realized_D_eff_sw': 0.07999999999999996,
            'sw_idx': 44327.796430480135,
            'q_sw': 9.688138595515861,
            'D_exp_eff': 0.07999999999999996,
            'D_exp': 0.0002282864036661219,
            'start_idx': 41103,
            'end_idx': 62547
        }],
        'diagnostics': {}
    }
}


@pytest.mark.unittest
@pytest.mark.python_apis
def test_calc_P_dict_eur():
    ctx = MockContext()
    service = ForecastService(ctx)
    eur, rur, res = service.calc_eur(P_dict_2, None, 0.0, 'daily', None)
    assert eur == 107931.54623732161
    assert rur == eur


@pytest.mark.unittest
@pytest.mark.python_apis
def test_calc_P_dict_eur_rur():
    ctx = MockContext()
    service = ForecastService(ctx)
    eur, rur, res = service.calc_eur(P_dict_2, None, 200.0, 'daily', None)
    assert eur == 108131.54623732161
    assert rur == (eur - 200.0)
