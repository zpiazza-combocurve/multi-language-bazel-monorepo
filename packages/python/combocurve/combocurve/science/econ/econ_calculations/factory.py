from queue import Queue
import inspect
from typing import Optional

from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.econ_calculations.wellhead import WellheadMonthly, WellheadDaily, GroupWellheadMonthly
from combocurve.science.econ.econ_calculations.stream_property import StreamPropertyMonthly, StreamPropertyDaily
from combocurve.science.econ.econ_calculations.ownership import Ownership, OwnershipDaily
from combocurve.science.econ.econ_calculations.volume import VolumeDaily, VolumeMonthly, GroupVolume
from combocurve.science.econ.econ_calculations.carbon_mass import CarbonMass
from combocurve.science.econ.econ_calculations.price import Price
from combocurve.science.econ.econ_calculations.revenue import Revenue, GroupRevenue
from combocurve.science.econ.econ_calculations.expense import (
    FixedExpense,
    VariableExpense,
    WaterDisposalExpense,
    CarbonExpense,
)
from combocurve.science.econ.econ_input.well_input import WellInput
from combocurve.science.econ.econ_calculations.well_result import WellResult
from combocurve.science.econ.econ_calculations.tax import TaxDeduct, ProductionTax
from combocurve.science.econ.econ_calculations.capex import CAPEX
from combocurve.science.econ.econ_calculations.cashflow import (BeforeIncomeTaxCashFlow, AfterIncomeTaxCashFlow,
                                                                GroupBeforeIncomeTaxCashFlow,
                                                                GroupCaseBeforeIncomeTaxCashFlow)
from combocurve.science.econ.econ_calculations.discounted_cashflow import (BeforeIncomeTaxDiscountedCashflow,
                                                                           AfterIncomeTaxDiscountedCashflow,
                                                                           GroupBeforeIncomeTaxDiscountedCashflow,
                                                                           GroupAfterIncomeTaxDiscountedCashflow)
from combocurve.science.econ.econ_calculations.group import (GroupFixedExpense, GroupVariableExpense,
                                                             GroupWaterDisposal, GroupProductionTax)
from combocurve.science.econ.econ_calculations.well_stream import WellStream, GroupWellStream

CALCULATIONS = {
    'WellheadMonthly': WellheadMonthly,
    'WellheadDaily': WellheadDaily,
    'StreamProperty': StreamPropertyMonthly,
    'StreamPropertyDaily': StreamPropertyDaily,
    'Ownership': Ownership,
    'OwnershipDaily': OwnershipDaily,
    'VolumeMonthly': VolumeMonthly,
    'VolumeDaily': VolumeDaily,
    'CarbonMass': CarbonMass,
    'WellStream': WellStream,
    'Price': Price,
    'Revenue': Revenue,
    'FixedExpense': FixedExpense,
    'VariableExpense': VariableExpense,
    'WaterDisposalExpense': WaterDisposalExpense,
    'CarbonExpense': CarbonExpense,
    'TaxDeduct': TaxDeduct,
    'ProductionTax': ProductionTax,
    'CAPEX': CAPEX,
    'BeforeIncomeTaxCashFlow': BeforeIncomeTaxCashFlow,
    'AfterIncomeTaxCashFlow': AfterIncomeTaxCashFlow,
    'BeforeIncomeTaxDiscountedCashflow': BeforeIncomeTaxDiscountedCashflow,
    'AfterIncomeTaxDiscountedCashflow': AfterIncomeTaxDiscountedCashflow
}

ROLLUP_CALCULATIONS = {
    'WellheadMonthly': WellheadMonthly,
    'WellheadDaily': WellheadDaily,
    'StreamProperty': StreamPropertyMonthly,
    'StreamPropertyDaily': StreamPropertyDaily,
    'Ownership': Ownership,
    'OwnershipDaily': OwnershipDaily,
    'VolumeMonthly': VolumeMonthly,
    'VolumeDaily': VolumeDaily,
}

GROUP_CALCULATIONS = {
    'WellheadMonthly': WellheadMonthly,
    'WellheadDaily': WellheadDaily,
    'StreamProperty': StreamPropertyMonthly,
    'StreamPropertyDaily': StreamPropertyDaily,
    'Ownership': Ownership,
    'VolumeMonthly': VolumeMonthly,
    'VolumeDaily': VolumeDaily,
    'CarbonMass': CarbonMass,
    'WellStream': WellStream,
    'Price': Price,
    'Revenue': Revenue,
    'FixedExpense': FixedExpense,
    'GroupFixedExpense': GroupFixedExpense,
    'VariableExpense': VariableExpense,
    'GroupVariableExpense': GroupVariableExpense,
    'WaterDisposalExpense': WaterDisposalExpense,
    'GroupWaterDisposal': GroupWaterDisposal,
    'CarbonExpense': CarbonExpense,
    'TaxDeduct': TaxDeduct,
    'ProductionTax': ProductionTax,
    'GroupProductionTax': GroupProductionTax,
    'CAPEX': CAPEX,
    'BeforeIncomeTaxCashFlow': BeforeIncomeTaxCashFlow,
    'AfterIncomeTaxCashFlow': AfterIncomeTaxCashFlow,
    'BeforeIncomeTaxDiscountedCashflow': GroupBeforeIncomeTaxDiscountedCashflow,
    'AfterIncomeTaxDiscountedCashflow': GroupAfterIncomeTaxDiscountedCashflow
}


