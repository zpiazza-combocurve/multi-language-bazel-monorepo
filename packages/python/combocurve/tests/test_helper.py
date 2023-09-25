import numpy as np

from combocurve.science.network_module.network_test_data.network_helper_test_data import (relevant_edges_test_1,
                                                                                          sort_network_nodes_test_s)
from combocurve.science.network_module.nodes.shared.helper import (assign_product_type, sum_stream_date_and_value_for_2,
                                                                   sum_stream_date_and_value_for_more,
                                                                   get_relevant_edges, sort_network_nodes)
from datetime import datetime
import pytest
import deepdiff


@pytest.mark.unittest
def test_assign_product_type():
    input_and_expected_results = [
        ## ghg
        ('CO2', 'ghg'),
        ('C1', 'ghg'),
        ('N2O', 'ghg'),
        ## product
        ('oil', 'product'),
        ('gas', 'product'),
        ('water', 'product'),
        ('wh_oil', 'product'),
        ('wh_gas', 'product'),
        ('wh_water', 'product'),
        ## fuel
        ('anthracite', 'fuel'),
        ('bituminous', 'fuel'),
        ('subbituminous', 'fuel'),
        ('lignite', 'fuel'),
        ('coal_coke', 'fuel'),
        ('mixed_commercial_sector', 'fuel'),
        ('mixed_industrial_coking', 'fuel'),
        ('mixed_industrial_sector', 'fuel'),
        ('mixed_electric_power_sector', 'fuel'),
        ('natural_gas', 'fuel'),
        ('distillate_fuel_oil_number_1', 'fuel'),
        ('distillate_fuel_oil_number_2', 'fuel'),
        ('distillate_fuel_oil_number_4', 'fuel'),
        ('residual_fuel_oil_number_5', 'fuel'),
        ('residual_fuel_oil_number_6', 'fuel'),
        ('used_oil', 'fuel'),
        ('kerosene', 'fuel'),
        ('liquefied_petroleum_gases_lpg', 'fuel'),
        ('propane', 'fuel'),
        ('propylene', 'fuel'),
        ('ethane', 'fuel'),
        ('ethanol', 'fuel'),
        ('ethylene', 'fuel'),
        ('isobutane', 'fuel'),
        ('isobutylene', 'fuel'),
        ('butane', 'fuel'),
        ('butylene', 'fuel'),
        ('naphtha', 'fuel'),
        ('natural_gasoline', 'fuel'),
        ('other_oil', 'fuel'),
        ('pentanes_plus', 'fuel'),
        ('petrochemical_feedstocks', 'fuel'),
        ('petroleum_coke', 'fuel'),
        ('special_naphtha', 'fuel'),
        ('unfinished_oils', 'fuel'),
        ('heavy_gas_oils', 'fuel'),
        ('lubricants', 'fuel'),
        ('motor_gasoline', 'fuel'),
        ('aviation_gasoline', 'fuel'),
        ('kerosene_type_jet_fuel', 'fuel'),
        ('asphalt_and_road_oil', 'fuel'),
        ('crude_oil', 'fuel'),
        ('municipal_solid_waste', 'fuel'),
        ('tires', 'fuel'),
        ('plastics', 'fuel'),
        ('blast_furnace_gas', 'fuel'),
        ('coke_oven_gas', 'fuel'),
        ('propane_gas', 'fuel'),
        ('fuel_gas', 'fuel'),
        ('wood_and_wood_residuals', 'fuel'),
        ('agricultural_byproducts', 'fuel'),
        ('peat', 'fuel'),
        ('solid_byproducts', 'fuel'),
        ('landfill_gas', 'fuel'),
        ('other_biomass_gases', 'fuel'),
        ('biodiesel', 'fuel'),
        ('rendered_animal_fat', 'fuel'),
        ('vegetable_oil', 'fuel'),
        ## electricity
        ('electricity_us_average', 'fuel'),
        ('electricity_ercot', 'fuel'),
        ## None
        ('qwe', None),
        ('', None),
        (None, None),
        (123, None),
    ]

    for (input_, expected_result) in input_and_expected_results:
        assert assign_product_type(input_) == expected_result


stream_1 = {
    'date': np.array([datetime(2000, 1, 1), datetime(2000, 2, 1),
                      datetime(2000, 3, 1)]),
    'value': np.array([1, 2, 3], dtype=float)
}

