import copy
from typing import Optional

import pandas as pd

from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
from api.aries_phdwin_imports.aries_data_extraction.dataclasses.overlay import DSTConditions
from api.aries_phdwin_imports.aries_import_helpers import (format_start_date, clean_overlay_keyword,
                                                           ACCEPTABLE_SHRINK_KEYWORDS_BY_PHASE)
from api.aries_phdwin_imports.combine_rows import (sum_overlay_expense_rows, aries_cc_round, FIXED_EXPENSE_CATEGORY,
                                                   sum_rows, copy_rows)
from api.aries_phdwin_imports.error import format_error_msg, ErrorMsgEnum
from api.aries_phdwin_imports.helpers import (
    KEYWORD_OVERLAY_CONV_DICT, str_join, set_oil_unshrunk, overlay_shrink_dict, overlay_liquid_expense_keys,
    FIXED_EXPENSE_OVERLAY_DICT, overlay_gas_expense_keys, CC_ARIES_OVERLAY_SEV_TAX_DIC, overlay_phase_dic,
    CC_ARIES_OVERLAY_PRICE_DICT, check_and_remove_well_from_previous_model, ARIES_CC_OVERLAY_GROSS_SEV_TAX_PHASE_DICT,
    ARIES_CC_OVERLAY_SEV_TAX_RATE_PHASE_DICT, ARIES_CC_OVERLAY_REVENUE_PHASE_DICT, ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT,
    ARIES_CC_OVERLAY_PHASE_STREAM_DICT, get_well_doc_overlay, extract_yield_properties, OPC_WELL_PHASE_DICT,
    CALC_VALUE_TO_OPTIONS_DICT, APPRAISED_LIQUID_EXPENSE_CONV_DICT, OVERLAY_OWNERSHIP_DICT,
    KEYWORD_LIQUID_EXPENSE_PHASE_DICT, check_if_use_fpd_asof, MAX_ALLOWABLE_MONTHS, variable_expenses_category)
from api.aries_phdwin_imports.interfaces.model_extraction import ModelExtractionInterface
from combocurve.shared.aries_import_enums import EconHeaderEnum, EconEnum, OverlayEnum, PhaseEnum, CCSchemaEnum, \
    OperatorEnum, UnitEnum, PriceEnum, ExpressionEnum, ForecastEnum