def calculation_function_on_queue(q: Queue, well_result_class):
    def calculation_function(well_input: WellInput,
                             well_result_params: dict,
                             feature_flags: Optional[dict[str, bool]] = None):
        if feature_flags is None:
            feature_flags = {}
        well_result: WellResult = well_result_class(well_input, well_result_params)
        calculation_input_factory = CalculationInputFactory(well_input, well_result, feature_flags)
        for calculation_class in q.queue:
            this_calculation: EconCalculation = calculation_class(
                **calculation_input_factory.params_from_input(calculation_class))
            this_result_dict = this_calculation.result(
                **calculation_input_factory.params_from_result(calculation_class))
            well_result.update_result_by_dict(this_result_dict)
        return well_result

    return calculation_function


GROUP_LEVEL_CALCULATIONS = [
    GroupWellheadMonthly,
    Ownership,
    GroupVolume,
    GroupWellStream,
    GroupRevenue,
    FixedExpense,
    VariableExpense,
    WaterDisposalExpense,
    TaxDeduct,
    ProductionTax,
    CAPEX,
    GroupBeforeIncomeTaxCashFlow,
]


def group_level_calculation_function(well_input_dict,
                                     well_result_dict,
                                     calculate_bfit=True,
                                     feature_flags: Optional[dict[str, bool]] = None):
    '''
    BFIT calculation consider both group assumption and wells' aggregation
    can be used for reversion, cutoff, allocation
    '''
    calculation_input_factory = CalculationInputFactory(well_input_dict, well_result_dict)
    calculation_pipeline = GROUP_LEVEL_CALCULATIONS if calculate_bfit else GROUP_LEVEL_CALCULATIONS[:-1]
    for calculation_class in calculation_pipeline:
        this_calculation: EconCalculation = calculation_class(
            **calculation_input_factory.params_from_input(calculation_class))
        this_result_dict = this_calculation.result(**calculation_input_factory.params_from_result(calculation_class))
        well_result_dict.update(this_result_dict)
    return well_result_dict


GROUP_CASE_CALCULATIONS = [
    GroupWellheadMonthly,
    Ownership,
    GroupVolume,
    GroupWellStream,
    GroupRevenue,
    FixedExpense,
    VariableExpense,
    WaterDisposalExpense,
    TaxDeduct,
    ProductionTax,
    CAPEX,
    GroupCaseBeforeIncomeTaxCashFlow,
    BeforeIncomeTaxDiscountedCashflow,
]


def group_level_calculation_function_for_group_case(well_input_dict,
                                                    well_result_dict,
                                                    feature_flags: Optional[dict[str, bool]] = None):
    '''
    BFIT calculation only consider group case to construct group case result, also include discounted BFIT calculation
    the most important part is when not allocation, BFIT CF will be negative due to expense, capex or tax
    '''
    calculation_input_factory = CalculationInputFactory(well_input_dict, well_result_dict)
    for calculation_class in GROUP_CASE_CALCULATIONS:
        this_calculation: EconCalculation = calculation_class(
            **calculation_input_factory.params_from_input(calculation_class))
        this_result_dict = this_calculation.result(**calculation_input_factory.params_from_result(calculation_class))
        well_result_dict.update(this_result_dict)
    return well_result_dict


class CalculationFactory():
    def __init__(self, calculation_dict: dict):
        self.calculation_dict = calculation_dict

    def econ_calculation_queue(self, is_fiscal_month=False, income_tax=False):
        calculation_queue = Queue()

        for key in self.calculation_dict:
            if key in {'AfterIncomeTaxCashFlow', 'AfterIncomeTaxDiscountedCashflow'} and not income_tax:
                continue
            if key in {'WellheadDaily', 'OwnershipDaily', 'VolumeDaily', 'StreamPropertyDaily'} and not is_fiscal_month:
                continue
            calculation_queue.put(self.calculation_dict[key])

        return calculation_queue

    def rollup_calculation_queue(self, daily: bool):
        calculation_queue = Queue()

        for key in self.calculation_dict:
            if key in {'WellheadDaily', 'OwnershipDaily', 'VolumeDaily', 'StreamPropertyDaily'} and not daily:
                continue
            calculation_queue.put(self.calculation_dict[key])

        return calculation_queue


class CalculationInputFactory():
    def __init__(self, well_input: WellInput, well_result: WellResult, feature_flags: Optional[dict[str, bool]] = None):
        self.well_input = well_input
        self.well_result = well_result
        self.feature_flags = feature_flags or {}

    def params_from_input(self, calculation_class):
        # find parameters of the constructor, excepting self
        constructor_params_dict = dict(inspect.signature(calculation_class.__init__).parameters)
        param_names = list(constructor_params_dict.keys())
        params = list(constructor_params_dict.values())
        kwargs = {}
        for param_name, param in zip(param_names, params):
            if param_name in {'self', 'args', 'kwargs', 'feature_flags'}:
                continue
            default = param.default
            if default == inspect._empty:
                kwargs[param_name] = self.well_input[param_name]
            else:
                kwargs[param_name] = self.well_input.get(param_name, default)
        if 'feature_flags' in param_names:
            # Hack to get feature flags in econ calculations
            # To use it, just declare "feature flags" as one of the parameters in the constructor.
            kwargs['feature_flags'] = self.feature_flags
        return kwargs

    def params_from_result(self, calculation_class):
        # find parameters of result(), excepting self
        result_params_dict = dict(inspect.signature(calculation_class.result).parameters)
        param_names = list(result_params_dict.keys())
        params = list(result_params_dict.values())
        kwargs = {}
        for param_name, param in zip(param_names, params):
            if param_name == 'self':
                continue
            default = param.default
            if default == inspect._empty:
                kwargs[param_name] = self.well_result[param_name]
            else:
                kwargs[param_name] = self.well_result.get(param_name, default)
        return kwargs