stream_2 = {
    'date': np.array([datetime(2000, 3, 1), datetime(2000, 4, 1),
                      datetime(2000, 5, 1)]),
    'value': np.array([1, 2, 3], dtype=float)
}

stream_3 = {
    'date': np.array([datetime(2001, 3, 1), datetime(2001, 4, 1),
                      datetime(2001, 5, 1)]),
    'value': np.array([1, 2, 3], dtype=float)
}

stream_1_times_2 = {
    'date': np.array([datetime(2000, 1, 1), datetime(2000, 2, 1),
                      datetime(2000, 3, 1)]),
    'value': np.array([2, 4, 6], dtype=float)
}

stream_2_times_2 = {
    'date': np.array([datetime(2000, 3, 1), datetime(2000, 4, 1),
                      datetime(2000, 5, 1)]),
    'value': np.array([2, 4, 6], dtype=float)
}

stream_1_2 = {
    'date':
    np.array(
        [datetime(2000, 1, 1),
         datetime(2000, 2, 1),
         datetime(2000, 3, 1),
         datetime(2000, 4, 1),
         datetime(2000, 5, 1)]),
    'value':
    np.array([1, 2, 4, 2, 3], dtype=float)
}

stream_1_3 = {
    'date':
    np.array([
        datetime(2000, 1, 1),
        datetime(2000, 2, 1),
        datetime(2000, 3, 1),
        datetime(2001, 3, 1),
        datetime(2001, 4, 1),
        datetime(2001, 5, 1)
    ]),
    'value':
    np.array([1, 2, 3, 1, 2, 3], dtype=float)
}

stream_2_3 = {
    'date':
    np.array([
        datetime(2000, 3, 1),
        datetime(2000, 4, 1),
        datetime(2000, 5, 1),
        datetime(2001, 3, 1),
        datetime(2001, 4, 1),
        datetime(2001, 5, 1)
    ]),
    'value':
    np.array([1, 2, 3, 1, 2, 3], dtype=float)
}

stream_1_2_3 = {
    'date':
    np.array([
        datetime(2000, 1, 1),
        datetime(2000, 2, 1),
        datetime(2000, 3, 1),
        datetime(2000, 4, 1),
        datetime(2000, 5, 1),
        datetime(2001, 3, 1),
        datetime(2001, 4, 1),
        datetime(2001, 5, 1)
    ]),
    'value':
    np.array([1, 2, 4, 2, 3, 1, 2, 3], dtype=float)
}


def compare_stream_date_and_value(a, b):
    if a is None or b is None:
        return a is None and b is None

    return np.array_equal(a.get('date'), b.get('date')) and np.array_equal(a.get('value'), b.get('value'))


@pytest.mark.unittest
def test_sum_stream_date_and_value_for_2():

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_1, stream_1), stream_1_times_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_2, stream_2), stream_2_times_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_1, stream_2), stream_1_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_2, stream_1), stream_1_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_1, None), stream_1)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(stream_2, None), stream_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_2(None, None), None)


@pytest.mark.unittest
def test_sum_stream_date_and_value_for_more():
    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None]), None)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None, None]), None)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None, None, None]), None)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1]), stream_1)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_2]), stream_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_3]), stream_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, stream_2]), stream_1_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, stream_3]), stream_1_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_2, stream_3]), stream_2_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, stream_2, stream_3]),
                                         stream_1_2_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None, stream_2, stream_3]), stream_2_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, None, stream_3]), stream_1_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, stream_2, None]), stream_1_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None, None, stream_3]), stream_3)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([None, stream_2, None]), stream_2)

    assert compare_stream_date_and_value(sum_stream_date_and_value_for_more([stream_1, None, None]), stream_1)


@pytest.mark.unittest
def test_get_relevant_edges():
    response_1 = get_relevant_edges(*relevant_edges_test_1['inputs'])
    assert not deepdiff.DeepDiff(response_1, relevant_edges_test_1['outputs'], significant_digits=6)


@pytest.mark.unittest
def test_sort_network_nodes():
    for test in sort_network_nodes_test_s:
        response = sort_network_nodes(*test['inputs'])
        assert not deepdiff.DeepDiff(response, test['outputs'], significant_digits=6)
