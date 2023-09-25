import pytest

from combocurve.science.econ.econ_calculations.stream_property import _process_compositional_economics_yield
from combocurve.science.econ.schemas.compositional_economics import CompositionalEconomicsRows, \
    CompositionalEconomicsRow


@pytest.fixture
def co2_comp_row() -> CompositionalEconomicsRow:
    return CompositionalEconomicsRow(
        **{
            'btu': 0,
            'category': 'CO2',
            'key': 'Compositional',
            'mol_factor': 6.4598,
            'mol_percentage': '32',
            'plant_efficiency': 50.88906970804049,
            'post_extraction': 37.83283031543596,
            'shrink': 15.715497693427043,
            'source': 'Manual',
            'value': '66'
        })


@pytest.fixture
def n2_comp_row() -> CompositionalEconomicsRow:
    return CompositionalEconomicsRow(
        **{
            'btu': 0,
            'category': 'N2',
            'key': 'Compositional',
            'mol_factor': 4.1643,
            'mol_percentage': '43',
            'plant_efficiency': 48.955540700606306,
            'post_extraction': 52.83938530630695,
            'shrink': 21.94911749873929,
            'source': 'Manual',
            'value': '55'
        })


@pytest.fixture
def c1_comp_row() -> CompositionalEconomicsRow:
    return CompositionalEconomicsRow(
        **{
            'btu': 1010,
            'category': 'C1',
            'key': 'Compositional',
            'mol_factor': 6.417,
            'mol_percentage': '23',
            'plant_efficiency': 83.15348903388417,
            'post_extraction': 9.32778437825708,
            'shrink': 3.8746975222066395,
            'source': 'Manual',
            'value': '77'
        })


@pytest.fixture
def compositionals_rows(n2_comp_row, c1_comp_row, co2_comp_row) -> CompositionalEconomicsRows:
    return CompositionalEconomicsRows(rows=[n2_comp_row, c1_comp_row, co2_comp_row])


@pytest.fixture
def compositionals_empty_rows() -> CompositionalEconomicsRows:
    return CompositionalEconomicsRows(rows=[])


def test_process_compositional_economics_yield(dates_dict, compositionals_rows):
    yields_result = _process_compositional_economics_yield(compositional_rows=compositionals_rows, date_dict=dates_dict)
    for comp in compositionals_rows.rows:
        assert yields_result[comp.category.value].value[0] == comp.value / 1000
        assert len(yields_result[comp.category.value].value) > 1
        assert yields_result[comp.category.value].shrinkage == "shrunk"


def test_process_compositional_economics_yield_empty(dates_dict, compositionals_empty_rows):
    yields_result = _process_compositional_economics_yield(compositional_rows=compositionals_empty_rows,
                                                           date_dict=dates_dict)
    assert yields_result == {}
