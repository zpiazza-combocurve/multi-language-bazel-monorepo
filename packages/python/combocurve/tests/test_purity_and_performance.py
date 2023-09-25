import pytest
import pickle
from combocurve.science.econ.well import economics

import os

my_path = os.path.dirname(__file__)


@pytest.mark.skip
@pytest.mark.benchmark
def test_performance_of_well_economic_calculations_extra_760(benchmark):
    with open(my_path + '/well_input_pickles/extra_760.pkl', 'rb') as f:
        raw_well_input = pickle.load(f)

    benchmark(economics, raw_well_input, 0, None)


@pytest.mark.skip
@pytest.mark.benchmark
def test_performance_of_well_economic_calculations_extra_756(benchmark):
    with open(my_path + '/well_input_pickles/extra_756.pkl', 'rb') as f:
        raw_well_input = pickle.load(f)

    benchmark(economics, raw_well_input, 0, None)


@pytest.mark.skip
@pytest.mark.benchmark
def test_performance_of_well_economic_calculations_ownandrev_264(benchmark):
    with open(my_path + '/well_input_pickles/ownandrev_264.pkl', 'rb') as f:
        raw_well_input = pickle.load(f)

    benchmark(economics, raw_well_input, 0, None)
