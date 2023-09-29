import copy
import datetime
from typing import Optional, Union

import pandas as pd

from api.aries_phdwin_imports.aries_data_extraction.dataclasses.common import Economic
from api.aries_phdwin_imports.aries_data_extraction.dataclasses.tax_expense import TaxModel, TaxConditionals, \
    TaxExpenseNaming, TaxExpenseBase, ExpenseValues
from api.aries_phdwin_imports.aries_import_helpers import (
    FIXED_EXPENSE_KEYWORD_PER_WELL, FIXED_EXPENSE_KEYWORD_TOTAL, get_fixed_expense_name,
    handle_overlay_expense_sequence, get_fixed_cost_name_from_assignment_dict, get_opc_expense_name,
    get_last_segment_from_overlay_override, str_join, get_expense_description_name,
    FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT, get_model_name_from_qualifiers, check_if_to_store_in_expense_hold,
    compare_cap_and_value, REVENUE_BASED_VAR_EXPENSE_KEY_DICT, DEFAULT_TAX_EXPENSE_OBJ,
    convert_str_date_to_datetime_format, process_list_start_date_and_get_end_date, update_use_std_dict,
    check_if_overlay_operation_process, atx_std_handle, check_if_more_than_one_element, add_hold_expense_doc)
from api.aries_phdwin_imports.combine_rows import (aries_cc_round, get_unit_key_and_clean_row_for_taxes,
                                                   shift_datetime_date, standardize_tax_units, override_tax_overlay,
                                                   combine_tax_rows, combine_variable_expense_rows,
                                                   combine_fixed_expense_rows, override_expense_overlay,
                                                   get_obj_by_well_count)
from api.aries_phdwin_imports.error import (format_error_msg, ErrorMsgEnum)
from api.aries_phdwin_imports.helpers import (
    check_for_inconsistent_date, format_aries_segment_date, update_fpd_asof_date, get_day_month_from_decimal_date,
    get_day_month_year_from_decimal_date, date_unit_list, cumulative_unit_dic, process_cum_format,
    create_default_escalation_obj, update_list_escalation_segment, handle_shortened_aries_tax_syntax,
    handle_stx_keyword, update_tax_obj_from_aries_unit, update_tax_model_with_backup_values,
    reorder_tax_document_row_for_rate_cut_off, update_fixed_expense_with_multiplier,
    reorder_expense_document_row_for_rate_cut_off, convert_tax_dates_to_offset, convert_expense_dates_to_offset,
    MAX_ALLOWABLE_MONTHS, get_overlayed_key)
from api.aries_phdwin_imports.interfaces.model_extraction import ModelExtractionInterface
from combocurve.shared.aries_import_enums import EconEnum, PhaseEnum, UnitEnum, EconHeaderEnum, CCSchemaEnum
from combocurve.utils.constants import DAYS_IN_MONTH


