import copy
import datetime
import math
from typing import Tuple

import pandas as pd
from dateutil.relativedelta import relativedelta

from api.aries_phdwin_imports.aries_import_helpers import get_major_phase, get_header_index_dict, format_start_date, \
    extract_df_row_value, fetch_value, get_model_name_from_qualifiers
from api.aries_phdwin_imports.combine_rows import aries_cc_round
from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.helpers import (
    OWNERSHIP_KEYS, DEFAULT_LEASE_NRI, ZERO_LEASE_NRI, str_join, check_for_inconsistent_date, format_aries_segment_date,
    RATE_CUT_OFF, LAST_POS_CASH_FLOW_DICT, MAX_CUM_CASH_FLOW_DICT_PMAX, remove_escalation_own_df, check_for_single_lse,
    check_for_default_lines, check_for_null_values_in_expression, update_date_model_from_expression_keyword,
    check_if_line_to_be_ignored, process_multiple_net_values, update_include_capex_in_date_model, has_forecast,
    fill_reversion_ownership_document)
from api.aries_phdwin_imports.interfaces.model_extraction import ModelExtractionInterface
from combocurve.shared.aries_import_enums import EconHeaderEnum, PhaseEnum, CCSchemaEnum, UnitEnum, EconEnum


class Ownership(ModelExtractionInterface):
    def __init__(self, aries_data_extraction):
        super().__init__(aries_data_extraction)

    def preprocess(self):
        self.section_economic_df = None
        self.header_cols = None
        self.ls_scenarios_id = None
        self.scenario = None
        self.property_id = None
        self.index = None

        # parameters to calculate original ownership
        self.ls_reversion_object = []
        self.ls_reversion_parameters = []

        # parameters to calculate original ownership
        self.net_unit = None
        self.lse_unit = None
        self.own_unit = None

        self.wi = None
        self.own_wi = None

        self.own_roy_oil_gas = None
        self.own_orri = None
        self.own_npi = None

        self.nri_oil = None
        self.nri_gas = None
        self.npi = None

        self.lse_wi = None
        self.lse_roy_oil_gas = None
        self.lse_orri = None
        self.lse_npi = None

        self.lease_nri_oil = None
        self.lease_nri_gas = None
        self.lease_nri_cnd = None
        self.lease_nri_ngl = None

        self.loss_lease_nri_oil = None
        self.loss_lease_nri_gas = None

        self.actual_nri_gas = None
        self.actual_nri_oil = None
        self.actual_nri_cnd = None
        self.actual_nri_ngl = None

        self.has_loss_keyword = False
        self.used_opnet = False
        self.has_eloss_pmax = False
        self.has_original_ownership_parameters = False
        self.has_original_own_ownership_parameters = False
        self.own_reversion_index = 0
        self.has_only_one_lse_dataline = False

        self.method = ''

        self.header_index = {}
        self.ownership_default_document = self.aries_data_extraction.get_default_format('ownership')

    @property
    def major_phase(self):
        keyword_mark_index = self.header_index[str(EconHeaderEnum.keyword.value)]
        expression_index = self.header_index[str(EconHeaderEnum.expression.value)]

        phase = get_major_phase(self.section_economic_df, self.aries_data_extraction.forecast_df, keyword_mark_index,
                                expression_index, self.property_id, self.aries_data_extraction.at_symbol_mapping_dic,
                                self.aries_data_extraction.CUSTOM_TABLE_dict, self.aries_data_extraction.log_report)

        if phase is None:
            return PhaseEnum.oil.value.upper()
        return phase

    def reversion_internal_calculation(  # noqa(C901)
            self, ls_reversion_object, ls_reversion_parameters, lease_nri_oil, lease_nri_gas) -> bool:
        """Internal calculation for reversion wi, nri_oil, nri_gas, npi, lease_nri_oil, lease_nri_gas

        Args:
            ls_reversion_object:
            ls_reversion_parameters:
            lease_nri_oil:
            lease_nri_gas:

        Returns:
            True if the reversion extraction is successful, False otherwise
        """
        # check if it has reversion, if not need to return reversion_extraction_success = True, means successful
        if len(ls_reversion_object) == 0 and len(ls_reversion_parameters) == 0:
            reversion_extraction_success = True
        else:
            reversion_extraction_success = False

        for idx in range(len(ls_reversion_object)):
            reversion_object = ls_reversion_object[idx]
            try:
                reversion_parameters = ls_reversion_parameters[idx]
            except IndexError:
                try:
                    reversion_parameters = copy.deepcopy(ls_reversion_parameters[-1])
                except IndexError:
                    reversion_extraction_success = True
                    break
                reversion_parameters = {key: 0 for key in reversion_parameters}

            wi = reversion_parameters['wi']
            nri_oil = reversion_parameters['nri_oil']
            nri_gas = reversion_parameters['nri_gas']
            npi = reversion_parameters['npi']
            lse_wi = reversion_parameters['lse_wi']
            lse_roy_oil_gas = reversion_parameters['lse_roy_oil_gas']
            lse_orri = reversion_parameters['lse_orri']
            lse_npi = reversion_parameters['lse_npi']
            own_wi = reversion_parameters['own_wi']
            own_roy_oil_gas = reversion_parameters['own_roy_oil_gas']
            own_orri = reversion_parameters['own_orri']
            own_npi = reversion_parameters['own_npi']

            condition_check_1 = (wi is None or nri_oil is None or nri_gas is None)
            condition_check_2 = (lse_wi is not None and own_wi is not None)
            condition_check_3 = (lse_roy_oil_gas is not None and own_roy_oil_gas is not None)
            condition_check_4 = (lse_orri is not None and own_orri is not None)
            condition_check_5 = (lse_npi is not None and own_npi is not None)

            if wi is not None and wi == 0 and not self.used_opnet:
                if lease_nri_oil is None:
                    if nri_oil == 0 and self.method in [EconEnum.pmax.value, EconEnum.bfit.value]:
                        lease_nri_oil = ZERO_LEASE_NRI
                    else:
                        lease_nri_oil = DEFAULT_LEASE_NRI
                if lease_nri_gas is None:
                    if nri_gas == 0 and self.method in [EconEnum.pmax.value, EconEnum.bfit.value]:
                        lease_nri_gas = ZERO_LEASE_NRI
                    else:
                        lease_nri_gas = DEFAULT_LEASE_NRI

            # if LSE exist, it will always be use rather than the value defined in NET
            # use 'LSE' define wi, nri_oil, nri_gas, lease_nri_oil, lease_nri_gas
            if all((condition_check_1, condition_check_2, condition_check_3, condition_check_4, condition_check_5)):
                # has 'LSE' keyword
                wi = (lse_wi * own_wi) / 100 if lse_wi <= 100 else own_wi
                nri_oil = (lse_wi * own_wi * (100 - (lse_roy_oil_gas + lse_orri))) / 10000 + (
                    lse_roy_oil_gas * own_roy_oil_gas) / 100 + (lse_orri * own_orri) / 100  # unit is %
                nri_gas = (lse_wi * own_wi * (100 - (lse_roy_oil_gas + lse_orri))) / 10000 + (
                    lse_roy_oil_gas * own_roy_oil_gas) / 100 + (lse_orri * own_orri) / 100  # unit is %
                npi = (lse_npi * own_npi) / 100  # unit is %

                if lease_nri_oil is None or lease_nri_gas is None:
                    if float(wi) == 0 and float(nri_oil) == 0 and (lse_roy_oil_gas + lse_orri == 0):
                        lease_nri_oil = 0.0
                        lease_nri_gas = 0.0
                    else:
                        lease_nri_oil = 100 - (lse_roy_oil_gas + lse_orri)  # unit is %
                        lease_nri_gas = 100 - (lse_roy_oil_gas + lse_orri)  # unit is %

            # use 'NET' define wi, nri_oil, nri_gas, lease_nri_oil, lease_nri_gas
            if wi != 0 and wi is not None and nri_oil is not None and nri_gas is not None:
                if lease_nri_oil is None or lease_nri_gas is None:
                    lease_nri_oil = (nri_oil / wi) * 100  # unit is %
                    lease_nri_gas = (nri_gas / wi) * 100  # unit is %

                # in case nri_oil > wi and nri_gas > wi, do not import this ownership model
                # need to show this well to user to fix this ownership econ assumption in the future
                if nri_oil > wi:
                    lease_nri_oil = DEFAULT_LEASE_NRI

                if nri_gas > wi:
                    lease_nri_gas = DEFAULT_LEASE_NRI

            if (wi is not None and nri_oil is not None and nri_gas is not None and lease_nri_oil is not None
                    and lease_nri_gas is not None and npi is not None):
                reversion_extraction_success = True
                del reversion_object['working_interest']
                del reversion_object['net_revenue_interest']
                del reversion_object['lease_net_revenue_interest']

                del reversion_object['prev_segment_cutoff']
                try:
                    use_lease_nri = lease_nri_oil if self.major_phase != 'GAS' else lease_nri_gas
                except NameError:
                    use_lease_nri = lease_nri_oil

                obj = {
                    **reversion_object, "working_interest": aries_cc_round(float(wi)),
                    "original_ownership": {
                        "net_revenue_interest": float(nri_oil),
                        "lease_net_revenue_interest": float(use_lease_nri)
                    },
                    "oil_ownership": {
                        "net_revenue_interest": "",
                        "lease_net_revenue_interest": ""
                    },
                    "gas_ownership": {
                        "net_revenue_interest": "",
                        "lease_net_revenue_interest": ""
                    },
                    "ngl_ownership": {
                        "net_revenue_interest": "",
                        "lease_net_revenue_interest": ""
                    },
                    "drip_condensate_ownership": {
                        "net_revenue_interest": "",
                        "lease_net_revenue_interest": ""
                    },
                    "net_profit_interest": ""
                }

                # if need to fill nri_gas or lease_nri_gas
                if nri_gas != nri_oil:
                    obj['gas_ownership']['net_revenue_interest'] = aries_cc_round(float(nri_gas))
                    obj['gas_ownership']['lease_net_revenue_interest'] = aries_cc_round(float(lease_nri_gas))

                # add net_profit_insterest_type and net_profit_interest
                if own_wi == 0 and own_roy_oil_gas == 0 and own_orri == 0 and own_npi != 0:
                    # the npi from LSE + OWN (no NET line)
                    obj['net_profit_interest_type'] = 'revenue'
                    obj['net_profit_interest'] = npi
                elif own_npi == 0 and lse_npi is not None:
                    # use the npi from LSE as npi
                    obj['net_profit_interest_type'] = 'expense'
                    obj['net_profit_interest'] = lse_npi
                elif lse_npi is None:
                    # the npi from NET (no LSE, no OWN line)
                    obj['net_profit_interest_type'] = 'expense'
                    obj['net_profit_interest'] = npi
                elif lse_npi == 0:
                    obj['net_profit_interest_type'] = 'expense'
                    obj['net_profit_interest'] = 0

                for key in OWNERSHIP_KEYS:
                    if self.ownership_default_document['econ_function']['ownership'][key] is None:
                        self.ownership_default_document['econ_function']['ownership'][key] = obj
                        break

        return reversion_extraction_success

    def read_ls_expression_append_to_ls_reversion_parameters(  # noqa(C901)
            self, ls_expression, keyword, propnum, reversion_parameters, scenario, section):
        """Read reversion value and append those parameters to ls_reversion_parameters

        Args:
            ls_expression:
            keyword:
            propnum:
            reversion_parameters:
            scenario:
            section:

        Returns:

        """
        unit = None

        if keyword == 'NET':
            try:
                reversion_parameters['wi'] = aries_cc_round(float(ls_expression[0]))
                reversion_parameters['nri_oil'] = aries_cc_round(float(ls_expression[1]))
            except (ValueError, KeyError, IndexError):
                message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
                self.aries_data_extraction.log_report.log_error(aries_row=ls_expression[1],
                                                                message=message,
                                                                scenario=scenario,
                                                                well=propnum,
                                                                model=ErrorMsgEnum.ownership.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

            if not unit:
                try:
                    nri_gas = ls_expression[2]
                    reversion_parameters['nri_gas'] = float(nri_gas)
                except (ValueError, KeyError):
                    reversion_parameters['nri_gas'] = reversion_parameters['nri_oil']
                    reversion_parameters['npi'] = 0
                    unit = ls_expression[2]
                except IndexError:
                    pass

            if not unit:
                try:
                    npi = ls_expression[3]
                    reversion_parameters['npi'] = float(npi)
                except (ValueError, KeyError):
                    reversion_parameters['npi'] = 0
                    unit = ls_expression[3]
                except IndexError:
                    pass

            if not unit:
                try:
                    unit = ls_expression[4]
                except IndexError:
                    pass

            if unit == 'FRAC':
                try:
                    reversion_parameters['wi'] *= 100
                    reversion_parameters['nri_oil'] *= 100
                    reversion_parameters['nri_gas'] *= 100
                    reversion_parameters['npi'] *= 100
                except (ValueError, KeyError, IndexError):
                    message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
                    self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                    message=message,
                                                                    scenario=scenario,
                                                                    well=propnum,
                                                                    model=ErrorMsgEnum.ownership.value,
                                                                    section=section,
                                                                    severity=ErrorMsgSeverityEnum.error.value)

        if keyword == 'LSE':
            try:
                reversion_parameters['lse_wi'] = float(ls_expression[0])
                reversion_parameters['lse_roy_oil_gas'] = float(ls_expression[1])
            except (ValueError, KeyError, IndexError):
                message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=message,
                                                                scenario=scenario,
                                                                well=propnum,
                                                                model=ErrorMsgEnum.ownership.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

            if not unit:
                try:
                    reversion_parameters['lse_orri'] = float(ls_expression[2])
                except (ValueError, KeyError, IndexError):
                    reversion_parameters['lse_orri'] = 0
                    reversion_parameters['lse_npi'] = 0
                    try:
                        unit = ls_expression[2]
                    except IndexError:
                        pass

            if not unit:
                try:
                    reversion_parameters['lse_npi'] = float(ls_expression[3])
                except (ValueError, KeyError, IndexError):
                    reversion_parameters['lse_npi'] = 0
                    try:
                        unit = ls_expression[3]
                    except IndexError:
                        pass

            if not unit:
                try:
                    unit = ls_expression[4]
                except IndexError:
                    pass

            if unit == 'FRAC':
                reversion_parameters['lse_wi'] *= 100
                reversion_parameters['lse_roy_oil_gas'] *= 100
                reversion_parameters['lse_orri'] *= 100
                reversion_parameters['lse_npi'] *= 100

        self.ls_reversion_parameters.append(reversion_parameters)

    def read_own_ls_exp_append_fill_to_ls_reversion_parameters(self, ls_expression, keyword, propnum,
                                                               own_reversion_index: int, scenario, section) -> bool:
        """Fill OWN expression value to reversion_parameters in list

        Args:
            ls_expression:
            keyword:
            propnum:
            own_reversion_index:
            scenario:
            section:

        Returns:
            True if revision parameters have the proper type and length. False otherwise
        """

        unit = None

        has_same_reversion_type_and_length = True
        reversion_parameters = {}

        try:
            # need to fill the OWN parameters for previous line
            reversion_parameters = self.ls_reversion_parameters[own_reversion_index - 1]
        except IndexError:
            has_same_reversion_type_and_length = False
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=ErrorMsgEnum.ownership.value,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        try:
            reversion_parameters['own_wi'] = float(ls_expression[0])
            reversion_parameters['own_roy_oil_gas'] = float(ls_expression[1])
        except (ValueError, KeyError):
            has_same_reversion_type_and_length = False
            message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        if not unit:
            try:
                reversion_parameters['own_orri'] = float(ls_expression[2])
            except (ValueError, IndexError):
                reversion_parameters['own_orri'] = 0
                reversion_parameters['own_npi'] = 0
                unit = ls_expression[2]

        if not unit:
            try:
                reversion_parameters['own_npi'] = float(ls_expression[3])
            except (ValueError, IndexError):
                reversion_parameters['own_npi'] = 0
                unit = ls_expression[3]

        if not unit:
            unit = ls_expression[4]

        if unit == 'FRAC':
            try:
                reversion_parameters['own_wi'] *= 100
                reversion_parameters['own_roy_oil_gas'] *= 100
                reversion_parameters['own_orri'] *= 100
                reversion_parameters['own_npi'] *= 100
            except KeyError:
                has_same_reversion_type_and_length = False
                message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=message,
                                                                scenario=scenario,
                                                                well=propnum,
                                                                model=ErrorMsgEnum.ownership.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

        return has_same_reversion_type_and_length

    def ownership_reversion(  # noqa(C901)
            self, ls_expression, keyword, ownership_default_document, propnum, start_date, cont, property_id,
            section) -> bool:
        """If there is reversion, append corresponding reversion object to
        ownership_default_document['econ_function']['reversion']['rows']

        Args:
            ls_expression:
            keyword:
            ownership_default_document:
            propnum:
            start_date:
            cont:
            property_id:
            section:

        Returns:
            True if a reversion object is created. False otherwise
        """
        # basic reversion format, need to add 'date', 'well_head_oil_cum', 'well_head_gas_cum'
        reversion_object = {
            'working_interest': None,
            'net_revenue_interest': None,
            'lease_net_revenue_interest': None,
            "balance": "gross",
            "include_net_profit_interest": "yes",
            "prev_segment_cutoff": None
        }

        reversion_parameters = {
            'wi': None,
            'nri_oil': None,
            'nri_gas': None,
            'npi': None,
            'lse_wi': None,
            'lse_roy_oil_gas': None,
            'lse_orri': None,
            'lse_npi': None,
            'own_wi': None,
            'own_roy_oil_gas': None,
            'own_orri': None,
            'own_npi': None
        }

        create_reversion_object = False

        try:
            # year
            int(start_date.split('/')[-1])
            # month
            int(start_date.split('/')[0])
        except (ValueError, IndexError):
            message = format_error_msg(ErrorMsgEnum.start_date_error_msg.value, start_date)
            self.aries_data_extraction.log_report.log_error(aries_row=start_date,
                                                            message=message,
                                                            scenario=self.scenario,
                                                            well=property_id,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)
            return create_reversion_object

        # add reversion value to previous reversion segment
        if len(self.ls_reversion_parameters) < len(self.ls_reversion_object):
            self.read_ls_expression_append_to_ls_reversion_parameters(ls_expression, keyword, propnum,
                                                                      reversion_parameters, self.scenario, section)

        ls_expression = check_for_inconsistent_date(ls_expression)

        # check reversion keyword
        try:
            if ls_expression[-1] == 'PAYOUT':
                try:
                    payout_value = float(ls_expression[-2])
                except ValueError:
                    payout_value = 0

                if payout_value == 0:
                    # M$/748 stream
                    reversion_object['payout_with_investment'] = 0
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'no'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    create_reversion_object = True
                elif payout_value == 1:
                    # M$/749 stream
                    reversion_object['payout_with_investment'] = 0
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'yes'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    create_reversion_object = True
                else:
                    reversion_object['payout_with_investment'] = payout_value * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'no'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    create_reversion_object = True
            elif ls_expression[-1] in ['M$/746', 'IM$/746', 'M$/452']:
                # add 'payout': 2200
                reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                reversion_object['balance'] = 'gross'
                reversion_object['include_net_profit_interest'] = 'yes'
                reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                create_reversion_object = True
                if ls_expression[-1] == 'M$/452':
                    self.aries_data_extraction.log_report.log_error(
                        aries_row=str_join(ls_expression),
                        message=ErrorMsgEnum.reversion_on_gross_revenue.value,
                        scenario=self.scenario,
                        well=property_id,
                        model=ErrorMsgEnum.ownership.value,
                        section=section,
                        severity=ErrorMsgSeverityEnum.warn.value)

            elif ls_expression[-1] in ['M$/747', 'IM$/747', 'M$/356']:
                # add 'payout': 2200
                reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                reversion_object['balance'] = 'gross'
                reversion_object['include_net_profit_interest'] = 'no'
                reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                create_reversion_object = True

            elif ls_expression[-1] in ['M$/748', 'IM$/748']:
                # add 'payout': 2200
                reversion_object['payout_with_investment'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                reversion_object['balance'] = 'gross'
                reversion_object['include_net_profit_interest'] = 'no'
                reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                create_reversion_object = True

            elif ls_expression[-1] in ['M$/749', 'IM$/749']:
                # add 'payout': 2200
                reversion_object['payout_with_investment'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                reversion_object['balance'] = 'gross'
                reversion_object['include_net_profit_interest'] = 'yes'
                reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                create_reversion_object = True

            elif ls_expression[-1] in ['M$N', 'IM$N', 'M$G', 'IM$G', 'M$/1069', 'M$/892']:
                # add 'payout': 2200
                reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                if ls_expression[-1] in ['M$N', 'IM$N', 'M$/1069']:
                    reversion_object['balance'] = 'net'
                else:
                    reversion_object['balance'] = 'gross'
                reversion_object['include_net_profit_interest'] = 'yes'
                reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                create_reversion_object = True
            # TODO: turn or statement into in statement e.g ls_expression[-1] in ('YR', 'YRS')
            elif ls_expression[-1] == 'YR' or ls_expression[-1] == 'YRS':
                # offset to START date
                # add 'date': '2026-07-01'
                # create start date datetime object
                # get date from start_date, ex: 10/2017
                year = int(start_date.split('/')[-1])
                month = int(start_date.split('/')[0])
                date = datetime.date(year, month, 1)

                # get float value of offset year
                offset_year = float(ls_expression[-2])

                # handle fraction years, such as 3.5 or 3.1
                year = math.floor(offset_year)
                offset_month = (offset_year - year) * 12

                month = math.ceil(offset_month)

                # create offset date
                date += relativedelta(years=+year)
                date += relativedelta(months=+month)
                reversion_object['date'] = date.strftime('%Y-%m-%d')
                create_reversion_object = True

            elif ls_expression[-1] == 'MO' or ls_expression[-1] == 'MOS':
                # offset to START date
                # add 'date': '2026-07-01'
                # create start date datetime object
                # get date from start_date, ex: 10/2017
                year = int(start_date.split('/')[-1])
                month = int(start_date.split('/')[0])
                date = datetime.date(year, month, 1)

                # get float value of offset year
                offset_month = float(ls_expression[-2])

                month = math.ceil(offset_month)

                # create offset date
                date += relativedelta(months=+month)
                reversion_object['date'] = date.strftime('%Y-%m-%d')
                create_reversion_object = True

            elif ls_expression[-1] == 'AD':
                seg_date = format_aries_segment_date(ls_expression[-2], self.aries_data_extraction.dates_1_base_date)
                # add 'date': '2026-07-01'
                reversion_object['date'] = seg_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
                create_reversion_object = True

            elif ls_expression[-1] == 'BBL':
                # add 'well_head_oil_cum': 250
                reversion_object['well_head_oil_cum'] = float(ls_expression[-2])
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'MB':
                # add 'well_head_oil_cum': 250
                reversion_object['well_head_oil_cum'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'MMB':
                # add 'well_head_oil_cum': 250
                reversion_object['well_head_oil_cum'] = float(ls_expression[-2]) * 1000000
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'MCF':
                # add 'well_head_gas_cum': 250
                reversion_object['well_head_gas_cum'] = float(ls_expression[-2])
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'MMF':
                # add 'well_head_gas_cum': 250
                reversion_object['well_head_gas_cum'] = float(ls_expression[-2]) * 1000
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'BCF':
                # add 'well_head_gas_cum': 250
                reversion_object['well_head_gas_cum'] = float(ls_expression[-2]) * 1000000
                reversion_object['start'] = start_date
                create_reversion_object = True

            elif ls_expression[-1] == 'LIFE' or ls_expression[-1] == 'FRAC' or ls_expression[-1] == '%' or len(
                    ls_expression) < 5:
                # do nothing to cause reversion cause reversion_extraction_success = True,
                # then this model will import into db
                # to distinguish 'LIFE' (no reversion) and 'reversion keyword not include currently'
                # (has reversion, but has no corresponding reversion in combocurve)

                create_reversion_object = True  # does not append object, just keep the reversion calculation on
                return create_reversion_object

            else:
                # 'reversion keyword not include currently'
                # append reversion_parameters to list to cause reversion_extraction_success = False,
                # then this model will not import into db
                # ex: 'M$/747', 'M$/748'
                self.ls_reversion_parameters.append(reversion_parameters)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=self.scenario,
                                                            well=property_id,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        # check if there is reversion
        if create_reversion_object:
            self.ls_reversion_object.append(reversion_object)

        return create_reversion_object

    def ownership_reversion_own_parameters(  # noqa(C901)
            self, ls_expression, keyword, ownership_default_document, propnum, start_date, own_reversion_index,
            has_only_one_lse_dataline, scenario, section) -> Tuple[bool, bool]:
        """Special function to add OWN parameter to reversion_parameters logic steps:
        1. Check if it has the same reversion keyword to reversion_object in list in order
        2. If OWN has the same reversion type to LSE, then save the OWN parameters to reversion_parameters in list in
           order

        Args:
            ls_expression:
            keyword:
            ownership_default_document:
            propnum:
            start_date:
            own_reversion_index:
            has_only_one_lse_dataline:
            scenario:
            section:

        Returns:
            True if reversion has the proper type and length. False Othwerise.
        """

        # basic reversion format, need to add 'date', 'well_head_oil_cum', 'well_head_gas_cum'
        start_date = format_start_date(start_date, self.aries_data_extraction.dates_1_base_date, format=True)
        reversion_object = {
            'working_interest': None,
            'net_revenue_interest': None,
            'lease_net_revenue_interest': None,
            "balance": "gross",
            "include_net_profit_interest": "yes",
            "prev_segment_cutoff": None
        }

        reversion_parameters = {
            'wi': None,
            'nri_oil': None,
            'nri_gas': None,
            'npi': None,
            'lse_wi': self.lse_wi,
            'lse_roy_oil_gas': self.lse_roy_oil_gas,
            'lse_orri': self.lse_orri,
            'lse_npi': self.lse_npi,
            'own_wi': None,
            'own_roy_oil_gas': None,
            'own_orri': None,
            'own_npi': None
        }

        has_same_reversion_type_and_length = False

        try:
            # year
            int(start_date.split('/')[-1])
            # month
            int(start_date.split('/')[0])
        except (ValueError, IndexError):
            message = format_error_msg(ErrorMsgEnum.start_date_error_msg.value, start_date)
            self.aries_data_extraction.log_report.log_error(aries_row=start_date,
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)
            return has_same_reversion_type_and_length, has_only_one_lse_dataline

        # LSE maybe has no reversion
        if self.ls_reversion_object:
            try:
                reversion_object = self.ls_reversion_object[own_reversion_index]
            except IndexError:
                reversion_object = {
                    'working_interest': None,
                    'net_revenue_interest': None,
                    'lease_net_revenue_interest': None,
                    "balance": "gross",
                    "include_net_profit_interest": "yes",
                    "prev_segment_cutoff": None
                }
        # TODO: unnecessary else
        else:
            reversion_object = {
                'working_interest': None,
                'net_revenue_interest': None,
                'lease_net_revenue_interest': None,
                "balance": "gross",
                "include_net_profit_interest": "yes",
                "prev_segment_cutoff": None
            }

        ls_expression = check_for_inconsistent_date(ls_expression, keyword, self.aries_data_extraction.log_report,
                                                    scenario, propnum, section)

        # check reversion keyword
        try:
            if ls_expression[-1] == 'PAYOUT':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and reversion_parameters
                    # (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    try:
                        payout_value = float(ls_expression[-2])
                    except ValueError:
                        payout_value = 0

                    if payout_value == 0:
                        # M$/748 stream
                        reversion_object['payout_with_investment'] = 0
                        reversion_object['start'] = start_date
                        reversion_object['balance'] = 'gross'
                        reversion_object['include_net_profit_interest'] = 'no'
                        reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    if payout_value == 1:
                        # M$/749 stream
                        reversion_object['payout_with_investment'] = 0
                        reversion_object['start'] = start_date
                        reversion_object['balance'] = 'gross'
                        reversion_object['include_net_profit_interest'] = 'yes'
                        reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    # check if 'payout' in reversion_object
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] in ['M$/746', 'IM$/746', 'M$/452']:
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'yes'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    if ls_expression[-1] == 'M$/452':
                        self.aries_data_extraction.log_report.log_error(
                            aries_row=str_join(ls_expression),
                            message=ErrorMsgEnum.reversion_on_gross_revenue.value,
                            scenario=scenario,
                            well=self.property_id,
                            model=ErrorMsgEnum.ownership.value,
                            section=section,
                            severity=ErrorMsgSeverityEnum.warn.value)
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] in ['M$/747', 'IM$/747', 'M$/356']:
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'no'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    # check if 'payout_without_investment' in reversion_object
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] in ['M$/748', 'IM$/748']:
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['payout_with_investment'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'no'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'payout_without_investment' in reversion_object
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] in ['M$/749', 'IM$/749']:
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['payout_with_investment'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'gross'
                    reversion_object['include_net_profit_interest'] = 'yes'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    # check if 'payout_without_investment' in reversion_object
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] in ['M$N', 'IM$N', 'M$G', 'IM$G', 'M$/1069', 'M$/892']:
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['payout_without_investment'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    reversion_object['balance'] = 'net'
                    reversion_object['include_net_profit_interest'] = 'yes'
                    reversion_object['prev_segment_cutoff'] = str(ls_expression[-2]) + '_' + str(ls_expression[-1])
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'payout_without_investment' in reversion_object
                    if reversion_object['prev_segment_cutoff'] == str(ls_expression[-2]) + '_' + str(
                            ls_expression[-1]) and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'YR' or ls_expression[-1] == 'YRS':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    year = int(start_date.split('/')[-1])
                    month = int(start_date.split('/')[0])
                    date = datetime.date(year, month, 1)

                    # get float value of offset year
                    offset_year = float(ls_expression[-2])

                    # handle fraction years, such as 3.5 or 3.1
                    year = math.floor(offset_year)
                    offset_month = (offset_year - year) * 12

                    month = math.ceil(offset_month)

                    # create offset date
                    date += relativedelta(years=+year)
                    date += relativedelta(months=+month)
                    reversion_object['date'] = date.strftime('%Y-%m-%d')

                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    # check if 'date' in reversion_object

                    # create start date datetime object
                    year = int(start_date.split('/')[-1])
                    month = int(start_date.split('/')[0])
                    date = datetime.date(year, month, 1)

                    offset_year = float(ls_expression[-2])

                    # handle fraction years, such as 3.5 or 3.1
                    year = math.floor(offset_year)
                    offset_month = (offset_year - year) * 12

                    month = math.ceil(offset_month)

                    # create offset date
                    date += relativedelta(years=+year)
                    date += relativedelta(months=+month)

                    if 'date' in reversion_object and date.strftime('%Y-%m-%d') == reversion_object['date']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'MO' or ls_expression[-1] == 'MOS':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    # get date from start_date, ex: 10/2017
                    year = int(start_date.split('/')[-1])
                    month = int(start_date.split('/')[0])
                    date = datetime.date(year, month, 1)

                    # get float value of offset year
                    offset_month = float(ls_expression[-2])

                    month = math.ceil(offset_month)

                    # create offset date
                    date += relativedelta(months=+month)
                    reversion_object['date'] = date.strftime('%Y-%m-%d')

                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # LSE has reversion (multiple lines)
                    # check if 'date' in reversion_object

                    # create start date datetime object
                    year = int(start_date.split('/')[-1])
                    month = int(start_date.split('/')[0])
                    date = datetime.date(year, month, 1)

                    offset_month = float(ls_expression[-2])

                    month = math.ceil(offset_month)

                    date += relativedelta(months=+month)

                    if 'date' in reversion_object and date.strftime('%Y-%m-%d') == reversion_object['date']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'AD':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True

                    formated_aries_date = format_aries_segment_date(ls_expression[-2],
                                                                    self.aries_data_extraction.dates_1_base_date)
                    reversion_object['date'] = formated_aries_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)

                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    seg_date = format_aries_segment_date(ls_expression[-2],
                                                         self.aries_data_extraction.dates_1_base_date)
                    # LSE has reversion (multiple lines)
                    date = seg_date.strftime(CCSchemaEnum.ymd_date_dash_format.value)
                    if 'date' in reversion_object and date == reversion_object['date']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'BBL':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_oil_cum'] = float(ls_expression[-2])
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'well_head_oil_cum' in reversion_object
                    if 'well_head_oil_cum' in reversion_object and float(ls_expression[-2]) * 1000 == reversion_object[
                            'well_head_oil_cum'] and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'MB':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_oil_cum'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'well_head_oil_cum' in reversion_object
                    if 'well_head_oil_cum' in reversion_object and float(ls_expression[-2]) * 1000 == reversion_object[
                            'well_head_oil_cum'] and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'MMB':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_oil_cum'] = float(ls_expression[-2]) * 1000000
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                else:
                    # check if 'well_head_oil_cum' in reversion_object
                    if 'well_head_oil_cum' in reversion_object and float(ls_expression[-2]) * 1000 == reversion_object[
                            'well_head_oil_cum'] and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'MCF':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_gas_cum'] = float(ls_expression[-2])
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'well_head_gas_cum' in reversion_object
                    if 'well_head_gas_cum' in reversion_object and float(
                            ls_expression[-2]
                    ) == reversion_object['well_head_gas_cum'] and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'MMF':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_gas_cum'] = float(ls_expression[-2]) * 1000
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                else:
                    # LSE has reversion (multiple lines)
                    # check if 'well_head_gas_cum' in reversion_object
                    if 'well_head_gas_cum' in reversion_object and float(ls_expression[-2]) * 1000 == reversion_object[
                            'well_head_gas_cum'] and start_date == reversion_object['start']:
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        try:
            if ls_expression[-1] == 'BCF':
                # if LSE only has one line, OWN has multiple lines
                if len(self.ls_reversion_object) == 0 or has_only_one_lse_dataline:
                    # need to add both reversion_object (OWN has reversion point) and
                    # reversion_parameters (LSE orginal value with OWN line value)
                    has_only_one_lse_dataline = True
                    reversion_object['well_head_gas_cum'] = float(ls_expression[-2]) * 1000000
                    reversion_object['start'] = start_date
                    # only read the reversion type value
                    if own_reversion_index == 0:
                        self.ls_reversion_object.append(reversion_object)
                        has_same_reversion_type_and_length = True
                    # read value for previous line reversion object, and also read the reversion type
                    else:
                        self.ls_reversion_object.append(reversion_object)
                        self.ls_reversion_parameters.append(reversion_parameters)
                        (has_same_reversion_type_and_length
                         ) = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                             ls_expression, keyword, propnum, own_reversion_index, scenario, section)
                # LSE has reversion (multiple lines)
                # check if 'well_head_gas_cum' in reversion_object
                elif ('well_head_gas_cum' in reversion_object
                      and float(ls_expression[-2]) * 1000 == reversion_object['well_head_gas_cum']
                      and start_date == reversion_object['start']):
                    has_same_reversion_type_and_length = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                        ls_expression, keyword, propnum, own_reversion_index, scenario, section)

            elif ls_expression[-1] == 'LIFE' or ls_expression[-1] == 'FRAC' or ls_expression[-1] == '%' or len(
                    ls_expression) < 5:
                # check if self.ls_reversion_object is empty, means no reversion for LSE
                if len(self.ls_reversion_object) == 0:
                    has_same_reversion_type_and_length = True

                # in this case, OWN reach the final line, LSE 1 line with multiple OWN lines
                elif len(self.ls_reversion_object) > len(self.ls_reversion_parameters):
                    self.ls_reversion_parameters.append(reversion_parameters)
                    has_same_reversion_type_and_length = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                        ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                # in this case, OWN reach the final line, LSE and OWN has same lines with same reversion type
                # and length
                elif len(self.ls_reversion_object) == len(self.ls_reversion_parameters):
                    has_same_reversion_type_and_length = self.read_own_ls_exp_append_fill_to_ls_reversion_parameters(
                        ls_expression, keyword, propnum, own_reversion_index, scenario, section)

                # if own_reversion_index == 0, means this OWN line will replace the default OWN line,
                # then fill the value for all reversion if reversion exist
                if own_reversion_index == 0:
                    has_same_reversion_type_and_length = True

                    # need to update each reversion_parameters in list
                    for reversion_parameters in self.ls_reversion_parameters:
                        reversion_parameters['own_wi'] = self.own_wi
                        reversion_parameters['own_roy_oil_gas'] = self.own_roy_oil_gas
                        reversion_parameters['own_orri'] = self.own_orri
                        reversion_parameters['own_npi'] = self.own_npi
        except Exception:
            message = format_error_msg(ErrorMsgEnum.class5_msg.value, str_join(ls_expression))
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=message,
                                                            scenario=scenario,
                                                            well=propnum,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)

        return has_same_reversion_type_and_length, has_only_one_lse_dataline

    @classmethod
    def calculate_wi(cls, lse_wi: float, own_wi: float) -> float:
        """Calculates wi value

        Args:
            lse_wi:
            own_wi:
        Returns:
            Calculated wi in decimal
        """
        if lse_wi <= 100:
            return (lse_wi * own_wi) / 100
        return own_wi

    @classmethod
    def calculate_nri(cls, lse_wi: float, own_wi: float, lse_roy_oil_gas: float, lse_orri: float,
                      own_roy_oil_gas: float, own_orri: float) -> float:
        """Calculates NRI value

        Args:
            lse_wi:
            own_wi:
            lse_roy_oil_gas:
            lse_orri:
            own_roy_oil_gas:
            own_orri:

        Returns:
            Calculated value for NRI
        """
        value = (lse_wi * own_wi * (100 - (lse_roy_oil_gas + lse_orri))) / 10000
        value += (lse_roy_oil_gas * own_roy_oil_gas) / 100
        value += (lse_orri * own_orri) / 100  # unit is %
        return value

    def model_extraction(  # noqa(C901)
            self, section_economic_df, header_cols, ls_scenarios_id, scenario, property_id, index, elt=False):
        """Extracts Ownership, general options and stream properties from section 2 and 7 df with START keyword
        """
        self.preprocess()

        self.section_economic_df = section_economic_df
        self.header_cols = header_cols
        self.ls_scenarios_id = ls_scenarios_id
        self.scenario = scenario
        self.property_id = property_id
        self.index = index
        self.header_index = get_header_index_dict([
            EconHeaderEnum.propnum.value, EconHeaderEnum.expression.value, EconHeaderEnum.keyword.value,
            EconHeaderEnum.section.value, EconHeaderEnum.qualifier.value, EconHeaderEnum.initial_keyword.value
        ], header_cols)

        dates_setting_dic = {
            'OK': {
                RATE_CUT_OFF[self.major_phase]: 1e-20  # NO_CUT_OFF_DICT
            },
            'NO': copy.deepcopy(LAST_POS_CASH_FLOW_DICT),
            'ZERO': copy.deepcopy(LAST_POS_CASH_FLOW_DICT),
            'PMAX': copy.deepcopy(MAX_CUM_CASH_FLOW_DICT_PMAX),
            'BFIT': copy.deepcopy(MAX_CUM_CASH_FLOW_DICT_PMAX),
            'OPINC': copy.deepcopy(LAST_POS_CASH_FLOW_DICT),
        }

        ls_expression = []

        own_model_name = ''

        ignore_list = ['TEXT', 'LIFE', 'BTU', 'SHRINK']
        repeat_ownership_keyword = {}
        skip_index = 0

        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')

        expression_index = self.header_index[EconHeaderEnum.expression.value]
        keyword_mark_index = self.header_index[EconHeaderEnum.keyword.value]
        section_index = self.header_index[EconHeaderEnum.section.value]
        propnum_index = self.header_index[EconHeaderEnum.propnum.value]
        qualifier_index = self.header_index[EconHeaderEnum.qualifier.value]
        original_keyword_index = self.header_index[EconHeaderEnum.initial_keyword.value]

        section_economic_df = remove_escalation_own_df(self.section_economic_df, expression_index, keyword_mark_index,
                                                       section_index, self.property_id, self.scenario,
                                                       self.aries_data_extraction.log_report)

        section_economic_df = check_for_single_lse(section_economic_df, expression_index, keyword_mark_index,
                                                   self.property_id, self.scenario,
                                                   self.aries_data_extraction.log_report)

        # TODO: refactor data manipulation. A lot of if/else statements
        for i in range(section_economic_df.shape[0]):
            index_list = [
                propnum_index, keyword_mark_index, section_index, expression_index, qualifier_index,
                original_keyword_index
            ]

            extracted_df_rows = extract_df_row_value(i, index_list, section_economic_df)
            propnum, keyword, section, expression, qualifier, original_keyword = extracted_df_rows

            if str(keyword).strip().upper() == 'TEXT':
                continue

            try:
                try:
                    ls_expression = [
                        fetch_value(string, self.property_id, self.aries_data_extraction.at_symbol_mapping_dic,
                                    self.aries_data_extraction.CUSTOM_TABLE_dict)
                        for string in expression.strip().split()
                    ]
                except Exception:
                    self.aries_data_extraction.log_report.log_error(aries_row=expression,
                                                                    message=ErrorMsgEnum.fetch_value_error_msg.value,
                                                                    scenario=self.scenario,
                                                                    well=self.property_id,
                                                                    model=ErrorMsgEnum.ownership.value,
                                                                    section=section,
                                                                    severity=ErrorMsgSeverityEnum.error.value)

                ###############################################
                # ownership model extraction
                ###############################################
                if keyword.startswith('*'):
                    skip_index += 1
                    continue
                try:
                    ls_expression = check_for_default_lines(ls_expression, keyword,
                                                            self.aries_data_extraction.common_default_lines)

                except Exception:
                    message = format_error_msg(ErrorMsgEnum.class3_msg.value, ErrorMsgEnum.default_lines.value)
                    self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                    message=message,
                                                                    scenario=self.scenario,
                                                                    well=self.property_id,
                                                                    model=ErrorMsgEnum.ownership.value,
                                                                    section=section,
                                                                    severity=ErrorMsgSeverityEnum.error.value)

                ls_expression = check_for_null_values_in_expression(ls_expression)
                if keyword == 'NET':
                    if original_keyword in repeat_ownership_keyword:
                        if original_keyword == '"':
                            if (self.index[i] - skip_index) - repeat_ownership_keyword[original_keyword] == 1:
                                repeat_ownership_keyword[original_keyword] = (self.index[i] - skip_index)
                                repeat_ownership_keyword['continuation'] = True
                            else:
                                continue
                        else:
                            if not (ls_expression[-1]
                                    in [UnitEnum.perc_sign.value, UnitEnum.frac.value, UnitEnum.life.value]
                                    and 'continuation' not in repeat_ownership_keyword):
                                self.aries_data_extraction\
                                    .log_report\
                                    .log_error(aries_row=str_join(ls_expression),
                                               message=ErrorMsgEnum.multiple_net_line_error.value,
                                               scenario=self.scenario,
                                               well=self.property_id,
                                               model=ErrorMsgEnum.ownership.value,
                                               section=section,
                                               severity=ErrorMsgSeverityEnum.error.value)
                                continue
                    else:
                        repeat_ownership_keyword[original_keyword] = (self.index[i] - skip_index)
                        repeat_ownership_keyword['"'] = (self.index[i] - skip_index)
                elif keyword == 'START':
                    # START format could be 7/2017, 7/23/2017, 2017.25, 7/23/2017 0:00
                    # (2017.25 need to special handle if . exist in START)
                    # update the start_date = 07/2017, 07/2017, 03/2017, 07/2017
                    start_date = self.aries_data_extraction.read_start(ls_expression, propnum, self.scenario,
                                                                       ErrorMsgEnum.ownership.value, section)
                    if start_date is None:
                        start_date = pd.to_datetime(self.aries_data_extraction.dates_1_base_date).strftime('%m/%Y')

                # check for wells keyword and store in self.well_number (1st oil, 2nd gas and 3rd injection)
                elif EconEnum.loss.value in keyword:
                    # check if current well has an oil or gas forecast
                    well_has_forecast = has_forecast(self.aries_data_extraction.forecast_df)

                    date_model_name = qualifier if qualifier != '' else 'ARIES_CC_DATES_MODEL'
                    model = update_date_model_from_expression_keyword(
                        keyword, ls_expression, self.property_id, self.ls_scenarios_id, dates_setting_dic,
                        self.aries_data_extraction.get_default_format, self.aries_data_extraction.discount_rows,
                        self.aries_data_extraction.ignore_overhead, self.has_eloss_pmax,
                        self.aries_data_extraction.dates_data_list, self.scenario,
                        self.aries_data_extraction.scenarios_dic, self.aries_data_extraction.projects_dic,
                        date_model_name, well_has_forecast,
                        self.aries_data_extraction.compare_and_save_into_self_data_list)
                    self.aries_data_extraction.ignore_overhead, ignore, self.has_eloss_pmax, self.method = model

                ignore_list, ignore, ls_expression = check_if_line_to_be_ignored(keyword, ls_expression, ignore_list)

                use_loss_for_lnri = keyword == EconEnum.loss.value and len(ls_expression) > 1

                if ignore and not use_loss_for_lnri:
                    continue

                if keyword not in [
                        'LSE', 'OWN', 'NET', 'LOSS', 'ELOSS', 'OPNET', 'START', 'BTU', 'SHRINK', 'NET/OIL', 'NET/GAS',
                        'NET/CND', 'NET/NGL', 'LIFE', 'ABAN', 'ABANDON'
                ] and section == EconHeaderEnum.own_section_key.value:
                    message = format_error_msg(ErrorMsgEnum.cc_error_msg.value, keyword)
                    self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                    message=message,
                                                                    scenario=self.scenario,
                                                                    well=self.property_id,
                                                                    model=ErrorMsgEnum.ownership.value,
                                                                    section=section,
                                                                    severity=ErrorMsgSeverityEnum.warn.value)

                if keyword == 'LOSS':
                    self.has_loss_keyword = True
                    if len(ls_expression) > 1:
                        try:
                            self.loss_lease_nri_oil = float(ls_expression[1]) * 100 \
                                if float(ls_expression[1]) <= 1 \
                                else float(ls_expression[1])
                        except ValueError:
                            self.loss_lease_nri_oil = None
                        try:
                            self.loss_lease_nri_gas = float(ls_expression[2]) * 100 \
                                if float(ls_expression[2]) <= 1 \
                                else float(ls_expression[2])
                        except (ValueError, IndexError):
                            self.loss_lease_nri_gas = self.loss_lease_nri_oil
                    else:
                        self.loss_lease_nri_oil = None
                        self.loss_lease_nri_gas = None

                elif 'NET/' in keyword:
                    phase = keyword.split('/')[-1]
                    value = float(ls_expression[0])
                    try:
                        temp_unit = ls_expression[1]
                    except IndexError:
                        temp_unit = None

                    # CC defaults to percent %. Convert FRAC to percent %
                    if temp_unit == 'FRAC':
                        value *= 100

                    if phase == 'OIL':
                        self.actual_nri_oil = value
                    elif phase == 'GAS':
                        self.actual_nri_gas = value
                    elif phase == 'CND':
                        self.actual_nri_cnd = value
                    elif phase == 'NGL':
                        self.actual_nri_ngl = value
                elif keyword == 'OPNET':
                    if not self.has_loss_keyword:
                        try:
                            self.lease_nri_oil = float(ls_expression[0])
                            self.used_opnet = True
                            if self.lease_nri_oil == 0:
                                oil_phase = PhaseEnum.oil.value
                                backup_nri_oil = self.aries_data_extraction.backup_ownership_dict.get(oil_phase)
                                self.lease_nri_oil = backup_nri_oil if backup_nri_oil is not None else DEFAULT_LEASE_NRI
                                self.used_opnet = False
                        except (ValueError, IndexError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.lease_nri_oil.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.error.value)

                        try:
                            self.lease_nri_gas = float(ls_expression[1])
                            self.used_opnet = True
                            if self.lease_nri_gas == 0:
                                gas_phase = PhaseEnum.gas.value
                                backup_nri_gas = self.aries_data_extraction.backup_ownership_dict.get(gas_phase)
                                self.lease_nri_gas = backup_nri_gas if backup_nri_gas is not None else DEFAULT_LEASE_NRI
                                self.used_opnet = False
                        except (ValueError, IndexError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.lease_nri_gas.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.warn.value)

                        if len(ls_expression) > 2:
                            self.lease_nri_cnd = float(ls_expression[2])

                        if self.lease_nri_oil is not None:
                            self.lease_nri_oil = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_oil)

                        if self.lease_nri_gas is not None:
                            self.lease_nri_gas = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_gas)
                        else:
                            self.lease_nri_gas = self.lease_nri_oil

                        if self.lease_nri_cnd is not None:
                            self.lease_nri_cnd = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_cnd)

                    else:
                        self.lease_nri_cnd = None
                        try:
                            self.lease_nri_oil = float(ls_expression[0])
                            # OPNET with zero is treated as empty
                            self.used_opnet = False if self.lease_nri_oil == 0 else True
                        except (ValueError, IndexError):
                            self.lease_nri_oil = None
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.lease_nri_oil.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.warn.value)
                            # print(row.PROPNUM, 'LOSS does not have lease_nri_oil and lease_nri_gas')

                        try:
                            self.lease_nri_gas = float(ls_expression[1])
                            self.used_opnet = False if self.lease_nri_oil == 0 else True
                        except (ValueError, IndexError):
                            self.lease_nri_gas = None
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.lease_nri_gas.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.warn.value)

                        if len(ls_expression) > 2:
                            self.lease_nri_cnd = float(ls_expression[2])
                        if self.lease_nri_oil is not None and self.lease_nri_gas is not None:
                            self.lease_nri_oil = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_oil)
                            self.lease_nri_gas = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_gas)
                        if self.lease_nri_cnd is not None:
                            self.lease_nri_cnd = self.aries_data_extraction\
                                .convert_value_unit_to_percent(self.lease_nri_cnd)
                elif keyword == 'NET':
                    # it can have multiple segment
                    # ls_expression have different length
                    # % or FRAC as unit, may appear in [2] or [3] or [4]
                    # TO LIFE or payout.value M$/746 will be in [5] or [6]
                    if not self.has_original_ownership_parameters:

                        self.has_original_ownership_parameters = True

                        try:
                            self.wi = float(ls_expression[0])  # value is compulsory for econ calculation
                        except (IndexError, ValueError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.wi.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.error.value)

                        try:
                            self.nri_oil = float(ls_expression[1])  # value is compulsory for econ calculation
                            self.actual_nri_cnd = self.nri_oil
                        except (IndexError, ValueError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.nri.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.warn.value)
                        if not self.net_unit:
                            try:
                                self.nri_gas = float(ls_expression[2])
                                self.actual_nri_ngl = self.nri_gas
                            except (IndexError, ValueError):
                                self.nri_gas = self.nri_oil
                                self.npi = 0
                                try:
                                    self.net_unit = ls_expression[2]
                                except IndexError:
                                    pass

                        if not self.net_unit:
                            try:
                                self.npi = float(ls_expression[3])
                            except (IndexError, ValueError):
                                self.npi = 0
                                try:
                                    self.net_unit = ls_expression[3]
                                except IndexError:
                                    pass

                        if not self.net_unit:
                            try:
                                self.net_unit = ls_expression[4]
                            except IndexError:
                                message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.unit.value,
                                                           str_join(ls_expression))
                                self.aries_data_extraction.log_report.log_error(
                                    aries_row=str_join(ls_expression),
                                    message=message,
                                    scenario=self.scenario,
                                    well=self.property_id,
                                    model=ErrorMsgEnum.ownership.value,
                                    section=section,
                                    severity=ErrorMsgSeverityEnum.warn.value)

                        if self.net_unit == 'FRAC':
                            if self.wi is not None:
                                self.wi *= 100
                            if self.nri_oil is not None:
                                self.nri_oil *= 100
                                self.actual_nri_cnd *= 100
                            if self.nri_gas is not None:
                                self.nri_gas *= 100
                                self.actual_nri_ngl *= 100
                            if self.npi is not None:
                                self.npi *= 100
                    elif 'continuation' not in repeat_ownership_keyword:
                        self.wi, self.nri_oil, self.nri_gas, self.npi = process_multiple_net_values(
                            ls_expression, self.wi, self.nri_oil, self.nri_gas, self.npi)
                    # reversion part: ls_expression[5], ls_expression[6] (not alway in 5 or 6)
                    create_reversion_successful = self.ownership_reversion(ls_expression, keyword,
                                                                           self.ownership_default_document, propnum,
                                                                           start_date, 'NET', self.property_id, section)
                    if not create_reversion_successful:
                        self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                        message=ErrorMsgEnum.ownership1_msg.value,
                                                                        scenario=self.scenario,
                                                                        well=self.property_id,
                                                                        model=ErrorMsgEnum.ownership.value,
                                                                        section=section,
                                                                        severity=ErrorMsgSeverityEnum.warn.value)
                        return
                elif keyword == 'LSE':
                    # need to get all parameters, with parameters from 'OWN', then calculate nri_oil and nri_gas
                    # ls_expression have different length
                    # % or FRAC as unit, may apprea in [2] or [3] or [4]
                    # TO LIFE or payout.value M$/746 will be in [5] or [6]
                    if not self.has_original_ownership_parameters:
                        self.has_original_ownership_parameters = True
                        try:
                            self.lse_wi = float(ls_expression[0])
                        except (IndexError, ValueError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.wi.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.error.value)

                        if not self.lse_unit:
                            try:
                                self.lse_roy_oil_gas = float(ls_expression[1])
                            except (IndexError, ValueError):
                                self.lse_roy_oil_gas = 0
                                self.lse_orri = 0
                                self.lse_npi = 0
                                try:
                                    self.lse_unit = ls_expression[1]
                                except IndexError:
                                    pass

                        if not self.lse_unit:
                            try:
                                self.lse_orri = float(ls_expression[2])
                            except (IndexError, ValueError):
                                self.lse_orri = 0
                                self.lse_npi = 0
                                try:
                                    self.lse_unit = ls_expression[2]
                                except IndexError:
                                    pass

                        if not self.lse_unit:
                            try:
                                self.lse_npi = float(ls_expression[3])
                            except (IndexError, ValueError):
                                self.lse_npi = 0
                                try:
                                    self.lse_unit = ls_expression[3]
                                except IndexError:
                                    pass

                        if not self.lse_unit:
                            self.lse_unit = ls_expression[4]

                        if self.lse_unit == 'FRAC':
                            if self.lse_wi is not None:
                                self.lse_wi *= 100
                            if self.lse_roy_oil_gas is not None:
                                self.lse_roy_oil_gas *= 100
                            if self.lse_orri is not None:
                                self.lse_orri *= 100
                            if self.lse_npi is not None:
                                self.lse_npi *= 100
                    # reversion part: ls_expression[5], ls_expression[6] (not alway in 5 or 6)
                    create_reversion_successful = self.ownership_reversion(ls_expression, keyword,
                                                                           self.ownership_default_document, propnum,
                                                                           start_date, 'LSE', self.property_id, section)

                    if not create_reversion_successful:
                        self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                        message=ErrorMsgEnum.ownership1_msg.value,
                                                                        scenario=self.scenario,
                                                                        well=self.property_id,
                                                                        model=ErrorMsgEnum.ownership.value,
                                                                        section=section,
                                                                        severity=ErrorMsgSeverityEnum.warn.value)
                        return
                elif keyword == 'OWN':
                    # need to update all parameters, with parameters from 'LSE', then calculate nri_oil and nri_gas
                    # ls_expression have different length
                    # % or FRAC as unit, may apprea in [2] or [3] or [4]
                    # TO LIFE or payout.value M$/746 will be in [5] or [6]
                    if not self.has_original_own_ownership_parameters:
                        self.has_original_own_ownership_parameters = True
                        try:
                            self.own_wi = float(ls_expression[0])
                        except (IndexError, ValueError):
                            message = format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.wi.value,
                                                       str_join(ls_expression))
                            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                            message=message,
                                                                            scenario=self.scenario,
                                                                            well=self.property_id,
                                                                            model=ErrorMsgEnum.ownership.value,
                                                                            section=section,
                                                                            severity=ErrorMsgSeverityEnum.error.value)

                        if not self.own_unit:
                            try:
                                self.own_roy_oil_gas = float(ls_expression[1])
                            except (IndexError, ValueError):
                                self.own_roy_oil_gas = 0
                                self.own_orri = 0
                                self.own_npi = 0
                                try:
                                    self.own_unit = ls_expression[1]
                                except IndexError:
                                    pass

                        if not self.own_unit:
                            try:
                                self.own_orri = float(ls_expression[2])
                            except (IndexError, ValueError):
                                self.own_orri = 0
                                self.own_npi = 0
                                try:
                                    self.own_unit = ls_expression[2]
                                except IndexError:
                                    pass

                        if not self.own_unit:
                            try:
                                self.own_npi = float(ls_expression[3])
                            except (IndexError, ValueError):
                                self.own_npi = 0
                                try:
                                    self.own_unit = ls_expression[3]
                                except IndexError:
                                    pass

                        if not self.own_unit:
                            try:
                                self.own_unit = ls_expression[4]
                            except IndexError:
                                pass

                        if self.own_unit == 'FRAC':
                            if self.own_wi is not None:
                                self.own_wi *= 100
                            if self.own_roy_oil_gas is not None:
                                self.own_roy_oil_gas *= 100
                            if self.own_orri is not None:
                                self.own_orri *= 100
                            if self.own_npi is not None:
                                self.own_npi *= 100

                    # reversion part: ls_expression[5], ls_expression[6] (not alway in 5 or 6)
                    ownership_revision = self.ownership_reversion_own_parameters(
                        ls_expression, keyword, self.ownership_default_document, propnum, start_date,
                        self.own_reversion_index, self.has_only_one_lse_dataline, self.scenario, section)
                    has_same_reversion_type_and_length, has_only_one_lse_dataline = ownership_revision

                    if not has_same_reversion_type_and_length:
                        self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                        message=ErrorMsgEnum.ownership1_msg.value,
                                                                        scenario=self.scenario,
                                                                        well=self.property_id,
                                                                        model=ErrorMsgEnum.ownership.value,
                                                                        section=section,
                                                                        severity=ErrorMsgSeverityEnum.error.value)
                        return
                    self.own_reversion_index += 1

                own_model_name = get_model_name_from_qualifiers(keyword, qualifier, own_model_name,
                                                                self.ownership_default_document)
            except Exception:
                message = format_error_msg(ErrorMsgEnum.class8_msg.value, ErrorMsgEnum.ownership_param.value, keyword)
                self.aries_data_extraction.log_report.log_error(message=message,
                                                                scenario=self.scenario,
                                                                well=self.property_id,
                                                                model=ErrorMsgEnum.ownership.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.error.value)

        # if no 'OWN' keyword, need to use default value
        if self.own_unit is None:
            if self.own_wi is None:
                self.own_wi = 100
                self.own_roy_oil_gas = 0
                self.own_orri = 0
                self.own_npi = 0
            self.own_unit = '%'
            own_reversion_point = 'TO'  # noqa: F841
            own_reversion_units = 'LIFE'  # noqa: F841

            # need to update each reversion_parameters in list
            for reversion_parameters in self.ls_reversion_parameters:
                reversion_parameters['own_wi'] = 100
                reversion_parameters['own_roy_oil_gas'] = 0
                reversion_parameters['own_orri'] = 0
                reversion_parameters['own_npi'] = 0

        # internal calculation for reversion
        reversion_extraction_success = self.reversion_internal_calculation(self.ls_reversion_object,
                                                                           self.ls_reversion_parameters,
                                                                           self.lease_nri_oil, self.lease_nri_gas)

        # if reversion extraction fail, means models not complete, stop extract this model
        if not reversion_extraction_success:
            self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                            message=ErrorMsgEnum.ownership1_msg.value,
                                                            scenario=self.scenario,
                                                            well=self.property_id,
                                                            model=ErrorMsgEnum.ownership.value,
                                                            section=section,
                                                            severity=ErrorMsgSeverityEnum.error.value)
            return

        # internal calculation for original ownership
        # check if 1. has no 'NET' to define wi, nri_oil, nri_gas
        # check if 2. has all needed parameters for 'NET' and 'LSE' for ownership model calcualtion

        if self.lease_nri_oil is None and self.loss_lease_nri_oil is not None:
            self.lease_nri_oil = self.loss_lease_nri_oil

        if self.lease_nri_gas is None and self.loss_lease_nri_gas is not None:
            self.lease_nri_gas = self.loss_lease_nri_gas

        if self.wi is not None and self.wi == 0 and not self.used_opnet:
            default_lease_nri_used = False
            if self.lease_nri_oil is None:
                if self.nri_oil == 0 and self.method in [EconEnum.pmax.value, EconEnum.bfit.value]:
                    self.lease_nri_oil = ZERO_LEASE_NRI
                else:
                    self.lease_nri_oil = DEFAULT_LEASE_NRI
                default_lease_nri_used = True
            if self.lease_nri_gas is None:
                if self.nri_gas == 0 and self.method in [EconEnum.pmax.value, EconEnum.bfit.value]:
                    self.lease_nri_gas = ZERO_LEASE_NRI
                else:
                    self.lease_nri_gas = DEFAULT_LEASE_NRI
                default_lease_nri_used = True
            if default_lease_nri_used:
                message = format_error_msg(ErrorMsgEnum.lease_nri_unavailable_msg.value, self.lease_nri_oil)
                self.aries_data_extraction.log_report.log_error(aries_row=str_join(ls_expression),
                                                                message=message,
                                                                scenario=self.scenario,
                                                                well=self.property_id,
                                                                model=ErrorMsgEnum.ownership.value,
                                                                section=section,
                                                                severity=ErrorMsgSeverityEnum.warn.value)

        condition_check_1 = (self.wi is None or self.nri_oil is None or self.nri_gas is None)
        condition_check_2 = (self.lse_wi is not None and self.own_wi is not None)
        condition_check_3 = (self.lse_roy_oil_gas is not None and self.own_roy_oil_gas is not None)
        condition_check_4 = (self.lse_orri is not None and self.own_orri is not None)
        condition_check_5 = (self.lse_npi is not None and self.own_npi is not None)

        # if LSE exist, it will always be use rather than the value defined in NET
        # use 'LSE' define wi, nri_oil, nri_gas, lease_nri_oil, lease_nri_gas
        if condition_check_1 and condition_check_2 and condition_check_3 and condition_check_4 and condition_check_5:
            # has 'LSE' keyword
            self.wi = self.calculate_wi(self.lse_wi, self.own_wi)
            self.nri_oil = self.calculate_nri(self.lse_wi, self.own_wi, self.lse_roy_oil_gas, self.lse_orri,
                                              self.own_roy_oil_gas, self.own_orri)

            self.nri_gas = self.calculate_nri(self.lse_wi, self.own_wi, self.lse_roy_oil_gas, self.lse_orri,
                                              self.own_roy_oil_gas, self.own_orri)

            self.npi = (self.lse_npi * self.own_npi) / 100  # unit is %

            # check if already get lease_nri from LOSS
            if self.actual_nri_oil is None:
                if float(self.wi) == 0 and float(self.nri_oil) == 0 and (self.lse_roy_oil_gas + self.lse_orri == 0):
                    self.lease_nri_oil = 0.0
                else:
                    self.lease_nri_oil = 100 - (self.lse_roy_oil_gas + self.lse_orri)  # unit is %

            if self.actual_nri_gas is None:
                if (float(self.wi) == 0.0 and float(self.nri_gas) == 0.0
                        and (self.lse_roy_oil_gas + self.lse_orri == 0)):
                    self.lease_nri_gas = 0.0
                else:
                    self.lease_nri_gas = 100 - (self.lse_roy_oil_gas + self.lse_orri)  # unit is %

        if self.wi is not None and float(self.wi) == 0.0 and self.has_eloss_pmax:
            update_include_capex_in_date_model(self.property_id, self.ls_scenarios_id,
                                               self.aries_data_extraction.get_default_format,
                                               self.aries_data_extraction.dates_data_list, self.scenario,
                                               self.aries_data_extraction.scenarios_dic,
                                               self.aries_data_extraction.projects_dic, date_model_name,
                                               self.aries_data_extraction.compare_and_save_into_self_data_list)

        if self.actual_nri_oil is not None:
            self.nri_oil = self.actual_nri_oil
        if self.actual_nri_gas is not None:
            self.nri_gas = self.actual_nri_gas

        # use 'NET' define wi, nri_oil, nri_gas, lease_nri_oil, lease_nri_gas
        if self.wi != 0 and self.wi is not None and self.nri_oil is not None and self.nri_gas is not None:
            # check if already get lease_nri from LOSS
            if self.lease_nri_oil is None or self.lease_nri_gas is None:
                self.lease_nri_oil = (self.nri_oil / self.wi) * 100 if self.nri_oil / self.wi < 1 else 100  # unit is %
                self.lease_nri_gas = (self.nri_gas / self.wi) * 100 if self.nri_gas / self.wi < 1 else 100  # unit is %

        if (self.wi is not None and self.nri_oil is not None and self.nri_gas is not None
                and self.lease_nri_oil is not None and self.lease_nri_gas is not None and self.npi is not None):
            self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                'working_interest'] = aries_cc_round(float(self.wi))
            self.ownership_default_document['econ_function']['ownership']['initial_ownership']['original_ownership'][
                'net_revenue_interest'] = aries_cc_round(float(self.nri_oil))
            self.ownership_default_document['econ_function']['ownership']['initial_ownership']['original_ownership'][
                'lease_net_revenue_interest'] = aries_cc_round(float(
                    self.lease_nri_oil)) if self.major_phase != 'GAS' else aries_cc_round(float(self.lease_nri_gas))
            if self.actual_nri_cnd is not None and self.actual_nri_cnd != self.nri_oil:
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'drip_condensate_ownership']['net_revenue_interest'] = aries_cc_round(float(self.actual_nri_cnd))
            if self.actual_nri_ngl is not None and self.actual_nri_ngl != self.nri_oil:
                self.ownership_default_document['econ_function']['ownership']['initial_ownership']['ngl_ownership'][
                    'net_revenue_interest'] = aries_cc_round(float(self.actual_nri_ngl))

            # if need to fill nri_gas or lease_nri_gas
            if self.nri_gas != self.nri_oil:
                self.ownership_default_document['econ_function']['ownership']['initial_ownership']['gas_ownership'][
                    'net_revenue_interest'] = aries_cc_round(float(self.nri_gas))
                self.ownership_default_document['econ_function']['ownership']['initial_ownership']['gas_ownership'][
                    'lease_net_revenue_interest'] = aries_cc_round(float(self.lease_nri_gas))

            # add net_profit_insterest_type and net_profit_interest
            if self.own_wi == 0 and self.own_roy_oil_gas == 0 and self.own_orri == 0 and self.own_npi != 0:
                # the npi from LSE + OWN (no NET line)
                # ownership_default_document['econ_function']['ownership']['net_profit_interest']['revenue'] = npi
                # del ownership_default_document['econ_function']['ownership']['net_profit_interest']['expense']
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest_type'] = 'revenue'
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest'] = self.npi
            elif self.own_npi == 0 and self.lse_npi is not None:
                # use the npi from LSE as npi
                # ownership_default_document['econ_function']['ownership']['net_profit_interest']['expense'] = lse_npi
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest_type'] = 'expense'
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest'] = self.lse_npi
            elif self.lse_npi is None:
                # the npi from NET (no LSE, no OWN line)
                # ownership_default_document['econ_function']['ownership']['net_profit_interest']['expense'] = npi
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest_type'] = 'expense'
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest'] = self.npi
            elif self.lse_npi == 0:
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest_type'] = 'expense'
                self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                    'net_profit_interest'] = 0
        else:
            if self.aries_data_extraction.backup_ownership_dict is not None:
                nri_oil = self.aries_data_extraction.backup_ownership_dict[PhaseEnum.oil.value]
                nri_gas = self.aries_data_extraction.backup_ownership_dict[PhaseEnum.gas.value]

                # CC-17500. Aries treats 0 nri from backup ownership as 1 (FRAC)
                nri_oil = 1 if nri_oil == 0 else nri_oil
                nri_gas = 1 if nri_gas == 0 else nri_gas

                self.lease_nri_oil = self.lease_nri_oil if self.used_opnet else DEFAULT_LEASE_NRI
                self.lease_nri_gas = self.lease_nri_gas if self.used_opnet else DEFAULT_LEASE_NRI

                if nri_oil is not None:
                    self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                        'working_interest'] = 100
                    self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                        'original_ownership']['net_revenue_interest'] = aries_cc_round(nri_oil * 100)
                    self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                        'original_ownership']['lease_net_revenue_interest'] = aries_cc_round(float(self.lease_nri_oil))
                    if nri_gas != nri_oil and nri_gas is not None:
                        self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                            'gas_ownership']['net_revenue_interest'] = aries_cc_round(nri_gas * 100)
                        self.ownership_default_document['econ_function']['ownership']['initial_ownership'][
                            'gas_ownership']['lease_net_revenue_interest'] = aries_cc_round(float(self.lease_nri_gas))

        # fill value into ownership_default_document
        for _id in self.ls_scenarios_id:
            if self.aries_data_extraction.scenarios_dic[_id]['name'] == self.scenario:
                self.ownership_default_document['wells'].add((_id, self.property_id))

        self.ownership_default_document['createdAt'] = datetime.datetime.now()
        self.ownership_default_document['updatedAt'] = datetime.datetime.now()
        ownership_default_document = fill_reversion_ownership_document(self.ownership_default_document)
        own_model_name = f'ARIES_CC_{self.ownership_default_document[CCSchemaEnum.assumption_key.value].upper()}'
        self.aries_data_extraction.compare_and_save_into_self_data_list(ownership_default_document,
                                                                        self.aries_data_extraction.ownership_data_list,
                                                                        self.aries_data_extraction.projects_dic,
                                                                        model_name=own_model_name,
                                                                        aries=True)
