import copy
import datetime
from typing import List, Dict, Optional

import pandas as pd

from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
from api.aries_phdwin_imports.aries_data_extraction.dataclasses.pricing import PriceConditionals, PricingValues
from api.aries_phdwin_imports.aries_import_helpers import (
    get_differential_last_segment, str_join, not_first_price_obj, convert_str_date_to_datetime_format,
    process_list_start_date_and_get_end_date, validate_ngl_price_document, CC_ARIES_OVERLAY_PRICE_DICT,
    stop_at_first_price_model, DEFAULT_PRICE_OBJ, DEFAULT_DIFFERENTIAL_OBJ, process_irregular_price_expression,
    compare_cap_and_value, get_model_name_from_qualifiers, check_if_more_than_one_element,
    set_price_start_date_to_base_date, set_diff_start_date_to_base_date)
from api.aries_phdwin_imports.combine_rows import (shift_datetime_date, aries_cc_round, combine_price_rows,
                                                   combine_differential_rows)
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.helpers import (
    get_price_unit_of_last_segment, MAX_ALLOWABLE_MONTHS, check_for_inconsistent_date, format_aries_segment_date,
    update_fpd_asof_date, get_day_month_from_decimal_date, get_day_month_year_from_decimal_date, date_unit_list,
    cumulative_unit_dic, process_cum_format, get_price_unit_key_from_phase, create_default_escalation_obj,
    update_list_escalation_segment, process_differenial_obj_append, get_max_cap,
    process_expression_for_overlay_differentials, STREAM_PRICE_KEYWORD_DICT, CC_ARIES_PRICE_UNIT_DICT,
    CC_ARIES_DIFF_UNIT_DICT, update_price_model_with_backup_values, NUMBER_OF_PRICE_PHASE)
from api.aries_phdwin_imports.interfaces.model_extraction import ModelExtractionInterface
from combocurve.shared.aries_import_enums import PhaseEnum, CCSchemaEnum, EconHeaderEnum, EconEnum, PriceEnum, UnitEnum