class Overlay(ModelExtractionInterface):
    def __init__(self, aries_data_extraction):
        super().__init__(aries_data_extraction)

    ARIES_VALUE_LIMIT_FOR_OVERLAY = 5

    overlay_expense_type_dict = {
        OverlayEnum.opc_gas_wi.value: EconEnum.opc.value,
        OverlayEnum.gpc_gas.value: EconEnum.gathering.value,
        OverlayEnum.gpc_gas_wi.value: EconEnum.gathering.value,
        OverlayEnum.gtc_gas_wi.value: EconEnum.transport.value,
        OverlayEnum.gtc_lqd.value: EconEnum.transport.value,
        OverlayEnum.gtc_gas_nri.value: EconEnum.transport.value,
        OverlayEnum.opc_oil_well.value: EconEnum.opc.value,
        OverlayEnum.opc_gas_well.value: EconEnum.opc.value,
        OverlayEnum.opc_oil_gas_well.value: EconEnum.opc.value,
        OverlayEnum.opc_oil_ini.value: EconEnum.opc.value,
        OverlayEnum.gtc_gas_ini.value: EconEnum.transport.value,
        OverlayEnum.opc_gas_ini.value: EconEnum.opc.value,
        OverlayEnum.ltc_oil_cnd_ini.value: EconEnum.transport.value,
        OverlayEnum.opc_ngl_ini.value: EconEnum.opc.value,
        OverlayEnum.opc_cnd_ini.value: EconEnum.opc.value,
        OverlayEnum.gpc_ngl_ini.value: EconEnum.gathering.value,
        OverlayEnum.cmp_gas.value: EconEnum.other.value
    }

    initial_gas_expense_keys = [OverlayEnum.opc_gas_ini.value, OverlayEnum.gtc_gas_ini.value, OverlayEnum.gpc_gas.value]

    expense_overlay_multipliers = {
        OverlayEnum.gross_gas.value: OverlayEnum.gross_gas.name,
        OverlayEnum.net_gas.value: OverlayEnum.net_gas.name,
        OverlayEnum.lease_net_gas.value: OverlayEnum.net_gas.name,  # lnri?
        OverlayEnum.lease_net_oil.value: OverlayEnum.net_gas.name,
        OverlayEnum.wi.value: OverlayEnum.wi.name
    }

    sev_tax_wi_phase_dict = {
        frozenset({OverlayEnum.oil_sev_tax_rate.value, OverlayEnum.oil_wi.value}): PhaseEnum.oil.value,
        frozenset({OverlayEnum.gas_sev_tax_rate.value, OverlayEnum.gas_wi.value}): PhaseEnum.gas.value,
        frozenset({OverlayEnum.cnd_sev_tax_rate.value, OverlayEnum.cnd_wi.value}): PhaseEnum.condensate.value,
        frozenset({OverlayEnum.ngl_sev_tax_rate.value, OverlayEnum.ngl_wi.value}): PhaseEnum.ngl.value
    }

    sev_tax_wi_general_dict = {
        frozenset({OverlayEnum.oil_sev_tax_rate.value, OverlayEnum.wi.value}): PhaseEnum.oil.value,
        frozenset({OverlayEnum.gas_sev_tax_rate.value, OverlayEnum.wi.value}): PhaseEnum.gas.value,
        frozenset({OverlayEnum.cnd_sev_tax_rate.value, OverlayEnum.wi.value}): PhaseEnum.condensate.value,
        frozenset({OverlayEnum.ngl_sev_tax_rate.value, OverlayEnum.wi.value}): PhaseEnum.ngl.value
    }

    fixed_expense_code = {
        316: 'OH/T',
        716: 'OH',
        317: 'OH/W',
        267: 'OPC/T',
        272: 'OPC/OGW',
        273: 'LTC/T',
        276: 'GTC/T',
        279: 'CMP/T',
        295: 'WRK/T'
    }

    @classmethod
    def get_expense_name(cls, keyword):
        return cls.overlay_expense_type_dict.get(keyword)

    @classmethod
    def apply_phase_multiplier_to_price(cls, document, phase, value):
        for row in document[EconEnum.econ_function.value][EconEnum.price_model.value][phase][EconEnum.rows.value]:
            if any(key in row for key in [
                    PriceEnum.dollar_per_bbl.value, PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_mmbtu.value,
                    PriceEnum.price.value, PriceEnum.pct_of_base_price.value
            ]):
                unit_key = next(key for key in [
                    PriceEnum.dollar_per_bbl.value, PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_mmbtu.value,
                    PriceEnum.price.value, PriceEnum.pct_of_base_price.value
                ] if key in row)
                row[unit_key] *= value
        return document

    @classmethod
    def check_differential_doc_overlay(cls, well_doc, phase, get_default_format):
        default_differential_document = get_default_format(EconEnum.differentials.value)
        if well_doc[EconEnum.econ_function.value][EconEnum.differentials.value][PriceEnum.diff_2.value][phase][
                EconEnum.rows.value] == default_differential_document[EconEnum.econ_function.value][
                    EconEnum.differentials.value][PriceEnum.diff_2.value][phase][EconEnum.rows.value]:
            return True
        return False

    @classmethod
    def apply_perc_differential_overlay(cls, document, value, start_date, phase):
        """

        Args:
            document:
            value:
            start_date:
            phase:

        Returns:

        """
        document[EconEnum.econ_function.value][EconEnum.differentials.value][PriceEnum.diff_2.value][phase][
            EconEnum.rows.value] = [{
                PriceEnum.pct_of_base_price.value: value,
                CCSchemaEnum.dates.value: {
                    CCSchemaEnum.start_date.value:
                    pd.to_datetime(start_date).strftime(CCSchemaEnum.ymd_date_dash_format.value),
                    CCSchemaEnum.end_date.value:
                    EconEnum.econ_limit.value
                }
            }]

    @classmethod
    def get_first_last_item_from_expression(cls, ls_expression: list[str]):
        """Returns the first and last items from the specified expression.

        Args:
            ls_expression: List of items where the first and last items will be extracted from

        Returns:
            Tuple structure (first_item, last_item)
        """
        return str(ls_expression[0]).split('/')[-1], str(ls_expression[-1]).split('/')[-1]

    @classmethod
    def get_phase_overlay_forecast_override(cls, exp):
        """

        Args:
            exp:

        Returns:

        """
        exp_1 = exp[0]
        exp_2 = exp[1]
        for phase_enum in PhaseEnum:
            if (phase_enum.value in exp_1.lower() or phase_enum.value in exp_2.lower()) and exp_1.split('.')[0] == 'MP':
                return phase_enum.value

    @classmethod
    def get_phase_for_liquid_expense_overlay(cls, keyword):
        phases = KEYWORD_LIQUID_EXPENSE_PHASE_DICT.get(keyword)
        if phases is None:
            phases = [PhaseEnum.oil.value]
        return phases

    @classmethod
    def check_for_dst_condition_1(cls, keyword: str, ls_expression: list[str], dst_conditions: DSTConditions):
        """

        Args:
            keyword:
            ls_expression:
            dst_conditions:

        Returns:
            Reference of the updated dst_conditions object
        """

        first_item, last_item = cls.get_first_last_item_from_expression(ls_expression)
        try:
            duration = ' '.join(ls_expression[3:6])
        except IndexError:
            duration = None
        if duration == 'TO LIFE MUL':
            if (first_item in ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT and ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT[first_item][0]
                    == ARIES_CC_OVERLAY_PHASE_STREAM_DICT.get(last_item)):
                phase, category = ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT[first_item]

                dst_conditions.condition_1 = True
                dst_conditions.condition_keyword_1 = keyword
                dst_conditions.condition_phase = phase
                dst_conditions.condition_category = category

                return dst_conditions
            if (last_item in ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT and ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT[last_item][0]
                    == ARIES_CC_OVERLAY_PHASE_STREAM_DICT.get(first_item)):
                phase, category = ARIES_CC_OVERLAY_EXPENSE_PHASE_DICT[last_item]

                dst_conditions.condition_1 = True
                dst_conditions.condition_keyword_1 = keyword
                dst_conditions.condition_phase = phase
                dst_conditions.condition_category = category

                return dst_conditions
        return dst_conditions

    @classmethod
    def get_workover_expense_category(cls, well_doc):
        """

        Args:
            well_doc:
        """
        workover_category = None
        for category in FIXED_EXPENSE_CATEGORY:
            if 'entire_well_life' in well_doc[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                    EconEnum.rows.value][-1]:
                workover_category = category
                break
        return workover_category

    @classmethod
    def get_opc_value_for_workover(cls, well_doc: dict, fixed_expense_assignment: dict, expense_key: str):
        """

        Args:
            well_doc:
            fixed_expense_assignment:
            expense_key:

        Returns:
            Fixed expense value
        """
        for fixed_expense_category in fixed_expense_assignment:
            if list(fixed_expense_assignment[fixed_expense_category])[-1] in OPC_WELL_PHASE_DICT.get(expense_key):
                category = fixed_expense_category
                break
        fixed_expense_value = well_doc[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
            EconEnum.rows.value]
        return fixed_expense_value

    @classmethod
    def check_for_dst_condition_2(cls, keyword: str, ls_expression: list[str], dst_conditions: DSTConditions):
        """
        Args:
            keyword:
            ls_expression:
            dst_conditions:

        Returns:
            Updated reference of dst_conditions object
        """
        first_item, last_item = cls.get_first_last_item_from_expression(ls_expression)
        try:
            duration = ' '.join(ls_expression[3:6])
        except IndexError:
            duration = None
        if duration == 'TO LIFE MINUS':
            if (first_item in ARIES_CC_OVERLAY_REVENUE_PHASE_DICT
                    and last_item == str(dst_conditions.condition_keyword_1).split('/')[-1]
                    and dst_conditions.condition_phase == ARIES_CC_OVERLAY_REVENUE_PHASE_DICT.get(first_item)):
                dst_conditions.condition_1 = True
                dst_conditions.condition_2 = True

                dst_conditions.condition_keyword_2 = keyword

                return dst_conditions
        return dst_conditions

    @classmethod
    def check_for_dst_condition_3(cls, keyword: str, ls_expression: list[str], dst_conditions: DSTConditions):
        first_item, last_item = cls.get_first_last_item_from_expression(ls_expression)
        overlay_key = str(keyword).split('/')[-1]
        try:
            duration = ' '.join(ls_expression[3:6])
        except IndexError:
            duration = None
        if (duration == 'TO LIFE MUL'
                and ARIES_CC_OVERLAY_GROSS_SEV_TAX_PHASE_DICT.get(overlay_key) == dst_conditions.condition_phase):
            if ((ARIES_CC_OVERLAY_SEV_TAX_RATE_PHASE_DICT.get(first_item) == dst_conditions.condition_phase
                 and last_item == str(dst_conditions.condition_keyword_2).split('/')[-1])
                    or (ARIES_CC_OVERLAY_SEV_TAX_RATE_PHASE_DICT.get(last_item) == dst_conditions.condition_phase
                        and first_item == str(dst_conditions.condition_keyword_2).split('/')[-1])):
                dst_conditions.condition_1 = True
                dst_conditions.condition_2 = True
                dst_conditions.condition_3 = True

                return dst_conditions
        return dst_conditions

    @classmethod
    def check_for_dst_condition(cls, keyword: str, ls_expression: list[str], dst_conditions: DSTConditions):
        """

        Args:
            keyword:
            ls_expression:
            dst_conditions:

        Returns:

        """
        if dst_conditions.condition_2:
            return cls.check_for_dst_condition_3(keyword, ls_expression, dst_conditions)
        elif dst_conditions.condition_1:
            return cls.check_for_dst_condition_2(keyword, ls_expression, dst_conditions)

        return cls.check_for_dst_condition_1(keyword, ls_expression, dst_conditions)

    @classmethod
    def apply_overlay_water_gas_expense(cls, match_data, owl_docs):
        """

        Args:
            match_data:
            owl_docs:

        Returns:

        """
        original_rows_oil = match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.oil.value][
            EconEnum.other.value][EconEnum.rows.value]
        original_rows_water = match_data[EconEnum.econ_function.value][EconEnum.water_disposal.value][
            EconEnum.rows.value]
        match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.oil.value][EconEnum.other.value][
            EconEnum.rows.value] = sum_overlay_expense_rows(original_rows_oil, owl_docs)
        match_data[EconEnum.econ_function.value][EconEnum.water_disposal.value][
            EconEnum.rows.value] = sum_overlay_expense_rows(original_rows_water, owl_docs)

    @classmethod
    def extract_overlay_shrink_value(cls, expression, keyword, document):
        overlay_key = clean_overlay_keyword(keyword)
        accepted_matches = ACCEPTABLE_SHRINK_KEYWORDS_BY_PHASE.get(overlay_key)
        if accepted_matches is not None and clean_overlay_keyword(expression[-1]) in accepted_matches:
            shrinkage = aries_cc_round(float(expression[0]) * 100)
            document[EconEnum.econ_function.value][EconEnum.shrinkage.value][overlay_shrink_dict[overlay_key]][
                EconEnum.rows.value][0][EconEnum.pct_remaining.value] = shrinkage

    @classmethod
    def get_overlay_fixed_expense_category(cls, fixed_expense_assignment, key):
        """

        Args:
            fixed_expense_assignment:
            key:
        """
        dict_keys = []
        fixed_expense_name = FIXED_EXPENSE_OVERLAY_DICT.get(key)
        for dict_key in fixed_expense_assignment:
            if fixed_expense_name in fixed_expense_assignment[dict_key]:
                dict_keys.append(dict_key)
        return dict_keys

    @classmethod
    def apply_phase_multiplier_to_sev_tax(cls, document, phase, value):
        for row in document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value]:
            if any(key in row for key in [
                    PriceEnum.dollar_per_bbl.value, PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_month.value,
                    PriceEnum.pct_of_revenue.value
            ]):
                unit_keys = (key for key in [
                    PriceEnum.dollar_per_bbl.value, PriceEnum.dollar_per_mcf.value, PriceEnum.dollar_per_month.value,
                    PriceEnum.pct_of_revenue.value
                ] if key in row)
                for unit_key in unit_keys:
                    row[unit_key] *= value

    def apply_wi_to_sev_tax_and_update_phase(self, match_data, phase):
        self.sev_wi_calculation_phase.add(phase)

        if self.aries_data_extraction.filled_sev_tax_phase == self.sev_wi_calculation_phase:
            match_data[EconEnum.econ_function.value][EconEnum.sev_tax.value][EconEnum.calc.value] = 'wi'

    def apply_multiplier_overlay_gas_expense(self, keyword, param_document, first_key, data):
        """

        Args:
            keyword:
            param_document:
            first_key:
            data:
        """
        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get expense name from keyword (gathering, transport, etc.)
            expense_type = self.get_expense_name(keyword)
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data
            # modify model based on overlay

            value = match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][expense_type][
                EconEnum.deal_terms.value]
            match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][expense_type][
                EconEnum.deal_terms.value] = aries_cc_round(float(first_key) * float(value))

            if EconEnum.options.value in match_data:
                match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                    EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                        EconEnum.deal_terms.value] = aries_cc_round(float(first_key) * float(value))

    def apply_wi_overlay_gas_expense(self, operation, keyword, param_document, data, calc_type):
        """

        Args:
            operation:
            keyword:
            param_document:
            data:
            calc_type:
        """
        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get expense name from keyword (gathering, transport, etc.)
            expense_type = self.get_expense_name(keyword)
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data
            # get calculation_value (nri, wi, etc) from calc type gotten from preceeding function
            if calc_type == OverlayEnum.gross_gas.name:
                calc_value = EconEnum.w_interest.value
            elif calc_type == OverlayEnum.net_gas.name:
                calc_value = EconEnum.net_interest.value
            elif calc_type == OverlayEnum.wi.name and operation == OperatorEnum.divide.value:
                calc_value = EconEnum.hundred_wi.value

            if calc_value == EconEnum.w_interest.value:
                match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][expense_type][
                    EconEnum.shrinkage_condition.value] = EconEnum.unshrunk.value
                if match_data[EconEnum.options.value]:
                    match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                            EconEnum.shrinkage_condition.value][EconEnum.label.value] = 'Unshrunk'
                    match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                            EconEnum.shrinkage_condition.value][EconEnum.value.value] = EconEnum.unshrunk.value
            else:
                # modify model based on overlay
                match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][expense_type][
                    EconEnum.calc.value] = calc_value
                if match_data[EconEnum.options.value]:
                    match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][EconEnum.calc.value][
                            EconEnum.label.value] = CALC_VALUE_TO_OPTIONS_DICT[calc_value]
                    match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][EconEnum.calc.value][
                            EconEnum.value.value] = calc_value

    def apply_overlay_stream_prop(self, start_date: str, expression: list[str], keyword: str):
        """

        Args:
            start_date:
            expression:
            keyword:
        """
        param_document = self.overlay_yield_document
        data = self.expense_data_list_overlay
        get_default_format = self.aries_data_extraction.get_default_format
        error_report = self.aries_data_extraction.log_report

        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            match_data = param_document.get((self.property_id, self.scenario))
            if match_data is None:
                match_data = well_doc
                param_document[(self.property_id, self.scenario)] = match_data
            if keyword.lower() == PhaseEnum.ngl_yield.value or keyword.lower() == PhaseEnum.ngl.value:
                extract_yield_properties(start_date, expression, keyword, self.property_id, match_data, self.scenario,
                                         self.section, error_report, False, False)
            else:
                self.extract_overlay_shrink_value(expression, keyword, match_data)
        else:
            if (self.property_id, self.scenario) in param_document:
                document = param_document.get((self.property_id, self.scenario))
                if keyword.lower() == PhaseEnum.ngl_yield.value:
                    extract_yield_properties(start_date, expression, keyword, self.property_id, document, self.scenario,
                                             self.section, error_report, False, False)
                else:
                    self.extract_overlay_shrink_value(expression, keyword, document)
            else:
                document = get_default_format(EconEnum.stream_properties.value)
                if keyword.lower() == PhaseEnum.ngl_yield.value:
                    extract_yield_properties(start_date, expression, keyword, self.property_id, document, self.scenario,
                                             self.section, error_report, False, False)
                else:
                    self.extract_overlay_shrink_value(expression, keyword, document)
                # add new document to dictionary
                param_document[(self.property_id, self.scenario)] = document

    def apply_deduct_severance_tax_to_expense_category(self, dst_condition_category: Optional[str],
                                                       dst_condition_phase: Optional[str]):
        """

        Args:
            dst_condition_category:
            dst_condition_phase:
        """
        param_document = self.overlay_expense_document
        data = self.expense_data_list_overlay

        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)

        if well_doc is not None:
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data
            match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][dst_condition_phase][
                dst_condition_category][EconEnum.deduct_before_sev_tax.value] = 'yes'

            if match_data[EconEnum.options.value]:
                match_data[EconEnum.options.value][EconEnum.var_exp.value][dst_condition_phase][
                    EconEnum.sub_items.value][dst_condition_category][EconEnum.sub_items.value][
                        EconEnum.deduct_before_sev_tax.value][EconEnum.label.value] = 'Yes'

                match_data[EconEnum.options.value][EconEnum.var_exp.value][dst_condition_phase][
                    EconEnum.sub_items.value][dst_condition_category][EconEnum.sub_items.value][
                        EconEnum.deduct_before_sev_tax.value][EconEnum.value.value] = 'yes'

    def apply_owl_expense(self):
        """Applies OWL Expense
        """
        data = self.expense_data_list_overlay
        param_document = self.overlay_expense_document
        owl_docs = self.aries_data_extraction.owl_overlay

        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data
            # modify model based on overlay
            if owl_docs:
                self.apply_overlay_water_gas_expense(match_data, owl_docs)

    def apply_1_wi_expense_overlay(self, ls_expression: list[str]):
        """

        Args:
            ls_expression:
        """
        first_key = clean_overlay_keyword(ls_expression[0])
        keyword = self.fixed_expense_code[int(first_key)]

        param_document = self.overlay_expense_document
        expense_assignment = self.aries_data_extraction.expense_name_assignment
        data = self.expense_data_list_overlay

        keywords = [
            list(use_keyword)[-1] for use_keyword in expense_assignment.values()
            if len(use_keyword) > 0 and keyword in list(use_keyword)[-1]
        ]

        fixed_cost_names = []
        for keyword in keywords:
            fixed_cost_names.append(list(expense_assignment.keys())[list(expense_assignment.values()).index({keyword})])

        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data

            for fixed_cost_name in fixed_cost_names:
                # modify model based on overlay
                if match_data[EconEnum.options.value]:
                    match_data[EconEnum.options.value][EconEnum.fixed_expense.value][fixed_cost_name][
                        EconEnum.sub_items.value][EconEnum.calc.value][
                            EconEnum.label.value] = EconEnum.one_minus_wi.value
                    match_data[EconEnum.options.value][EconEnum.fixed_expense.value][fixed_cost_name][
                        EconEnum.sub_items.value][EconEnum.calc.value][
                            EconEnum.value.value] = EconEnum.one_minus_wi.name
                match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][fixed_cost_name][
                    EconEnum.calc.value] = EconEnum.one_minus_wi.name

    def load_overlay_forecast_override(self, expression: list[str]):
        """

        Args:
            expression:
        """
        # get phase (oil, gas, water, ngl) based on unit
        phase = self.get_phase_overlay_forecast_override(expression)

        param_document = self.overlay_acf_document
        get_default = self.aries_data_extraction.get_default_format

        if phase is not None:
            # if 3rd item is not equal to X, third item should be date
            if expression[3] != 'X':
                # get date
                try:
                    date = pd.to_datetime(expression[3]).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                except Exception:
                    date = None
                # if a valid date is returned, update date in 'actual vs forecast' document
                if date is not None:
                    # get model from parameter document if available
                    default_document = param_document.get((self.property_id, self.scenario))
                    if default_document is not None:
                        temp_dict = {EconEnum.date.value: date}
                        default_document[EconEnum.econ_function.value][EconEnum.prod_vs_fit_model.value][
                            EconEnum.replace_actual.value][phase] = temp_dict
                        default_document[EconEnum.econ_function.value][EconEnum.prod_vs_fit_model.value][
                            EconEnum.ignore_hist_prod.value] = 'no'
                    # if document does not exist in parameter document, create default model
                    else:
                        temp_dict = {EconEnum.date.value: date}
                        param_document[(self.property_id,
                                        self.scenario)] = get_default(EconEnum.actual_or_forecast.value)

                        param_document[(self.property_id, self.scenario)][EconEnum.econ_function.value][
                            EconEnum.prod_vs_fit_model.value][EconEnum.replace_actual.value][phase] = temp_dict

                        param_document[(self.property_id, self.scenario)][EconEnum.econ_function.value][
                            EconEnum.prod_vs_fit_model.value][EconEnum.ignore_hist_prod.value] = 'no'
            # however, if 3rd item in expression is X set phase in model to 'never'
            elif expression[3] == 'X':
                # get model from parameter document if available
                default_document = param_document.get((self.property_id, self.scenario))
                if default_document:
                    temp_dict = {EconEnum.never.value: ""}
                    default_document[EconEnum.econ_function.value][EconEnum.prod_vs_fit_model.value][
                        EconEnum.replace_actual.value][phase] = temp_dict
                    default_document[EconEnum.econ_function.value][EconEnum.prod_vs_fit_model.value][
                        EconEnum.ignore_hist_prod.value] = 'no'
                # if document does not exist in parameter document, create default model
                else:
                    temp_dict = {EconEnum.never.value: ""}
                    param_document[(self.property_id, self.scenario)] = get_default(EconEnum.actual_or_forecast.value)
                    param_document[(self.property_id, self.scenario)][EconEnum.econ_function.value][
                        EconEnum.prod_vs_fit_model.value][EconEnum.replace_actual.value][phase] = temp_dict
                    param_document[(self.property_id, self.scenario)][EconEnum.econ_function.value][
                        EconEnum.prod_vs_fit_model.value][EconEnum.ignore_hist_prod.value] = 'no'

    def apply_workover_overlay(self, expression: list[str]):
        """

        Args:
            expression:
        """
        param_document = self.overlay_expense_document
        data = self.expense_data_list_overlay
        fixed_expense_assignment = self.aries_data_extraction.expense_name_assignment

        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            first_key = clean_overlay_keyword(expression[0])
            last_key = clean_overlay_keyword(expression[-1])
            try:
                first_key = aries_cc_round(float(first_key))
            except ValueError:
                first_key = None
            first_key = first_key if not str(expression[0]).startswith('S/') else None
            if last_key in OPC_WELL_PHASE_DICT and first_key is not None:
                workover_category = self.get_workover_expense_category(well_doc)
                fixed_expense_value = self.get_opc_value_for_workover(well_doc, fixed_expense_assignment, last_key)
                if workover_category is not None and fixed_expense_value is not None:
                    # get model if stored in parameter document
                    match_data = param_document.get((self.property_id, self.scenario))
                    # if no matching data in parameter document, use the original model (well_doc)
                    if match_data is None:
                        match_data = well_doc
                        # store model in parameter document
                        param_document[(self.property_id, self.scenario)] = match_data
                    match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][workover_category][
                        EconEnum.rows.value] = fixed_expense_value
                    value = match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][workover_category][
                        EconEnum.deal_terms.value]
                    match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][workover_category][
                        EconEnum.deal_terms.value] = aries_cc_round(float(first_key) * float(value))
                    if match_data[EconEnum.options.value]:
                        match_data[EconEnum.options.value][EconEnum.fixed_expense.value][workover_category][
                            EconEnum.sub_items.value][EconEnum.deal_terms.value] = float(first_key) * float(value)

    def apply_fixed_expense_overlay(self, value, first_key, last_key, operation, param_document, data,
                                    expense_name_assignment):
        """

        Args:
            value:
            first_key:
            last_key:
            operation:
            param_document:
            data:
            expense_name_assignment:
        """
        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get expense name from keyword (gathering, transport, etc.)
            fixed_expense_categories = self.get_overlay_fixed_expense_category(expense_name_assignment, first_key)
            if len(fixed_expense_categories) == 0:
                fixed_expense_categories = self.get_overlay_fixed_expense_category(expense_name_assignment, last_key)
            if len(fixed_expense_categories) > 0:
                if last_key == OverlayEnum.wi.value:
                    if operation == OperatorEnum.divide.value:
                        calc_value = EconEnum.hundred_wi.value
                    elif operation == OperatorEnum.multiply.value:
                        calc_value = EconEnum.w_interest.value
                elif last_key == OverlayEnum.nri.value:
                    if operation == OperatorEnum.multiply.value:
                        calc_value = EconEnum.net_interest.value
                # get model if stored in parameter document
                match_data = param_document.get((self.property_id, self.scenario))
                # if no matching data in parameter document, use the original model (well_doc)
                if match_data is None:
                    match_data = well_doc
                    # store model in parameter document
                    param_document[(self.property_id, self.scenario)] = match_data
                # modify model based on overlay
                for fixed_expense_category in fixed_expense_categories:
                    if value is not None:
                        mul_value = match_data[EconEnum.econ_function.value][
                            EconEnum.fixed_expense.value][fixed_expense_category][EconEnum.deal_terms.value]
                        match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][fixed_expense_category][
                            EconEnum.deal_terms.value] = aries_cc_round(float(value) * float(mul_value))
                        if match_data[EconEnum.options.value]:
                            match_data[EconEnum.options.value][EconEnum.fixed_expense.value][fixed_expense_category][
                                EconEnum.sub_items.value][EconEnum.deal_terms.value] = aries_cc_round(
                                    float(value) * float(mul_value))
                    else:
                        match_data[EconEnum.econ_function.value][EconEnum.fixed_expense.value][fixed_expense_category][
                            EconEnum.calc.value] = calc_value
                        if match_data[EconEnum.options.value]:
                            match_data[EconEnum.options.value][EconEnum.fixed_expense.value][fixed_expense_category][
                                EconEnum.sub_items.value][EconEnum.calc.value][
                                    EconEnum.label.value] = CALC_VALUE_TO_OPTIONS_DICT[calc_value]
                            match_data[EconEnum.options.value][EconEnum.fixed_expense.value][fixed_expense_category][
                                EconEnum.sub_items.value][EconEnum.calc.value][EconEnum.value.value] = calc_value

    def apply_overlay_liquid_multiplier_expense(  # noqa (C901)
            self, start_date, keyword, first_key_value, expression, param_document, data, wells_dic, as_of_date):
        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get expense name from keyword (gathering, transport, etc.)
            expense_type = self.get_expense_name(keyword)
            # get model if stored in parameter document
            if expense_type is not None:
                match_data = param_document.get((self.property_id, self.scenario))
                # if no matching data in parameter document, use the original model (well_doc)
                if match_data is None:
                    match_data = well_doc
                    # store model in parameter document
                    param_document[(self.property_id, self.scenario)] = match_data
                # liquid list (oil and ngl)
                phases = self.get_phase_for_liquid_expense_overlay(keyword)
                # modify model based on overlay
                try:
                    last_two = f'{expression[-2]} {expression[-1]}'
                except IndexError:
                    last_two = None
                shrink = False
                for phase in phases:
                    last_key = clean_overlay_keyword(expression[-1])
                    if last_key in OVERLAY_OWNERSHIP_DICT:
                        ownership_type = OVERLAY_OWNERSHIP_DICT.get(last_key)
                        if ownership_type == EconEnum.w_interest.value and OperatorEnum.divide.value in str(last_two):
                            ownership_type = EconEnum.hundred_wi.value
                        if last_key in [OverlayEnum.net_oil.value, OverlayEnum.net_gas.value]:
                            shrink = True
                        match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][expense_type][
                            EconEnum.calc.value] = ownership_type
                        if match_data[EconEnum.options.value]:
                            match_data[EconEnum.options.value][EconEnum.var_exp.value][phase][
                                EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][EconEnum.calc.value][
                                    EconEnum.label.value] = CALC_VALUE_TO_OPTIONS_DICT[ownership_type]
                            match_data[EconEnum.options.value][EconEnum.var_exp.value][phase][
                                EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][EconEnum.calc.value][
                                    EconEnum.value.value] = ownership_type
                        if shrink:
                            if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value]:
                                match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][expense_type][
                                    EconEnum.shrinkage_condition.value] = EconEnum.shrunk.value
                                if match_data[EconEnum.options.value]:
                                    match_data[EconEnum.options.value][EconEnum.var_exp.value][phase][
                                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                                            EconEnum.shrinkage_condition.value][EconEnum.label.value] = 'Shrunk'
                                    match_data[EconEnum.options.value][EconEnum.var_exp.value][phase][
                                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                                            EconEnum.shrinkage_condition.value][
                                                EconEnum.value.value] = EconEnum.shrunk.value

                    if first_key_value is not None and (last_two == f'{OperatorEnum.multiply.value} {keyword}'
                                                        or last_two == f'{OperatorEnum.multiply.value} S/{keyword}'):
                        value = match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][expense_type][
                            EconEnum.deal_terms.value]
                        match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][expense_type][
                            EconEnum.deal_terms.value] = float(first_key_value) * float(value)

                        if match_data[EconEnum.options.value]:
                            match_data[EconEnum.options.value][EconEnum.var_exp.value][phase][
                                EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                                    EconEnum.deal_terms.value] = float(first_key_value) * float(value)
                    elif first_key_value is not None and keyword == OverlayEnum.gtc_lqd.value:
                        rows = copy.deepcopy(match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase]
                                             [expense_type][EconEnum.rows.value])
                        use_fpd, use_asof = check_if_use_fpd_asof(start_date, wells_dic, as_of_date, self.property_id)
                        if use_fpd or use_asof:
                            if use_fpd:
                                offset_type = EconEnum.fpd_offset.value
                            else:
                                offset_type = EconEnum.asof_offset.value
                            overlay_row = [{
                                EconEnum.cap.value: '',
                                offset_type: {
                                    CCSchemaEnum.start.value: 1,
                                    CCSchemaEnum.end.value: EconEnum.econ_limit.value,
                                    EconEnum.period.value: MAX_ALLOWABLE_MONTHS
                                },
                                PriceEnum.dollar_per_bbl.value: first_key_value
                            }]
                        else:
                            overlay_row = [{
                                EconEnum.cap.value: '',
                                CCSchemaEnum.dates.value: {
                                    CCSchemaEnum.start_date.value:
                                    pd.to_datetime(start_date).strftime(CCSchemaEnum.ymd_date_dash_format.value),
                                    CCSchemaEnum.end_date.value:
                                    EconEnum.econ_limit.value
                                },
                                PriceEnum.dollar_per_bbl.value: first_key_value
                            }]
                        if len(rows) > 1:
                            overlay_row = rows + overlay_row
                            overlay_row = sum_rows(overlay_row)
                        # new_rows = sum_overlay_expense_rows(rows, overlay_row)
                        match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][expense_type][
                            EconEnum.rows.value] = overlay_row

    def apply_overlay_liquid_expense(self, start_date, keyword, expression):
        """

        Args:
            start_date:
            keyword:
            expression:
        """
        param_document = self.overlay_expense_document
        data = self.expense_data_list_overlay
        expense_name_assignment = self.aries_data_extraction.expense_name_assignment
        wells_dic = self.aries_data_extraction.wells_dic
        as_of_date = self.aries_data_extraction.as_of_date

        # match appraised key with initial key
        if keyword in APPRAISED_LIQUID_EXPENSE_CONV_DICT:
            keyword = APPRAISED_LIQUID_EXPENSE_CONV_DICT.get(keyword)
        # get first and last key
        first_key = clean_overlay_keyword(expression[0])
        last_key = clean_overlay_keyword(expression[-1])
        try:
            value = float(expression[0])
        except ValueError:
            value = None
        try:
            date_unit = expression[4]
        except IndexError:
            date_unit = None
        try:
            operation = expression[-2]
        except IndexError:
            operation = None
        # expense type is gotten from first key or keyword and calculation type is gotten from second key
        if date_unit == UnitEnum.life.value and any(
                sign in expression for sign in [OperatorEnum.divide.value, OperatorEnum.multiply.value]):
            if (first_key in FIXED_EXPENSE_OVERLAY_DICT and last_key in OVERLAY_OWNERSHIP_DICT) or (
                    value is not None and (last_key == OverlayEnum.opc_oil_gas_well.value or
                                           (last_key == keyword and last_key in FIXED_EXPENSE_OVERLAY_DICT))):
                self.apply_fixed_expense_overlay(value, first_key, last_key, operation, param_document, data,
                                                 expense_name_assignment)
            elif ((first_key == keyword and last_key in OVERLAY_OWNERSHIP_DICT)
                  or (value is not None and (last_key in OVERLAY_OWNERSHIP_DICT or last_key == keyword))):
                self.apply_overlay_liquid_multiplier_expense(start_date, keyword, value, expression, param_document,
                                                             data, wells_dic, as_of_date)

    def apply_multiplier_across_gas_expense(self, param_document, first_key, data):
        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data
            # loop through all expense type
            for expense_type in variable_expenses_category:
                # modify model based on overlay
                value = match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][
                    PhaseEnum.gas.value][expense_type][EconEnum.deal_terms.value]
                match_data[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][expense_type][
                    EconEnum.deal_terms.value] = aries_cc_round(float(first_key) * float(value))

                if match_data[EconEnum.options.value]:
                    match_data[EconEnum.options.value][EconEnum.var_exp.value][PhaseEnum.gas.value][
                        EconEnum.sub_items.value][expense_type][EconEnum.sub_items.value][
                            EconEnum.deal_terms.value] = aries_cc_round(float(first_key) * float(value))

    def apply_overlay_gas_expense(self, keyword, expression):
        """

        Args:
            keyword:
            expression:
        """
        first_key = clean_overlay_keyword(expression[0])
        last_key = clean_overlay_keyword(expression[-1])

        param_document = self.overlay_expense_document
        data = self.expense_data_list_overlay

        try:
            value = float(first_key)
        except ValueError:
            value = None

        value = value if not str(expression[0]).startswith('S/') else None

        # expense type is gotten from first key and calculation type is gotten from second key
        if ((first_key in self.initial_gas_expense_keys and last_key in self.expense_overlay_multipliers)
                or (last_key in self.initial_gas_expense_keys and first_key in self.expense_overlay_multipliers)):
            calc_type = self.expense_overlay_multipliers.get(last_key)
            if calc_type is None:
                calc_type = self.expense_overlay_multipliers.get(first_key)
            if calc_type is not None:
                try:
                    operation = expression[-2]
                except IndexError:
                    operation = None
                self.apply_wi_overlay_gas_expense(operation, keyword, param_document, data, calc_type)
        # if last key is same as keyword a multiplier should be added to the corresponding expense type
        elif last_key == keyword and value is not None:
            self.apply_multiplier_overlay_gas_expense(keyword, param_document, value, data)
        elif keyword == OverlayEnum.all_gas_net.value and last_key == OverlayEnum.net_gas.value:
            self.apply_multiplier_across_gas_expense(param_document, expression[0], data)

    def process_sev_tax_stream(self, ls_expression, keyword):
        """

        Args:
            ls_expression:
            keyword:
        """
        param_document = self.overlay_tax_document
        data = self.tax_data_list_overlay

        try:
            unit = str(ls_expression[4]).strip()
        except IndexError:
            unit = None
        if unit is not None:
            first_key = str(ls_expression[0]).strip()
            last_key = str(ls_expression[-1]).strip()
            first_last = frozenset({clean_overlay_keyword(first_key), clean_overlay_keyword(last_key)})

            if unit == UnitEnum.life.value:
                if (last_key == str(keyword).strip() or last_key == str(keyword.split('/')[-1]).strip()):
                    try:
                        value = aries_cc_round(float(first_key))
                        if ls_expression[2] == UnitEnum.perc_sign.value:
                            value /= 100
                    except (ValueError, IndexError):
                        value = None
                    if value is not None:
                        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
                        if well_doc is not None:
                            match_data = param_document.get((self.property_id, self.scenario), well_doc)
                            param_document[(self.property_id, self.scenario)] = match_data
                            self.apply_phase_multiplier_to_sev_tax(match_data, CC_ARIES_OVERLAY_SEV_TAX_DIC[keyword],
                                                                   value)
                elif first_last in self.sev_tax_wi_phase_dict or first_last in self.sev_tax_wi_general_dict:
                    phase = self.sev_tax_wi_phase_dict.get(first_last)
                    if phase is None:
                        phase = self.sev_tax_wi_general_dict.get(first_last)
                    well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
                    if well_doc is not None:
                        match_data = param_document.get((self.property_id, self.scenario), well_doc)
                        param_document[(self.property_id, self.scenario)] = match_data

                        self.apply_wi_to_sev_tax_and_update_phase(match_data, phase)

    def apply_overlay_1064(self, economic_row: Economic):
        """Processing overlay with keyword 1064:
           Check for presence of stream 861 indicating deduct sev tax = no.
           If first value in expression is a number, replace all existing ad val tax values to that number.
           Multiple lines of 1064 currently not supported.

        Args:
            expression_list (_type_): Current Aries expression being processed split by spaces
        """
        param_document = self.overlay_tax_document
        data = self.tax_data_list_overlay

        # get model document that matches the well and scenario
        well_doc = get_well_doc_overlay(data, self.property_id, self.ls_scenarios_id)
        if well_doc is not None:
            # get model if stored in parameter document
            match_data = param_document.get((self.property_id, self.scenario))
            # if no matching data in parameter document, use the original model (well_doc)
            if match_data is None:
                match_data = well_doc
            # modify model based on overlay

            try:
                first_key = clean_overlay_keyword(economic_row.ls_expression[0])
                last_key = clean_overlay_keyword(economic_row.ls_expression[-1])
                operator = clean_overlay_keyword(economic_row.ls_expression[-2])
            except IndexError:
                first_key, last_key, operator = None, None, None

            try:
                first_value = float(economic_row.ls_expression[0])
            except ValueError:
                first_value = None

            if first_key == '861' or last_key == '861':
                has_861 = True
            else:
                has_861 = False

            if has_861 and operator == 'MUL':
                in_last_item = True if last_key == '861' else False

                # Presence of stream 861 indicates deduct severance tax = No
                match_data[EconEnum.econ_function.value][EconEnum.adval_tax.value][
                    EconEnum.deduct_sev_tax.value] = ExpressionEnum.no.value

                # If value is a number instead of stream 861, use value to override all Ad Val tax values
                # Only check for number in first value since 2nd must always be a stream
                if in_last_item and first_value is not None and first_value < self.ARIES_VALUE_LIMIT_FOR_OVERLAY:
                    value = first_value
                    value = aries_cc_round(value * 100)

                    for row in match_data['econ_function']['ad_valorem_tax']['rows']:
                        row['pct_of_revenue'] = value

                # store model in parameter document
                param_document[(self.property_id, self.scenario)] = match_data

    def process_stream_multiplier_overlay(self, start_date, expression, overlay_key, template_document):
        """

        Args:
            start_date:
            expression:
            overlay_key:
            template_document:
        """
        param_document = self.overlay_risk_document
        data_ls = self.risking_data_list_overlay
        stream_properties_data = self.stream_properties_data_list_overlay
        yield_param_document = self.overlay_yield_document
        get_default = self.aries_data_extraction.get_default_format

        last_key = clean_overlay_keyword(expression[-1])
        # get unit from expression
        use_shrunk_gas = False

        shrunk_gas_count = self.aries_data_extraction.shrunk_gas_count

        if last_key == OverlayEnum.sales_ngl.value:
            stream_properties_default_document = yield_param_document.get((self.property_id, self.scenario))
            if stream_properties_default_document is None:
                stream_properties_default_document = get_well_doc_overlay(stream_properties_data, self.property_id,
                                                                          self.ls_scenarios_id)
            try:
                shrink = float(
                    stream_properties_default_document[EconEnum.econ_function.value][EconEnum.shrinkage.value][
                        PhaseEnum.gas.value][EconEnum.rows.value][shrunk_gas_count][EconEnum.pct_remaining.value])
            except Exception:
                shrink = 0
            value = aries_cc_round(float(expression[0]) * 100)
            use_shrunk_gas = True if shrink == value else False

        if use_shrunk_gas:
            rows_length = len(stream_properties_default_document[EconEnum.econ_function.value][EconEnum.yields.value][
                PhaseEnum.ngl.value][EconEnum.rows.value])
            if shrunk_gas_count < rows_length:
                stream_properties_default_document[EconEnum.econ_function.value][EconEnum.yields.value][
                    PhaseEnum.ngl.value][EconEnum.rows.value][shrunk_gas_count].pop(EconEnum.unshrunk_gas.value)

                stream_properties_default_document[EconEnum.econ_function.value][EconEnum.yields.value][
                    PhaseEnum.ngl.value][EconEnum.rows.value][shrunk_gas_count][
                        EconEnum.shrunk_gas.value] = ForecastEnum.shrunk_gas.value

                yield_param_document[(self.property_id, self.scenario)] = stream_properties_default_document
                self.aries_data_extraction.shrunk_gas_count += 1
        else:
            # get phase (oil, gas, water, ngl) based on overlay_key
            phase = overlay_phase_dic.get(overlay_key)
            # get model if stored in parameter document and update model
            risking_default_document = param_document.get((self.property_id, self.scenario))
            if str_join(expression[5:6]) == 'MUL' and last_key == overlay_key:
                if risking_default_document is not None:
                    risk_obj = extract_yield_properties(start_date,
                                                        expression,
                                                        overlay_key,
                                                        self.property_id,
                                                        template_document,
                                                        self.scenario,
                                                        9,
                                                        self.aries_data_extraction.error_report,
                                                        False,
                                                        False,
                                                        shrink=False,
                                                        risk=True,
                                                        risk_overlay=True)
                    # Store risk object if object is given from extract_yield_properties
                    if risk_obj is not None:
                        copy_risk_rows = copy_rows(risking_default_document[EconEnum.econ_function.value][
                            EconEnum.risk_model.value][phase][EconEnum.rows.value])
                        # remove default risk object
                        if len(copy_risk_rows):
                            if (copy_risk_rows[0][EconEnum.multiplier.value] == 100
                                    and EconEnum.entire_well_life.value in copy_risk_rows[0]):
                                copy_risk_rows.pop(0)

                        template_document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                            EconEnum.rows.value].append(risk_obj)
                        copy_risk_rows.insert(0, risk_obj)

                        new_risk_rows = sum_rows(copy_risk_rows, risk=True, risk_overlay=True)
                        risking_default_document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                            EconEnum.rows.value] = new_risk_rows
                # otherwise create default model and update
                else:
                    risking_default_document = get_well_doc_overlay(data_ls, self.property_id, self.ls_scenarios_id)
                    if risking_default_document is None:
                        risking_default_document = get_default(EconEnum.risk.value)
                        risking_default_document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                            EconEnum.rows.value].pop(0)
                    risk_obj = extract_yield_properties(start_date,
                                                        expression,
                                                        overlay_key,
                                                        self.property_id,
                                                        template_document,
                                                        self.scenario,
                                                        9,
                                                        self.aries_data_extraction.error_report,
                                                        False,
                                                        False,
                                                        shrink=False,
                                                        risk=True,
                                                        risk_overlay=True)
                    # Store risk object if object is given from extract_yield_properties
                    if risk_obj is not None:
                        copy_risk_rows = copy_rows(risking_default_document[EconEnum.econ_function.value][
                            EconEnum.risk_model.value][phase][EconEnum.rows.value])

                        template_document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                            EconEnum.rows.value].append(risk_obj)

                        copy_risk_rows.insert(0, risk_obj)
                        new_risk_rows = sum_rows(copy_risk_rows, risk=True, risk_overlay=True)
                        risking_default_document[EconEnum.econ_function.value][EconEnum.risk_model.value][phase][
                            EconEnum.rows.value] = new_risk_rows
                        param_document[(self.property_id, self.scenario)] = risking_default_document

    def process_price_model_multiplier(self, ls_expression, keyword, start_date):
        """

        Args:
            ls_expression:
            keyword:
            start_date:
        """
        try:
            unit = str(ls_expression[4]).strip()
        except IndexError:
            unit = None
        if unit is not None:
            overlay_key = (self.property_id, self.scenario)

            if unit == UnitEnum.life.value and (str(ls_expression[-1]).strip() == str(keyword).strip() or str(
                    ls_expression[-1]).strip() == str(keyword).split('/')[-1].strip()):
                try:
                    value = aries_cc_round(float(ls_expression[0])) * 100
                except (ValueError, IndexError):
                    value = None
                if value is not None:
                    phase = CC_ARIES_OVERLAY_PRICE_DICT[keyword]
                    differential_well_doc = get_well_doc_overlay(self.differential_data_list_overlay, self.property_id,
                                                                 self.ls_scenarios_id)
                    if differential_well_doc is None:
                        differential_well_doc = self.aries_data_extraction.get_default_format(
                            EconEnum.differentials.value)

                        match_data = differential_well_doc
                        self.overlay_differential_document[overlay_key] = match_data
                        self.apply_perc_differential_overlay(match_data, value, start_date, phase)
                    else:
                        match_data = self.overlay_differential_document.get(overlay_key)
                        if match_data is None:
                            match_data = differential_well_doc
                            self.overlay_differential_document[overlay_key] = match_data
                        use_differential = self.check_differential_doc_overlay(
                            differential_well_doc, phase, self.aries_data_extraction.get_default_format)

                    if use_differential:
                        self.apply_perc_differential_overlay(match_data, value, start_date, phase)
                    else:
                        if value is not None:
                            well_doc = get_well_doc_overlay(self.price_data_list_overlay, self.property_id,
                                                            self.ls_scenarios_id)
                            if well_doc is not None:
                                match_data = self.overlay_price_document.get(overlay_key)
                                if match_data is None:
                                    match_data = well_doc
                                    self.overlay_price_document[overlay_key] = match_data
                                self.apply_phase_multiplier_to_price(match_data, phase, value)

    def convert_document_to_list(self, document, ids, property_id, scenario, data):
        """

        Args:
            document:
            ids:
            property_id:
            scenario:
            data:
        """
        scenarios_dic = self.aries_data_extraction.scenarios_dic
        project_dic = self.aries_data_extraction.projects_dic
        compare_and_save_data_list = self.aries_data_extraction.compare_and_save_into_self_data_list

        if document is not None:
            # create wells set
            document[CCSchemaEnum.wells.value] = set()
            # if document name is not empty and not an initial overlay model and 'OL_1' to name
            if document[CCSchemaEnum.name.value] and 'OL' not in document[CCSchemaEnum.name.value]:
                document[CCSchemaEnum.name.value] = document[CCSchemaEnum.name.value] + '_OL_0001'
            # else if document name is empty (risking and actual vs forecast)
            # create name based on assumption key and 'OL_1'
            elif not document[CCSchemaEnum.name.value]:
                document[
                    CCSchemaEnum.name.value] = f'ARIES_CC_{document[CCSchemaEnum.assumption_key.value].upper()}_OL_0001'
            # save into data list
            for _id in ids:
                if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                    document[CCSchemaEnum.wells.value].add((_id, property_id))

            compare_and_save_data_list(document, data, project_dic, aries=True)

    def process_overlay(self, start_date: str, economic_row: Economic, overlay_key: str, dst_conditions: DSTConditions,
                        template_risk_document: dict):
        """

        Args:
            start_date:
            economic_row:
            overlay_key:
            dst_conditions:
            template_risk_document:
        """
        keyword = economic_row.keyword

        if overlay_key == OverlayEnum.load.value:
            # apply load keyword (forecast override)
            self.load_overlay_forecast_override(economic_row.ls_expression)
        elif dst_conditions.validate_conditions():
            self.apply_deduct_severance_tax_to_expense_category(dst_conditions.condition_category,
                                                                dst_conditions.condition_phase)

            # Reset conditions to default
            dst_conditions.reset_conditions()

        elif (keyword.lower() == PhaseEnum.ngl_yield.value or keyword.lower() == PhaseEnum.ngl.value
              or overlay_key in overlay_shrink_dict):
            # apply yield
            self.apply_overlay_stream_prop(start_date, economic_row.ls_expression, economic_row.keyword)

        elif overlay_key == OverlayEnum.workover_exp.value:
            # apply workover expense from oil and/or gas operating (opc) expense
            self.apply_workover_overlay(economic_row.ls_expression)

        elif overlay_key in overlay_liquid_expense_keys + list((FIXED_EXPENSE_OVERLAY_DICT.keys())):
            # apply overlay to liquid expense
            self.apply_overlay_liquid_expense(start_date, overlay_key, economic_row.ls_expression)

        elif overlay_key in overlay_gas_expense_keys:
            # apply overlay to expense (transportation, gathering, etc.)
            self.apply_overlay_gas_expense(overlay_key, economic_row.ls_expression)

        elif keyword in CC_ARIES_OVERLAY_SEV_TAX_DIC:
            self.process_sev_tax_stream(economic_row.ls_expression, keyword)

        elif overlay_key == OverlayEnum.adval_tax_wi.value:
            # apply overlay to ad valorem
            self.apply_overlay_1064(economic_row)

        elif overlay_key in overlay_phase_dic:
            # add multiplier to gross stream using risking model
            self.process_stream_multiplier_overlay(start_date, economic_row.ls_expression, overlay_key,
                                                   template_risk_document)
        elif keyword in CC_ARIES_OVERLAY_PRICE_DICT:
            # handles multiplier
            self.process_price_model_multiplier(economic_row.ls_expression, keyword, start_date)

        else:
            if self.section == EconHeaderEnum.overlay_section_key.value:
                message = format_error_msg(ErrorMsgEnum.cc_error_msg.value, keyword)

                self.error_log(str_join(economic_row.ls_expression),
                               message,
                               self.section,
                               model=self.__class__.__name__)

    def build_overlay_docs(self) -> list[tuple]:
        """

        Returns:
            A list of tuple like the following (document: dict, data_list: list).
        """
        # get overlay expense document
        expense_document = self.overlay_expense_document.get((self.property_id, self.scenario))
        # get overlay tax document
        tax_document = self.overlay_tax_document.get((self.property_id, self.scenario))
        # get overlay price document
        price_document = self.overlay_price_document.get((self.property_id, self.scenario))
        # get overlay differential document
        differential_document = self.overlay_differential_document.get((self.property_id, self.scenario))
        # get overlay yield document
        yield_document = self.overlay_yield_document.get((self.property_id, self.scenario))
        # get overlay actual vs forecast document
        acf_document = self.overlay_acf_document.get((self.property_id, self.scenario))
        # get overlay risking document
        risk_document = self.overlay_risk_document.get((self.property_id, self.scenario))

        # delete well and scenario from model where it existed
        check_and_remove_well_from_previous_model(self.expense_data_list_overlay, self.overlay_expense_document,
                                                  self.property_id, self.scenario, self.ls_scenarios_id)

        check_and_remove_well_from_previous_model(self.tax_data_list_overlay, self.overlay_tax_document,
                                                  self.property_id, self.scenario, self.ls_scenarios_id)

        check_and_remove_well_from_previous_model(self.stream_properties_data_list_overlay, self.overlay_yield_document,
                                                  self.property_id, self.scenario, self.ls_scenarios_id)

        check_and_remove_well_from_previous_model(self.price_data_list_overlay, self.overlay_price_document,
                                                  self.property_id, self.scenario, self.ls_scenarios_id)

        check_and_remove_well_from_previous_model(self.differential_data_list_overlay,
                                                  self.overlay_differential_document, self.property_id, self.scenario,
                                                  self.ls_scenarios_id)

        return [(tax_document, self.tax_data_list_overlay), (expense_document, self.expense_data_list_overlay),
                (acf_document, self.actual_forecast_data_list_overlay), (risk_document, self.risking_data_list_overlay),
                (yield_document, self.stream_properties_data_list_overlay),
                (price_document, self.price_data_list_overlay),
                (differential_document, self.differential_data_list_overlay)]

    def model_extraction(self,
                         section_economic_df,
                         header_cols,
                         ls_scenarios_id,
                         scenario,
                         property_id,
                         index,
                         elt=False):

        self.expense_data_list_overlay = (self.aries_data_extraction.elt_expense_data_list
                                          if elt else self.aries_data_extraction.expense_data_list)
        self.tax_data_list_overlay = ([] if elt else self.aries_data_extraction.tax_data_list)
        self.actual_forecast_data_list_overlay = ([] if elt else self.aries_data_extraction.actual_forecast_data_list)
        self.risking_data_list_overlay = ([] if elt else self.aries_data_extraction.risking_data_list)
        self.stream_properties_data_list_overlay = ([]
                                                    if elt else self.aries_data_extraction.stream_properties_data_list)
        self.price_data_list_overlay = ([] if elt else self.aries_data_extraction.price_data_list)
        self.differential_data_list_overlay = ([] if elt else self.aries_data_extraction.differential_data_list)

        self.overlay_expense_document = {} if elt else self.aries_data_extraction.overlay_expense_param
        self.overlay_tax_document = {} if elt else self.aries_data_extraction.overlay_tax_param
        self.overlay_price_document = {} if elt else self.aries_data_extraction.overlay_price_param
        self.overlay_differential_document = {} if elt else self.aries_data_extraction.overlay_differential_param
        self.overlay_yield_document = {} if elt else self.aries_data_extraction.overlay_yield_param
        self.overlay_acf_document = {} if elt else self.aries_data_extraction.actual_vs_forecast_param
        self.overlay_risk_document = {} if elt else self.aries_data_extraction.risking_params

        self.ls_scenarios_id = ls_scenarios_id
        self.scenario = scenario
        self.property_id = property_id
        self.header_cols = header_cols
        self.sev_wi_calculation_phase = set()

        start_date = format_start_date(self.aries_data_extraction.dates_1_base_date,
                                       self.aries_data_extraction.dates_1_base_date,
                                       format=True)
        overlay_wi_keyword = None

        self.aries_data_extraction.shrunk_gas_count = 0

        ignore_list = ['START', 'TEXT', 'ERROR']

        dst_conditions = DSTConditions()

        template_risk_document = self.aries_data_extraction.get_default_format(EconEnum.risk.value)

        section_economic_df = pd.DataFrame(section_economic_df, columns=header_cols)

        for _, value in section_economic_df.iterrows():
            economic_row = Economic(keyword=value[EconHeaderEnum.keyword.value],
                                    propnum=value[EconHeaderEnum.propnum.value],
                                    original_keyword=value[EconHeaderEnum.initial_keyword.value],
                                    section=value[EconHeaderEnum.section.value],
                                    qualifier=value[EconHeaderEnum.qualifier.value],
                                    expression=value[EconHeaderEnum.expression.value],
                                    sequence=value[EconHeaderEnum.sequence.value])

            keyword = economic_row.keyword
            expression = economic_row.expression
            self.section = economic_row.section

            if str(keyword).strip().upper() in ignore_list or keyword.startswith('*'):
                continue

            if keyword in KEYWORD_OVERLAY_CONV_DICT:
                economic_row.keyword = KEYWORD_OVERLAY_CONV_DICT[keyword]
            try:
                economic_row.ls_expression = self.build_ls_expression(expression,
                                                                      self.section,
                                                                      keyword,
                                                                      model=self.__class__.__name__)

                # cleans keywords (e.g. S/687 ==> 687)
                overlay_key = clean_overlay_keyword(economic_row.keyword)
                if expression == '1 X FRAC TO LIFE MINUS 95':
                    overlay_wi_keyword = overlay_key

                dst_conditions = self.check_for_dst_condition(economic_row.keyword, economic_row.ls_expression,
                                                              dst_conditions)

                if expression == 'S/370 X FRAC TO LIFE PLUS 376':
                    self.apply_owl_expense()

                elif economic_row.ls_expression[-2] == 'MUL' and economic_row.ls_expression[-1] == overlay_wi_keyword:
                    # apply 1-WI Overlay
                    self.apply_1_wi_expense_overlay(economic_row.ls_expression)

                elif overlay_key is not None:
                    if overlay_key in [OverlayEnum.opc_oil_wi.value, OverlayEnum.tran_oil_wi.value]:
                        if set_oil_unshrunk(economic_row.ls_expression):
                            continue

                    self.process_overlay(start_date, economic_row, overlay_key, dst_conditions, template_risk_document)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class5_msg.value, ErrorMsgEnum.overlay_param.value, property_id,
                                           scenario)

                self.error_log(expression, message, self.section, model=self.__class__.__name__)

        overlay_docs = self.build_overlay_docs()

        idx = 0
        for document, data_list in overlay_docs:
            # convert document and append to list
            if elt and idx == 1:
                return document
            self.convert_document_to_list(document, ls_scenarios_id, property_id, scenario, data_list)
            idx += 1