class TaxExpense(ModelExtractionInterface):
    def __init__(self, aries_data_extraction):
        super().__init__(aries_data_extraction)
        self.opc_usage_dict = {}

    def pre_process(self):
        self.opc_usage_dict = {
            PhaseEnum.oil.value: {
                EconEnum.gathering.value: False,
                EconEnum.opc.value: False,
                EconEnum.market.value: False,
                EconEnum.other.value: False
            },
            PhaseEnum.gas.value: {
                EconEnum.opc.value: False
            },
            PhaseEnum.ngl.value: {
                EconEnum.gathering.value: False,
                EconEnum.opc.value: False,
                EconEnum.transport.value: False,
                EconEnum.market.value: False,
                EconEnum.other.value: False
            },
            PhaseEnum.condensate.value: {
                EconEnum.gathering.value: False,
                EconEnum.opc.value: False,
                EconEnum.transport.value: False,
                EconEnum.market.value: False,
                EconEnum.other.value: False
            }
        }

    @classmethod
    def assign_key_based_on_keyword(cls, keyword, phase):
        if keyword == 'ATX/T':
            return 'dollar_per_month'
        elif phase == 'gas':
            return 'dollar_per_mcf'
        else:
            return 'pct_of revenue'

    @classmethod
    def format_obj_key(cls, keyword, key):
        if 'ATX' in keyword or 'STX' in keyword or 'STD' in keyword:
            return f'{keyword}-{EconEnum.overlay_sequence.value}-{key}'
        return f'{keyword}-{EconEnum.overlay_sequence.value}'

    @classmethod
    def assign_fixed_expense_to_obj(cls, obj, ls_expression, fixed_cost_name, expense_default_document):
        try:
            cap_int = aries_cc_round(eval(str(ls_expression[1])))
        except (IndexError, ValueError, NameError):
            cap_int = None

        if cap_int is not None:
            if cap_int == 0:
                obj['fixed_expense'] = float(expense_default_document['econ_function']['fixed_expenses']
                                             [fixed_cost_name]['rows'][-1]['fixed_expense'])
            elif float(expense_default_document['econ_function']['fixed_expenses'][fixed_cost_name]['rows'][-1]
                       ['fixed_expense']) >= cap_int:
                obj['fixed_expense'] = cap_int
            else:
                obj['fixed_expense'] = float(expense_default_document['econ_function']['fixed_expenses']
                                             [fixed_cost_name]['rows'][-1]['fixed_expense'])
        else:
            obj['fixed_expense'] = float(expense_default_document['econ_function']['fixed_expenses'][fixed_cost_name]
                                         ['rows'][-1]['fixed_expense'])

    @classmethod
    def update_expense_tax_offset_obj_rate(cls, last_segment: dict, cutoff_unit: str, obj: dict,
                                           ls_expression: list[str]):
        """

        Args:
            last_segment:
            cutoff_unit:
            obj:
            ls_expression:

        Returns:

        """
        rate_unit = next(key for key in last_segment if 'rate' in key)
        last = last_segment[rate_unit][CCSchemaEnum.start.value]
        if last != 0:
            if cutoff_unit in [UnitEnum.bbl_per_day.value, UnitEnum.mcf_per_day.value]:
                start = aries_cc_round(float(ls_expression[3]))
            else:
                start = 0
            del obj[CCSchemaEnum.dates.value]
            obj[rate_unit] = {CCSchemaEnum.start.value: start, CCSchemaEnum.end.value: last}
            return obj, True
        else:
            return None, True

    @classmethod
    def update_expense_tax_offset_obj_offset(cls, last_segment: dict, cutoff_unit: str,
                                             tax_conditionals: TaxConditionals, start: Optional[str]):
        """

        Args:
            last_segment:
            cutoff_unit:
            tax_conditionals:
            start:
        """
        def assign_start(last, conditional):
            try:
                start_local = round(float(last))
            except ValueError:
                if last == EconEnum.econ_limit.value:
                    setattr(tax_conditionals, conditional, True)
                return None
            if start_local == MAX_ALLOWABLE_MONTHS:
                return 0

        if tax_conditionals.use_asof:
            last_value = last_segment[EconEnum.asof_offset.value][CCSchemaEnum.end.value]
            start = assign_start(last_value, 'start_asof')
        elif tax_conditionals.use_fpd:
            last_value = last_segment[EconEnum.fpd_offset.value][CCSchemaEnum.end.value]
            start = assign_start(last_value, 'start_fpd')
        if cutoff_unit in [UnitEnum.bbl_per_day.value, UnitEnum.mcf_per_day.value]:
            cutoff_unit = UnitEnum.life.value
        return start, cutoff_unit

    @classmethod
    def check_last_segment_for_keys(cls, obj: dict, tax_conditionals: TaxConditionals, economic_values: Economic,
                                    tax_exp_base: TaxExpenseBase, last_segment: dict):
        """

        Args:
            obj:
            tax_conditionals:
            economic_values:
            tax_exp_base:
            last_segment:

        Returns:

        """
        tax_conditionals.start_fpd = False
        tax_conditionals.start_asof = False
        tax_conditionals.auto_return = False

        start = None
        cutoff_unit = economic_values.ls_expression[4]

        original_keyword = economic_values.original_keyword
        keyword = economic_values.keyword

        start_date = tax_exp_base.start_date

        if last_segment is not None:
            has_rate = any('rate' in key for key in last_segment)
            has_offset = any('offset' in key for key in last_segment)
            if has_rate:
                obj, tax_conditionals.auto_return = cls.update_expense_tax_offset_obj_rate(
                    last_segment, cutoff_unit, obj, economic_values.ls_expression)
            elif has_offset:
                start, cutoff_unit = cls.update_expense_tax_offset_obj_offset(last_segment, cutoff_unit,
                                                                              tax_conditionals, start)
            else:
                last_date = pd.to_datetime(last_segment[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value],
                                           errors='coerce')
                if not pd.isnull(last_date):
                    last_date += pd.DateOffset(days=1)
                    start_date = last_date.strftime(CCSchemaEnum.mdy_date_slash_format.value)
                else:
                    tax_conditionals.auto_return = True if original_keyword == '"' else tax_conditionals.auto_return
                if cutoff_unit in [UnitEnum.bbl_per_day.value, UnitEnum.mcf_per_day.value]:
                    cutoff_unit = UnitEnum.life.value
                    tax_exp_base.ignore_list.append(keyword)
        else:
            if tax_conditionals.use_asof:
                tax_conditionals.start_asof = True
            elif tax_conditionals.use_fpd:
                tax_conditionals.start_fpd = True

        return start, cutoff_unit, start_date

    @classmethod
    def get_last_segment(cls, document: dict, tax_model: TaxModel):
        """

        Args:
            document: Document from which the last segment will be extracted
            tax_model:

        Returns:
            Last element end_date as new start_date
        """
        model_name = tax_model.model_name
        phase = tax_model.phase
        expense = tax_model.expense
        fixed_cost_name = tax_model.fixed_cost_name

        # if rows for price > 1 or phase_list for differentials > 0 (assume the last element use dates as cutoff)
        if model_name == 'ad_valorem_tax' or model_name == 'water_disposal':
            if len(document['econ_function'][model_name]['rows']) > 1:
                return document['econ_function'][model_name]['rows'][-1]

        elif model_name == 'fixed_expenses':
            if len(document['econ_function'][model_name][fixed_cost_name]['rows']) > 1:
                return document['econ_function'][model_name][fixed_cost_name]['rows'][-1]

        elif model_name == 'severance_tax':
            if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                if len(document['econ_function'][model_name][phase]['rows']) > 1:
                    return document['econ_function'][model_name][phase]['rows'][-1]
        else:
            if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                if len(document['econ_function'][model_name][phase][expense]['rows']) > 1:
                    return document['econ_function'][model_name][phase][expense]['rows'][-1]
        return

    @classmethod
    def update_obj_based_on_yr_cutoff(cls, obj: dict, start: str, cutoff_unit: str, formated_start_date: pd.DateOffset,
                                      new_start_date: str, tax_conditionals: TaxConditionals, expression: str):
        """Updates obj based on tax_conditionals and the cutoff units: `YR`, `YRS`, `IYR` and `IYRS`

        Args:
            obj:
            start:
            cutoff_unit:
            formated_start_date:
            new_start_date:
            tax_conditionals:
            expression:
        Returns:
            True if the update is successful. False otherwise.
        """
        shift_day, shift_month, shift_year = get_day_month_year_from_decimal_date(abs(float(expression)))

        formated_end_date = formated_start_date + pd.DateOffset(years=shift_year, months=shift_month,
                                                                days=shift_day) + pd.offsets.MonthBegin(0)

        if formated_start_date == formated_end_date:
            return False

        if cutoff_unit in ['YR', 'YRS']:
            formated_start_date = pd.to_datetime(new_start_date)
            formated_end_date += pd.DateOffset(days=-1)
            update_fpd_asof_date(obj, start, formated_start_date, formated_end_date, tax_conditionals.use_fpd,
                                 tax_conditionals.use_asof, tax_conditionals.start_asof, tax_conditionals.start_fpd)

            return True
        elif cutoff_unit in ['IYR', 'IYRS']:
            formated_end_date += pd.DateOffset(days=-1)
            update_fpd_asof_date(obj,
                                 start,
                                 formated_start_date,
                                 formated_end_date,
                                 tax_conditionals.use_fpd,
                                 tax_conditionals.use_asof,
                                 tax_conditionals.start_asof,
                                 tax_conditionals.start_fpd,
                                 incremental=True)

            return True
        return False

    @classmethod
    def update_obj_based_on_mo_cutoff(cls, obj: dict, start: str, start_date: str, new_start_date: str,
                                      tax_conditionals: TaxConditionals, cutoff_unit: str, expression: str):
        """Updates obj based on tax_conditionals and the cutoff units: `YR`, `YRS`, `IYR` and `IYRS`

        Args:
            obj:
            start:
            start_date:
            new_start_date:
            tax_conditionals:
            cutoff_unit:
            expression:

        Returns:
            True if the update is successful. False otherwise.
        """
        if cutoff_unit == 'MO' or cutoff_unit == 'MOS':
            formated_start_date = pd.to_datetime(start_date) + pd.offsets.MonthBegin(0)
            shift_day, shift_month = get_day_month_from_decimal_date(abs(float(expression)))
            formated_end_date = formated_start_date + pd.DateOffset(months=shift_month,
                                                                    days=shift_day) + pd.offsets.MonthBegin(0)

            if formated_start_date == formated_end_date:
                return False

            formated_start_date = pd.to_datetime(new_start_date)
            formated_end_date += pd.DateOffset(days=-1)
            update_fpd_asof_date(obj, start, formated_start_date, formated_end_date, tax_conditionals.use_fpd,
                                 tax_conditionals.use_asof, tax_conditionals.start_asof, tax_conditionals.start_fpd)
        elif cutoff_unit in ['IMO', 'IMOS']:
            formated_start_date = pd.to_datetime(new_start_date) + pd.offsets.MonthBegin(0)
            shift_day, shift_month = get_day_month_from_decimal_date(round(abs(float(expression))))
            formated_end_date = formated_start_date + pd.DateOffset(months=shift_month,
                                                                    days=shift_day) + pd.offsets.MonthBegin(0)

            if formated_start_date == formated_end_date:
                return False

            formated_end_date += pd.DateOffset(days=-1)
            update_fpd_asof_date(obj,
                                 start,
                                 formated_start_date,
                                 formated_end_date,
                                 tax_conditionals.use_fpd,
                                 tax_conditionals.use_asof,
                                 tax_conditionals.start_asof,
                                 tax_conditionals.start_fpd,
                                 incremental=True)
        return True

    @classmethod
    def update_obj_based_on_phase_model_name(cls,
                                             value: str,
                                             ls_expression: str,
                                             phase: str,
                                             obj: dict,
                                             keyword: str,
                                             multiplier: int,
                                             model_name: str,
                                             use_std_dict: dict,
                                             validate_water: bool = False):
        """

        Args:
            value:
            ls_expression:
            phase:
            obj:
            keyword:
            multiplier:
            model_name:
            use_std_dict:
            validate_water:

        Returns:
            use_std_dict reference, both when it is updated or not.
        """
        if phase == 'gas':
            obj['dollar_per_mcf'] = float(value) * multiplier
            obj.pop('dollar_per_month', None)
            if model_name not in ['ad_valorem_tax', 'severance_tax']:
                obj.pop('pct_of_revenue', None)
        elif model_name == 'fixed_expenses':
            obj['fixed_expense'] = float(value) * multiplier
            if 'Y' in ls_expression:
                obj['fixed_expense'] /= 12
            obj.pop('pct_of_revenue', None)
        elif phase in ['oil', 'ngl', 'drip_condensate', 't'] or (validate_water and model_name == 'water_disposal'):
            if all(['ATX' not in keyword, 'STX' not in keyword, 'STD' not in keyword]):
                # only change to unit cost for expense model
                obj['dollar_per_bbl'] = float(value) * multiplier
                if model_name not in ['ad_valorem_tax', 'severance_tax']:
                    obj.pop('dollar_per_month', None)
                obj.pop('pct_of_revenue', None)
            elif 'pct_of_revenue' in obj:
                if keyword == 'ATX/T':
                    obj['dollar_per_month'] = obj['pct_of_revenue']
                    obj['pct_of_revenue'] = 0
                    if 'Y' in ls_expression:
                        obj['dollar_per_month'] /= 12
                elif 'STD' in keyword:
                    # Update use_std_dict values
                    update_use_std_dict(keyword, use_std_dict)
                    obj['dollar_per_bbl'] = float(value) * multiplier
                    obj.pop('pct_of_revenue', None)
                elif 'STX' in keyword:
                    obj.pop('dollar_per_month', None)
                    obj['dollar_per_bbl'] = 0

    @classmethod
    def update_stx_results_based_on_unit(cls, stx_rows: list[dict], phase: str, unit: str):
        """Adjusts the values (if necessary) for data imported with STX/xxx keyword.

        Args:
            stx_rows: Rows processed under the STX/xxx keyword
            phase: Phase associated to the rows.
            unit: Unit to be evaluated '%' or '$/x'
        """
        value_unit = 'dollar_per_mcf' if phase == 'gas' else 'dollar_per_bbl'
        for row in stx_rows:
            if unit == '%':
                row[value_unit] = 0
                # Convert into a percentage value only if the original value is less than 1.
                if row.get('pct_of_revenue', 0) <= 1:
                    row['pct_of_revenue'] *= 100
            elif '$' in unit:
                row[value_unit] = row['pct_of_revenue']
                row['pct_of_revenue'] = 0

    @classmethod
    def update_tax_expense_overlay_dict(cls, keyword: str, obj: dict, use_obj: str, tax_expense_overlay_dict: dict):
        """Updates the tax_expense_overlay_dict with obj or use_obj as reference

        Args:
            keyword:
            obj:
            use_obj:
            tax_expense_overlay_dict:
        """
        if f'{keyword}-{EconEnum.overlay_sequence.value}' in tax_expense_overlay_dict:
            tax_expense_overlay_dict[use_obj].append(obj)
        else:
            tax_expense_overlay_dict[use_obj] = [obj]

    def update_econ_function_based_on_sequence(self, obj: dict, tax_expense_overlay_dict: dict, default_document: dict,
                                               tax_model: TaxModel, sequence: Union[int, str], keyword: str, phase: str,
                                               cont: str):
        """Validates the sequence and update the econ function accordingly

        Args:
            obj:
            tax_expense_overlay_dict:
            default_document:
            tax_model:
            sequence:
            keyword:
            phase:
            cont:
        """
        if sequence == EconEnum.overlay_sequence.value:
            unit, key = get_overlayed_key(self.section_economic_df, keyword)

            if 'STX' in keyword:
                self.update_stx_results_based_on_unit([obj], phase, unit)

            use_obj = self.format_obj_key(keyword, key)
            self.update_tax_expense_overlay_dict(keyword, obj, use_obj, tax_expense_overlay_dict)
        else:
            use_obj = obj

        self.update_econ_function(default_document,
                                  tax_model.model_name,
                                  use_obj,
                                  fixed_cost_name=tax_model.fixed_cost_name,
                                  keyword=keyword,
                                  cont=cont,
                                  phase=phase,
                                  expense=tax_model.expense)

    def update_econ_function(self, default_document, model_name, use_obj, *args, **kwargs):
        """Updates the econ function object contained in the default_dicument obj

        Args:
            default_document:
            model_name:
            use_obj:

        Keyword Args:
            fixed_cost_name:
            keyword:
            cont:
            phase:
            expense:
        """
        fixed_cost_name = kwargs['fixed_cost_name']
        keyword = kwargs['keyword']
        cont = kwargs['cont']
        phase = kwargs['phase']
        expense = kwargs['expense']

        if model_name == 'ad_valorem_tax' or model_name == 'water_disposal':
            default_document['econ_function'][model_name]['rows'].append(use_obj)
        elif model_name == 'fixed_expenses':
            description = default_document['econ_function'][model_name][fixed_cost_name]['description']
            default_document['econ_function'][model_name][fixed_cost_name][
                'description'] = get_expense_description_name(keyword, description)
            default_document['econ_function'][model_name][fixed_cost_name]['rows'].append(use_obj)
            update_list_escalation_segment(use_obj, self.property_id, self.scenario, keyword, cont,
                                           self.aries_data_extraction.escalation_segment_param,
                                           self.aries_data_extraction.get_default_format)
        elif model_name == 'severance_tax':
            default_document['econ_function'][model_name][phase]['rows'].append(use_obj)
        else:
            # need to handle expenses name (variable_expenses)
            description = default_document['econ_function'][model_name][phase][expense]['description']
            default_document['econ_function'][model_name][phase][expense]['description'] = get_expense_description_name(
                keyword, description)
            default_document['econ_function'][model_name][phase][expense]['rows'].append(use_obj)
            update_list_escalation_segment(use_obj, self.property_id, self.scenario, keyword, cont,
                                           self.aries_data_extraction.escalation_segment_param,
                                           self.aries_data_extraction.get_default_format)

    def extract_model_name_from_keyword(self,
                                        keyword: str,
                                        original_keyword: str,
                                        phase: str,
                                        expense_default_document: dict,
                                        fixed_exp_assignment: dict,
                                        assign: bool = True):
        """

        Args:
            keyword:
            original_keyword:
            phase:
            fixed_exp_assignment:
            expense_default_document:
            assign:
        """
        # fixed expense keyword list
        fixed_exp_keyword_ls = FIXED_EXPENSE_KEYWORD_PER_WELL + FIXED_EXPENSE_KEYWORD_TOTAL

        # Initialize model_name_
        tax_model = TaxModel()

        tax_model.phase = phase
        tax_model.model_name = None
        tax_model.expense = None
        tax_model.fixed_cost_name = None

        if 'ATX' in keyword:
            tax_model.model_name = 'ad_valorem_tax'
        elif 'STX' in keyword or 'STD' in keyword:
            tax_model.model_name = 'severance_tax'
        elif keyword in fixed_exp_keyword_ls:
            if assign:
                tax_model.fixed_cost_name, tax_model.model_name, fixed_exp_assignment = get_fixed_expense_name(
                    keyword, original_keyword, fixed_exp_assignment)
            else:
                tax_model.fixed_cost_name, _ = get_fixed_cost_name_from_assignment_dict(keyword, fixed_exp_assignment)
                tax_model.model_name = EconEnum.fixed_expense.value

        elif 'CMP' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = 'other'
            tax_model.phase = phase if phase != 'rev' else PhaseEnum.gas.value
        elif 'GPC' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = 'gathering'
            tax_model.phase = phase if phase != 'rev' else PhaseEnum.gas.value
        elif 'GTC' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = 'transportation'
            tax_model.phase = phase if phase != 'rev' else PhaseEnum.gas.value
        elif 'LTC' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = 'transportation'
            tax_model.phase = phase if phase != 'rev' else PhaseEnum.oil.value
        elif 'OPC' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = get_opc_expense_name(keyword, original_keyword, self.opc_usage_dict,
                                                     expense_default_document)
        elif 'TRC' in keyword:
            tax_model.model_name = 'variable_expenses'
            tax_model.expense = 'marketing'
            tax_model.phase = phase if phase != 'rev' else PhaseEnum.gas.value

        if phase == 'cnd':
            tax_model.phase = 'drip_condensate'
        elif phase == 'wtr':
            tax_model.model_name = 'water_disposal'

        return tax_model

    def process_date_format(self, obj: dict, economic_values: Economic, tax_conditionals: TaxConditionals,
                            tax_exp_base: TaxExpenseBase, default_document: dict):
        """Adds start_date or end_date to obj input obj

        Args:
            obj:
            economic_values:
            tax_conditionals:
            tax_exp_base:
            default_document
        """
        keyword = economic_values.keyword
        original_keyword = economic_values.original_keyword
        ls_expression = economic_values.ls_expression

        phase = keyword.split('/')[-1].strip().lower()
        tax_model = self.extract_model_name_from_keyword(keyword, original_keyword, phase,
                                                         tax_exp_base.exp_default_document,
                                                         tax_exp_base.fixed_exp_assignment)

        last_segment = self.get_last_segment(default_document, tax_model)

        last_segment = get_last_segment_from_overlay_override(last_segment, tax_exp_base.tax_expense_overlay_dict)
        last_segment = None if original_keyword != '"' else last_segment

        # process start_date and end_date
        try:
            ls_expression[4]
        except IndexError:
            self.error_log(str_join(ls_expression),
                           format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                            str_join(ls_expression)),
                           self.section,
                           model=self.__class__.__name__)

        (start, cutoff_unit, new_start_date) = self.check_last_segment_for_keys(obj, tax_conditionals, economic_values,
                                                                                tax_exp_base, last_segment)
        if tax_conditionals.auto_return:
            return

        ls_expression = check_for_inconsistent_date(ls_expression, keyword, self.aries_data_extraction.log_report,
                                                    self.scenario, economic_values.propnum, self.section)
        cutoff_unit = ls_expression[4]

        try:
            if cutoff_unit == 'AD':
                formated_start_date = pd.to_datetime(new_start_date) + pd.offsets.MonthBegin(0)
                formated_end_date = format_aries_segment_date(ls_expression[3],
                                                              self.aries_data_extraction.dates_1_base_date)
                formated_end_date += pd.offsets.MonthBegin(0)
                if formated_start_date == formated_end_date:
                    return

                formated_end_date += pd.DateOffset(days=-1)
                update_fpd_asof_date(obj, start, formated_start_date, formated_end_date, tax_conditionals.use_fpd,
                                     tax_conditionals.use_asof, tax_conditionals.start_asof, tax_conditionals.start_fpd)
            elif cutoff_unit in ['MO', 'MOS', 'IMO', 'IMOS']:
                if not self.update_obj_based_on_mo_cutoff(obj, start, tax_exp_base.start_date, new_start_date,
                                                          tax_conditionals, cutoff_unit, ls_expression[3]):
                    return

            elif cutoff_unit in ['YR', 'YRS', 'IYR', 'IYRS']:
                formated_start_date = pd.to_datetime(tax_exp_base.start_date) + pd.offsets.MonthBegin(0)
                if not self.update_obj_based_on_yr_cutoff(obj, start, cutoff_unit, formated_start_date, new_start_date,
                                                          tax_conditionals, ls_expression[3]):
                    return

            elif cutoff_unit in [UnitEnum.bbl_per_day.value, UnitEnum.mcf_per_day.value]:
                del obj['dates']
                if cutoff_unit == UnitEnum.bbl_per_day.value:
                    obj['oil_rate'] = {'start': aries_cc_round(float(ls_expression[3])), 'end': 'inf'}
                elif cutoff_unit == UnitEnum.mcf_per_day.value:
                    obj['gas_rate'] = {'start': aries_cc_round(float(ls_expression[3])), 'end': 'inf'}
            elif cutoff_unit == 'LIFE':
                formated_start_date = pd.to_datetime(new_start_date)
                update_fpd_asof_date(obj,
                                     start,
                                     formated_start_date,
                                     'Econ Limit',
                                     tax_conditionals.use_fpd,
                                     tax_conditionals.use_asof,
                                     tax_conditionals.start_asof,
                                     tax_conditionals.start_fpd,
                                     life=True)
        except Exception:
            message = (format_error_msg(ErrorMsgEnum.cut_off_date_error_msg.value, tax_exp_base.start_date))
            self.error_log(str_join(ls_expression), message, self.section, model=self.__class__.__name__)

    def process_cutoff_format(self, obj: dict, economic_values: Economic, tax_conditionals: TaxConditionals,
                              tax_exp_base: TaxExpenseBase, default_document_str: str):
        """Adds cutoff to input obj

        Args:
            obj:
            economic_values:
            tax_conditionals:
            tax_exp_base:
            default_document_str:
        """
        default_document = getattr(tax_exp_base, default_document_str, tax_exp_base.tax_default_document)

        unit = None
        ls_expression = economic_values.ls_expression
        try:
            unit = ls_expression[4]
        except IndexError:
            message = (format_error_msg(ErrorMsgEnum.class6_msg.value, str_join(ls_expression)))
            self.error_log(str_join(ls_expression), message, self.section, model=self.__class__.__name__)

        if unit in date_unit_list + [
                UnitEnum.incr_month.value, UnitEnum.incr_months.value, UnitEnum.bbl_per_day.value,
                UnitEnum.mcf_per_day.value, UnitEnum.incr_year.value, UnitEnum.incr_years.value
        ]:
            self.process_date_format(obj, economic_values, tax_conditionals, tax_exp_base, default_document)
        elif unit in cumulative_unit_dic:
            # Update obj cum format
            process_cum_format(obj, tax_exp_base.start_date, unit, ls_expression)
        else:
            self.error_log(str_join(ls_expression),
                           format_error_msg(ErrorMsgEnum.invalid_msg.value, unit),
                           self.section,
                           model=self.__class__.__name__)

    def append_obj_and_assign_escalation(self,
                                         default_document: dict,
                                         obj: dict,
                                         keyword: str,
                                         original_keyword: str,
                                         fixed_exp_assignment: dict,
                                         overlay: bool = False):
        """Appends tax or expense obj

        Args:
            default_document:
            obj:
            keyword:
            original_keyword:
            fixed_exp_assignment:
            overlay:
        """
        phase = keyword.split('/')[-1].lower()

        # tax model
        tax_model = self.extract_model_name_from_keyword(keyword,
                                                         original_keyword,
                                                         phase,
                                                         default_document,
                                                         fixed_exp_assignment,
                                                         assign=False)
        model_name = tax_model.model_name
        fixed_cost_name = tax_model.fixed_cost_name
        expense = tax_model.expense
        phase = tax_model.phase

        if not model_name:
            # deal with keyword that not covered
            return default_document

        if overlay:
            if 'STX' in keyword or 'ATX' in keyword or 'STD' in keyword:
                if self.aries_data_extraction.main_tax_unit[phase] is not None:
                    use_obj = f'{keyword}-{EconEnum.overlay_sequence.value}' \
                              f'-{self.aries_data_extraction.main_tax_unit[phase]}'
            else:
                use_obj = f'{keyword}-{EconEnum.overlay_sequence.value}'
        else:
            use_obj = obj

        # tax model
        if model_name == 'ad_valorem_tax' or model_name == 'water_disposal':
            default_document['econ_function'][model_name]['rows'].append(use_obj)
        elif model_name == 'fixed_expenses':
            if type(use_obj) is list:
                for row_obj in obj:
                    default_document['econ_function'][model_name][fixed_cost_name]['rows'].append(row_obj)
            else:
                default_document['econ_function'][model_name][fixed_cost_name]['rows'].append(use_obj)
        elif model_name == 'severance_tax':
            if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                default_document['econ_function'][model_name][phase]['rows'].append(use_obj)
        # expense model
        else:
            # append obj to default (for expense) and also assign escalation
            if phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                description = default_document['econ_function'][model_name][phase][expense]['description']
                default_document['econ_function'][model_name][phase][expense][
                    'description'] = get_expense_description_name(keyword, description)
                default_document['econ_function'][model_name][phase][expense]['rows'].append(use_obj)
        # append escalation for expense
        # special handle for LTC/OIL
        if keyword == 'LTC/OIL':
            default_document['econ_function'][model_name]['drip_condensate'][expense]['rows'].append(
                copy.deepcopy(use_obj))

        return default_document

    def process_list_method_format(self, economic_values: Economic, tax_exp_base: TaxExpenseBase,
                                   default_document_str: str, cont: str):
        """
        input: start_date, ls_expression, obj, propnum
        output: add list method of tax or expense to obj

        note: this list method need to handle PRI, PAJ, PAD all together
              need to append tax or expense obj to default_document
              1 row will have multiple objs which need to be appended (for loop to go through)
        """
        # Importing here to avoid cyclical import
        from api.aries_phdwin_imports.aries_data_extraction.helpers.common import get_shift_month_year_multiplier

        keyword = economic_values.keyword
        original_keyword = economic_values.original_keyword
        ls_expression = economic_values.ls_expression
        propnum = economic_values.propnum
        sequence = economic_values.sequence

        default_document = getattr(tax_exp_base, default_document_str, tax_exp_base.tax_default_document)

        phase = keyword.split('/')[-1].lower()

        tax_model = self.extract_model_name_from_keyword(keyword, original_keyword, phase,
                                                         tax_exp_base.exp_default_document,
                                                         tax_exp_base.fixed_exp_assignment)

        shift_month_year = get_shift_month_year_multiplier(ls_expression[-1])

        shift_month = shift_month_year['shift_month']
        shift_year = shift_month_year['shift_year']
        multiplier = shift_month_year['multiplier']

        for idx in range(1, len(ls_expression) - 1):
            last_segment = self.get_last_segment(default_document, tax_model)

            if '*' not in str(ls_expression[idx]):
                if ls_expression[0] != 'X' and idx == 1:
                    start_date = self.aries_data_extraction.read_start(ls_expression,
                                                                       propnum,
                                                                       self.scenario,
                                                                       ErrorMsgEnum.tax_expense.value,
                                                                       EconHeaderEnum.tax_expense_section_key.value,
                                                                       is_list=True)
                    start_date = convert_str_date_to_datetime_format(start_date, format='%m/%Y')
                    start_date, end_date = process_list_start_date_and_get_end_date(start_date, shift_month, shift_year)
                else:
                    try:
                        last_segment = get_last_segment_from_overlay_override(last_segment,
                                                                              tax_exp_base.tax_expense_overlay_dict)

                        start_date = convert_str_date_to_datetime_format(last_segment['dates']['end_date'],
                                                                         format=CCSchemaEnum.ymd_date_dash_format.value)
                        start_date = shift_datetime_date(start_date, days=1)
                        start_date, end_date = process_list_start_date_and_get_end_date(
                            start_date, shift_month, shift_year)
                    except Exception:
                        # directly use start_date (for list method syntax 1st line use X 1 2 3 4 5 #)
                        start_date = pd.to_datetime(tax_exp_base.start_date)
                        start_date, end_date = process_list_start_date_and_get_end_date(
                            start_date, shift_month, shift_year)

                try:
                    use_value = float(ls_expression[idx]) * multiplier
                except ValueError:
                    continue

                default_escalation = create_default_escalation_obj(start_date, end_date,
                                                                   self.aries_data_extraction.get_default_format)

                obj = {
                    "dollar_per_month": 0,
                    "pct_of_revenue": use_value,
                    "dates": {
                        "start_date": start_date,
                        "end_date": end_date
                    },
                    "cap": "",
                    "escalation_model": default_escalation
                }

                if 'ATX' not in keyword and 'STX' not in keyword and 'STD' in keyword:
                    obj.pop('dollar_per_month', None)

                self.update_obj_based_on_phase_model_name(ls_expression[idx], ls_expression[-1], phase, obj, keyword,
                                                          multiplier, tax_model.model_name, tax_exp_base.use_std_dict,
                                                          True)

                self.update_econ_function_based_on_sequence(obj, tax_exp_base.tax_expense_overlay_dict,
                                                            default_document, tax_model, sequence, keyword, phase, cont)

            elif '*' in str(ls_expression[idx]):
                value = ls_expression[idx].split('*')[1]
                times = ls_expression[idx].split('*')[0]

                if ls_expression[0] != 'X' and idx == 1:
                    start_date = self.aries_data_extraction.read_start(ls_expression,
                                                                       propnum,
                                                                       self.scenario,
                                                                       ErrorMsgEnum.tax_expense.value,
                                                                       EconHeaderEnum.tax_expense_section_key.value,
                                                                       is_list=True)
                    start_date = convert_str_date_to_datetime_format(start_date, format='%m/%Y')
                else:
                    try:
                        last_segment = get_last_segment_from_overlay_override(last_segment,
                                                                              tax_exp_base.tax_expense_overlay_dict)

                        start_date = convert_str_date_to_datetime_format(last_segment['dates']['end_date'],
                                                                         format=CCSchemaEnum.ymd_date_dash_format.value)
                        start_date = shift_datetime_date(start_date, days=1)
                    except Exception:
                        # directly use start_date (for list method syntax 1st line use X 1 2 3 4 5 #)
                        start_date = pd.to_datetime(tax_exp_base.start_date)

                start_date, end_date = process_list_start_date_and_get_end_date(start_date, shift_month * int(times),
                                                                                shift_year * int(times))

                try:
                    use_value = float(value) * multiplier
                except ValueError:
                    continue

                obj = {
                    "dollar_per_month": 0,
                    "pct_of_revenue": use_value,
                    "dates": {
                        "start_date": start_date,
                        "end_date": end_date
                    },
                    "cap": "",
                    "escalation_model": create_default_escalation_obj(start_date, end_date, None)
                }

                if 'ATX' not in keyword and 'STX' not in keyword and 'STD' not in keyword:
                    obj.pop('dollar_per_month', None)

                self.update_obj_based_on_phase_model_name(value, ls_expression[-1], phase, obj, keyword, multiplier,
                                                          tax_model.model_name, tax_exp_base.use_std_dict)

                self.update_econ_function_based_on_sequence(obj, tax_exp_base.tax_expense_overlay_dict,
                                                            default_document, tax_model, sequence, keyword, phase, cont)

        return default_document

    def confirm_well_stream_availability(self):
        """
        Determines the availability of well streams based on the well count by phase object dictionary.

        Returns:
        tuple: A tuple containing two dictionaries: `has_phase_dict` and `all_zero_dict`.
        - `has_phase_dict`: A dictionary where the keys are the phases and the values indicate whether a phase exists
        for each key. If the length of the value is greater than 0, the value is assigned `True`; otherwise, it is
        assigned `False`.
        - `all_zero_dict`: A dictionary where the keys are the phases and the values indicate whether all counts for
        each phase key are zero. The value is `True` if there are no rows in the phase value where the 'count'
        attribute is not equal to 0 and the length of the value is greater than 0; otherwise, it is assigned `False`
        """
        has_phase_dict, all_zero_dict = {}, {}
        for key, value in self.aries_data_extraction.well_count_by_phase_obj_dict.items():
            has_phase_dict[key] = len(value) > 0
            all_zero_dict[key] = not any(row['count'] != 0 for row in value) and len(value) > 0
        return has_phase_dict, all_zero_dict

    def update_fixed_expense_obj_if_need_be(self, document, obj, keyword):
        """
        Updates the fixed expense object based on the well count information and the specified keyword.

        Args:
            document (dict): The document containing relevant information.
            obj (dict): The fixed expense object to be updated.
            keyword (str): The keyword indicating the type of update to be performed.

        Returns:
            dict: The updated fixed expense object.

        Notes:
            This method updates the fixed expense object based on the well count information obtained from the
            `aries_data_extraction` object and the specified keyword.

            If the keyword ends with '/W', indicating an all wells based update, the function retrieves the well count
            information from the `aries_data_extraction` object and combines it with the obj using the
            `get_obj_by_well_count` function.

            If the keyword is one of ['OPC/OGW', 'OPC/OWL', 'OPC/GWL', 'OPC/INJ'], indicating a phase-based update, the
            function retrieves the well count information from the `aries_data_extraction` object based on
            the corresponding phase(s) specified in the `by_well_phase_dict`. The retrieved combo rows are combined
            with the obj using the`get_obj_by_well_count` function.

            The updated fixed expense object is returned by the method.
        """
        by_well_phase_dict = {'OPC/OGW': ['oil', 'gas'], 'OPC/OWL': ['oil'], 'OPC/GWL': ['gas'], 'OPC/INJ': ['inj']}
        if 'fixed_expense' in obj:
            if keyword.endswith('/W'):
                combo_rows = sum(self.aries_data_extraction.well_count_by_phase_obj_dict.values(), [])
                obj = get_obj_by_well_count(document, combo_rows, obj)
            elif keyword in by_well_phase_dict:
                combo_rows = [
                    row for phase, ls in self.aries_data_extraction.well_count_by_phase_obj_dict.items()
                    if phase in by_well_phase_dict[keyword] for row in ls
                ]
                obj = get_obj_by_well_count(document, combo_rows, obj)

        return obj

    def check_major_phase_for_default_well_count(self):
        """
        Checks the major phase from the Aries data extraction (gotten from the Forecast extraction section ) and
        determines the availability of oil, gas, and injection streams based on the major phase.

        Returns:
            tuple: A tuple containing three boolean values indicating the availability of oil, gas, and injection
            streams,respectively.

        Notes:
            This method checks the major phase obtained from the `aries_data_extraction` object. If the major phase is
            one of ['oil', 'gas', 'inj'], it sets the corresponding availability flag to True, indicating the
            availability of the respective phase.

            The availability flags for oil, gas, and injection are returned as a tuple in the order (has_oil, has_gas,
            has_inj).

            This method is typically used as a fallback when none of the oil, gas, or injection availability flags are
            True in the `process_per_well_case` method.
        """
        has_oil, has_gas, has_inj = False, False, False
        if str(self.aries_data_extraction.major_phase).lower() in ['oil', 'gas', 'inj']:
            major_phase = str(self.aries_data_extraction.major_phase).lower()
            if major_phase == 'oil':
                has_oil = True
            elif major_phase == 'gas':
                has_gas = True
            else:
                has_inj = True
        return has_oil, has_gas, has_inj

    def process_per_well_case(self, keyword: str):
        """
        Determines the processing logic for a given keyword to check the availability of well streams and return
        a boolean value indicating whether the keyword condition is satisfied.
        This function is only used for per well cases and lets us know if we can use $/well/month or not
        If true we can use it (pending the other conditions are met)
        Args:
            keyword (str): The keyword to process, specifying the condition to be checked.

        Returns:
            bool: A boolean value indicating whether the condition specified by the keyword is satisfied.

        Notes:
            This method relies on the `confirm_well_stream_availability` method to determine the availability of well
            streams. The availability is checked based on the 'has_phase_dict' and 'all_zero_dict' dictionaries returned
            by the `confirm_well_stream_availability` method.

            The following conditions are checked based on the given keyword:

            - If the keyword ends with '/W', it returns True unconditionally.
            - If the keyword is 'OPC/OGW', it returns True if there is availability of oil or gas streams and there is
            no availability of injection streams or all injection counts are zero.
            - If the keyword is 'OPC/OWL', it returns True if there is availability of oil streams, no availability of
            gas streams or all gas counts are zero, and there is no availability of injection streams or all injection
            counts are zero.
            - If the keyword is 'OPC/GWL', it returns True if there is availability of gas streams, no availability of
            oil streams or all oil counts are zero, and there is no availability of injection streams or all injection
            counts are zero.
            - If the keyword is 'OPC/INJ', it returns True if there is availability of injection streams, no
            availability of oil streams or all oil counts are zero, and there is no availability of gas streams or all
            gas counts are zero.

            For any other keyword, it returns False.

            If none of the oil, gas, or injection availability flags are True, the method falls back to the
            `check_major_phase_for_default_well_count` method to determine the availability based on major phases.
        """
        has_phase_dict, all_zero_dict = self.confirm_well_stream_availability()
        has_oil, has_gas, has_inj = has_phase_dict.get('oil'), has_phase_dict.get('gas'), has_phase_dict.get('inj')
        all_zero_oil, all_zero_gas, all_zero_inj = all_zero_dict.get('oil'), all_zero_dict.get(
            'gas'), all_zero_dict.get('inj')

        default_oil_count_used, default_gas_count_used = self.aries_data_extraction.default_well_count_for_major_phase[
            'oil'], self.aries_data_extraction.default_well_count_for_major_phase['gas']

        if keyword.endswith('/W'):
            return True
        elif keyword == 'OPC/OGW':
            return (has_oil or has_gas) and (not has_inj or all_zero_inj)
        elif keyword == 'OPC/OWL':
            return has_oil and (not has_gas or all_zero_gas or default_gas_count_used) and (not has_inj or all_zero_inj)
        elif keyword == 'OPC/GWL':
            return has_gas and (not has_oil or all_zero_oil or default_oil_count_used) and (not has_inj or all_zero_inj)
        elif keyword == 'OPC/INJ':
            return has_inj and (not has_oil or all_zero_oil) and (not has_gas or all_zero_gas)

        return False

    @classmethod
    def get_previous_value(cls, keyword: str, exp_default_document: dict, tax_model: TaxModel):
        """

        Args:
            keyword:
            exp_default_document:
            tax_model:

        Returns:
            Previous row from the current row. None if there is not any.
        """
        model_name = tax_model.model_name
        phase = tax_model.phase
        expense = tax_model.expense

        if 'GAS' in keyword:
            if len(exp_default_document['econ_function'][model_name][phase][expense]['rows']) > 1:
                rows = exp_default_document['econ_function'][model_name][phase][expense]['rows']
                prev_value_key = get_unit_key_and_clean_row_for_taxes(rows)
                return rows[-1][prev_value_key], prev_value_key
            else:
                # prev_value, prev_value_key
                return None, None
        elif 'WTR' not in keyword:
            if len(exp_default_document['econ_function'][model_name][phase][expense]['rows']) > 1:
                last_row = exp_default_document['econ_function'][model_name][phase][expense]['rows'][-1]
                use_key = next(key for key in last_row
                               if key in ['dollar_per_bbl', 'pct_of_oil_rev', 'pct_of_gas_rev', 'pct_of_ngl_rev'])
                return last_row[use_key]
        else:
            if len(exp_default_document['econ_function'][model_name]['rows']) > 1:
                return exp_default_document['econ_function'][model_name]['rows'][-1]['dollar_per_bbl']
        return None

    def process_gas_expense(self, obj: dict, economic_row: Economic, tax_exp_base: TaxExpenseBase,
                            exp_values: ExpenseValues):
        """

        Args:
            obj:
            economic_row:
            tax_exp_base:
            exp_values:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """
        keyword = economic_row.keyword
        original_keyword = economic_row.original_keyword

        tax_model = self.extract_model_name_from_keyword(keyword, original_keyword,
                                                         keyword.split('/')[-1].strip().lower(),
                                                         tax_exp_base.exp_default_document,
                                                         tax_exp_base.fixed_exp_assignment)

        prev_value, prev_value_key = self.get_previous_value(keyword, tax_exp_base.exp_default_document, tax_model)

        if exp_values.value == 'X' and prev_value is not None:
            exp_values.value = prev_value
        if exp_values.unit is not None:
            val_mul = 1
            if exp_values.unit == 'M$':
                val_mul = 1000
            obj['dollar_per_mcf'] = aries_cc_round(eval(str(exp_values.value))) * val_mul
        else:
            obj['dollar_per_mcf'] = 0
            self.error_log(str_join(economic_row.ls_expression),
                           format_error_msg(ErrorMsgEnum.invalid1_msg.value, ErrorMsgEnum.unit.value,
                                            str_join(economic_row.ls_expression)),
                           self.section,
                           model=self.__class__.__name__)

        mismatch_found = prev_value_key is not None and prev_value_key != 'dollar_per_mcf'
        store_in_hold = check_if_to_store_in_expense_hold(obj, keyword, tax_exp_base.hold_expense_doc, mismatch_found)

        if store_in_hold:
            return False
        return True

    def process_water_disposal(self, obj: dict, economic_row: Economic, tax_exp_base: TaxExpenseBase,
                               exp_values: ExpenseValues):
        """

        Args:
            obj:
            economic_row:
            tax_exp_base:
            exp_values:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """
        keyword = economic_row.keyword
        original_keyword = economic_row.original_keyword

        use_key = None

        tax_model = self.extract_model_name_from_keyword(keyword, original_keyword,
                                                         keyword.split('/')[-1].strip().lower(),
                                                         tax_exp_base.exp_default_document,
                                                         tax_exp_base.fixed_exp_assignment)

        prev_value = self.get_previous_value(keyword, tax_exp_base.exp_default_document, tax_model)

        if exp_values.value == 'X' and prev_value is not None:
            exp_values.value = prev_value

        if keyword in REVENUE_BASED_VAR_EXPENSE_KEY_DICT:
            if exp_values.unit != UnitEnum.perc_sign.value:
                exp_values.value = float(exp_values.value)
                exp_values.value *= 100

            rev_unit_key = REVENUE_BASED_VAR_EXPENSE_KEY_DICT.get(keyword)

            mismatch_found = use_key is not None and use_key != rev_unit_key

            obj[rev_unit_key] = aries_cc_round(eval(str(exp_values.value)))
            store_in_hold = check_if_to_store_in_expense_hold(obj, keyword, tax_exp_base.hold_expense_doc,
                                                              mismatch_found)
            if store_in_hold:
                return False
        elif exp_values.unit is not None:
            val_mul = 1
            if exp_values.unit == 'M$':
                val_mul = 1000
            mismatch_found = use_key is not None and use_key != 'dollar_per_bbl'
            obj['dollar_per_bbl'] = aries_cc_round(eval(str(exp_values.value))) * val_mul
            store_in_hold = check_if_to_store_in_expense_hold(obj, keyword, tax_exp_base.hold_expense_doc,
                                                              mismatch_found)
            if store_in_hold:
                return False
        else:
            mismatch_found = use_key is not None and use_key != 'dollar_per_bbl'
            obj['dollar_per_bbl'] = 0
            store_in_hold = check_if_to_store_in_expense_hold(obj, keyword, tax_exp_base.hold_expense_doc,
                                                              mismatch_found)
            if store_in_hold:
                return False
            self.error_log(str_join(economic_row.ls_expression),
                           format_error_msg(ErrorMsgEnum.invalid1_msg.value, ErrorMsgEnum.unit.value,
                                            str_join(economic_row.ls_expression)),
                           self.section,
                           model=self.__class__.__name__)
        return True

    def process_fixed_expenses_total(self, obj: dict, economic_row: Economic, tax_exp_base: TaxExpenseBase,
                                     exp_values: ExpenseValues):
        """

        Args:
            obj:
            economic_row:
            tax_exp_base:
            exp_values:
        """
        keyword = economic_row.keyword
        fixed_cost_name, fixed_expense_slot_full = get_fixed_cost_name_from_assignment_dict(
            keyword, tax_exp_base.fixed_exp_assignment)

        if self.aries_data_extraction.ignore_overhead and 'OH' in keyword and not fixed_expense_slot_full:
            tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
                'affect_econ_limit'] = 'no'
        description = tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
            'description']
        tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
            'description'] = get_expense_description_name(keyword, description)

        if exp_values.value == 'X':
            self.assign_fixed_expense_to_obj(obj, economic_row.ls_expression, fixed_cost_name,
                                             tax_exp_base.exp_default_document)
        elif exp_values.unit == '$/Y':
            obj['fixed_expense'] = eval(str(exp_values.value)) / 12
        elif exp_values.unit == '$/D':
            obj['fixed_expense'] = eval(str(exp_values.value)) * DAYS_IN_MONTH
        elif exp_values.unit is not None:
            val_mul = 1
            if exp_values.unit == 'M$':
                val_mul = 1000
            obj['fixed_expense'] = eval(str(exp_values.value)) * val_mul
        else:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                       str_join(economic_row.ls_expression))
            self.error_log(str_join(economic_row.ls_expression), message, self.section, model=self.__class__.__name__)

    def validate_use_per_well_unit(self, document, fixed_cost_name, use_per_well_unit):
        """
        Validates and updates the 'use_per_well_unit' flag based on the fixed expense rows in the document.

        Args:
            document (dict): The document containing the fixed expense rows.
            fixed_cost_name (str): The name of the fixed cost to validate.
            use_per_well_unit (bool): The current value of the 'use_per_well_unit' flag.

        Returns:
            bool: The updated value of the 'use_per_well_unit' flag.

        Notes:
            This method validates the 'use_per_well_unit' flag by examining the fixed expense rows associated with the
            specified fixed cost name in the document. The fixed expense rows are accessed through
            document['econ_function']['fixed_expenses'][fixed_cost_name]['rows'].

            If there is more than one fixed expense row, the method checks for specific keys derived from each row using
            the 'get_unit_key_and_clean_row_for_taxes' function. The keys are stored in the 'keys' list.

            If the 'fixed_expense_per_well' key is found in the 'keys' list and 'use_per_well_unit' is False, it
            indicates that the fixed expense should be applied per well. In this case, the 'use_per_well_unit' flag
            is updated to True.

            Similarly, if the 'fixed_expense' key is found in the 'keys' list and 'use_per_well_unit' is True,
            it indicates that the fixed expense should be applied as a total fixed expense. In this case,
            the 'use_per_well_unit' flag is updated to False.

            The updated value of the 'use_per_well_unit' flag is returned by the method.
        """
        fixed_expense_rows = document['econ_function']['fixed_expenses'][fixed_cost_name]['rows']
        if len(fixed_expense_rows) > 1:
            keys = [get_unit_key_and_clean_row_for_taxes([row]) for row in fixed_expense_rows[1:]]
            if any(key == 'fixed_expense_per_well' for key in keys) and not use_per_well_unit:
                use_per_well_unit = True
            if any(key == 'fixed_expense' for key in keys) and use_per_well_unit:
                use_per_well_unit = False

        return use_per_well_unit

    def process_fixed_expense_per_well(self, obj: dict, economic_row: Economic, tax_exp_base: TaxExpenseBase,
                                       exp_values: ExpenseValues) -> bool:
        """Updates the object with fixed expenses values

        Args:
            obj:
            economic_row:
            tax_exp_base:
            exp_values:
        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """
        def get_fixed_expense_unit(per_well_unit: bool) -> str:
            return 'fixed_expense_per_well' if per_well_unit else 'fixed_expense'

        keyword = economic_row.keyword

        # check if conditions are met to process case as $/well/month
        use_per_well_unit = self.process_per_well_case(keyword)

        fixed_cost_name, fixed_expense_slot_full = get_fixed_cost_name_from_assignment_dict(
            keyword, tax_exp_base.fixed_exp_assignment)

        # check if the current fixed expense is using the case the unit that has been set
        use_per_well_unit = self.validate_use_per_well_unit(tax_exp_base.exp_default_document, fixed_cost_name,
                                                            use_per_well_unit)

        if self.aries_data_extraction.ignore_overhead and 'OH' in keyword and not fixed_expense_slot_full:
            tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
                'affect_econ_limit'] = 'no'

        description = tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
            'description']

        tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name][
            'description'] = get_expense_description_name(keyword, description)

        if exp_values.value == 'X':
            self.assign_fixed_expense_to_obj(obj, economic_row.ls_expression, fixed_cost_name,
                                             tax_exp_base.exp_default_document)
        elif exp_values.unit == '$/Y':
            obj[get_fixed_expense_unit(use_per_well_unit)] = aries_cc_round((eval(str(exp_values.value)) / 12))
        elif exp_values.unit == '$/D':
            obj[get_fixed_expense_unit(use_per_well_unit)] = aries_cc_round(
                (eval(str(exp_values.value)) * DAYS_IN_MONTH))
        elif exp_values.unit is not None:
            val_mul = 1
            if exp_values.unit == 'M$':
                val_mul = 1000
            obj[get_fixed_expense_unit(use_per_well_unit)] = aries_cc_round(eval(str(exp_values.value))) * val_mul
        elif exp_values.unit == '$/B':
            if keyword == 'OPC/OWL':
                obj['dollar_per_bbl'] = aries_cc_round(eval(str(exp_values.value)))
                self.aries_data_extraction.owl_overlay.append(obj)
                tax_exp_base.fixed_exp_assignment[fixed_cost_name] = set()
                return None, False
        else:
            self.error_log(str_join(economic_row.ls_expression),
                           format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                            str_join(economic_row.ls_expression)),
                           self.section,
                           model=self.__class__.__name__)
        obj = self.update_fixed_expense_obj_if_need_be(
            tax_exp_base.exp_default_document['econ_function']['fixed_expenses'][fixed_cost_name], obj, keyword)

        return obj, True

    def unpack_exp_values_from_expression(self, ls_expression: list[str], start_value: int) -> ExpenseValues:
        """

        Args:
            ls_expression:
            start_value:

        Returns:
            Unpacked value, cap and unit values.
        """
        exp_values = ExpenseValues()
        try:
            exp_values.value = ls_expression[0]
        except IndexError:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.value.value, start_value)
            self.error_log(str_join(ls_expression), message, self.section, model=self.__class__.__name__)
        try:
            exp_values.cap = ls_expression[1]
        except IndexError:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.cap.value, str_join(ls_expression))
            self.error_log(str_join(ls_expression), message, self.section, model=self.__class__.__name__)
        try:
            exp_values.unit = ls_expression[2]
        except IndexError:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value, str_join(ls_expression))
            self.error_log(str_join(ls_expression), message, self.section, model=self.__class__.__name__)

        return exp_values

    def unpack_tax_values_from_expression(self, ls_expression: list[str], start_value: int):
        """Unpacks start_value, end_value and unit based on ls_expression

        Args:
            ls_expression:
            start_value:

        Returns:
            Processed start_value, end_date and unit variables
        """
        end_value = ''
        unit = ''

        try:
            start_value = aries_cc_round(float(ls_expression[0]))
        except (ValueError, IndexError):
            self.error_log(str_join(ls_expression),
                           format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.value.value, start_value),
                           self.section,
                           model=self.__class__.__name__)
        try:
            end_value = ls_expression[1]
        except IndexError:
            self.error_log(str_join(ls_expression),
                           format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.end_value.value,
                                            str_join(ls_expression)),
                           self.section,
                           model=self.__class__.__name__)
        try:
            unit = ls_expression[2]
        except IndexError:
            self.error_log(str_join(ls_expression),
                           format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                            str_join(ls_expression)),
                           self.section,
                           model=self.__class__.__name__)

        return start_value, end_value, unit

    def update_filled_sev_tax_phase_for_overlay(self, economic_row: Economic):
        list_method = '#' in str(economic_row.ls_expression[-1])
        keyword = economic_row.keyword
        if 'STX/' in str(keyword):
            stx_phase = str(keyword.split('/')[-1]).strip().lower()
            stx_phase = stx_phase if stx_phase != 'cnd' else PhaseEnum.condensate.value
            if stx_phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                try:
                    stx_value = float(economic_row.ls_expression[0])
                except (ValueError, TypeError):
                    stx_value = None
                if (stx_value is not None and stx_value != 0) or list_method:
                    self.aries_data_extraction.filled_sev_tax_phase.add(stx_phase)

    def handle_tax_document(self, obj: dict, economic_row: Economic, tax_conditionals: TaxConditionals,
                            tax_exp_base: TaxExpenseBase, tax_expense_naming: TaxExpenseNaming, start_value: int):
        """

        Args:
            obj:
            economic_row:
            tax_conditionals:
            tax_exp_base:
            tax_expense_naming:
            start_value:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """
        keyword = economic_row.keyword

        if economic_row.sequence == EconEnum.overlay_sequence.value:
            tax_conditionals.tax_overlay_present = True
        tax_conditionals.use_tax_model = True

        # Update use_std_dict values
        update_use_std_dict(keyword, tax_exp_base.use_std_dict)

        list_method = '#' in str(economic_row.ls_expression[-1])

        self.update_filled_sev_tax_phase_for_overlay(economic_row)

        if keyword == 'ATX/T':
            tax_exp_base.tax_default_document['econ_function']['ad_valorem_tax']['calculation'] = 'wi'

        # special handle for ATX or ATX short format
        # [3 %] should change to [3 3 % TO LIFE FLAT 0] -> [3 X % TO LIFE PC 0]
        # tax model extraction
        if list_method:
            # list method
            self.process_list_method_format(economic_row, tax_exp_base, 'tax_default_document', 'expense')

            tax_conditionals.use_fpd = False
            tax_conditionals.use_asof = False
        else:
            # Formula method (need to append escalation)
            if not self.process_tax_formula_method(obj, economic_row, tax_conditionals, tax_exp_base, start_value):
                return False

            start_value, end_value, unit = self.unpack_tax_values_from_expression(economic_row.ls_expression,
                                                                                  start_value)

            if end_value != 'X':
                try:
                    aries_cc_round(float(end_value))
                except (ValueError, TypeError):
                    full_ls_expression = [
                        economic_row.ls_expression[0], 'X', economic_row.ls_expression[1], 'TO', 'LIFE', 'PC', '0'
                    ]
                    economic_row.ls_expression = full_ls_expression.copy()

            # Update ignore_list
            atx_std_handle(keyword, tax_exp_base.ignore_list, tax_exp_base.tax_default_document)

        tax_expense_naming.tax_model_name = get_model_name_from_qualifiers(keyword, economic_row.qualifier,
                                                                           tax_expense_naming.tax_model_name,
                                                                           tax_exp_base.tax_default_document)

        return True

    def handle_expense_document(self, obj: dict, economic_row: Economic, tax_conditionals: TaxConditionals,
                                tax_exp_base: TaxExpenseBase, tax_exp_naming: TaxExpenseNaming, start_value: int):
        """Update the expense_default document

        Args:
            obj:
            economic_row:
            tax_conditionals:
            tax_exp_base:
            tax_exp_naming:
            start_value:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """

        keyword = economic_row.keyword

        tax_conditionals.use_expense_model = True
        if economic_row.sequence == EconEnum.overlay_sequence.value:
            tax_conditionals.expense_overlay_present = True

        exp_values = self.unpack_exp_values_from_expression(economic_row.ls_expression, start_value)

        # special handle for expense short format
        # [3 %] should change to [3 3 % TO LIFE FLAT 0] -> [3 X % TO LIFE PC 0]
        if exp_values.cap != 'X' and len(economic_row.ls_expression) < 3:
            try:
                exp_values.cap = float(exp_values.cap)
            except ValueError:
                full_ls_expression = [
                    economic_row.ls_expression[0], 'X', economic_row.ls_expression[1], 'TO', 'LIFE', 'PC', '0'
                ]
                economic_row.ls_expression = full_ls_expression.copy()

        # expenses model extraction
        if '#' in str(economic_row.ls_expression[-1]):
            # list method
            self.process_list_method_format(economic_row, tax_exp_base, 'exp_default_document', 'expense')

            tax_conditionals.use_fpd = False
            tax_conditionals.use_asof = False
        else:
            if not self.process_exp_formula_method(obj, economic_row, tax_conditionals, tax_exp_base, exp_values):
                return False

        tax_exp_naming.expense_model_name = get_model_name_from_qualifiers(keyword, economic_row.qualifier,
                                                                           tax_exp_naming.expense_model_name,
                                                                           tax_exp_base.exp_default_document)
        return True

    def process_exp_formula_method(self, obj: dict, economic_row: Economic, tax_conditionals: TaxConditionals,
                                   tax_exp_base: TaxExpenseBase, exp_values: ExpenseValues):
        """

        Args:
            obj:
            economic_row:
            tax_conditionals:
            tax_exp_base:
            exp_values:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """

        keyword = economic_row.keyword
        original_keyword = economic_row.original_keyword

        phase = keyword.split('/')[-1].strip().lower()

        # formula method (need to append escalation)
        self.process_cutoff_format(obj, economic_row, tax_conditionals, tax_exp_base, 'exp_default_document')
        if obj == DEFAULT_TAX_EXPENSE_OBJ:
            return False

        if any(key in obj for key in ['dates', 'offset_to_fpd', 'offset_to_as_of_date']):
            try:
                # TODO: Update reference when escalation module is created
                tax_model = self.extract_model_name_from_keyword(keyword,
                                                                 original_keyword,
                                                                 phase,
                                                                 tax_exp_base.exp_default_document,
                                                                 tax_exp_base.fixed_exp_assignment,
                                                                 assign=False)

                unique_escalation_default_document = self.aries_data_extraction.escalation_model_extraction(
                    economic_row.ls_expression, tax_exp_base.start_date, keyword, self.scenario, self.ls_scenarios_id,
                    self.property_id, 'expense', self.section, tax_model.expense)
            except Exception:
                unique_escalation_default_document = 'none'
                self.error_log(economic_row.expression,
                               format_error_msg(ErrorMsgEnum.escalation_msg.value, keyword,
                                                str_join(economic_row.ls_expression)),
                               self.section,
                               model=self.__class__.__name__)

            obj['escalation_model'] = copy.deepcopy(unique_escalation_default_document)
        else:
            obj['escalation_model'] = 'none'

        # add differential value and unit to differential obj
        if exp_values.cap != 'X':
            try:
                exp_values.cap = aries_cc_round(float(exp_values.cap))
                obj['cap'] = exp_values.cap
            except (ValueError, TypeError):
                self.error_log(str_join(economic_row.ls_expression),
                               format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.cap.value, exp_values.cap),
                               self.section,
                               model=self.__class__.__name__)
                obj['cap'] = ''

        # fixed expenses
        if str(keyword).strip() in FIXED_EXPENSE_KEYWORD_TOTAL:
            # Update fixed_expense field in obj
            self.process_fixed_expenses_total(obj, economic_row, tax_exp_base, exp_values)

        elif str(keyword.strip()) in FIXED_EXPENSE_KEYWORD_PER_WELL:
            obj, valid = self.process_fixed_expense_per_well(obj, economic_row, tax_exp_base, exp_values)
            if not valid:
                return False

        # water disposal and variable expense
        elif (any(exp_phase in keyword for exp_phase in ['WTR', 'OIL', 'NGL', 'CND'])
              or (keyword in REVENUE_BASED_VAR_EXPENSE_KEY_DICT)):
            if not self.process_water_disposal(obj, economic_row, tax_exp_base, exp_values):
                return False

        elif 'GAS' in keyword:
            if not self.process_gas_expense(obj, economic_row, tax_exp_base, exp_values):
                return False

        elif self.section == EconHeaderEnum.tax_expense_section_key.value:
            self.error_log(str_join(economic_row.ls_expression),
                           format_error_msg(ErrorMsgEnum.cc_error_msg.value, keyword),
                           self.section,
                           model=self.__class__.__name__)

        # check and replace if the expense value is greater than the cap value
        obj = compare_cap_and_value(obj, self.aries_data_extraction.log_report, self.scenario, self.property_id,
                                    self.section, ErrorMsgEnum.expense.value)

        if economic_row.sequence == EconEnum.overlay_sequence.value:
            tax_exp_base.exp_default_document = self.append_obj_and_assign_escalation(tax_exp_base.exp_default_document,
                                                                                      obj,
                                                                                      keyword,
                                                                                      original_keyword,
                                                                                      tax_exp_base.fixed_exp_assignment,
                                                                                      overlay=True)
            handle_overlay_expense_sequence(tax_exp_base, keyword, obj)
        else:
            tax_exp_base.exp_default_document = self.append_obj_and_assign_escalation(
                tax_exp_base.exp_default_document, obj, keyword, original_keyword, tax_exp_base.fixed_exp_assignment)

        return True

    def process_tax_formula_method(self, obj: dict, economic_values: Economic, tax_conditionals: TaxConditionals,
                                   tax_exp_base: TaxExpenseBase, start_value: int):
        """

        Args:
            obj:
            economic_values:
            tax_conditionals:
            tax_exp_base:
            start_value:

        Returns:
            True if the parent process must go on. False if the parent process needs to continue with the next iteration
        """
        keyword = economic_values.keyword
        original_keyword = economic_values.original_keyword

        start_value, end_value, unit = self.unpack_tax_values_from_expression(economic_values.ls_expression,
                                                                              start_value)

        if end_value != 'X':
            try:
                aries_cc_round(float(end_value))
            except (ValueError, TypeError):
                full_ls_expression = [
                    economic_values.ls_expression[0], 'X', economic_values.ls_expression[1], 'TO', 'LIFE', 'PC', '0'
                ]
                economic_values.ls_expression = full_ls_expression.copy()

        if keyword in ['STX', 'STD']:
            new_expression_keyword = handle_stx_keyword(keyword, economic_values.ls_expression)
            for keyword, economic_values.ls_expression in new_expression_keyword:
                self.process_cutoff_format(obj, economic_values, tax_conditionals, tax_exp_base, 'tax_default_document')
                if obj == DEFAULT_TAX_EXPENSE_OBJ:
                    continue

                update_tax_obj = update_tax_obj_from_aries_unit(economic_values.ls_expression[0],
                                                                economic_values.ls_expression[2], keyword, obj,
                                                                economic_values.sequence,
                                                                self.aries_data_extraction.main_tax_unit,
                                                                tax_exp_base.phase_tax_unit_dict)

                obj, self.aries_data_extraction.main_tax_unit, tax_exp_base.phase_tax_unit_dict = update_tax_obj
                obj_iter = copy.deepcopy(obj)

                # Update ignore_list
                atx_std_handle(keyword, tax_exp_base.ignore_list, tax_exp_base.tax_default_document)

                # Update tax_default_document
                self.append_obj_and_assign_escalation(tax_exp_base.tax_default_document, obj_iter, keyword,
                                                      original_keyword, tax_exp_base.fixed_exp_assignment)
                obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)
            return True
        else:
            self.process_cutoff_format(obj, economic_values, tax_conditionals, tax_exp_base, 'tax_default_document')

            if obj == DEFAULT_TAX_EXPENSE_OBJ:
                return False

            tax_obj = update_tax_obj_from_aries_unit(start_value, unit, keyword, obj, economic_values.sequence,
                                                     self.aries_data_extraction.main_tax_unit,
                                                     tax_exp_base.phase_tax_unit_dict)

            obj, self.aries_data_extraction.main_tax_unit, tax_exp_base.phase_tax_unit_dict = tax_obj

            if economic_values.sequence == EconEnum.overlay_sequence.value:
                tax_exp_base.tax_default_document = self.append_obj_and_assign_escalation(
                    tax_exp_base.tax_default_document,
                    obj,
                    keyword,
                    original_keyword,
                    tax_exp_base.fixed_exp_assignment,
                    overlay=True)

                phase = keyword.split('/')[-1].lower()
                used_key = self.aries_data_extraction.main_tax_unit[phase]
                overlay_dict_key = f'{keyword}-{EconEnum.overlay_sequence.value}-{used_key}'
                if overlay_dict_key in tax_exp_base.tax_expense_overlay_dict:
                    tax_exp_base.tax_expense_overlay_dict[overlay_dict_key].append(obj)
                else:
                    tax_exp_base.tax_expense_overlay_dict[overlay_dict_key] = [obj]
            else:
                tax_exp_base.tax_default_document = self.append_obj_and_assign_escalation(
                    tax_exp_base.tax_default_document, obj, keyword, original_keyword,
                    tax_exp_base.fixed_exp_assignment)
            return True

    def create_tax_expense_obj(self, economic_row: Economic, tax_conditionals: TaxConditionals,
                               tax_expense_naming: TaxExpenseNaming, tax_exp_base: TaxExpenseBase, start_value: int):
        """

        Args:
            economic_row:
            tax_conditionals:
            tax_expense_naming:
            tax_exp_base:
            start_value:

        Returns:

        """
        keyword = economic_row.keyword

        obj = copy.deepcopy(DEFAULT_TAX_EXPENSE_OBJ)

        if '#' not in str(economic_row.ls_expression[-1]):
            economic_row.ls_expression = handle_shortened_aries_tax_syntax(economic_row.ls_expression)

        if 'ATX' in keyword or 'STX' in keyword or 'STD' in keyword:
            if not self.handle_tax_document(obj, economic_row, tax_conditionals, tax_exp_base, tax_expense_naming,
                                            start_value):
                return False
        else:
            if not self.handle_expense_document(obj, economic_row, tax_conditionals, tax_exp_base, tax_expense_naming,
                                                start_value):
                return False

        return True

    def save_tax_obj_into_data_list(self, tax_conditionals: TaxConditionals, tax_exp_base: TaxExpenseBase,
                                    tax_expense_naming: TaxExpenseNaming):
        """Saves Tax document into Aries data list

        Args:
            tax_conditionals:
            tax_exp_base:
            tax_expense_naming:
        """
        try:
            if self.aries_data_extraction.backup_tax_dict:
                tax_exp_base.tax_default_document = update_tax_model_with_backup_values(
                    tax_exp_base.tax_default_document, self.aries_data_extraction.backup_tax_dict,
                    self.aries_data_extraction.as_of_date)

            tax_exp_base.tax_default_document = check_if_more_than_one_element(
                tax_exp_base.tax_default_document, self.aries_data_extraction.add_zero_to_end_of_row)
            for _id in self.ls_scenarios_id:
                if self.aries_data_extraction.scenarios_dic[_id]['name'] == self.scenario:
                    tax_exp_base.tax_default_document['wells'].add((_id, self.property_id))

            tax_exp_base.tax_default_document['createdAt'] = datetime.datetime.now()
            tax_exp_base.tax_default_document['updatedAt'] = datetime.datetime.now()

            # not important enough that I will want to risk the entire tax model import on
            try:
                tax_exp_base.tax_default_document = standardize_tax_units(tax_exp_base.tax_default_document,
                                                                          tax_exp_base.phase_tax_unit_dict,
                                                                          tax_exp_base.use_std_dict,
                                                                          tax_exp_base.tax_expense_overlay_dict)
            except (IndexError, TypeError, KeyError):
                pass

            if tax_conditionals.tax_overlay_present:
                date_dict = {
                    'asof': self.aries_data_extraction.as_of_date,
                    'fpd': self.aries_data_extraction.wells_dic[self.property_id].get('first_prod_date')
                }
                tax_exp_base.tax_default_document = override_tax_overlay(tax_exp_base.tax_default_document,
                                                                         self.property_id, self.scenario,
                                                                         tax_exp_base.tax_expense_overlay_dict,
                                                                         date_dict,
                                                                         self.aries_data_extraction.log_report,
                                                                         self.aries_data_extraction.get_default_format)
            # not an essential function will fix later (might (will) cause more bugs if left)
            tax_exp_base.tax_default_document = reorder_tax_document_row_for_rate_cut_off(
                tax_exp_base.tax_default_document)

            tax_exp_base.tax_default_document = combine_tax_rows(tax_exp_base.tax_default_document)

            try:
                tax_exp_base.tax_default_document = convert_tax_dates_to_offset(
                    tax_exp_base.tax_default_document, self.aries_data_extraction.as_of_date,
                    self.aries_data_extraction.wells_dic.get(self.property_id, {}).get('first_prod_date'))
            except Exception:
                message = ErrorMsgEnum.failed_to_set_criteria_to_reference.value
                self.error_log(None, message, self.section, model=self.__class__.__name__)

            tax_model_name = tax_expense_naming.tax_model_name
            if tax_model_name == '':
                tax_key = CCSchemaEnum.assumption_key.value
                tax_model_name = f'ARIES_CC_{tax_exp_base.tax_default_document[tax_key].upper()}'

            # compare and save into data_list
            self.aries_data_extraction.compare_and_save_into_self_data_list(tax_exp_base.tax_default_document,
                                                                            self.aries_data_extraction.tax_data_list,
                                                                            self.aries_data_extraction.projects_dic,
                                                                            model_name=tax_model_name,
                                                                            aries=True)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class7_msg.value, ErrorMsgEnum.tax.value)
            self.error_log(None, message, self.section, model=self.__class__.__name__)

    def save_expense_obj_into_data_list(self, tax_conditionals: TaxConditionals, tax_exp_base: TaxExpenseBase,
                                        tax_expense_naming: TaxExpenseNaming, xinvwt_multiplier, elt: bool):
        """Saves the Expense document in the Aries data list

        Args:
            tax_conditionals:
            tax_exp_base:
            tax_expense_naming:
            xinvwt_multiplier:
        """
        try:
            expense_default_document = add_hold_expense_doc(tax_exp_base.exp_default_document,
                                                            tax_exp_base.hold_expense_doc)
            expense_default_document = update_fixed_expense_with_multiplier(expense_default_document, xinvwt_multiplier)
            expense_default_document = check_if_more_than_one_element(expense_default_document,
                                                                      self.aries_data_extraction.add_zero_to_end_of_row)

            for _id in self.ls_scenarios_id:
                if self.aries_data_extraction.scenarios_dic[_id]['name'] == self.scenario:
                    expense_default_document['wells'].add((_id, self.property_id))

            expense_default_document['createdAt'] = datetime.datetime.now()
            expense_default_document['updatedAt'] = datetime.datetime.now()

            expense_default_document = combine_variable_expense_rows(
                expense_default_document, self.property_id, self.scenario, self.aries_data_extraction.scenarios_dic,
                self.ls_scenarios_id, self.aries_data_extraction.escalation_data_list,
                self.aries_data_extraction.compare_escalation_and_save_into_self_data_list,
                self.aries_data_extraction.user_id)

            expense_default_document = combine_fixed_expense_rows(
                expense_default_document, self.property_id, self.scenario, self.aries_data_extraction.scenarios_dic,
                self.ls_scenarios_id, self.aries_data_extraction.escalation_data_list,
                self.aries_data_extraction.compare_escalation_and_save_into_self_data_list,
                self.aries_data_extraction.user_id)

            if tax_conditionals.expense_overlay_present:
                expense_default_document = override_expense_overlay(expense_default_document, self.property_id,
                                                                    self.scenario,
                                                                    tax_exp_base.tax_expense_overlay_dict,
                                                                    self.aries_data_extraction.log_report,
                                                                    self.aries_data_extraction.get_default_format)

            expense_default_document = reorder_expense_document_row_for_rate_cut_off(expense_default_document)

            try:
                expense_default_document = convert_expense_dates_to_offset(
                    expense_default_document, self.aries_data_extraction.as_of_date,
                    self.aries_data_extraction.wells_dic.get(self.property_id, {}).get('first_prod_date'))
            except Exception:
                message = ErrorMsgEnum.failed_to_set_criteria_to_reference.value
                self.error_log(None, message, self.section, model=self.__class__.__name__)

            expense_model_name = tax_expense_naming.expense_model_name
            if expense_model_name == '':
                exp_key = CCSchemaEnum.assumption_key.value
                expense_model_name = f'ARIES_CC_{tax_exp_base.exp_default_document[exp_key].upper()}'

            if elt:
                return expense_default_document

            if expense_default_document == self.aries_data_extraction.get_default_format('expense'):
                return

            # compare and save into data_list
            self.aries_data_extraction.compare_and_save_into_self_data_list(
                expense_default_document,
                self.aries_data_extraction.expense_data_list,
                self.aries_data_extraction.projects_dic,
                model_name=expense_model_name,
                aries=True)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class7_msg.value, ErrorMsgEnum.expense.value)
            self.error_log(None, message, self.section, model=self.__class__.__name__)

    def save_obj_into_data_list(self, tax_conditionals: TaxConditionals, tax_exp_base: TaxExpenseBase,
                                tax_expense_naming: TaxExpenseNaming, xinvwt_multiplier: int, elt: bool):
        """Saves into the Aries Extraction data list the tax or expense object.

        Args:
            tax_conditionals:
            tax_exp_base:
            tax_expense_naming:
            xinvwt_multiplier:
        """
        if tax_conditionals.use_tax_model:
            self.save_tax_obj_into_data_list(tax_conditionals, tax_exp_base, tax_expense_naming)

        if tax_conditionals.use_expense_model:
            doc = self.save_expense_obj_into_data_list(tax_conditionals, tax_exp_base, tax_expense_naming,
                                                       xinvwt_multiplier, elt)
            if elt:
                return doc

    def model_extraction(self,
                         section_economic_df,
                         header_cols,
                         ls_scenarios_id,
                         scenario,
                         property_id,
                         index,
                         elt=False):
        """Treats section 6 df with START keyword and extracts tax and expense escalation

        Args:
            section_economic_df:
            header_cols:
            ls_scenarios_id:
            scenario:
            property_id:
            index:
        """

        self.pre_process()

        self.scenario = scenario
        self.property_id = property_id
        self.header_cols = header_cols
        self.ls_scenarios_id = ls_scenarios_id
        self.aries_data_extraction.filled_sev_tax_phase = set()

        use_std_dict = {
            PhaseEnum.oil.value: False,
            PhaseEnum.gas.value: False,
            PhaseEnum.ngl.value: False,
            PhaseEnum.aries_condensate.value: False
        }

        phase_tax_unit_dict = {
            PhaseEnum.oil.value: None,
            PhaseEnum.gas.value: None,
            PhaseEnum.ngl.value: None,
            PhaseEnum.aries_condensate.value: None
        }

        tax_exp_base = TaxExpenseBase(start_date=pd.to_datetime(self.aries_data_extraction.dates_1_base_date),
                                      fixed_exp_assignment=copy.deepcopy(FIXED_EXPENSE_KEYWORD_ASSIGNMENT_DICT),
                                      use_std_dict=use_std_dict,
                                      phase_tax_unit_dict=phase_tax_unit_dict,
                                      tax_default_document=self.aries_data_extraction.get_default_format('tax'),
                                      exp_default_document=self.aries_data_extraction.get_default_format('expense'),
                                      tax_expense_overlay_dict={},
                                      hold_expense_doc={},
                                      ignore_list=['TEXT'])

        tax_exp_base.start_date = tax_exp_base.start_date.strftime('%m/%Y')

        ################################
        # tax format filling
        ################################
        # 10/30/2019, change aries default tax model document, deduct_severance_tax to 'yes'
        tax_exp_base.tax_default_document['econ_function']['ad_valorem_tax']['deduct_severance_tax'] = 'yes'

        ################################
        # expense format filling
        ################################

        # Initialize tax_model_name, expense_model_name
        tax_expense_naming = TaxExpenseNaming()

        # Initialize start_fpd, start_asof, auto_return, use_fpd, use_asof, use_expense_model, expense_overlay_present
        # tax_overlay_present, use_expense_model
        tax_conditionals = TaxConditionals()

        xinvwt_multiplier = 1

        self.aries_data_extraction.owl_overlay = []

        self.aries_data_extraction.main_tax_unit = {
            PhaseEnum.oil.value: None,
            PhaseEnum.gas.value: None,
            PhaseEnum.ngl.value: None,
            PhaseEnum.aries_condensate.value: None
        }

        self.section_economic_df = pd.DataFrame(section_economic_df, columns=header_cols)
        self.section_economic_df['ls_expression'] = ''

        for idx, value in self.section_economic_df.iterrows():
            economic_row = Economic(value[EconHeaderEnum.keyword.value], value[EconHeaderEnum.propnum.value],
                                    value[EconHeaderEnum.initial_keyword.value], value[EconHeaderEnum.expression.value],
                                    value[EconHeaderEnum.qualifier.value], value[EconHeaderEnum.section.value],
                                    value[EconHeaderEnum.sequence.value])

            keyword = economic_row.keyword

            start_value = 0

            self.section = economic_row.section

            if keyword.startswith('*') \
                    or keyword in tax_exp_base.ignore_list \
                    or keyword in ['SALV', 'ABAN', 'PLUG']:
                continue

            try:

                economic_row.ls_expression = self.build_ls_expression(economic_row.expression,
                                                                      self.section,
                                                                      keyword,
                                                                      self.__class__.__name__,
                                                                      ignore_char='#')

                self.section_economic_df.at[idx, 'ls_expression'] = economic_row.ls_expression

                overlay_operation_process = check_if_overlay_operation_process(economic_row.ls_expression)
                if overlay_operation_process:
                    message = format_error_msg(ErrorMsgEnum.overlay_operations_error.value, keyword)
                    self.error_log(str_join(economic_row.ls_expression),
                                   message,
                                   self.section,
                                   model=self.__class__.__name__)
                    continue

                if keyword == 'START':
                    # START format could be 7/2017, 7/23/2017, 2017.25, 7/23/2017 0:00
                    # (2017.25 need to special handle if . exist in START)
                    # update the start_date = 07/2017, 07/2017, 03/2017, 07/2017
                    tax_exp_base.start_date = self.aries_data_extraction.read_start(economic_row.ls_expression,
                                                                                    economic_row.propnum, scenario,
                                                                                    ErrorMsgEnum.tax_expense.value,
                                                                                    self.section)
                    if tax_exp_base.start_date is None:
                        tax_exp_base.start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date) \
                            .strftime('%m/%Y')
                elif keyword == 'BTU':
                    pass
                elif keyword in ['XINVWT', 'WEIGHT']:
                    try:
                        xinvwt_multiplier = float(economic_row.ls_expression[0])
                    except (IndexError, ValueError):
                        xinvwt_multiplier = 1
                else:
                    if not self.create_tax_expense_obj(economic_row, tax_conditionals, tax_expense_naming, tax_exp_base,
                                                       start_value):
                        continue

            except Exception:
                message = format_error_msg(ErrorMsgEnum.class8_msg.value, ErrorMsgEnum.tax_expense_param.value, keyword)
                self.error_log(str_join(economic_row.ls_expression),
                               message,
                               self.section,
                               model=self.__class__.__name__)

        self.aries_data_extraction.expense_name_assignment = tax_exp_base.fixed_exp_assignment

        # Save the Tax document or Expense document into the Aries Data list.
        doc = self.save_obj_into_data_list(tax_conditionals, tax_exp_base, tax_expense_naming, xinvwt_multiplier, elt)
        if elt:
            return doc
