from combocurve.science.econ.embedded_lookup_table.conversion import EmbeddedConverter
from combocurve.shared.econ_tools.econ_model_tools import FIXED_EXP_KEYS
import copy

from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults


def get_elt_field(current_input, key, default_values):
    # dict.get will return None if the key is found and the value is None instead of using default value
    return current_input.get(key) if current_input.get(key) is not None else default_values[key]


class ExpenseConverter(EmbeddedConverter):
    VAR_PHASES = ['oil', 'gas', 'ngl', 'drip_condensate']

    VAR_PROCESSES = ['gathering', 'processing', 'transportation', 'marketing', 'other']

    WATER_KEYS = [
        'escalation_model', 'calculation', 'affect_econ_limit', 'deduct_before_severance_tax',
        'deduct_before_ad_val_tax', 'cap', 'deal_terms', 'rate_type', 'rows_calculation_method'
    ]

    GHG_COMPS = ['co2e', 'co2', 'ch4', 'n2o']

    GHG_KEYS = WATER_KEYS + ['description']

    FIXED_KEYS = GHG_KEYS + [
        'stop_at_econ_limit',
        'expense_before_fpd',
    ]

    OIL_GAS_VAR_KEYS = WATER_KEYS + ['shrinkage_condition', 'description']

    NGL_DRIP_VAR_KEYS = WATER_KEYS + ['description']

    DEFAULT_WATER_VALUES = copy.deepcopy(EconModelDefaults.water_disposal)

    DEFAULT_FIXED_VALUES = copy.deepcopy(EconModelDefaults.fixed_exp())

    DEFAULT_GHG_VALUES = copy.deepcopy(EconModelDefaults.ghg_default())

    DEFAULT_OIL_VAR_VALUES = copy.deepcopy(EconModelDefaults.oil_var_exp)

    DEFAULT_GAS_VAR_VALUES = copy.deepcopy(EconModelDefaults.gas_var_exp)

    DEFAULT_NGL_DRIP_COND_VALUES = copy.deepcopy(EconModelDefaults.ngl_drip_cond_var_exp)

    def incorporate_embedded(self, expense_model):
        '''take a model and, if applicable, its embedded lookup tables and
        translate them into the format of the original expense model

        Args:
            expense_model (dict): original expense model and its connected embedded lookup tables

        Returns:
            tuple:
                fixed_expense (dict): formatted fixed expense input
                var_expense(dict): formatted variable expense input
                water_disposal (dict): formatted water disposal expense input
        '''
        fixed_expense = [self.orig_emb(expense_model['fixed_expenses'], 'original')]
        var_expense = [self.orig_emb(expense_model['variable_expenses'], 'original')]
        water_disposal = [self.orig_emb(expense_model['water_disposal'], 'original')]
        ghg_expense = [self.orig_emb(expense_model['carbon_expenses'], 'original')]

        if expense_model.get('fetched_embedded'):
            for embedded_lookup_table in expense_model['fetched_embedded']:
                fixed, var, water, ghg = self.embedded_expenses_conversion(embedded_lookup_table)

                fixed_expense.append(self.orig_emb(fixed, 'embedded'))
                var_expense.append(self.orig_emb(var, 'embedded'))
                water_disposal.append(self.orig_emb(water, 'embedded'))
                ghg_expense.append(self.orig_emb(ghg, 'embedded'))

        return fixed_expense, var_expense, water_disposal, ghg_expense

    def embedded_expenses_conversion(self, lookup_input):
        '''convert embedded lookup table input to inputs from the original lookup model

        Args:
            lookup_input (list): specific keys and values from the embedded lookup table

        Returns:
            tuple:
                fixed_expenses_input (dict): formatted fixed expense input
                variable_expenses_input (dict): formatted variable expense input
                water_expenses_input (dict): formatted water disposal expense input
        '''
        fixed_expenses_lookup_input = {k: None for k in FIXED_EXP_KEYS}
        var_expenses_lookup_input = {j: {k: None for k in self.VAR_PROCESSES} for j in self.VAR_PHASES}
        water_expenses_lookup_input = None
        carbon_expenses_lookup_input = {j: None for j in self.GHG_COMPS}

        for entry in lookup_input:
            entry = self.lines_processor(entry, 'expense')
            if entry['key'] == 'fixed_expenses':
                for k in fixed_expenses_lookup_input:
                    # embedded lookup table doesn't keep the category of fixed exp, put it to empty slot in order
                    if fixed_expenses_lookup_input[k] is None:
                        fixed_expenses_lookup_input[k] = entry
                        break
            elif entry['key'] in ['oil', 'gas', 'ngl', 'drip_condensate']:
                var_expenses_lookup_input[entry['key']][entry['category']] = entry
            elif entry['key'] == 'water_disposal':
                water_expenses_lookup_input = entry
            elif entry['key'] == 'carbon_expenses':
                carbon_expenses_lookup_input[entry['category']] = entry

        fixed_expenses_input = self.embedded_fixed_expenses_conversion(fixed_expenses_lookup_input)
        var_expenses_input = self.embedded_var_expenses_conversion(var_expenses_lookup_input)
        water_expenses_input = self.embedded_water_expenses_conversion(water_expenses_lookup_input)
        carbon_expenses_input = self.embedded_carbon_expenses_conversion(carbon_expenses_lookup_input)

        return fixed_expenses_input, var_expenses_input, water_expenses_input, carbon_expenses_input

    def embedded_carbon_expenses_conversion(self, carbon_expenses_lookup_input):
        '''convert ghg embedded lookup table input to that of the original model

        Args:
            carbon_expenses_lookup_input (dict): ghg expenses input parameters for this embedded lookup table

        Returns:
            dict: converted data that matches the format of original expense model
        '''
        carbon_expenses_input = dict.fromkeys(self.GHG_COMPS, dict())

        for comp in self.GHG_COMPS:
            current_input = carbon_expenses_lookup_input[comp]
            if current_input is None:
                carbon_expenses_input[comp] = self.DEFAULT_GHG_VALUES
                continue

            expense_rows = self.row_converter(current_input, 'carbon_expense')

            carbon_expenses_input[comp] = {
                key: get_elt_field(current_input, key, self.DEFAULT_GHG_VALUES)
                for key in self.GHG_KEYS
            }

            carbon_expenses_input[comp]['rows'] = expense_rows

        return carbon_expenses_input

    def embedded_fixed_expenses_conversion(self, fixed_expenses_lookup_input):
        '''convert fixed embedded lookup table input to that of the original model

        Args:
            fixed_expenses_lookup_input (dict): fixed expenses input parameters for this embedded lookup table

        Returns:
            dict: converted data that matches the format of original expense model
        '''
        fixed_expenses_input = dict.fromkeys(FIXED_EXP_KEYS, dict())

        for category in FIXED_EXP_KEYS:
            current_input = fixed_expenses_lookup_input[category]
            if current_input is None:
                fixed_expenses_input[category] = self.DEFAULT_FIXED_VALUES
                continue

            expense_rows = self.row_converter(current_input, 'fixed_expense')

            fixed_expenses_input[category] = {
                key: get_elt_field(current_input, key, self.DEFAULT_FIXED_VALUES)
                for key in self.FIXED_KEYS
            }

            fixed_expenses_input[category]['rows'] = expense_rows

        return fixed_expenses_input

    def embedded_var_expenses_conversion(self, var_expenses_lookup_input):
        '''convert variable embedded lookup table input to that of the original model

        Args:
            var_expenses_lookup_input (dict): variable expenses input parameters for this embedded lookup table

        Returns:
            dict: converted data that matches the format of original expense model
        '''
        var_expenses_input = {j: {k: dict() for k in self.VAR_PROCESSES} for j in self.VAR_PHASES}
        for phase in self.VAR_PHASES:
            if phase == 'gas':
                default_values = self.DEFAULT_GAS_VAR_VALUES
            elif phase == 'oil':
                default_values = self.DEFAULT_OIL_VAR_VALUES
            else:
                default_values = self.DEFAULT_NGL_DRIP_COND_VALUES

            for process in self.VAR_PROCESSES:
                current_input = var_expenses_lookup_input[phase][process]
                if current_input is None:
                    var_expenses_input[phase][process] = default_values
                    continue

                expense_rows = self.row_converter(current_input, 'variable_expense')

                var_expenses_input[phase][process] = {
                    key: get_elt_field(current_input, key, default_values)
                    for key in (self.OIL_GAS_VAR_KEYS if phase in ['oil', 'gas'] else self.NGL_DRIP_VAR_KEYS)
                }

                var_expenses_input[phase][process]['rows'] = expense_rows

        return var_expenses_input

    def embedded_water_expenses_conversion(self, water_expenses_lookup_input):
        '''convert water disposal embedded lookup table input to that of the original model

        Args:
            water_expenses_lookup_input (dict): water expenses input parameters for this embedded lookup table

        Returns:
            dict: converted data that matches the format of original expense model
        '''
        water_expenses_input = dict()

        current_input = water_expenses_lookup_input
        if current_input is None:
            water_expenses_input = self.DEFAULT_WATER_VALUES
            return water_expenses_input

        expense_rows = self.row_converter(current_input, 'water_expense')

        water_expenses_input = {
            key: get_elt_field(current_input, key, self.DEFAULT_WATER_VALUES)
            for key in self.WATER_KEYS
        }

        water_expenses_input['rows'] = expense_rows

        return water_expenses_input
