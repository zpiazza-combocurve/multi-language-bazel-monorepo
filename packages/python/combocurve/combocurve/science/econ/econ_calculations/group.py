import numpy as np
from combocurve.science.econ.pre_process import PreProcess

from combocurve.science.econ.econ_calculations.calculation import EconCalculation


class GroupUpdate():
    def recursively_update_params(self, original_dict, group_dict, new_dict):
        for key, value in original_dict.items():
            if type(value) == dict:
                new_dict[key] = self.recursively_update_params(value, group_dict[key], {})
            elif type(value) == np.ndarray and key not in ['time']:
                new_dict[key] = value + group_dict[key]
            else:
                new_dict[key] = value
        return new_dict

    def fix_group_exp_length(self, group_exp, t_allocation, t_all):
        for exp in group_exp:
            exp['values'] = PreProcess.adjust_array(exp['values'], t_allocation, t_all, 0)

    def recursively_fix_group_params_length(self, group_params, t_allocation, t_all):
        for key, value in group_params.items():
            if type(value) == dict:
                self.recursively_fix_group_params_length(value, t_allocation, t_all)
            elif type(value) == np.ndarray and key not in ['time']:
                group_params[key] = PreProcess.adjust_array(value, t_allocation, t_all)
            elif key == 'time':
                group_params[key] = t_all


class GroupFixedExpense(EconCalculation, GroupUpdate):
    def __init__(self):
        pass

    def result(self, t_all, fixed_expenses, group_fixed_expenses, t_allocation):
        self.fix_group_exp_length(group_fixed_expenses, t_allocation, t_all)
        return {'fixed_expenses': fixed_expenses + group_fixed_expenses}


class GroupVariableExpense(EconCalculation, GroupUpdate):
    def __init__(self):
        pass

    def result(self, t_all, variable_expenses, group_variable_expenses, t_allocation):
        self.fix_group_exp_length(group_variable_expenses, t_allocation, t_all)
        return {'variable_expenses': variable_expenses + group_variable_expenses}


class GroupWaterDisposal(EconCalculation, GroupUpdate):
    def __init__(self):
        pass

    def result(self, t_all, water_disposal, group_water_disposals, t_allocation):
        self.fix_group_exp_length(group_water_disposals, t_allocation, t_all)
        return {'water_disposal': water_disposal + group_water_disposals}


class GroupProductionTax(EconCalculation, GroupUpdate):
    def __init__(self):
        pass

    def result(self, t_all, production_tax_dict, group_production_tax_dict, t_allocation):

        self.recursively_fix_group_params_length(group_production_tax_dict, t_allocation, t_all)
        new_production_tax_dict = self.recursively_update_params(
            production_tax_dict,
            group_production_tax_dict,
            {},
        )
        return {'production_tax_dict': new_production_tax_dict}
