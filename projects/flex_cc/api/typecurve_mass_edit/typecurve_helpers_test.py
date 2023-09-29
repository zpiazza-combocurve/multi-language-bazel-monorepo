import pytest
from api.typecurve_mass_edit.typecurve_external import TypeCurveExternalExport

skip_limit_cases = [({
    'ret_list': [1, 2, 3, 4, 5, 6],
    'skip': 2,
    'limit': 3
}, [3, 4, 5]), ({
    'ret_list': [1, 2, 3, 4, 5, 6],
    'skip': 7,
    'limit': 3
}, []), ({
    'ret_list': [1, 2, 3, 4, 5, 6],
    'skip': 0,
    'limit': 10
}, [1, 2, 3, 4, 5, 6]), ({
    'ret_list': [1, 2, 3, 4, 5, 6],
    'skip': 2,
    'limit': 0
}, []), ({
    'ret_list': [1, 2, 3, 4, 5, 6],
    'skip': 2,
    'limit': 10
}, [3, 4, 5, 6])]


@pytest.mark.unittest
@pytest.mark.parametrize("test_input,expected", skip_limit_cases)
def test_skip_limit_functions(test_input, expected):
    tc_external_export = TypeCurveExternalExport('context')
    ret = tc_external_export.skip_and_limit(**test_input)
    assert ret == expected
