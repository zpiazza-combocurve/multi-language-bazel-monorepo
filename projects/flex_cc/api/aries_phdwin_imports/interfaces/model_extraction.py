from abc import ABC, abstractmethod
from typing import Optional, Union

from api.aries_phdwin_imports.aries_import_helpers import fetch_value
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.helpers import check_for_default_lines, str_join, check_for_null_values_in_expression


class ModelExtractionInterface(ABC):
    def __init__(self, aries_data_extraction):
        self.aries_data_extraction = aries_data_extraction

        self.property_id = None
        self.header_cols = None
        self.scenario = None
        self.ls_scenarios_id = None
        self.section = None

    def error_log(self,
                  aries_row: Optional[str],
                  message: Union[str, ErrorMsgEnum],
                  section: Union[str, int],
                  model: str,
                  severity: str = ErrorMsgSeverityEnum.error.value):
        """Encapsulates the error logging for the model extraction processes
        Args:
            aries_row: Row where the error occurred
            message: Message to the user about the error
            section: Economic section related to the process that was being made
            model: ModelExtraction instance model where the error occurred
            severity: Severity of the error to report. default: `error`
        Returns:
        """
        from api.aries_phdwin_imports.aries_data_extraction.helpers.common import get_model_value

        model = get_model_value(model)
        self.aries_data_extraction.log_report.log_error(aries_row=aries_row,
                                                        message=message,
                                                        scenario=self.scenario,
                                                        well=self.property_id,
                                                        model=model,
                                                        section=section,
                                                        severity=severity)

    def build_ls_expression(self, expression: str, section: str, keyword: str, model: str, ignore_char: str = None):
        """Builds the ls expression list based on the `EXPRESSION` field found in the economic df
                Args:
                    expression: character chain containing the information to look up. e.g. `35 X M$ TO LIFE PC 0`
                    section: section number associated to capex in the economic table.
                    keyword: keyword string extracted from the economic dataframe
                    model: Model to which the expression is being created
                    ignore_char: Whether to validate an ignoring character or not (applicable on pricing, tax_expense)
                Returns:
                    ls_expression list e.g ['35', 'X', 'M$', 'TO', 'LIFE', 'PC', '0']
                """
        ls_expression = []
        try:
            ls_expression = [
                fetch_value(string, self.property_id, self.aries_data_extraction.at_symbol_mapping_dic,
                            self.aries_data_extraction.CUSTOM_TABLE_dict) for string in expression.strip().split()
            ]
        except Exception:
            self.error_log(expression, ErrorMsgEnum.fetch_value_error_msg.value, section, model)

        if ignore_char is None or (ignore_char is not None and ignore_char not in str(ls_expression[-1])):
            try:
                ls_expression = check_for_default_lines(ls_expression, keyword,
                                                        self.aries_data_extraction.common_default_lines)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.default_lines.value)
                self.error_log(str_join(ls_expression), message, section, model)

        ls_expression = check_for_null_values_in_expression(ls_expression)

        return ls_expression

    @abstractmethod
    def model_extraction(self,
                         section_economic_df,
                         header_cols,
                         ls_scenarios_id,
                         scenario,
                         property_id,
                         index,
                         elt=False):
        pass
