import copy
import datetime
from typing import Optional, List

import numpy as np
import pandas as pd
from bson import ObjectId

from api.aries_phdwin_imports.aries_import_helpers import (get_header_index, get_model_name_from_qualifiers)
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg

from api.aries_phdwin_imports.aries_data_extraction.helpers.capex import (check_if_aban_salv_keyword_present,
                                                                          get_capex_delay_days_and_date,
                                                                          get_capex_escalation_start,
                                                                          update_offset_if_delay_present,
                                                                          update_capex_cum_obj)
from api.aries_phdwin_imports.helpers import (str_join, DEFAULT_BASE_DATE, check_for_inconsistent_date,
                                              get_day_month_year_from_decimal_date, get_day_month_from_decimal_date,
                                              format_aries_segment_date, cumulative_unit_dic)
from api.aries_phdwin_imports.interfaces.model_extraction import ModelExtractionInterface
from combocurve.shared.aries_import_enums import EconHeaderEnum, CCSchemaEnum


class Capex(ModelExtractionInterface):
    def __init__(self, aries_data_extraction):
        super().__init__(aries_data_extraction)

        self.section_economic_df = None

        self.capex_default_document = {}
        self.invwt_multiplier = 1

        self.abandon_delay_days = None
        self.abandon_delay_date = None
        self.salvage_delay_days = None
        self.salvage_delay_date = None

    def pre_process(self):
        """Initializes global variables with its proper content
        """
        self.capex_default_document = self.aries_data_extraction.get_default_format('capex')
        self.invwt_multiplier = 1

        _, expression_index, keyword_mark_index, _, _ = get_header_index([
            EconHeaderEnum.propnum.value, EconHeaderEnum.expression.value, EconHeaderEnum.keyword.value,
            EconHeaderEnum.qualifier.value, EconHeaderEnum.section.value
        ], self.header_cols)

        try:
            (self.abandon_delay_days, self.abandon_delay_date, self.salvage_delay_days,
             self.salvage_delay_date) = get_capex_delay_days_and_date(self.section_economic_df, keyword_mark_index,
                                                                      self.property_id, expression_index,
                                                                      self.aries_data_extraction.at_symbol_mapping_dic,
                                                                      self.aries_data_extraction.CUSTOM_TABLE_dict)
        except ValueError:
            pass

    def update_date_in_capex(self, capex_obj: dict, start_date: str):
        """Updates date field in capex obj

        Args:
            capex_obj: Capex structure object that is going to be updated.
            start_date: start_date extracted from the economic dataframe
        """
        formatted_start_date = pd.to_datetime(start_date, errors="coerce")
        if not pd.isnull(formatted_start_date):
            capex_obj['date'] = formatted_start_date.strftime('%Y-%m-%d')
        elif self.aries_data_extraction.dates_1_base_date is not None:
            base_date = self.aries_data_extraction.dates_1_base_date
            capex_obj['date'] = pd.to_datetime(base_date).strftime('%Y-%m-%d')
        else:
            capex_obj['date'] = pd.to_datetime(DEFAULT_BASE_DATE).strftime('%Y-%m-%d')

    def add_escalation_to_capex(self, capex_obj: dict, ls_expression: List[str], keyword: str, section: str,
                                expression: str, start_date):
        """

        Args:
            capex_obj: Capex object that is going to be updated
            ls_expression:
            keyword:
            section:
            expression:
            start_date:

        Returns:

        """
        if any(obj_key in capex_obj for obj_key in ['date', 'offset_to_econ_limit']):
            try:
                unique_escalation_default_document = self.aries_data_extraction.escalation_model_extraction(
                    ls_expression, start_date, keyword, self.scenario, self.ls_scenarios_id, self.property_id, 'capex',
                    section)
                capex_obj['escalation_model'] = copy.deepcopy(unique_escalation_default_document)
                # add escalation offset
                capex_obj = get_capex_escalation_start(capex_obj, start_date, ls_expression,
                                                       self.aries_data_extraction.custom_escalation)
            except Exception:
                capex_obj['escalation_model'] = 'none'
                message = format_error_msg(ErrorMsgEnum.escalation_msg.value, keyword, str_join(ls_expression))
                self.aries_data_extraction.log_report.log_error(aries_row=expression,
                                                                message=message,
                                                                scenario=self.scenario,
                                                                well=self.property_id,
                                                                model=ErrorMsgEnum.capex.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.warn.value)
        else:
            capex_obj['escalation_model'] = 'none'

    def update_tangible_and_intagible_capex(self, capex_obj: dict, ls_expression: List[str], keyword: str,
                                            section: str):
        """Updates the capex object's tangible and intangible fields

        Args:
            capex_obj: Capex object that is going to be updated
            ls_expression: Expression where the intangible and tangible values are going to be extracted from
            keyword: Keyword value extracted from the economic df
            section: Section value extracted from the economic df
        """
        # need to handle if value is 'X'
        try:
            value = eval(str(ls_expression[0]))
            if keyword == 'SALV' and section == EconHeaderEnum.tax_expense_section_key.value:
                value = -1 * value if value > 0 else value
            capex_obj['tangible'] = value
        except (ValueError, NameError):
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.tangible_capex.value,
                                       str_join(ls_expression))

            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=self.scenario,
                                                            well=self.property_id,
                                                            model=ErrorMsgEnum.capex.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)
        # need to handle when intangible value is X
        try:
            value = eval(str(ls_expression[1]))
            if keyword == 'SALV':
                value = -1 * value if value > 0 else value
            capex_obj['intangible'] = value
        except (ValueError, NameError):
            if ls_expression[1] != 'X':
                message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.intangible_capex.value,
                                           str_join(ls_expression))
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=message,
                                                                scenario=self.scenario,
                                                                well=self.property_id,
                                                                model=ErrorMsgEnum.capex.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

    @classmethod
    def set_type_of_calculation(cls, capex_obj: dict, ls_expression: List[str]):
        """Sets the type of calculation (net or gross)

        Args:
            capex_obj: Capex object that is going to be updated
            ls_expression: Expression evaluated to check the type of calculation
        """
        if str(ls_expression[2]).split('$')[-1] == 'N':
            capex_obj['calculation'] = 'net'
        elif str(ls_expression[2]).split('$')[-1] == 'G':
            capex_obj['calculation'] = 'gross'

        if ls_expression[2] == '$':
            try:
                capex_obj['tangible'] /= 1000
                capex_obj['intangible'] /= 1000
            except TypeError:
                pass

    def process_cutoff_from_expression(self, capex_obj: dict, ls_expression: List[str], keyword: str, section: str,
                                       start_date: str):
        """Updates capex_obj based on the given ls_expression

        Args:
            capex_obj: Capex object that is going to be updated
            ls_expression: Expression to be evaluated in order to process cutoff
            keyword: Keyword value extracted from the economic df
            section: Section value extracted from the economic df
            start_date: start_date: Start date associated with the START row
        """

        if ls_expression[4] == 'LIFE':
            # add 'offset_to_econ_limit'
            capex_obj['after_econ_limit'] = 'yes'
            del capex_obj['date']
            capex_obj['offset_to_econ_limit'] = 0

            update_offset_if_delay_present(capex_obj, keyword, section, self.abandon_delay_days,
                                           self.abandon_delay_date, self.salvage_delay_days, self.salvage_delay_date)
        else:
            # set capex obj back to other investment if the abandonment is not set to the life of the well
            capex_obj['category'] = 'other_investment' if capex_obj.get(
                'category') == 'abandonment' and section == 8 else capex_obj.get('category')
            # date since start_date

        try:
            if ls_expression[4] in ['YR', 'YRS', 'IYR', 'IYRS']:
                shift_day, shift_month, shift_year = get_day_month_year_from_decimal_date(ls_expression[3])
                offset = pd.DateOffset(years=shift_year, months=shift_month, days=shift_day)
                if ls_expression[4].startswith('I'):
                    date = pd.to_datetime(
                        self.capex_default_document['econ_function']['other_capex']['rows'][-1]['date']) + offset
                else:
                    date = pd.to_datetime(start_date) + offset
                capex_obj['date'] = date.strftime('%Y-%m-%d')

            elif ls_expression[4] in ['MO', 'MOS', 'IMO', 'IMOS']:
                shift_day, shift_month = get_day_month_from_decimal_date(ls_expression[3])
                offset = pd.DateOffset(days=shift_day, months=shift_month)
                if ls_expression[4].startswith('I'):
                    date = pd.to_datetime(
                        self.capex_default_document['econ_function']['other_capex']['rows'][-1]['date']) + offset
                else:
                    date = pd.to_datetime(start_date) + offset
                capex_obj['date'] = date.strftime('%Y-%m-%d')
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.date.value,
                                       tuple([start_date, str_join(ls_expression)]))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=self.scenario,
                                                            well=self.property_id,
                                                            model=ErrorMsgEnum.capex.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.warn.value)
        try:
            if ls_expression[4] == 'AD':
                base_date = self.aries_data_extraction.dates_1_base_date
                formatted_base_date = format_aries_segment_date(ls_expression[3], base_date)
                capex_obj['date'] = formatted_base_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.date.value, str_join(ls_expression))

            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=self.scenario,
                                                            well=self.property_id,
                                                            model=ErrorMsgEnum.capex.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        if ls_expression[4] in cumulative_unit_dic:
            update_capex_cum_obj(capex_obj, start_date, ls_expression)

    def append_capex_row_to_data_list(self, capex_model_name: str):
        """Appends the capex rows into the projects' data list

        Args:
            capex_model_name: Name which is used to identify the capex model
        """
        # remove the default row in capex_default_model
        capex_rows = self.capex_default_document['econ_function']['other_capex']['rows']
        if len(capex_rows) > 1:
            self.capex_default_document['econ_function']['other_capex']['rows'].pop(0)

        for _id in self.ls_scenarios_id:
            if self.aries_data_extraction.scenarios_dic[_id]['name'] == self.scenario:
                self.capex_default_document['wells'].add((_id, self.property_id))

        capex_model_name = (capex_model_name if capex_model_name != '' else
                            f'ARIES_CC_{self.capex_default_document[CCSchemaEnum.assumption_key.value].upper()}')

        self.aries_data_extraction.compare_and_save_into_self_data_list(self.capex_default_document,
                                                                        self.aries_data_extraction.capex_data_list,
                                                                        self.aries_data_extraction.projects_dic,
                                                                        model_name=capex_model_name,
                                                                        aries=True)

    def create_capex_object(self, row: pd.Series, ls_expression: List[str], start_date) -> Optional[dict]:
        """Creates a new row to be appended in the capex info structure

        Args:
            row: row extracted from the economic section dataframe
            ls_expression: Built ls expression based on the expression field from the economic section dataframe
            start_date: Start date associated with the START row

        Returns:
            A capex object or None if keyword does not meet the requirements
        """

        propnum = row[EconHeaderEnum.propnum.value]
        keyword = row[EconHeaderEnum.keyword.value]
        section = row[EconHeaderEnum.section.value]
        expression = row[EconHeaderEnum.expression.value]

        if keyword in ['ABANDON', 'SALVAGE']:
            return

        # create default capex object
        capex_obj = {
            "category": "other_investment",
            "date": "1800-01-31",
            "tangible": 0,
            "intangible": 0,
            "capex_expense": "capex",
            "after_econ_limit": "no",
            "calculation": "gross",
            "depreciation_model": "none",
            "deal_terms": 1,
            "description": keyword
        }

        if keyword in ['ABAN', 'ABDN', 'PLUG']:
            capex_obj['category'] = 'abandonment'
        elif keyword == 'SALV':
            capex_obj['category'] = 'salvage'
        elif keyword == 'DRILL':
            capex_obj['category'] = 'drilling'

        self.update_date_in_capex(capex_obj, start_date)

        check_for_inconsistent_date(ls_expression, keyword, self.aries_data_extraction.log_report, self.scenario,
                                    propnum, section)

        self.process_cutoff_from_expression(capex_obj, ls_expression, keyword, section, start_date)

        self.add_escalation_to_capex(capex_obj, ls_expression, keyword, section, expression, start_date)

        self.update_tangible_and_intagible_capex(capex_obj, ls_expression, keyword, section)

        self.set_type_of_calculation(capex_obj, ls_expression)

        if keyword not in ['ABAN', 'SALV', 'PLUG']:
            capex_obj['deal_terms'] = self.invwt_multiplier
        return capex_obj

    def model_extraction(self, section_economic_df: np.ndarray, header_cols: List[str], ls_scenarios_id: List[ObjectId],
                         scenario: str, property_id: str, index: int, elt: bool):
        """Extracts capex, escalation from section 8, 6 df

        Args:
            section_economic_df:
            header_cols:
            ls_scenarios_id:
            scenario:
            property_id: propnum field
            index:
        """

        self.header_cols = header_cols
        self.property_id = property_id
        self.scenario = scenario
        self.ls_scenarios_id = ls_scenarios_id
        self.section_economic_df = section_economic_df

        self.pre_process()

        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')

        ################################
        # capex format filling (kewyord currently have: ABDN, COMPL, DRILL, SALV, WORKOVER)
        ################################
        has_capex_model = False

        # depreciation_model could need to handle in the future
        # (the value for depreciation seems store in AC_DATASETUP showing in front-end of Aries)
        capex_model_name = ''

        ignore_list = ['TEXT']

        ls_expression = []
        section_economic_df = pd.DataFrame(section_economic_df, columns=header_cols)

        for _, value in section_economic_df.iterrows():
            try:
                propnum = value[EconHeaderEnum.propnum.value]
                keyword = value[EconHeaderEnum.keyword.value]
                section = value[EconHeaderEnum.section.value]
                qualifier = value[EconHeaderEnum.qualifier.value]
                expression = value[EconHeaderEnum.expression.value]

                if str(keyword).strip().upper() == 'TEXT' or keyword.startswith('*') or keyword in ignore_list:
                    continue

                # Build the ls_expression list
                ls_expression = self.build_ls_expression(expression, section, keyword, self.__class__.__name__)

                if keyword == 'START':
                    # START format could be 7/2017, 7/23/2017, 2017.25, 7/23/2017 0:00
                    # (2017.25 need to special handle if . exist in START)
                    # update the start_date = 07/2017, 07/2017, 03/2017, 07/2017
                    start_date = self.aries_data_extraction.read_start(ls_expression, propnum, scenario,
                                                                       ErrorMsgEnum.capex.value, section)
                    if start_date is None:
                        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')
                elif keyword in ['INVWT', 'WEIGHT']:
                    try:
                        self.invwt_multiplier = float(ls_expression[0])
                        self.invwt_multiplier = self.invwt_multiplier if self.invwt_multiplier != 0 else 1
                    except (ValueError, IndexError):
                        self.invwt_multiplier = 1
                else:
                    has_capex_model = True

                    capex_obj = self.create_capex_object(value, ls_expression, start_date)

                    if not capex_obj:
                        continue
                    # TODO: Add time stamp
                    self.capex_default_document['createdAt'] = datetime.datetime.now()
                    self.capex_default_document['updatedAt'] = datetime.datetime.now()

                    self.capex_default_document['econ_function']['other_capex']['rows'].append(capex_obj)
                capex_model_name = get_model_name_from_qualifiers(keyword, qualifier, capex_model_name,
                                                                  self.capex_default_document)
            except Exception:
                skip_error_msg = False
                capex_error_otp = check_if_aban_salv_keyword_present(self.abandon_delay_days, self.abandon_delay_date,
                                                                     self.salvage_delay_days, self.salvage_delay_date,
                                                                     keyword, property_id, ls_expression, qualifier,
                                                                     capex_model_name, self.capex_default_document,
                                                                     self.aries_data_extraction.at_symbol_mapping_dic,
                                                                     self.aries_data_extraction.CUSTOM_TABLE_dict)
                if capex_error_otp is not None:
                    (self.abandon_delay_days, self.abandon_delay_date, self.salvage_delay_days, self.salvage_delay_date,
                     capex_model_name, skip_error_msg) = capex_error_otp
                if skip_error_msg:
                    continue
                message = format_error_msg(ErrorMsgEnum.class8_msg.value, ErrorMsgEnum.capex_param.value, keyword)
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=message,
                                                                scenario=scenario,
                                                                well=property_id,
                                                                model=ErrorMsgEnum.capex.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

        if elt:
            return self.capex_default_document

        # if no section 8, then wouldn't import any capex_default model
        if has_capex_model:
            self.append_capex_row_to_data_list(capex_model_name)
