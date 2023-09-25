import numpy as np
import copy
from combocurve.services.rollUp.roll_up_well_input import RollUpWellInput
from combocurve.services.rollUp.roll_up_well_result import RollUpWellResult
from combocurve.science.econ.econ_calculations.factory import (
    CalculationFactory,
    calculation_function_on_queue,
    ROLLUP_CALCULATIONS,
)

ASSUMPTION_KEYS = [
    'dates',
    'ownership_reversion',
    'stream_properties',
    'risking',
    'production_vs_fit',
    'schedule',
]


def sum_up_volume(volume_list):
    if len(volume_list) == 0:
        return False
    #
    ret_dict = copy.deepcopy(volume_list[0])
    for v in volume_list[1:]:
        for col in v:
            if col == 'date':
                continue
            else:
                ret_dict[col] = np.add(ret_dict[col], v[col])
    ## format adjust
    for key in ret_dict:
        if type(ret_dict[key]) == np.ndarray:
            ret_dict[key] = ret_dict[key].astype(float).tolist()

    return ret_dict


def calculate_well_count(well_volume):
    oil = well_volume['gross_oil_well_head_volume'] > 0
    gas = well_volume['gross_gas_well_head_volume'] > 0
    water = well_volume['gross_water_well_head_volume'] > 0

    well_count = (oil + gas + water).astype(int)
    well_volume['well_count_curve'] = well_count

    return well_volume


def single_well_volume(single_well_input):
    rollup_well_input = RollUpWellInput(single_well_input)

    calculation_factory = CalculationFactory(ROLLUP_CALCULATIONS)

    rollup_calculation_queue = calculation_factory.rollup_calculation_queue(daily=False)

    rollup_function = calculation_function_on_queue(rollup_calculation_queue, RollUpWellResult)
    rollup_well_result: RollUpWellResult = rollup_function(rollup_well_input, {})
    ret_dict = rollup_well_result.rollup_result_dict(daily=False)
    return ret_dict


def single_well_volume_daily(single_well_input):
    rollup_well_input = RollUpWellInput(single_well_input)

    calculation_factory = CalculationFactory(ROLLUP_CALCULATIONS)

    rollup_calculation_queue = calculation_factory.rollup_calculation_queue(daily=True)

    rollup = calculation_function_on_queue(rollup_calculation_queue, RollUpWellResult)
    rollup_well_result: RollUpWellResult = rollup(rollup_well_input, {})
    ret_dict = rollup_well_result.rollup_result_dict(daily=True)
    return ret_dict