class Pricing(ModelExtractionInterface):
    def __init__(self, aries_data_extraction):
        super().__init__(aries_data_extraction)
        self.aries_data_extraction = aries_data_extraction

        self.pct_diff_oil_1 = []
        self.pct_diff_gas_1 = []
        self.pct_diff_ngl_1 = []
        self.pct_diff_condensate_1 = []

        self.pct_diff_oil_2 = []
        self.pct_diff_gas_2 = []
        self.pct_diff_ngl_2 = []
        self.pct_diff_condensate_2 = []

        self.dollar_diff_oil_1 = []
        self.dollar_diff_gas_1 = []
        self.dollar_diff_ngl_1 = []
        self.dollar_diff_condensate_1 = []

        self.dollar_diff_oil_2 = []
        self.dollar_diff_gas_2 = []
        self.dollar_diff_ngl_2 = []
        self.dollar_diff_condensate_2 = []

        self.dollar_diff_oil_3 = []
        self.dollar_diff_gas_3 = []
        self.dollar_diff_ngl_3 = []
        self.dollar_diff_condensate_3 = []

        self.oil_order = []
        self.gas_order = []
        self.ngl_order = []
        self.cnd_order = []

        self.differential_ls_dict = {}
        self.orphan_diff_ls_dict = {}

        self.property_id = None
        self.scenario = None
        self.section = 5

    def pre_process(self):
        # group differential obj into pct_diff_4oil, pct_diff_gas, pct_diff_ngl, pct_diff_condensate
        self.pct_diff_oil_1 = []
        self.pct_diff_gas_1 = []
        self.pct_diff_ngl_1 = []
        self.pct_diff_condensate_1 = []

        # group differential obj into pct_diff_4oil, pct_diff_gas, pct_diff_ngl, pct_diff_condensate
        self.pct_diff_oil_2 = []
        self.pct_diff_gas_2 = []
        self.pct_diff_ngl_2 = []
        self.pct_diff_condensate_2 = []

        # group differential obj into dollar_diff_oil, dollar_diff_gas, dollar_diff_ngl, dollar_diff_condensate
        self.dollar_diff_oil_1 = []
        self.dollar_diff_gas_1 = []
        self.dollar_diff_ngl_1 = []
        self.dollar_diff_condensate_1 = []

        # group differential obj into dollar_diff_oil, dollar_diff_gas, dollar_diff_ngl, dollar_diff_condensate
        self.dollar_diff_oil_2 = []
        self.dollar_diff_gas_2 = []
        self.dollar_diff_ngl_2 = []
        self.dollar_diff_condensate_2 = []

        # group differential obj into dollar_diff_oil, dollar_diff_gas, dollar_diff_ngl, dollar_diff_condensate
        self.dollar_diff_oil_3 = []
        self.dollar_diff_gas_3 = []
        self.dollar_diff_ngl_3 = []
        self.dollar_diff_condensate_3 = []

        self.oil_order = []
        self.gas_order = []
        self.ngl_order = []
        self.cnd_order = []

        self.differential_ls_dict = {
            PhaseEnum.oil.value: (self.dollar_diff_oil_1, self.dollar_diff_oil_2, self.dollar_diff_oil_3,
                                  self.pct_diff_oil_1, self.pct_diff_oil_2, self.oil_order),
            PhaseEnum.gas.value: (self.dollar_diff_gas_1, self.dollar_diff_gas_2, self.dollar_diff_gas_3,
                                  self.pct_diff_gas_1, self.pct_diff_gas_2, self.gas_order),
            PhaseEnum.ngl.value: (self.dollar_diff_ngl_1, self.dollar_diff_ngl_2, self.dollar_diff_ngl_3,
                                  self.pct_diff_ngl_1, self.pct_diff_ngl_2, self.ngl_order),
            PhaseEnum.aries_condensate.value:
            (self.dollar_diff_condensate_1, self.dollar_diff_condensate_2, self.dollar_diff_condensate_3,
             self.pct_diff_condensate_1, self.pct_diff_condensate_2, self.cnd_order)
        }

        self.orphan_diff_ls_dict = copy.deepcopy(self.differential_ls_dict)

        self.property_id = None
        self.scenario = None
        self.section = 5

    @classmethod  # noqa (C901)
    def append_differential_list(cls, differential_ls_dict, differential_default_document):  # noqa (C901)
        """Appends each differential list obj to oil, gas, ngl, drip_condesate

        Args:
            differential_ls_dict:
            differential_default_document:

        Returns:
            Modified differential_default_document with the updated fields.
        """
        for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.aries_condensate.value]:
            (dollar_diff_phase_1, dollar_diff_phase_2, dollar_diff_phase_3, pct_diff_phase_1, pct_diff_phase_2,
             phase_order) = differential_ls_dict.get(phase)
            if phase == PhaseEnum.aries_condensate.value:
                phase_key = PhaseEnum.condensate.value
            else:
                phase_key = phase
            # if a percentaage differential is available and a third differential is also added
            # combine differential 2 and 3 as percentage must stand alone and dollar should combine
            if (pct_diff_phase_1 or pct_diff_phase_2) and dollar_diff_phase_3:
                dollar_diff_phase_2 += dollar_diff_phase_3
                dollar_diff_phase_3 = []

            # if a PAD and PAJ differential exists (PAJ goes to pct_diff_phase_1 and PAD goes to pct_diff_phase_2)
            # combine all dollar differentials in differential one
            if pct_diff_phase_1 and pct_diff_phase_2 and dollar_diff_phase_2:
                dollar_diff_phase_1 += dollar_diff_phase_2
                dollar_diff_phase_2 = []

            if len(phase_order) > 0:
                # if the first differential is a percentage type
                # 1. Add the first differential to differential 1
                # 2. If there is 2nd percentage differential set it to differential 2
                #
                if phase_order[-1] == 'pct':
                    if pct_diff_phase_1:
                        differential_default_document['econ_function']['differentials']['differentials_1'][phase_key][
                            'rows'].extend(pct_diff_phase_1)
                    elif pct_diff_phase_2:
                        differential_default_document['econ_function']['differentials']['differentials_1'][phase_key][
                            'rows'].extend(pct_diff_phase_2)
                    if pct_diff_phase_1 and pct_diff_phase_2:
                        differential_default_document['econ_function']['differentials']['differentials_2'][phase_key][
                            'rows'].extend(pct_diff_phase_2)
                    elif dollar_diff_phase_1:
                        differential_default_document['econ_function']['differentials']['differentials_2'][phase_key][
                            'rows'].extend(dollar_diff_phase_1)
                    if pct_diff_phase_1 and pct_diff_phase_2 and dollar_diff_phase_1:
                        differential_default_document['econ_function']['differentials']['differentials_3'][phase_key][
                            'rows'].extend(dollar_diff_phase_1)
                    elif dollar_diff_phase_2:
                        differential_default_document['econ_function']['differentials']['differentials_3'][phase_key][
                            'rows'].extend(dollar_diff_phase_2)
                else:
                    differential_default_document['econ_function']['differentials']['differentials_1'][phase_key][
                        'rows'].extend(dollar_diff_phase_1)
                    if dollar_diff_phase_2:
                        differential_default_document['econ_function']['differentials']['differentials_2'][phase_key][
                            'rows'].extend(dollar_diff_phase_2)
                    if dollar_diff_phase_3:
                        differential_default_document['econ_function']['differentials']['differentials_3'][phase_key][
                            'rows'].extend(dollar_diff_phase_3)
                    if (pct_diff_phase_1 or pct_diff_phase_2) and dollar_diff_phase_2:
                        if pct_diff_phase_1:
                            differential_default_document['econ_function']['differentials']['differentials_3'][
                                phase_key]['rows'].extend(pct_diff_phase_1)
                        elif pct_diff_phase_2:
                            differential_default_document['econ_function']['differentials']['differentials_3'][
                                phase_key]['rows'].extend(pct_diff_phase_2)
                    elif (pct_diff_phase_1 or pct_diff_phase_2) and not dollar_diff_phase_2:
                        if pct_diff_phase_1 and pct_diff_phase_2:
                            differential_default_document['econ_function']['differentials']['differentials_2'][
                                phase_key]['rows'].extend(pct_diff_phase_1)
                            differential_default_document['econ_function']['differentials']['differentials_3'][
                                phase_key]['rows'].extend(pct_diff_phase_2)
                        elif pct_diff_phase_1:
                            differential_default_document['econ_function']['differentials']['differentials_2'][
                                phase_key]['rows'].extend(pct_diff_phase_1)
                        elif pct_diff_phase_2:
                            differential_default_document['econ_function']['differentials']['differentials_2'][
                                phase_key]['rows'].extend(pct_diff_phase_2)
            else:
                if dollar_diff_phase_1:
                    differential_default_document['econ_function']['differentials']['differentials_1'][phase_key][
                        'rows'].extend(dollar_diff_phase_1)
                if dollar_diff_phase_2:
                    differential_default_document['econ_function']['differentials']['differentials_2'][phase_key][
                        'rows'].extend(dollar_diff_phase_2)
                if dollar_diff_phase_3:
                    differential_default_document['econ_function']['differentials']['differentials_3'][phase_key][
                        'rows'].extend(dollar_diff_phase_3)

        return differential_default_document

    @classmethod
    def get_price_differential_model_name(cls, document):
        if document['assumptionKey'] == 'differentials':
            return 'differentials'
        elif document['assumptionKey'] == 'pricing':
            return 'price_model'
        return

    @classmethod
    def check_if_apply_cap(cls, default_document):
        """

        Args:
            default_document:

        Returns:

        """
        phase_ls = ['oil', 'gas', 'ngl', 'drip_condensate']
        model = cls.get_price_differential_model_name(default_document)

        if model == "price_model":
            for phase in phase_ls:
                rows = default_document['econ_function'][model][phase]['rows']
                max_cap = get_max_cap(rows)
                if max_cap != -1:
                    default_document['econ_function'][model][phase]['cap'] = max_cap

        return default_document

    @classmethod
    def check_dollar_diff_by_resource(cls, resource: List[Dict], resource_2: List[Dict], obj: dict):
        """Appends the received obj on resource or resource_2 data structure depending on their properties

        Args:
            resource: First choice to append obj. e.g. dollar_diff_oil_1, dollar_diff_gas_1
            resource_2: Second choice to append obj. e.g. dollar_diff_oil_2, dollar_diff_gas_2
            obj: dict-like structure to append to resource
        """
        if not resource:
            resource.append(obj)
        elif resource[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != 'Econ Limit':
            resource.append(obj)
        else:
            resource_2.append(obj)

    def check_dates_and_price_obj(self, formatted_start_date, formatted_end_date, price_default_document, ls_expression,
                                  keyword):
        return formatted_start_date == formatted_end_date and not_first_price_obj(
            price_default_document, ls_expression, keyword, self.dollar_diff_oil_1, self.dollar_diff_oil_2,
            self.pct_diff_oil_1, self.pct_diff_oil_2)

    @classmethod
    def get_shift_month_year_multiplier(cls, ls_expression: str) -> dict:
        """

        Args:
            ls_expression: Expression extracted from the global ls_expression list

        Returns:
            Dictionary-like structure containing the shift_month, shift_year and multiplier values
        """
        if ls_expression in ['#', '#/M', '#M']:
            return {'shift_month': 1, 'shift_year': 0, 'multiplier': 1}

        if ls_expression in ['#/Y', '#Y']:
            return {'shift_month': 0, 'shift_year': 1, 'multiplier': 1}

        if ls_expression in ['M#', 'M#/M', 'M#M']:
            return {'shift_month': 1, 'shift_year': 0, 'multiplier': 1000}

        if ls_expression in ['M#/Y', 'M#Y']:
            return {'shift_month': 0, 'shift_year': 1, 'multiplier': 1000}

        return {'shift_month': 0, 'shift_year': 1, 'multiplier': 1000}

    def update_price_based_on_value(self, price_obj: dict, price_default_document: dict, pricing_values: PricingValues,
                                    economic_values: Economic, use_oil_price_as_base: bool):
        """Evaluates value and updates the price object accordingly

        Args:
            price_obj:
            price_default_document:
            pricing_values:
            economic_values:
            use_oil_price_as_base:
        """
        if pricing_values.value == 'X':
            # need to fetch the last segment
            _, pre_value = self.get_last_segment_and_value(economic_values.ls_expression, economic_values.propnum,
                                                           price_default_document, economic_values.keyword,
                                                           self.scenario, self.section)
            # Update price_obj
            self.update_cc_price_unit(pre_value,
                                      pricing_values.unit,
                                      economic_values.keyword,
                                      price_obj,
                                      use_oil_price_as_base=use_oil_price_as_base)
        else:
            try:
                pricing_values.value = aries_cc_round(float(pricing_values.value))
            except ValueError:
                message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.value.value,
                                           pricing_values.value)
                self.error_log(str_join(economic_values.ls_expression),
                               message,
                               self.section,
                               model=self.__class__.__name__)

            # Update price_obj
            self.update_cc_price_unit(pricing_values.value,
                                      pricing_values.unit,
                                      economic_values.keyword,
                                      price_obj,
                                      use_oil_price_as_base=use_oil_price_as_base)

    @classmethod
    def update_price_based_on_keyword(cls, price_obj: dict, keyword: str, use_btu: bool):
        """Evaluates the keyword in order to update the price object accordingly

        Args:
            price_obj:
            keyword:
            use_btu:
        """
        if keyword == 'PRI/OIL':
            price_obj['price'] = price_obj['dollar_per_bbl']
            del price_obj['dollar_per_bbl']

        if 'GAS' in keyword and use_btu:
            price_obj['dollar_per_mmbtu'] = price_obj['dollar_per_mcf']
            del price_obj['dollar_per_mcf']

    @classmethod
    def update_cc_price_unit(cls,
                             value: float,
                             unit: str,
                             keyword: str,
                             obj: dict,
                             _type: str = PriceEnum.price.value,
                             use_oil_price_as_base: bool = False):
        """
        Args:
            value:
            unit:
            keyword:
            obj:
            _type:
            use_oil_price_as_base:
        """
        # get price unit from expression list
        if use_oil_price_as_base:
            obj[PriceEnum.pct_of_oil_price.value] = round(value * 100, 4)
            return

        if unit in CC_ARIES_PRICE_UNIT_DICT:
            if str(keyword.split('/')[-1]).lower() in [
                    PhaseEnum.oil.value, PhaseEnum.ngl.value, PhaseEnum.aries_condensate.value
            ]:
                obj[PriceEnum.dollar_per_bbl.value] = value
            elif str(keyword.split('/')[-1]).lower() == PhaseEnum.gas.value:
                obj[PriceEnum.dollar_per_mcf.value] = value
        elif _type == PriceEnum.diff.value:
            if unit == UnitEnum.dollar_sign.value:
                if PhaseEnum.gas.value in keyword.lower():
                    obj[PriceEnum.dollar_per_mcf.value] = value
                else:
                    obj[PriceEnum.dollar_per_bbl.value] = value

            elif unit == UnitEnum.perc_sign.value:
                # 0 % differential value is considered 100 %
                if value == 0:
                    value = 100
                obj[PriceEnum.pct_of_base_price.value] = value

            elif unit == UnitEnum.frac.value:
                # 0 % differential value is considered 100 %
                if value == 0:
                    value = 1
                obj[PriceEnum.pct_of_base_price.value] = value * 100

    def update_differential_scenario_qualifier(self):
        _id = self.ls_scenarios_id[0]
        scenario_qualifier_doc = self.aries_data_extraction.scenarios_dic[_id]['columns']['differentials']['qualifiers']
        if 'qualifier1' not in scenario_qualifier_doc:
            scenario_qualifier_doc['qualifier1'] = {
                'name': 'ALT DIFFS',
                'createdAt': datetime.datetime.now(),
                'createdBy': self.aries_data_extraction.user_id,
            }

    def update_differential_model_based_on_price_backup(self, differentials_ignored, processed_diffs, price_model_name,
                                                        diff_model_name):
        use_differential_model = True

        for phase in [item for item in processed_diffs if item in differentials_ignored]:
            phase_key = phase if phase != PhaseEnum.condensate.value else PhaseEnum.aries_condensate.value
            self.orphan_diff_ls_dict[phase_key] = self.differential_ls_dict[phase_key]
            self.differential_ls_dict[phase_key] = ([], [], [], [], [], [])

        if len(differentials_ignored) == NUMBER_OF_PRICE_PHASE:
            use_differential_model = False
            price_model_name = 'ECOPHASE_PRICE_BACKUP'
            diff_model_name = 'DEFAULT_DIFFERENTIAL'
            self.differential_ls_dict = None
            return use_differential_model, price_model_name, diff_model_name

        return use_differential_model, price_model_name, diff_model_name

    def process_price(self, price_obj: dict, price_conditionals: PriceConditionals, economic_values: Economic,
                      pricing_values: PricingValues, start_date: str, scenario: str, price_default_document: dict,
                      differential_obj: dict, phase_usage_ls: set, phases_using_list_price: set,
                      use_oil_price_as_base: bool):
        """Process the price object field values

        Args:
            price_conditionals:
            economic_values:
            pricing_values:
            start_date:
            scenario:
            price_default_document:
            price_obj:
            differential_obj:
            phase_usage_ls:
            phases_using_list_price:
            use_oil_price_as_base:

        Returns:
            True if successful, False otherwise.
        """

        if '#' in str(economic_values.ls_expression[-1]):
            # Update price_default_document
            self.process_list_method_format(start_date, economic_values.ls_expression, economic_values.propnum,
                                            price_default_document, phase_usage_ls, economic_values.keyword,
                                            economic_values.original_keyword, 'price', price_conditionals.use_btu)
            price_conditionals.use_fpd = False
            price_conditionals.use_asof = False

            phase = str(economic_values.keyword).split('/')[-1].strip().lower()
            phases_using_list_price.add(phase)

            return True
        # formula method
        else:
            if pricing_values.unit not in CC_ARIES_PRICE_UNIT_DICT:
                _, economic_values.ls_expression, pricing_values.unit = process_irregular_price_expression(
                    economic_values.keyword, economic_values.ls_expression, self.property_id, self.scenario,
                    self.aries_data_extraction.log_report)

            price_obj = self.process_cutoff_format(start_date, economic_values.ls_expression, price_obj,
                                                   economic_values.propnum, price_default_document,
                                                   economic_values.keyword, economic_values.original_keyword,
                                                   self.scenario, self.section, price_conditionals.use_fpd,
                                                   price_conditionals.use_asof)

            if price_obj == DEFAULT_PRICE_OBJ:
                return False

            unique_escalation_default_document = self.create_escalation_document(price_obj, economic_values, start_date)

            # add price value and unit to price_obj

            if pricing_values.unit not in CC_ARIES_PRICE_UNIT_DICT and not use_oil_price_as_base:
                return False

            # Update price_obj based on value. e.g whether pricing_values.value == 'X' or not.
            self.update_price_based_on_value(price_obj, price_default_document, pricing_values, economic_values,
                                             use_oil_price_as_base)

            if pricing_values.cap != 'X':
                try:
                    cap = aries_cc_round(float(pricing_values.cap))
                    price_obj['cap'] = cap
                except ValueError:
                    self.error_log(str_join(economic_values.ls_expression),
                                   format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.value.value,
                                                    pricing_values.cap),
                                   self.section,
                                   model=self.__class__.__name__)
                    price_obj['cap'] = ''

            # special handle for oil, change key to price
            self.update_price_based_on_keyword(price_obj, economic_values.keyword, price_conditionals.use_btu)

            # check and replace if price value is greater than its cap value
            compare_cap_and_value(price_obj, self.aries_data_extraction.log_report, scenario, self.property_id,
                                  self.section, EconEnum.price_model.value)

            # Update price_default_document
            self.append_obj_and_assign_escalation(price_default_document, unique_escalation_default_document, price_obj,
                                                  differential_obj, phase_usage_ls, economic_values.keyword,
                                                  economic_values.original_keyword)

            return True

    def create_escalation_document(self, price_obj: dict, economic_values: Economic, start_date: str) -> str:
        """Creates a document regarding escalation

        Args:
            price_obj:
            start_date:
            economic_values: Economic instance representing the values extracted from the current evaluated df row.

        Returns:
            Unique escalation document string reference
        """
        if any(key in price_obj for key in ['dates', 'offset_to_fpd', 'offset_to_as_of_date']):
            try:
                unique_escalation_document = self.aries_data_extraction.escalation_model_extraction(
                    economic_values.ls_expression, start_date, economic_values.keyword, self.scenario,
                    self.ls_scenarios_id, economic_values.propnum, 'price', self.section)
            except Exception:
                unique_escalation_document = 'none'
                message = format_error_msg(ErrorMsgEnum.escalation_msg.value, economic_values.keyword,
                                           str_join(economic_values.ls_expression))
                self.error_log(economic_values.expression, message, self.section, model=self.__class__.__name__)
        else:
            unique_escalation_document = 'none'

        return unique_escalation_document

    def process_differentials(self, price_obj: dict, price_conditionals: PriceConditionals, economic_values: Economic,
                              pricing_values: PricingValues, start_date: str, scenario: str,
                              differential_default_document: dict, differential_obj: dict, phase_usage_ls: set):
        """

        Args:
            price_obj:
            price_conditionals:
            economic_values:
            pricing_values:
            start_date:
            scenario:
            differential_default_document:
            differential_obj:
            phase_usage_ls:

        Returns:
            True if successful, False otherwise.
        """
        # LIST method
        if '#' in str(economic_values.ls_expression[-1]):
            # Update differential_default_document
            self.process_list_method_format(start_date, economic_values.ls_expression, economic_values.propnum,
                                            differential_default_document, phase_usage_ls, economic_values.keyword,
                                            economic_values.original_keyword, 'differential',
                                            price_conditionals.use_btu)
            price_conditionals.use_fpd = False
            price_conditionals.use_asof = False

            return True
        # formula method
        else:
            if pricing_values.unit not in CC_ARIES_DIFF_UNIT_DICT:
                keyword, economic_values.ls_expression, unit = process_irregular_price_expression(
                    economic_values.keyword, economic_values.ls_expression, self.property_id, scenario,
                    self.aries_data_extraction.log_report)

            differential_obj = self.process_cutoff_format(start_date, economic_values.ls_expression, differential_obj,
                                                          economic_values.propnum, differential_default_document,
                                                          economic_values.keyword, economic_values.original_keyword,
                                                          scenario, self.section, price_conditionals.use_fpd,
                                                          price_conditionals.use_asof)

            if differential_obj == DEFAULT_DIFFERENTIAL_OBJ:
                return False

            # add differential value and unit to differentail obj
            try:
                if pricing_values.value == 'X':
                    # need to fetch the last segment
                    _, pre_value = self.get_last_segment_and_value(economic_values.ls_expression,
                                                                   economic_values.propnum,
                                                                   differential_default_document,
                                                                   economic_values.keyword, scenario, self.section)

                    differential_obj = self.update_cc_price_unit(pre_value,
                                                                 pricing_values.unit,
                                                                 economic_values.keyword,
                                                                 differential_obj,
                                                                 _type='differentials')
                else:
                    try:
                        pricing_values.value = aries_cc_round(float(pricing_values.value))
                    except ValueError:
                        self.error_log(str_join(economic_values.ls_expression),
                                       format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.value.value,
                                                        pricing_values.value),
                                       self.section,
                                       model=self.__class__.__name__)

                    # Update differential_obj
                    self.update_cc_price_unit(pricing_values.value,
                                              pricing_values.unit,
                                              economic_values.keyword,
                                              differential_obj,
                                              _type='differentials')

                if economic_values.ls_expression[1] != 'X':
                    try:
                        cap = aries_cc_round(float(pricing_values.cap))
                        differential_obj['cap'] = cap
                    except ValueError:
                        self.error_log(str_join(economic_values.ls_expression),
                                       format_error_msg(ErrorMsgEnum.value.value, pricing_values.cap),
                                       self.section,
                                       model=self.__class__.__name__)
                        differential_obj['cap'] = ''

            except Exception:
                self.error_log(str_join(economic_values.ls_expression),
                               format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.paj.value,
                                                str_join(economic_values.ls_expression)),
                               self.section,
                               model=self.__class__.__name__)

            if ('GAS' in economic_values.keyword and price_conditionals.use_btu
                    and 'dollar_per_mcf' in differential_obj.keys()):
                differential_obj['dollar_per_mmbtu'] = differential_obj['dollar_per_mcf']
                del differential_obj['dollar_per_mcf']

            differential_obj = compare_cap_and_value(differential_obj, self.aries_data_extraction.log_report, scenario,
                                                     self.property_id, self.section, EconEnum.differential_model.value)

            # Update differential_obj
            self.append_obj_and_assign_escalation(differential_default_document, None, price_obj, differential_obj,
                                                  phase_usage_ls, economic_values.keyword,
                                                  economic_values.original_keyword)
            return True

    def process_price_differential_object(self, economic_values: Economic, price_conditionals: PriceConditionals,
                                          start_date: str, scenario: str, price_default_document: dict,
                                          differential_default_document: dict, phase_usage_ls: set,
                                          phases_using_list_price: set, use_oil_price_as_base: bool) -> Optional[tuple]:
        """Encapsulates the price/differential process based on the keyword extracted from the economic row

        Args:
            economic_values:
            price_conditionals:
            start_date:
            scenario:
            price_default_document:
            differential_default_document:
            phase_usage_ls:
            phases_using_list_price:
            use_oil_price_as_base:

        Returns:
            Tuple-like structure containing the duo (price_model_name, diff_model_name). None if either the price or
            differentials process is not successful.
        """
        price_obj = copy.deepcopy(DEFAULT_PRICE_OBJ)
        differential_obj = copy.deepcopy(DEFAULT_DIFFERENTIAL_OBJ)

        price_model_name = ''
        diff_model_name = ''

        if economic_values.ls_expression[1] in CC_ARIES_PRICE_UNIT_DICT:
            economic_values.ls_expression.insert(1, 'X')

        pricing_values = PricingValues('', economic_values.ls_expression[0])
        try:
            pricing_values.cap = economic_values.ls_expression[1]
        except IndexError:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.cap.value,
                                       str_join(economic_values.ls_expression))
            self.error_log(str_join(economic_values.ls_expression),
                           message,
                           self.section,
                           model=self.__class__.__name__)

        try:
            pricing_values.unit = economic_values.ls_expression[2]
        except IndexError:
            pricing_values.unit = None
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                       str_join(economic_values.ls_expression))
            self.error_log(str_join(economic_values.ls_expression),
                           message,
                           self.section,
                           model=self.__class__.__name__)
        # price process
        if 'PRI/' in economic_values.keyword:
            if not self.process_price(price_obj, price_conditionals, economic_values, pricing_values, start_date,
                                      scenario, price_default_document, differential_obj, phase_usage_ls,
                                      phases_using_list_price, use_oil_price_as_base):
                return

            price_model_name = get_model_name_from_qualifiers(economic_values.keyword, economic_values.qualifier,
                                                              price_model_name, price_default_document)

        # differentials process
        elif 'PAD/' in economic_values.keyword or 'PAJ/' in economic_values.keyword:
            if not self.process_differentials(price_obj, price_conditionals, economic_values, pricing_values,
                                              start_date, scenario, differential_default_document, differential_obj,
                                              phase_usage_ls):
                return

            diff_model_name = get_model_name_from_qualifiers(economic_values.keyword, economic_values.qualifier,
                                                             diff_model_name, differential_default_document)

        # elif keyword == 'PRI':
        # ex: PRI 48.00 3.75 0 0 $ TO LIFE
        # ex: PRI 48.00 3.75 $
        # ex: PRI 48.00 3.75 0 0 $ PC 3.0
        # ex: PRI 48.00 3.75 0 0 $ 1/2020 AD
        #      “ 52.00 4.25 0 0 $ TO LIFE
        # currently not inlcude 'PRI" keyword
        else:
            if self.section == EconHeaderEnum.price_section_key.value:
                self.error_log(str_join(economic_values.ls_expression),
                               format_error_msg(ErrorMsgEnum.cc_error_msg.value, economic_values.keyword),
                               self.section,
                               model=self.__class__.__name__)
            return

        return price_model_name, diff_model_name

    def validate_price_backup(self, price_default_document: dict, price_model_name: str, diff_model_name: str):
        """Validates and update differential model based on price backup

        Args:
            price_default_document:
            price_model_name:
            diff_model_name:

        Returns:

        """
        differentials_ignored = []
        # Store the phases that actually have a proper set in the import structure
        processed_differentials = [
            phase for phase, ls in self.differential_ls_dict.items() if any([len(item) > 0 for item in ls])
        ]
        if self.aries_data_extraction.backup_price_dict is not None:
            (price_default_document, differential_ls_dict,
             differentials_ignored) = update_price_model_with_backup_values(
                 price_default_document, self.differential_ls_dict, self.aries_data_extraction.backup_price_dict,
                 self.aries_data_extraction.as_of_date)

        return self.update_differential_model_based_on_price_backup(differentials_ignored, processed_differentials,
                                                                    price_model_name, diff_model_name)

    def process_default_document(self, default_document: dict):
        """Process the passed default document and updates it with wells and timestamps

        Args:
            default_document: Can be any document schema
            is_orphan: Whether link the default document to a scenario

        Returns:
            Updated default document with wells and timestamps
        """
        default_document = check_if_more_than_one_element(default_document,
                                                          self.aries_data_extraction.add_zero_to_end_of_row)
        default_document = self.check_if_apply_cap(default_document)

        for _id in self.ls_scenarios_id:
            if self.aries_data_extraction.scenarios_dic[_id]['name'] == self.scenario:
                default_document['wells'].add((_id, self.property_id))

        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

        return default_document

    def process_orphan_diff_models(self, orphan_diff_default: dict, diff_model_name: str):
        """

        Args:
            orphan_diff_default: Default document based on differentials default document to store orphan models.
            diff_model_name: Model name associated to the differentials document
        """
        self.append_differential_list(self.orphan_diff_ls_dict, orphan_diff_default)
        self.process_default_document(orphan_diff_default)
        set_diff_start_date_to_base_date(orphan_diff_default, self.aries_data_extraction.dates_1_base_date)
        combine_differential_rows(orphan_diff_default)
        orphan_diff_default['orphan'] = True

        self.aries_data_extraction.compare_and_save_into_self_data_list(
            orphan_diff_default,
            self.aries_data_extraction.differential_data_list,
            self.aries_data_extraction.projects_dic,
            model_name=diff_model_name,
            aries=True)
        self.update_differential_scenario_qualifier()

    def append_differential_row_to_data_list(self, differential_default_document: dict, diff_model_name: str):

        differential_default_document = self.append_differential_list(self.differential_ls_dict,
                                                                      differential_default_document)

        differential_default_document = self.process_default_document(differential_default_document)

        differential_default_document = set_diff_start_date_to_base_date(differential_default_document,
                                                                         self.aries_data_extraction.dates_1_base_date)
        differential_default_document = combine_differential_rows(differential_default_document)

        # compare and save into data_list
        diff_model_name = (diff_model_name if diff_model_name != '' else
                           f'ARIES_CC_{differential_default_document[CCSchemaEnum.assumption_key.value].upper()}')

        self.aries_data_extraction.compare_and_save_into_self_data_list(
            differential_default_document,
            self.aries_data_extraction.differential_data_list,
            self.aries_data_extraction.projects_dic,
            model_name=diff_model_name,
            aries=True)

    def get_last_segment_and_value(self, ls_expression, propnum, default_document, keyword, scenario, section):
        """Fetch and returns the value of the previous segment of price of differentials

        Args:
            ls_expression:
            propnum:
            default_document:
            keyword:
            scenario:
            section:

        Returns:
            The value of the price of previous segment
        """

        pre_value = None
        model_name = ''

        phase = keyword.split('/')[-1].lower()

        if phase == 'cnd':
            phase = 'drip_condensate'

        if 'PRI/' in keyword:
            model_name = 'price_model'
        elif 'PAD/' in keyword or 'PAJ/' in keyword:
            model_name = 'differentials'

        # fetch the last element end_date as new start_date
        # if rows for price > 1 or phase_list for differentials > 0 (assume the last element use dates as cutoff)
        last_segment = None
        if model_name == 'price_model':
            if len(default_document['econ_function'][model_name][phase]['rows']) > 1:
                last_segment = default_document['econ_function'][model_name][phase]['rows'][-1]

        elif model_name == 'differentials':
            if phase == 'oil':
                last_segment = get_differential_last_segment(ls_expression, keyword, self.dollar_diff_oil_1,
                                                             self.dollar_diff_oil_2, self.pct_diff_oil_1,
                                                             self.pct_diff_oil_2)
            elif phase == 'gas':
                last_segment = get_differential_last_segment(ls_expression, keyword, self.dollar_diff_gas_1,
                                                             self.dollar_diff_gas_2, self.pct_diff_gas_1,
                                                             self.pct_diff_gas_2)
            elif phase == 'ngl':
                last_segment = get_differential_last_segment(ls_expression, keyword, self.dollar_diff_ngl_1,
                                                             self.dollar_diff_ngl_2, self.pct_diff_ngl_1,
                                                             self.pct_diff_ngl_2)
            elif phase == 'drip_condensate':
                last_segment = get_differential_last_segment(ls_expression, keyword, self.dollar_diff_condensate_1,
                                                             self.dollar_diff_condensate_2, self.pct_diff_condensate_1,
                                                             self.pct_diff_condensate_2)

        if last_segment is not None:
            pre_value = get_price_unit_of_last_segment(last_segment)
            if pre_value is None:
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=ErrorMsgEnum.line_error_msg.value,
                                                                scenario=scenario,
                                                                well=propnum,
                                                                model=ErrorMsgEnum.price.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)
        return last_segment, pre_value

    def process_date_format(  # noqa (C901)
            self, start_date, ls_expression, obj, propnum, price_default_document, keyword, original_keyword, scenario,
            section, use_fpd, use_asof):
        """Adds start_date or end_date to input obj

        Args:
            start_date:
            ls_expression:
            obj:
            propnum:
            price_default_document:
            keyword:
            original_keyword:
            scenario:
            section:
            use_fpd:
            use_asof:

        Returns:

        """
        start = None
        start_fpd, start_asof = False, False
        last_segment, pre_value = self.get_last_segment_and_value(ls_expression, self.property_id,
                                                                  price_default_document, keyword, scenario, section)

        last_segment = None if original_keyword != '"' else last_segment

        new_start_date = start_date
        if last_segment is not None:
            if use_asof:
                last = last_segment['offset_to_as_of_date']['end']
                try:
                    start = round(float(last))
                except ValueError:
                    if last == 'Econ Limit':
                        if original_keyword == '"':
                            return obj
                        start_asof = True
                    start = None
                    if start == MAX_ALLOWABLE_MONTHS:
                        start = 0
            else:
                last_date = pd.to_datetime(last_segment['dates']['end_date'], errors='coerce')
                if not pd.isnull(last_date):
                    last_date += pd.DateOffset(days=1)
                    new_start_date = last_date.strftime('%m/%d/%Y')
                else:
                    if original_keyword == '"':
                        return obj
        else:
            if use_asof:
                start_asof = True

        # process start_date and end_date
        try:
            cutoff_unit = ls_expression[4]
        except IndexError:
            cutoff_unit = 'LIFE'
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=format_error_msg(
                                                                ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                                                str_join(ls_expression)),
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.price.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        ls_expression = check_for_inconsistent_date(ls_expression, keyword, self.aries_data_extraction.log_report,
                                                    scenario, propnum, section)

        try:
            if cutoff_unit == 'AD':
                formated_start_date = pd.to_datetime(new_start_date)
                formated_end_date = format_aries_segment_date(ls_expression[3],
                                                              self.aries_data_extraction.dates_1_base_date)

                if formated_start_date == formated_end_date \
                        and not_first_price_obj(price_default_document,
                                                ls_expression,
                                                keyword,
                                                self.dollar_diff_oil_1,
                                                self.dollar_diff_oil_2,
                                                self.pct_diff_oil_1,
                                                self.pct_diff_oil_2):
                    return obj

                formated_end_date += pd.DateOffset(days=-1)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           formated_end_date,
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           price_diff=True)

            elif cutoff_unit in ['MO', 'MOS']:
                formated_start_date = pd.to_datetime(start_date)
                shift_day, shift_month = get_day_month_from_decimal_date(abs(float(ls_expression[3])))
                formated_end_date = formated_start_date + pd.DateOffset(months=shift_month, days=shift_day)

                if self.check_dates_and_price_obj(formated_start_date, formated_end_date, price_default_document,
                                                  ls_expression, keyword):
                    return obj

                formated_start_date = pd.to_datetime(new_start_date)
                formated_end_date += pd.DateOffset(days=-1)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           formated_end_date,
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           price_diff=True)

            elif cutoff_unit in ['IMO', 'IMOS']:
                formated_start_date = pd.to_datetime(new_start_date)
                shift_day, shift_month = get_day_month_from_decimal_date(abs(float(ls_expression[3])))
                formated_end_date = formated_start_date + pd.DateOffset(months=shift_month, days=shift_day)

                if self.check_dates_and_price_obj(formated_start_date, formated_end_date, price_default_document,
                                                  ls_expression, keyword):
                    return obj

                formated_end_date += pd.DateOffset(days=-1)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           formated_end_date,
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           price_diff=True,
                                           incremental=True)

            elif cutoff_unit in ['YR', 'YRS']:
                formated_start_date = pd.to_datetime(start_date)
                shift_day, shift_month, shift_year = get_day_month_year_from_decimal_date(abs(float(ls_expression[3])))

                formated_end_date = formated_start_date + pd.DateOffset(years=shift_year)

                if self.check_dates_and_price_obj(formated_start_date, formated_end_date, price_default_document,
                                                  ls_expression, keyword):
                    return obj

                formated_start_date = pd.to_datetime(new_start_date)
                formated_end_date += pd.DateOffset(days=-1)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           formated_end_date,
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           price_diff=True)

            elif cutoff_unit in ['IYR', 'IYRS']:
                formated_start_date = pd.to_datetime(new_start_date)
                shift_day, shift_month, shift_year = get_day_month_year_from_decimal_date(abs(float(ls_expression[3])))
                formated_end_date = formated_start_date + pd.DateOffset(
                    years=shift_year, months=shift_month, days=shift_day)

                if self.check_dates_and_price_obj(formated_start_date, formated_end_date, price_default_document,
                                                  ls_expression, keyword):
                    return obj

                formated_end_date += pd.DateOffset(days=-1)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           formated_end_date,
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           price_diff=True,
                                           incremental=True)

            elif cutoff_unit == 'LIFE':
                formated_start_date = pd.to_datetime(new_start_date)
                obj = update_fpd_asof_date(obj,
                                           start,
                                           formated_start_date,
                                           'Econ Limit',
                                           use_fpd,
                                           use_asof,
                                           start_asof,
                                           start_fpd,
                                           life=True,
                                           price_diff=True)

        except Exception:
            message = (format_error_msg(ErrorMsgEnum.cut_off_date_error_msg.value, start_date))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.price.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        return obj

    def process_cutoff_format(self, start_date, ls_expression, obj, propnum, price_default_document, keyword,
                              original_keyword, scenario, section, use_fpd, use_asof):
        """Adds cutoff to input obj

        Args:
            start_date:
            ls_expression:
            obj:
            propnum:
            price_default_document:
            keyword:
            original_keyword:
            scenario:
            section:
            use_fpd:
            use_asof:

        Returns:
            Modified input obj with cutoff included
        """

        try:
            unit = ls_expression[4]
        except IndexError:
            unit = 'LIFE'
            message = (format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                        str_join(ls_expression)))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.price.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        if unit in date_unit_list + ['IMOS', 'IYRS', 'IYR', 'IMO']:
            obj = self.process_date_format(start_date, ls_expression, obj, propnum, price_default_document, keyword,
                                           original_keyword, scenario, section, use_fpd, use_asof)
        elif unit in cumulative_unit_dic:
            obj = process_cum_format(obj, start_date, unit, ls_expression)
        else:
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=format_error_msg(
                                                                ErrorMsgEnum.invalid_msg.value, unit),
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.price.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        return obj

    def get_last_segment_per_phase(self, model_name, phase, price_default_document):
        if model_name == 'price_model':
            return price_default_document['econ_function'][model_name][phase]['rows'][-1]

        if model_name == 'differentials':
            if phase == 'oil':
                if self.dollar_diff_oil_1[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != 'Econ Limit':
                    return self.dollar_diff_oil_1[-1]
                return self.dollar_diff_oil_2[-1]
            elif phase == 'gas':
                if self.dollar_diff_gas_1[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != 'Econ Limit':
                    return self.dollar_diff_gas_1[-1]
                return self.dollar_diff_gas_2[-1]
            elif phase == 'ngl':
                if self.dollar_diff_ngl_1[-1][CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] != 'Econ Limit':
                    return self.dollar_diff_ngl_1[-1]
                return self.dollar_diff_ngl_2[-1]
            elif phase == 'drip_condensate':
                if self.dollar_diff_condensate_1[-1][CCSchemaEnum.dates.value][
                        CCSchemaEnum.end_date.value] != 'Econ Limit':
                    return self.dollar_diff_condensate_1[-1]
                return self.dollar_diff_condensate_2[-1]

    def process_list_method_format(  # noqa (C901)
            self, start_date, ls_expression, propnum, price_default_document, phase_usage_ls, keyword, original_keyword,
            cont, use_btu):
        """Adds list method of price or differentials to obj

        Notes:
            This list method need to handle PRI, PAJ, PAD all together
            nece obj or differential obj to price_default_document
            1 row will have med to append priultiple objs which need to be appended (for loop to go through)

        Args:
            start_date:
            ls_expression:
            propnum:
            price_default_document:
            phase_usage_ls:
            keyword:
            original_keyword:
            cont:
            use_btu:
        """
        phase = str(keyword).split('/')[-1].strip().lower()
        model_name = ''
        unit_key = ''

        phase = 'drip_condensate' if phase == 'cnd' else phase

        if 'PRI/' in keyword:
            model_name = 'price_model'
        elif 'PAD/' in keyword or 'PAJ/' in keyword:
            model_name = 'differentials'

        if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
            unit_key = get_price_unit_key_from_phase(phase)
        else:
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=format_error_msg(
                                                                ErrorMsgEnum.invalid_msg.value, phase),
                                                            scenario=self.scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.price.value,
                                                            section=self.section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        shift_month_year_obj = self.get_shift_month_year_multiplier(ls_expression[-1])
        shift_month = shift_month_year_obj['shift_month']
        shift_year = shift_month_year_obj['shift_year']
        multiplier = shift_month_year_obj['multiplier']

        for idx in range(1, len(ls_expression) - 1):
            obj = {}
            if '*' not in str(ls_expression[idx]):
                if ls_expression[0] != 'X' and idx == 1:
                    start_date = self.aries_data_extraction.read_start(ls_expression,
                                                                       propnum,
                                                                       self.scenario,
                                                                       ErrorMsgEnum.price.value,
                                                                       EconHeaderEnum.price_section_key.value,
                                                                       is_list=True)
                    start_date = convert_str_date_to_datetime_format(start_date, format='%m/%Y')
                    start_date, end_date = process_list_start_date_and_get_end_date(start_date, shift_month, shift_year)
                else:
                    try:
                        last_segment = self.get_last_segment_per_phase(model_name, phase, price_default_document)

                        start_date = convert_str_date_to_datetime_format(last_segment['dates']['end_date'])
                        start_date = shift_datetime_date(start_date, days=1)
                        start_date, end_date = process_list_start_date_and_get_end_date(
                            start_date, shift_month, shift_year)
                    except Exception:
                        # directly use start_date (for list method syntax 1st line use X 1 2 3 4 5 #)
                        start_date = pd.to_datetime(start_date)
                        start_date, end_date = process_list_start_date_and_get_end_date(
                            start_date, shift_month, shift_year)

                try:
                    use_value = aries_cc_round(float(ls_expression[idx]) * multiplier)
                except ValueError:
                    continue

                obj = {
                    "cap":
                    "",
                    "dates": {
                        "start_date": start_date,
                        "end_date": end_date
                    },
                    unit_key:
                    use_value,
                    'escalation_model':
                    create_default_escalation_obj(start_date, end_date, self.aries_data_extraction.get_default_format)
                }

            elif '*' in str(ls_expression[idx]):
                expression_split = ls_expression[idx].split('*')
                value = expression_split[1]
                times = expression_split[0]

                if ls_expression[0] != 'X' and idx == 1:
                    start_date = self.aries_data_extraction.read_start(ls_expression,
                                                                       propnum,
                                                                       self.scenario,
                                                                       ErrorMsgEnum.price.value,
                                                                       EconHeaderEnum.price_section_key.value,
                                                                       is_list=True)
                    start_date = convert_str_date_to_datetime_format(start_date, format='%m/%Y')
                else:
                    try:
                        last_segment = self.get_last_segment_per_phase(model_name, phase, price_default_document)

                        start_date = convert_str_date_to_datetime_format(last_segment['dates']['end_date'])
                        start_date = shift_datetime_date(start_date, days=1)
                    except Exception:
                        # directly use start_date (for list method syntax 1st line use X 1 2 3 4 5 #)
                        start_date = pd.to_datetime(start_date)

                start_date, end_date = process_list_start_date_and_get_end_date(start_date, shift_month * int(times),
                                                                                shift_year * int(times))

                try:
                    use_value = aries_cc_round(float(value) * multiplier)
                except ValueError:
                    continue

                obj = {
                    "cap":
                    "",
                    "dates": {
                        "start_date": start_date,
                        "end_date": end_date
                    },
                    unit_key:
                    use_value,
                    'escalation_model':
                    create_default_escalation_obj(start_date, end_date, self.aries_data_extraction.get_default_format)
                }

            self.update_price_based_on_keyword(obj, keyword, use_btu)

            if model_name == 'differentials':
                if phase == 'oil':
                    self.check_dollar_diff_by_resource(self.dollar_diff_oil_1, self.dollar_diff_oil_2, obj)
                elif phase == 'gas':
                    self.check_dollar_diff_by_resource(self.dollar_diff_gas_1, self.dollar_diff_gas_2, obj)
                elif phase == 'ngl':
                    self.check_dollar_diff_by_resource(self.dollar_diff_ngl_1, self.dollar_diff_ngl_2, obj)
                elif phase == 'drip_condensate':
                    self.check_dollar_diff_by_resource(self.dollar_diff_condensate_1, self.dollar_diff_condensate_2,
                                                       obj)
            else:
                price_default_document['econ_function'][model_name][phase]['rows'].append(obj)
                phase_usage_ls.add(original_keyword)
                update_list_escalation_segment(obj, self.property_id, self.scenario, keyword, cont,
                                               self.aries_data_extraction.escalation_segment_param,
                                               self.aries_data_extraction.get_default_format)

    def append_obj_and_assign_escalation(self, default_document, unique_escalation_default_document, price_obj,
                                         differential_obj, phase_usage_ls, keyword, original_keyword):
        """Appends price or differential obj and assign unique escalation default document to default document

        Args:
            default_document:
            unique_escalation_default_document:
            price_obj:
            differential_obj:
            phase_usage_ls:
            keyword:
            original_keyword:

        Returns:
            Modified default_document with the updated fields.
        """
        # append each price or differential obj and assign escalation model
        price_obj['escalation_model'] = copy.deepcopy(unique_escalation_default_document)
        if keyword == 'PRI/OIL':
            # append to rows
            default_document['econ_function']['price_model']['oil']['rows'].append(price_obj)
            phase_usage_ls.add(original_keyword)

        if keyword == 'PRI/NGL':
            # append to rows
            validate_ngl_price_document(default_document, price_obj)
            default_document['econ_function']['price_model']['ngl']['rows'].append(price_obj)
            phase_usage_ls.add(original_keyword)

        if keyword == 'PRI/GAS':
            # append to rows
            default_document['econ_function']['price_model']['gas']['rows'].append(price_obj)
            phase_usage_ls.add(original_keyword)

        if keyword == 'PRI/CND':
            # append to rows
            default_document['econ_function']['price_model']['drip_condensate']['rows'].append(price_obj)
            phase_usage_ls.add(original_keyword)

        process_differenial_obj_append(keyword, differential_obj, self.differential_ls_dict)

    def model_extraction(  # noqa (C901)
            self,
            section_economic_df: pd.DataFrame,
            header_cols,
            ls_scenarios_id,
            scenario,
            property_id,
            index,
            elt=False):
        """Extract price, escalation from section 5 df with START keyword

        Args:
            section_economic_df:
            header_cols:
            ls_scenarios_id:
            scenario:
            property_id:
            index:
        """
        self.pre_process()

        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')

        self.property_id = property_id
        self.scenario = scenario
        self.ls_scenarios_id = ls_scenarios_id

        ################################
        # price format filling
        ################################
        price_default_document = self.aries_data_extraction.get_default_format('pricing')
        differential_default_document = self.aries_data_extraction.get_default_format('differentials')

        # Initialize use_btu, use_fpd, use_asof
        price_conditionals = PriceConditionals(False, False, False)

        price_model_name = ''
        diff_model_name = ''

        phase_usage_ls = set()

        multiple_price_dict = {
            PhaseEnum.oil.value: False,
            PhaseEnum.gas.value: False,
            PhaseEnum.ngl.value: False,
            PhaseEnum.condensate.value: False
        }

        # list of keywords to ignore
        ignore_list = ['TEXT']

        # set of phase price decks using list method
        phases_using_list_price = set()

        section_economic_df = pd.DataFrame(section_economic_df, columns=header_cols)
        for _, row_value in section_economic_df.iterrows():
            use_oil_price_as_base = False
            try:
                economic_row = Economic(
                    row_value[EconHeaderEnum.keyword.value], row_value[EconHeaderEnum.propnum.value],
                    row_value[EconHeaderEnum.initial_keyword.value], row_value[EconHeaderEnum.expression.value],
                    row_value[EconHeaderEnum.qualifier.value], row_value[EconHeaderEnum.section.value],
                    row_value[EconHeaderEnum.sequence.value])

                keyword = economic_row.keyword
                self.section = economic_row.section

                if str(keyword).strip().upper() == 'TEXT' or keyword.startswith('*') or keyword in ignore_list:
                    continue

                economic_row.ls_expression = self.build_ls_expression(economic_row.expression,
                                                                      self.section,
                                                                      keyword,
                                                                      self.__class__.__name__,
                                                                      ignore_char='#')

                if economic_row.keyword in CC_ARIES_OVERLAY_PRICE_DICT or keyword == 'PRI/NGL':
                    overlay_differentials = process_expression_for_overlay_differentials(
                        economic_row.ls_expression, economic_row.keyword)
                    economic_row.ls_expression = overlay_differentials[0]
                    economic_row.keyword = overlay_differentials[1]
                    use_oil_price_as_base = overlay_differentials[2]

                # Convert stream number into product name
                if economic_row.keyword in STREAM_PRICE_KEYWORD_DICT:
                    economic_row.keyword = 'PRI/' + str(STREAM_PRICE_KEYWORD_DICT[economic_row.keyword]).upper()

                if 'PRI' in economic_row.keyword:
                    economic_row.keyword = stop_at_first_price_model(economic_row.keyword,
                                                                     economic_row.original_keyword, multiple_price_dict,
                                                                     phase_usage_ls, price_default_document)

                if economic_row.keyword == 'START':
                    # START format could be 7/2017, 7/23/2017, 2017.25, 7/23/2017 0:00
                    # (2017.25 need to special handle if . exist in START)
                    # update the start_date = 07/2017, 07/2017, 03/2017, 07/2017
                    start_date = self.aries_data_extraction.read_start(economic_row.ls_expression, economic_row.propnum,
                                                                       scenario, ErrorMsgEnum.price_diff.value,
                                                                       self.section)
                    if start_date is None:
                        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')
                elif economic_row.keyword == 'BTU':
                    price_conditionals.use_btu = True
                else:
                    price_differentials = self.process_price_differential_object(
                        economic_row, price_conditionals, start_date, scenario, price_default_document,
                        differential_default_document, phase_usage_ls, phases_using_list_price, use_oil_price_as_base)

                    if price_differentials is None:
                        continue

                    price_model_name, diff_model_name = price_differentials
            except Exception:
                if self.section == EconHeaderEnum.price_section_key.value:
                    self.aries_data_extraction.log_report.log_error(
                        aries_row=str_join(economic_row.ls_expression),
                        message=format_error_msg(ErrorMsgEnum.class8_msg.value, ErrorMsgEnum.price_diff_param.value,
                                                 economic_row.keyword),
                        scenario=scenario,
                        well=property_id,
                        model=ErrorMsgEnum.price_diff.value,
                        section=self.section,
                        severity=ErrorMsgSeverityEnum.warn.value)

        differential_backup_return = self.validate_price_backup(price_default_document, price_model_name,
                                                                diff_model_name)

        use_differential_model, price_model_name, diff_model_name = differential_backup_return

        price_default_document = self.process_default_document(price_default_document)

        price_default_document = set_price_start_date_to_base_date(price_default_document,
                                                                   self.aries_data_extraction.dates_1_base_date,
                                                                   phases_using_list_price)
        price_default_document = combine_price_rows(
            price_default_document, self.property_id, self.scenario, self.aries_data_extraction.scenarios_dic,
            ls_scenarios_id, self.aries_data_extraction.escalation_data_list,
            self.aries_data_extraction.compare_escalation_and_save_into_self_data_list,
            self.aries_data_extraction.user_id)

        price_model_name = (price_model_name
                            or f'ARIES_CC_{price_default_document[CCSchemaEnum.assumption_key.value].upper()}')
        for phase, use in multiple_price_dict.items():
            if use:
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(economic_row.ls_expression),
                                                                message=format_error_msg(
                                                                    ErrorMsgEnum.multiple_price_msg.value,
                                                                    phase.upper()),
                                                                scenario=scenario,
                                                                well=property_id,
                                                                model=ErrorMsgEnum.price.value,
                                                                section=self.section,
                                                                severity=ErrorMsgSeverityEnum.warn.value)

        # compare and save into data_list
        self.aries_data_extraction.compare_and_save_into_self_data_list(price_default_document,
                                                                        self.aries_data_extraction.price_data_list,
                                                                        self.aries_data_extraction.projects_dic,
                                                                        model_name=price_model_name,
                                                                        aries=True)

        if self.orphan_diff_ls_dict:
            orphan_diff_default = self.aries_data_extraction.get_default_format('differentials')
            self.process_orphan_diff_models(orphan_diff_default, f'ALT_{diff_model_name}')

        if use_differential_model:
            self.append_differential_row_to_data_list(differential_default_document, diff_model_name)
