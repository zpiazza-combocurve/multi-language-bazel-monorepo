import copy
import re
import datetime
import numpy as np
import pandas as pd
from bson.objectid import ObjectId
from dateutil import parser
from operator import itemgetter

from combocurve.utils.constants import DAYS_IN_MONTH, DAYS_IN_YEAR
from api.aries_phdwin_imports.aries_import_helpers import (str_join, shift_datetime_date,
                                                           process_list_start_date_and_get_end_date,
                                                           convert_str_date_to_datetime_format)
from api.aries_phdwin_imports.helpers import (check_for_inconsistent_date, get_day_month_from_decimal_date,
                                              get_day_month_year_from_decimal_date, format_aries_segment_date,
                                              get_well_doc_overlay, check_and_remove_well_from_previous_model,
                                              date_unit_list, LAST_POS_CASH_FLOW_DICT)
from combocurve.shared.date import days_from_1900
from combocurve.shared.aries_import_enums import (CCSchemaEnum, ForecastEnum, UnitEnum, PhaseEnum, EconEnum,
                                                  EconHeaderEnum)
from api.aries_phdwin_imports.aries_forecast_helpers.aries_forecast_conv_func import get_k_linear, get_d_eff_linear

from api.aries_phdwin_imports.error import ErrorMsgEnum, ErrorMsgSeverityEnum, format_error_msg
from api.aries_phdwin_imports.independent_aries_convert import aries_convert
from combocurve.science.segment_models.shared.helper import (arps_get_D, arps_D_2_D_eff, exp_get_D, exp_D_2_D_eff)

MINIMUM_FLOWRATE = 1e-10
FLOWRATE_ALLOWANCE = 0.92
NEAR_ZERO_RATIO_FORECAST_VALUE = 0.0000001
FORECAST_WELL_LIMIT = 10000
NEAR_ZERO_VALUE = 0.0001

RATIO_FILL_LINES = ['0', 'X', 'B/M', 'TO', 'LIFE', 'LOG', 'TIME']


def get_cums_value(ls_expression, phase_cum_dict):
    """
    Update the phase cumulative values in the phase_cum_dict based on the values provided in the ls_expression.

    Args:
        ls_expression (list): A list of values representing different phases (oil, gas, water) and their cumulative
                              values. The ls_expression should contain values in the order
                              [oil_cum, gas_cum, water_cum].
        phase_cum_dict (dict): A dictionary containing the current cumulative values for each phase.
            The dictionary should have keys for PhaseEnum.oil.value, PhaseEnum.gas.value, and PhaseEnum.water.value.

    Returns:
        None: The function modifies the phase_cum_dict in-place.

    Raises:
        IndexError: If the ls_expression doesn't have enough values to update all phases.
        TypeError: If the values in ls_expression are not of numeric type.
        ValueError: If the values in ls_expression cannot be converted to floats.

    Note:
        - The function multiplies the cumulative values in ls_expression by 1000 before updating the phase_cum_dict.
        - If any error occurs while updating the phase_cum_dict for a specific phase, the cumulative value for that
          phase is set to 0.
    """
    phase_cum_index_dict = {PhaseEnum.oil.value: 0, PhaseEnum.gas.value: 1, PhaseEnum.water.value: 5}

    for phase in phase_cum_index_dict:
        try:
            phase_cum_dict[phase] = float(ls_expression[phase_cum_index_dict[phase]]) * 1000
        except (IndexError, TypeError, ValueError):
            phase_cum_dict[phase] = 0


def format_float_str(float_str):
    ret_str = re.sub('[^0-9\.-]', '', float_str)  # noqa W605, keep only number . and -
    ret_str = re.sub(r'\.+', '.', ret_str)  # replace multiple '.' like '...' with '.'
    return ret_str


def check_if_well_limit_reached_and_append(document, well_id, scenario, _id, wells_dic, forecasts_dic, forecasts_id,
                                           get_default_format):
    # checks if base forecast name is less than 5000
    count = int(len(document[CCSchemaEnum.wells.value]) / FORECAST_WELL_LIMIT)
    # if less than 5000 append to document
    if count == 0:
        document[CCSchemaEnum.wells.value].append(wells_dic[str(well_id)][CCSchemaEnum._id.value])
        return document
    else:
        forecast_name = get_forecast_continuation_name(scenario, count)
        # otherwise check for a forecast continuation name that has less than 5000 wells and append to it
        while (forecast_name, _id) in forecasts_dic:
            if len(forecasts_dic[(forecast_name, _id)][CCSchemaEnum.wells.value]) < FORECAST_WELL_LIMIT:
                document_cont = forecasts_dic[(forecast_name, _id)]
                document_cont[CCSchemaEnum.wells.value].append(wells_dic[str(well_id)][CCSchemaEnum._id.value])
                return document_cont
            else:
                count += 1
                forecast_name = get_forecast_continuation_name(scenario, count)

        # if none found create new forecast continuation name based on the last continuation name found
        forecasts_default_document = get_default_format('forecasts')
        # need to give _id to each document
        if forecasts_id is not None:
            forecasts_default_document[CCSchemaEnum._id.value] = forecasts_id
        else:
            forecasts_default_document[CCSchemaEnum._id.value] = ObjectId()

        # forecasts collection
        forecasts_default_document[CCSchemaEnum.wells.value].append(wells_dic[str(well_id)][CCSchemaEnum._id.value])
        forecasts_default_document[ForecastEnum.name.value] = get_forecast_continuation_name(scenario,
                                                                                             count,
                                                                                             strip=True)
        forecasts_default_document[CCSchemaEnum.project.value] = _id
        forecasts_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
        forecasts_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()

        forecasts_dic[(forecast_name, _id)] = forecasts_default_document

        return forecasts_default_document


def get_forecast_continuation_name(name, index, strip=False):
    # gets continuation forecast name
    name = str(name).strip() if strip else str(name)
    return '_'.join([name, str(index + 1)])


def convert_param_dic_idx_to_date(param_dic):
    '''
    convert start_idx, end_idx to start_date, end_date
    '''
    if param_dic[ForecastEnum.end_date.value] is None:
        shift_days = param_dic[ForecastEnum.end_index.value]
        param_dic[ForecastEnum.end_date.value] = (pd.to_datetime('1/1900') + pd.DateOffset(days=shift_days)).strftime(
            CCSchemaEnum.mdy_date_slash_format.value)

    return param_dic


def get_forecast_date_index(date, end=False, list_method=False):
    date_components = date.split('/')

    year = float(date_components[2])
    month = float(date_components[0])
    day = float(date_components[1])

    date = datetime.date(int(year), int(month), int(day))
    if end and not list_method:
        date += datetime.timedelta(days=-1)

    return days_from_1900(date)


def convert_param_dic_date_to_idx(param_dic, list_method=False):
    '''
    convert start_date, end_date to start_idx, end_idx
    '''
    # get start index from start date if available, as start index could be gotten from previous segment index
    if param_dic[ForecastEnum.start_date.value] is not None:
        param_dic[ForecastEnum.start_index.value] = get_forecast_date_index(param_dic[ForecastEnum.start_date.value])

    elif param_dic[ForecastEnum.start_index.value] is not None:
        # need to provide start_date
        param_dic[ForecastEnum.start_date.value] = get_forecast_date_from_index(
            param_dic[ForecastEnum.start_index.value])

    else:
        # unlikely, it should always have start_date (new segment) or start_idx (previous segment idx)
        param_dic[ForecastEnum.start_index.value] = None

    if param_dic[ForecastEnum.end_date.value] is not None:
        param_dic[ForecastEnum.end_index.value] = get_forecast_date_index(param_dic[ForecastEnum.end_date.value],
                                                                          end=True,
                                                                          list_method=list_method)
    else:
        param_dic[ForecastEnum.end_index.value] = None

    return param_dic


def get_forecast_date_from_index(idx):
    date = (pd.to_datetime('1/1900') + pd.DateOffset(days=idx)).strftime(CCSchemaEnum.mdy_date_slash_format.value)

    return date


def get_value_for_econ_from_unit(expression):
    '''
    Input:
    Expression (list): Aries Syntax Expression where 2nd value is 'X'

    Output:
        Returns 10 if Unit is based per month and 0.3 if per day, if unsure use 10
    '''
    if expression[2].split('/')[-1] == 'D':
        return 0.3
    return 10


def check_for_flat_decline_method_in_ls_expression(decline_method, param_dic, expression):
    try:
        last_element_check = float(expression[-1]) == 0
    except ValueError:
        last_element_check = False
    if last_element_check:
        expression[-1] = '0'
    try:
        last_two = ' '.join([value for value in expression[-2:]])
    except (IndexError, TypeError):
        last_two = None

    qi = param_dic['qi']
    try:
        qend = float(expression[1])
    except (IndexError, ValueError):
        qend = None
    if qend is not None and qi is not None:
        qend = convert_q_from_unit(qend, expression)
        if qi == qend:
            return 'FLAT'
        else:
            return decline_method
    elif last_two == 'PC 0':
        return 'FLAT'
    else:
        return decline_method


def convert_q_from_unit(q, expression):
    if expression[2] in [UnitEnum.bpm.value, UnitEnum.mpm.value, UnitEnum.upm.value]:
        q = q / DAYS_IN_MONTH
    elif expression[2] in [UnitEnum.bpy.value, UnitEnum.mpy.value, UnitEnum.upy.value]:
        q = q / DAYS_IN_YEAR
    elif expression[2] in [UnitEnum.mbpd.value, UnitEnum.mmpd.value, UnitEnum.mupd.value]:
        q = q * 1000
    elif expression[2] in [UnitEnum.mbpm.value, UnitEnum.mmpm.value]:
        q = q / DAYS_IN_MONTH * 1000
    elif expression[2] in [UnitEnum.mbpy.value, UnitEnum.mmpy.value]:
        q = q / DAYS_IN_YEAR * 1000

    return q


def update_qi_from_unit(param_dic, expression, iset=False):
    if iset:
        qi = float(expression[0])
    else:
        qi = param_dic[ForecastEnum.qi.value]

    if expression[2] in [UnitEnum.bpm.value, UnitEnum.mpm.value, UnitEnum.upm.value]:
        qi = qi / DAYS_IN_MONTH
    elif expression[2] in [UnitEnum.bpy.value, UnitEnum.mpy.value, UnitEnum.upy.value]:
        qi = qi / DAYS_IN_YEAR
    elif expression[2] in [UnitEnum.mbpd.value, UnitEnum.mmpd.value, UnitEnum.mupd.value]:
        qi = qi * 1000
    elif expression[2] in [UnitEnum.mbpm.value, UnitEnum.mmpm.value]:
        qi = qi / DAYS_IN_MONTH * 1000
    elif expression[2] in [UnitEnum.mbpy.value, UnitEnum.mmpy.value]:
        qi = qi / DAYS_IN_YEAR * 1000

    param_dic[ForecastEnum.qi.value] = qi

    return param_dic


def update_qend_from_unit(param_dic, expression):
    qend = param_dic['qend']

    if qend is not None:
        if expression[2] in [UnitEnum.bpm.value, UnitEnum.mpm.value, UnitEnum.upm.value]:
            qend = qend / DAYS_IN_MONTH
        elif expression[2] in [UnitEnum.bpy.value, UnitEnum.mpy.value, UnitEnum.upy.value]:
            qend = qend / DAYS_IN_YEAR
        elif expression[2] in [UnitEnum.mbpd.value, UnitEnum.mmpd.value, UnitEnum.mupd.value]:
            qend = qend * 1000
        elif expression[2] in [UnitEnum.mbpm.value, UnitEnum.mmpm.value]:
            qend = qend / DAYS_IN_MONTH * 1000
        elif expression[2] in [UnitEnum.mbpy.value, UnitEnum.mmpy.value]:
            qend = qend / DAYS_IN_YEAR * 1000
    param_dic['qend'] = qend
    return param_dic


def get_aries_forecast_qend(expression, doc):
    '''
    Input:
    Expression (list): Aries Expression Syntax
    doc (dictionary): Aries forecast document

    Output:
    Updates qend based on value in expression
    '''
    try:
        doc[ForecastEnum.qend.value] = float(expression[1])
    except ValueError:
        doc[ForecastEnum.qend.value] = get_value_for_econ_from_unit(expression)


def handle_zero_date_segment(day, expression, scenario, property_id, error_report):
    if float(expression[3]) == 0:
        day = 2
        error_report.log_error(message=ErrorMsgEnum.zero_date_segment_error.value,
                               aries_row=str_join(expression),
                               scenario=scenario,
                               well=property_id,
                               model=ErrorMsgEnum.forecast.value,
                               section=EconHeaderEnum.forecast_section_key.value,
                               severity=ErrorMsgSeverityEnum.warn.value)
    return day


def forecast_incline_check(param_dic, decline_method, key, expression, well_id, scenario, error_report):
    incline = False
    try:
        incline = param_dic[key] < 0
    except TypeError:
        incline = False
    decline_method = decline_method if not incline else 'EXP'
    if incline:
        param_dic['secant_deff'] = param_dic[key]
        error_report.log_error(aries_row=str_join(expression),
                               message=ErrorMsgEnum.change_b_to_exp_full.value,
                               scenario=scenario,
                               section=EconHeaderEnum.forecast_section_key.value,
                               well=well_id,
                               severity=ErrorMsgSeverityEnum.warn.value)
    return param_dic, decline_method


def run_time_forecast_segment_check(param_dic, segment_obj, decline_method):
    valid = True
    if param_dic[ForecastEnum.start_index.value] >= param_dic[ForecastEnum.end_index.value] and (
            param_dic[ForecastEnum.end_index.value] + DAYS_IN_MONTH > param_dic[ForecastEnum.start_index.value]
            or param_dic[ForecastEnum.qi.value] > FLOWRATE_ALLOWANCE * param_dic[ForecastEnum.qend.value]):
        param_dic[ForecastEnum.end_index.value] = param_dic[ForecastEnum.start_index.value] + 1
        segment_obj[ForecastEnum.end_index.value] = param_dic[ForecastEnum.end_index.value]
        param_dic = convert_param_dic_idx_to_date(param_dic)
    elif (param_dic[ForecastEnum.end_index.value] < param_dic[ForecastEnum.start_index.value] or
          (param_dic[ForecastEnum.qi.value] < MINIMUM_FLOWRATE
           and param_dic[ForecastEnum.qend.value] < MINIMUM_FLOWRATE)) and decline_method != 'FLAT':
        valid = False
    return param_dic, segment_obj, valid


def handle_ratio_flow_rate_value_from_unit(param_dic, keyword, base_phase, ls_expression, qi_from_prev, qend_from_prev):
    if keyword != f'{EconEnum.water_ratio.value}{PhaseEnum.water.value.upper()}':
        if ls_expression[2] == UnitEnum.bpmcf.value:
            if qi_from_prev is None:
                param_dic[ForecastEnum.qi.value] /= 1000
            if qend_from_prev is None:
                param_dic[ForecastEnum.qend.value] /= 1000
        if ls_expression[2] == UnitEnum.mmpb.value:
            if base_phase.lower() == PhaseEnum.gas.value:
                param_dic[ForecastEnum.qi.value] = 0
                param_dic[ForecastEnum.qend.value] = 0
            else:
                if qi_from_prev is None:
                    param_dic[ForecastEnum.qi.value] *= 1000
                if qend_from_prev is None:
                    param_dic[ForecastEnum.qend.value] *= 1000

    if param_dic[ForecastEnum.qend.value] == 0:
        param_dic[ForecastEnum.qend.value] = NEAR_ZERO_RATIO_FORECAST_VALUE
    if param_dic[ForecastEnum.qi.value] == 0:
        param_dic[ForecastEnum.qi.value] = NEAR_ZERO_RATIO_FORECAST_VALUE

    return param_dic


def process_flat_forecast_when_no_duration(param_dic, expression, start_date, life):
    if str(str(expression[-2]).split('/')[0]).upper() in ['B', 'EXP', 'HAR', 'H', 'A', 'PC', 'SPD']:
        segment_end_date = pd.to_datetime(param_dic['start_date']) + pd.DateOffset(days=1)
    else:
        segment_end_date = pd.to_datetime(start_date) + pd.DateOffset(years=int(life))

    return segment_end_date


def check_for_valid_b_value(expression, decline_method):
    change_made = False
    # Check if hyperbolic decline
    if decline_method == 'B':
        # get secant deff value if a number
        try:
            secant_deff = float(expression[-1])
        except (ValueError, TypeError):
            secant_deff = None
        # check if secant deff is negative
        if secant_deff is not None:
            if secant_deff < 0:
                # round b value to the nearest hundredth
                b = round(float(expression[-2].split('/')[1]), 2)
                # if negative check if b is zero to the hunderdth value
                if b == 0:
                    # if so change to exponential
                    expression[-2] = 'EXP'
                    change_made = True
                    decline_method = 'EXP'
    return expression, decline_method, change_made


def exp_d_2_d_sec_deff(d, b):
    sec_deff = 1 - np.power(1 + DAYS_IN_YEAR * b * d, -1 / b)
    return sec_deff


def get_d_from_cumulative(qi, qend, b, cum_vol):
    return ((np.power(qi, b) * (np.power(qend, 1 - b) - np.power(qi, 1 - b))) / (cum_vol * (b - 1)))


def exp_d_2_d_tan_deff(d):
    tan_deff = (1 - np.exp(-d * DAYS_IN_YEAR))
    return tan_deff


def update_secant_deff_based_on_exp_cut_off(param_dic):
    cut_off = param_dic['dm']
    qi = param_dic['qi']
    qend = param_dic['qend']
    b = param_dic['b']
    if cut_off is not None and qi is not None and qend is not None and b is not None:
        new_d = np.power(qi / qend, b) * (-np.log(1 - cut_off / 100) / DAYS_IN_YEAR)
        param_dic['secant_deff'] = exp_d_2_d_sec_deff(new_d, b) * 100
    return param_dic


def update_cumulative_forecast_param_dic(param_dic, expression, curve_type):
    if expression[4] in cumulative_unit_dic and curve_type != 'SPD':
        if curve_type == 'EXP':
            di = (float(param_dic[ForecastEnum.qi.value])
                  - convert_q_from_unit(float(expression[1]), expression)) / param_dic['imu']
            param_dic[ForecastEnum.secant_deff.value] = exp_d_2_d_sec_deff(di, 0.0001) * 100
        else:
            di = get_d_from_cumulative(param_dic[ForecastEnum.qi.value],
                                       convert_q_from_unit(float(expression[1]), expression), param_dic['b'],
                                       param_dic['imu'])

            param_dic[ForecastEnum.secant_deff.value] = exp_d_2_d_sec_deff(di, param_dic['b']) * 100
    return param_dic


def update_deff_in_param_dic(param_dic, expression, curve_type=None):
    # convert unit to per day (from per month, per year)
    # date (delta unit is day)
    try:
        cutoff_crit = expression[4]
    except IndexError:
        cutoff_crit = None
    if curve_type == 'B' and cutoff_crit == 'EXP':
        param_dic = update_secant_deff_based_on_exp_cut_off(param_dic)
        return param_dic, True

    delta, valid = get_forecast_delta(param_dic, expression)

    if not valid:
        return [], False

    # cumulative
    param_dic = update_cumulative_forecast_param_dic(param_dic, expression, curve_type)

    if delta is not None:
        param_dic = update_date_forecast_param_dic(param_dic, expression, delta, curve_type)

    return param_dic, True


def update_date_forecast_param_dic(param_dic, expression, delta, curve_type):
    start_idx = 0
    end_idx = delta
    if curve_type == 'SPD':
        if expression[1] == 'EL':
            k = get_k_linear(start_idx, param_dic[ForecastEnum.qi.value], end_idx, 10)
            param_dic[ForecastEnum.linear_deff.value] = get_d_eff_linear(k, param_dic[ForecastEnum.qi.value]) * 100
        elif expression[0] == '0' and expression[1] == '0':
            # flat (qi ==  qend)
            param_dic[ForecastEnum.qi.value] = 0
            param_dic[ForecastEnum.qend.value] = 0
        else:
            param_dic[ForecastEnum.qi.value] = param_dic[
                ForecastEnum.qi.value] if param_dic[ForecastEnum.qi.value] != 0 else NEAR_ZERO_VALUE
            k = get_k_linear(start_idx, param_dic[ForecastEnum.qi.value], end_idx,
                             convert_q_from_unit(eval(str(expression[1])), expression))
            param_dic[ForecastEnum.linear_deff.value] = get_d_eff_linear(k, param_dic[ForecastEnum.qi.value]) * 100
    else:
        if expression[1] == 'EL':
            di = exp_get_D(start_idx, param_dic[ForecastEnum.qi.value], end_idx, 10)
            if curve_type == 'H':
                param_dic[ForecastEnum.tangent_deff.value] = exp_d_2_d_tan_deff(di) * 100
            elif curve_type == 'A':
                param_dic[ForecastEnum.nominal_deff.value] = di * DAYS_IN_YEAR * 100
            elif curve_type == 'B':
                # temporary (allows a deff to be used for exponential)
                di_b = arps_get_D(start_idx, param_dic[ForecastEnum.qi.value], end_idx,
                                  convert_q_from_unit(eval(str(expression[1])), expression), float(param_dic['b']))
                if di_b < 0:
                    param_dic[ForecastEnum.secant_deff.value] = exp_d_2_d_tan_deff(di) * 100
                else:
                    param_dic[ForecastEnum.secant_deff.value] = arps_D_2_D_eff(di_b, float(param_dic['b'])) * 100
            else:
                param_dic[ForecastEnum.secant_deff.value] = exp_D_2_D_eff(di) * 100
        elif expression[0] == '0' or expression[1] == '0':
            # flat (qi ==  qend)
            param_dic[ForecastEnum.qi.value] = 0
            param_dic[ForecastEnum.qend.value] = 0
        else:
            di = exp_get_D(start_idx, param_dic[ForecastEnum.qi.value], end_idx,
                           convert_q_from_unit(eval(str(expression[1])), expression))
            if curve_type == 'H':
                param_dic[ForecastEnum.tangent_deff.value] = exp_d_2_d_tan_deff(di) * 100
            elif curve_type == 'A':
                param_dic[ForecastEnum.nominal_deff.value] = di * DAYS_IN_YEAR * 100
            elif curve_type == 'B':
                # temporary (allows a deff to be used for exponential)
                di_b = arps_get_D(start_idx, param_dic[ForecastEnum.qi.value], end_idx,
                                  convert_q_from_unit(eval(str(expression[1])), expression), float(param_dic['b']))

                if di_b < 0:
                    param_dic[ForecastEnum.secant_deff.value] = exp_d_2_d_tan_deff(di) * 100
                else:
                    param_dic[ForecastEnum.secant_deff.value] = arps_D_2_D_eff(di_b, float(param_dic['b'])) * 100
            else:
                param_dic[ForecastEnum.secant_deff.value] = exp_D_2_D_eff(di) * 100

    return param_dic


def get_forecast_delta(param_dic, expression):
    delta = None
    if expression[4] in [UnitEnum.incr_month.value, UnitEnum.incr_months.value]:
        delta = round(float(expression[3]) * DAYS_IN_MONTH)
    elif expression[4] in [UnitEnum.incr_year.value, UnitEnum.incr_years.value]:
        delta = round(float(expression[3]) * DAYS_IN_YEAR)
    elif expression[4] in [
            UnitEnum.month.value, UnitEnum.months.value, UnitEnum.year.value, UnitEnum.years.value, UnitEnum.ad.value,
            UnitEnum.life.value
    ]:
        try:
            delta = (pd.to_datetime(param_dic[CCSchemaEnum.end_date.value])
                     - pd.to_datetime(param_dic[CCSchemaEnum.start_date.value])).days - 1
        except pd.errors.OutOfBoundsDatetime:
            delta = (parser.parse(param_dic[CCSchemaEnum.end_date.value])
                     - parser.parse(param_dic[CCSchemaEnum.start_date.value])).days - 1
    valid = delta is not None and delta > 0
    return delta, valid


def get_data_obj():
    return {phase: copy.deepcopy(PHASE_SEGMENT_OBJ) for phase in ['gas', 'oil', 'water']}


def get_forecast_sum_and_end_date_of_prev_segment_eur(qualifier,
                                                      propnum,
                                                      keyword,
                                                      scenario,
                                                      section,
                                                      forecast_datas_params_dic,
                                                      aries_extract=None):
    '''
    qualifier is forecastname
    propnum is well id
    keyword is phase

    search in self.forecast_datas_params_dic[(scenario, qualifier, propnum)],
    when get saved document, search in specific phase

    when calculate MB or MU decline method, need to get sum (mu) of previous eur from each segment
    output: sum (mu) of previous eur from each segment for specific well and phase

    noted: eur is mu
    '''
    if '/' in keyword:
        phase = keyword.strip().split('/')[0] if keyword.strip().split('/')[0] != 'WTR' else 'WATER'

        total_prev_mu = None
        prev_end_date = None  # the last segment end_date for specific phase
        prev_end_idx = None  # the last segment end_date for specific phase

        forecast_datas_params_document = forecast_datas_params_dic.get((scenario, qualifier, propnum))
        if forecast_datas_params_document is not None:
            for segment in forecast_datas_params_document['data'][phase.lower()]['P_dict']['best']['segments']:
                prev_end_date = segment['end_date']
                prev_end_idx = segment['end_idx']

    else:
        keyword = keyword if keyword != 'WTR' else 'WATER'

        total_prev_mu = 0 if aries_extract is None else aries_extract.total_prev_mu_dict[keyword.lower()]
        prev_end_date = None  # the last segment end_date for specific phase
        prev_end_idx = None  # the last segment end_date for specific phase

        forecast_datas_params_document = forecast_datas_params_dic.get((scenario, qualifier, propnum))
        if forecast_datas_params_document is not None:
            segments = forecast_datas_params_document['data'][keyword.lower()]['P_dict']['best']['segments']
            for segment in segments:
                try:
                    total_prev_mu += segment['imu']
                except TypeError:
                    pass
                prev_end_date = segment['end_date']
                prev_end_idx = segment['end_idx']

    return total_prev_mu, prev_end_date, prev_end_idx


def get_ratio_forecast_start_date_and_cutoff(ls_expression, start_date, param_dic, qualifier, propnum, keyword,
                                             scenario, section, dates_1_base_date, forecast_datas_params_dic,
                                             log_report):
    '''
    if previous segment exist, use previous segment end_date + 1 as start_date
    if cutoff is date, need to calculate the end_date
    add start_date or end_date to param_dic
    return: param_dic
    '''
    base = keyword.strip().split('/')[1]
    total_prev_mu, prev_end_date, prev_end_idx = get_forecast_sum_and_end_date_of_prev_segment_eur(
        qualifier, propnum, keyword, scenario, section, forecast_datas_params_dic)
    # start_date handle
    try:
        if prev_end_date:
            param_dic['start_idx'] = prev_end_idx + 1
            param_dic['start_date'] = (pd.to_datetime('1/1900')
                                       + pd.DateOffset(days=param_dic['start_idx'])).strftime('%m/%d/%Y')
        else:
            param_dic['start_date'] = pd.to_datetime(start_date).strftime('%m/%d/%Y')

        ls_expression = check_for_inconsistent_date(ls_expression, keyword, log_report, scenario, propnum, section)

        # date cutoff handle
        if ls_expression[4] == 'LIFE':
            forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
            segment = forecast_datas_params_document['data'][base.lower()]['P_dict']['best']['segments'][-1]
            param_dic['end_date'] = segment['end_date']

        elif ls_expression[4] in ['MO', 'MOS', 'MOX']:
            segment_end_date = pd.to_datetime(start_date)
            day, month = get_day_month_from_decimal_date(ls_expression[3])
            segment_end_date += pd.DateOffset(months=month, days=day)
            param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

        elif ls_expression[4] == 'YR' or ls_expression[4] == 'YRS':
            segment_end_date = pd.to_datetime(start_date)
            day, month, year = get_day_month_year_from_decimal_date(ls_expression[3])
            segment_end_date += pd.DateOffset(years=year, months=month, days=day)
            param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

        elif ls_expression[4] == 'IMO' or ls_expression[4] == 'IMOS':
            segment_end_date = pd.to_datetime(param_dic['start_date'])
            day, month = get_day_month_from_decimal_date(ls_expression[3])
            segment_end_date += pd.DateOffset(months=month, days=day)
            param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

        elif ls_expression[4] == 'IYR':
            segment_end_date = pd.to_datetime(param_dic['start_date'])
            day, month, year = get_day_month_year_from_decimal_date(ls_expression[3])
            segment_end_date += pd.DateOffset(years=year, months=month, days=day)
            param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

        elif ls_expression[4] in ['AD', 'ADX']:
            if '/' in ls_expression[3]:
                # since pd.to_datetime can only handle max 2261 year
                if int(ls_expression[3].split('/')[-1]) > 2261:
                    param_dic['end_date'] = ls_expression[3]
                else:
                    segment_end_date = format_aries_segment_date(ls_expression[3], dates_1_base_date)
                    param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')
            elif '.' in ls_expression[3]:
                day, month, year = get_day_month_year_from_decimal_date(ls_expression[3])
                param_dic['end_date'] = pd.to_datetime(datetime.date(year, month, day))
    except Exception:
        log_report.log_error(message=format_error_msg(ErrorMsgEnum.cut_off_date_error_msg.value, start_date),
                             aries_row=str_join(ls_expression),
                             scenario=scenario,
                             well=propnum,
                             model=ErrorMsgEnum.forecast.value,
                             section=section,
                             severity=ErrorMsgSeverityEnum.error.value)

    return param_dic


def convert_unit_of_imu(expression, total_prev_mu, param_dic):
    if expression[4] == 'MB' or expression[4] == 'MMF' or expression[4] == 'MU':
        volume = float(expression[3]) * 1000
        param_dic['imu'] = volume - total_prev_mu
    elif expression[4] == 'MMB' or expression[4] == 'BCF':
        volume = float(expression[3]) * 1000000
        param_dic['imu'] = volume - total_prev_mu
    elif expression[4] == 'BBL' or expression[4] == 'MCF' or expression[4] == 'U':
        volume = float(expression[3])
        param_dic['imu'] = volume - total_prev_mu
    elif expression[4] == 'IMU':
        volume = float(expression[3])
        param_dic['imu'] = volume * 1000
    elif expression[4] == 'IU':
        volume = float(expression[3])
        param_dic['imu'] = volume

    return param_dic


def process_forecast_date_cut_off(start_date, expression, scenario, propnum, param_dic, dates_1_life, dates_1_base_date,
                                  log_report):
    if expression[4] == UnitEnum.life.value:
        # end_date = prev_end_date + dates_1_life
        segment_end_date = pd.to_datetime(start_date)
        segment_end_date += pd.DateOffset(years=int(dates_1_life))
        param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')
    elif expression[4] == 'AD':
        # end_date = ad_date
        segment_end_date = format_aries_segment_date(expression[3], dates_1_base_date)
        param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')
    elif UnitEnum.month.value in expression[4]:
        start_date = param_dic['start_date'] if expression[4].startswith('I') else start_date
        segment_end_date = pd.to_datetime(start_date)
        day, month = get_day_month_from_decimal_date(expression[3])
        segment_end_date += pd.DateOffset(months=month, days=day)
        param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')
    elif UnitEnum.year.value in expression[4]:
        start_date = param_dic['start_date'] if expression[4].startswith('I') else start_date
        segment_end_date = pd.to_datetime(start_date)
        day, month, year = get_day_month_year_from_decimal_date(expression[3])
        segment_end_date += pd.DateOffset(years=year, months=month, days=day)
        param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

    return param_dic


def process_forecast_cut_off_syntax(start_date, propnum, scenario, total_prev_mu, dates_1_life, dates_1_base_date,
                                    expression, param_dic, log_report):
    if expression[3] == 'X':
        # get qend
        get_aries_forecast_qend(expression, param_dic)

    # imu handle
    # if forecast cutoff is IMU or IU, the volume can be put to imu directly
    # if forecast cutoff is not IMU or IU, the volume need to subtract the total_prev_mu
    # all unit need to convert to BBL (U) or MCF (U)
    # convert unit of imu
    elif expression[4] in ['MB', 'MMF', 'MU', 'MMB', 'BCF', 'BBL', 'MCF', 'U', 'IMU', 'IU']:
        param_dic = convert_unit_of_imu(expression, total_prev_mu, param_dic)

    # date cutoff handle
    elif expression[4] in date_unit_list:
        param_dic = process_forecast_date_cut_off(start_date, expression, scenario, propnum, param_dic, dates_1_life,
                                                  dates_1_base_date, log_report)

    return param_dic


def special_cutoff_handle(expression, param_dic):
    if expression[4] == 'EXP':
        # if decline_method == 'H' (tangent_deff) or 'A' (nominal_deff), need to still treat dm as secent_deff
        param_dic['dm'] = float(expression[3])

    elif expression[4] in ['BPD', 'MPD']:
        param_dic['qend'] = float(expression[3])

    return param_dic


def get_forecast_start_date_and_cutoff(aries_extract, ls_expression, start_date, param_dic, qualifier, propnum, keyword,
                                       scenario, section, dates_1_base_date, dates_1_life, forecast_datas_params_dic,
                                       log_report):
    '''
    if previous segment exist, use previous segment end_date + 1 as start_date
    if cutoff is volume unit, such as MU, MB, BBL, MCF...exist
    (need to get_forecast_sum_and_end_date_of_prev_segment_eur)
    if cutoff is date, need to calculate the end_date

    imu unit: oil is berrels, gas is mcf, water is berrels, other unit need to change to generic unit

    add start_date or imu or end_date to param_dic
    return: param_dic

    noted: current_mu - previous_mu = imu
    '''
    total_prev_mu, prev_end_date, prev_end_idx = get_forecast_sum_and_end_date_of_prev_segment_eur(
        qualifier, propnum, keyword, scenario, section, forecast_datas_params_dic, aries_extract=aries_extract)

    try:
        # start_date handle
        if prev_end_date:
            param_dic['start_idx'] = prev_end_idx + 1
            param_dic['start_date'] = (pd.to_datetime('1/1900')
                                       + pd.DateOffset(days=param_dic['start_idx'])).strftime('%m/%d/%Y')
        else:
            param_dic['start_date'] = pd.to_datetime(start_date).strftime('%m/%d/%Y')

        ls_expression = check_for_inconsistent_date(ls_expression, keyword, log_report, scenario, propnum, section)

        # if cutoff unit can not fetch, use qend
        param_dic = process_forecast_cut_off_syntax(start_date, propnum, scenario, total_prev_mu, dates_1_life,
                                                    dates_1_base_date, ls_expression, param_dic, log_report)
    except Exception:
        log_report.log_error(message=format_error_msg(ErrorMsgEnum.cut_off_date_error_msg.value, start_date),
                             aries_row=str_join(ls_expression),
                             scenario=scenario,
                             well=propnum,
                             model=ErrorMsgEnum.forecast.value,
                             section=section,
                             severity=ErrorMsgSeverityEnum.error.value)

    # special cutoff handle
    param_dic = special_cutoff_handle(ls_expression, param_dic)

    # adjust qend unit by ls_expression[2] defined unit
    param_dic = update_qend_from_unit(param_dic, ls_expression)

    return param_dic


def read_ratio_forecast_qi(aries_extract, ls_expression, start_date, param_dic, qualifier, propnum, keyword, scenario,
                           section, forecast_datas_params_dic):
    '''
    read qi and its unit from ls_expression, unit need to change to per day

    return: param_dic
    '''
    # get ratio schedueled ratio phase
    phase = keyword.strip().split('/')[0]
    base_phase = keyword.strip().split('/')[1]

    phase = phase if phase != 'WTR' else 'WATER'

    prev_qend = None
    qi_from_prev = None
    qend_from_prev = None

    try:
        # if key has not been created pass
        forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
        segment = forecast_datas_params_document['data'][phase.lower()]['P_dict']['best']['segments'][-1]
        prev_qend = segment['qend']
    except (KeyError, IndexError):
        pass

    # check if intial rate and end rate is set as X
    # this signfies that the rate from the previous end should be kept constant across the segment
    if ls_expression[0] == 'X' and ls_expression[1] == 'X':
        qi_from_prev = True
        param_dic['qi'] = prev_qend
        qend_from_prev = True
        param_dic['qend'] = param_dic['qi']
    # if just the initial rate is set as X use the previous end rate as the first rate and get the end rate
    # from the expression
    elif ls_expression[0] == 'X':
        qi_from_prev = True
        param_dic['qi'] = prev_qend
        param_dic['qend'] = float(ls_expression[1])
    # if the end rate is set as X. This signifies that the rate should be kept constant through out the segment
    elif ls_expression[1] == 'X':
        param_dic['qi'] = float(ls_expression[0])
        param_dic['qend'] = param_dic['qi']
    else:
        # get initial rate and end rate
        param_dic['qi'] = float(ls_expression[0])
        param_dic['qend'] = float(ls_expression[1])

    param_dic = handle_ratio_flow_rate_value_from_unit(param_dic, keyword, base_phase, ls_expression, qi_from_prev,
                                                       qend_from_prev)
    aries_extract.segment_qend = param_dic['qend']

    return param_dic


def read_forecast_qi(aries_extract, ls_expression, start_date, param_dic, qualifier, propnum, keyword, scenario,
                     section, forecast_datas_params_dic, log_report):
    '''
    read qi and its unit from ls_expression, unit need to change to per day

    return: param_dic
    '''
    use_nl = False
    if keyword == 'WTR':
        keyword = 'WATER'

    prev_qend = None

    try:
        # if key has not been created pass
        forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
        segment = forecast_datas_params_document['data'][keyword.lower()]['P_dict']['best']['segments'][-1]
        prev_qend = segment['qend']
    except (KeyError, IndexError):
        pass
    try:
        qend = eval(str(ls_expression[1]))
    except NameError:
        qend = None

    param_dic['qend'] = qend
    param_dic = update_qend_from_unit(param_dic, ls_expression)
    aries_extract.segment_qend = param_dic['qend']

    try:
        cutoff_crit = ls_expression[4]
    except IndexError:
        cutoff_crit = None

    if (param_dic['end_date'] is not None or cutoff_crit == 'EXP') and param_dic['qend'] is not None:
        ls_expression[-1] = 'X'

    if prev_qend:
        param_dic['qi'] = prev_qend
        if ls_expression[0] != 'X':
            try:
                param_dic['qi'] = eval(str(ls_expression[0]))
            except NameError:
                log_report.log_error(aries_row=ls_expression,
                                     message=format_error_msg(ErrorMsgEnum.class6_msg.value,
                                                              ErrorMsgEnum.flowrate.value, ls_expression[0]),
                                     scenario=scenario,
                                     well=propnum,
                                     model=ErrorMsgEnum.forecast_stream.value,
                                     section=section,
                                     severity=ErrorMsgSeverityEnum.error.value)
            param_dic = update_qi_from_unit(param_dic, ls_expression)

    else:
        qi_str = ls_expression[0]
        try:
            qi_str = format_float_str(str(qi_str))
            param_dic['qi'] = eval(str(qi_str))
        except Exception:
            log_report.log_error(aries_row=ls_expression,
                                 message=format_error_msg(ErrorMsgEnum.class6_msg.value, ErrorMsgEnum.flowrate.value,
                                                          qi_str),
                                 scenario=scenario,
                                 well=propnum,
                                 model=ErrorMsgEnum.forecast_stream.value,
                                 section=section,
                                 severity=ErrorMsgSeverityEnum.error.value)

        # only adjust unit to daily production if qi fetched value from ls_expression[0]

        param_dic = update_qi_from_unit(param_dic, ls_expression)

    if ls_expression[1] in ['NL', 'EL']:
        param_dic['qend'] = 10 / DAYS_IN_MONTH
        use_nl = True

    if ls_expression[-2] == 'ISET':
        # must have previous segment
        # recompleting (qi = prev_qend + volume)
        # param_dic['qi'] += float(ls_expression[0])

        # only adjust unit to daily production if qi fetched value from ls_expression[0]
        param_dic = update_qi_from_unit(param_dic, ls_expression, iset=True)

    return param_dic, use_nl


def get_number_of_days(unit):
    """
    Gets numbers of days in specified time unit

    Inputs (str): 'month', 'year'

    Output: Number of day in months or year
    """
    common_number = {'year': 365.25, 'month': (365 / 12)}

    return common_number[unit]


def determine_known_param(param_dic):
    '''
    input: param_dic
    output: known_param which is not None in param_dic
    '''
    ls_unknown_key = ['end_idx', 'imu', 'qend', 'dm']

    for known_param in ls_unknown_key:
        if param_dic[known_param] is not None:
            return known_param


def check_end_idx(param_dic):
    '''
    currently temp check, it will be combine to forecast calculation in the future
    if end_idx is too big, just use start_idx + (365 * 100)nd_idx
    '''
    if param_dic['end_idx'] > (param_dic['start_idx'] + (365 * param_dic['life'])):
        param_dic['end_idx'] = (param_dic['start_idx'] + (365 * param_dic['life']))
    return param_dic


def calc_incremental_month_indices(start_idx, end_idx):
    return round((pd.to_datetime(get_forecast_date_from_index(end_idx))
                  - pd.to_datetime(get_forecast_date_from_index(start_idx))).days / DAYS_IN_MONTH, 4)


def format_forecast_for_converted_ratio(aries_extract, expressions, phase, start_date, scenario, section,
                                        ls_scenarios_id, qualifier, propnum, forecast_datas_params_dic,
                                        get_default_format, dates_1_base_date, dates_1_life, max_date_index,
                                        scenarios_dic, wells_dic, forecasts_dic, forecast_datas_dic, forecast_ids,
                                        forecast_other_phase, projects_dic, log_report):
    # TODO: Refactor the code to get arguments like wells_dic, forecasts_dics etc directly from aries_extract
    for expression in expressions:
        ls_segment_obj, ls_param_dic, use_nl = read_parameters_convert_to_segment_obj(
            aries_extract, expression, start_date, qualifier, propnum, phase, section, scenario,
            forecast_datas_params_dic, dates_1_base_date, dates_1_life, max_date_index, log_report)
        update_param_dic(propnum, scenario, qualifier, phase, ls_param_dic, forecast_datas_params_dic,
                         get_default_format)
        # start processing the segment_obj (follow phdwins procedure)
        for segment_obj in ls_segment_obj:
            for _id in projects_dic:
                forecast_formatting_process(scenario, qualifier, propnum, segment_obj, phase, _id, ls_scenarios_id,
                                            forecast_ids, scenarios_dic, wells_dic, get_default_format,
                                            forecast_other_phase, forecasts_dic, forecast_datas_dic)


def update_param_dic(propnum, scenario, qualifier, phase, ls_param_dic, forecast_datas_params_dic, get_default_format):
    for param_dic in ls_param_dic:
        data_obj = get_data_obj()
        forecast_datas_params_document = forecast_datas_params_dic.get((scenario, qualifier, propnum))
        if forecast_datas_params_document is None:
            # 1st time saving the forecast_default_document_params
            forecast_default_document_params = get_default_format('forecast-datas')
            # forecast_datas collection
            data_obj[phase.lower()]['P_dict']['best']['segments'].append(param_dic)
            forecast_default_document_params['data'] = data_obj
            forecast_datas_params_dic[(scenario, qualifier, propnum)] = forecast_default_document_params
        else:
            forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
            forecast_datas_params_document['data'][phase.lower()]['P_dict']['best']['segments'].append(param_dic)
        # start processing the segment_obj (follow phdwins procedure)


def convert_ratio_expression_to_rate_expressions(ls_segment_obj, base_segments, phase, segment_conversion):
    ratio_start_idx = ls_segment_obj[-1]['start_idx']
    ratio_end_idx = ls_segment_obj[-1]['end_idx']

    idx_b_ls = []
    for segment in base_segments:
        current_start_idx = segment['start_idx']
        current_end_idx = segment['end_idx']
        current_b = segment.get('b')
        if ratio_start_idx <= current_end_idx and ratio_start_idx >= current_start_idx:
            if ratio_end_idx <= current_end_idx:
                idx_b_ls.append((ratio_start_idx, ratio_end_idx, current_b))
                break
            else:
                idx_b_ls.append((ratio_start_idx, current_end_idx, current_b))
                ratio_start_idx = current_end_idx + 1

    rate_b_mo_ls = []
    for idx_b in idx_b_ls:
        qi, qend = segment_conversion.predict_time_ratio([idx_b[0], idx_b[1]], ls_segment_obj, base_segments)
        calc_incr_months = calc_incremental_month_indices(idx_b[0], idx_b[1])
        rate_b_mo_ls.append((qi, qend, calc_incr_months, idx_b[2]))

    if phase.lower() == PhaseEnum.gas.value:
        rc_unit = 'M/D'
    else:
        rc_unit = 'B/D'

    ls_expressions = []
    for rate_b_mo in rate_b_mo_ls:
        if rate_b_mo[3] is not None and float(rate_b_mo[3]) != 0:
            ls_expressions.append([rate_b_mo[0], rate_b_mo[1], rc_unit, rate_b_mo[2], 'IMO', f'B/{rate_b_mo[3]}', 'X'])
        else:
            ls_expressions.append([rate_b_mo[0], rate_b_mo[1], rc_unit, rate_b_mo[2], 'IMO', 'EXP', 'X'])

    return ls_expressions


def read_parameters_convert_to_segment_obj_ratio(aries_extract, ls_expression, start_date, qualifier, propnum, keyword,
                                                 section, scenario, dates_1_life, dates_1_base_date, max_date_index,
                                                 forecast_datas_params_dic, log_report):
    '''
    input: ls_expression, ex: ['141.5366', 'X', 'B/M', '6.000000', 'EXP', 'B/1.2000', '12.379443']
    noted: param_dic, ex: {'start_date': '10/2017',
                            'qi': 141.5366,
                            'b': 1.2,
                            'secant_deff': 70,
                            'tangent_deff': None,
                            'nominal_deff': None,
                            'life': max_life,

                            'imu': None,
                            'qend': None,
                            'dm': None,
                            'end_date': 8/2012}

    noted: None in the dictionary will be calculated and replaced by a value or date string
    output: [segment_obj], [param_dic]
    '''
    # forecast formula method
    # get all 8 parameters
    # decline_method = ls_expression[-2].split('/')[0]

    param_dic = {
        'start_date': None,
        'start_idx': None,
        'qi': None,
        'b': None,
        'secant_deff': None,
        'tangent_deff': None,
        'nominal_deff': None,
        'life': dates_1_life,
        'imu': None,
        'qend': None,
        'dm': None,
        'end_date': None,
        'end_idx': None
    }

    # decide to use start_date or previous segment end_date, also check if MU is the decline method
    param_dic = get_ratio_forecast_start_date_and_cutoff(ls_expression, start_date, param_dic, qualifier, propnum,
                                                         keyword, scenario, section, dates_1_base_date,
                                                         forecast_datas_params_dic, log_report)

    # read qi (need to convert unit to CC's production unit)
    param_dic = read_ratio_forecast_qi(aries_extract, ls_expression, start_date, param_dic, qualifier, propnum, keyword,
                                       scenario, section, forecast_datas_params_dic)
    if param_dic.get('start_date') == param_dic.get('end_date'):
        return [], []
    param_dic = convert_param_dic_date_to_idx(param_dic)

    decline_method = ls_expression[-2].split('/')[0]
    decline_method = check_for_flat_decline_method_in_ls_expression(decline_method, param_dic, ls_expression)

    param_dic, segment_obj = aries_convert[decline_method.lower()]['ratio'](param_dic, ls_expression, max_date_index)

    return [segment_obj], [param_dic]


def read_parameters_convert_to_segment_obj(  # noqa C901
        aries_extract,
        ls_expression,
        start_date,
        qualifier,
        propnum,
        keyword,
        section,
        scenario,
        forecast_datas_params_dic,
        dates_1_base_date,
        dates_1_life,
        max_date_index,
        log_report,
        forecast_side_import=False):
    '''
    input: ls_expression, ex: ['141.5366', 'X', 'B/M', '6.000000', 'EXP', 'B/1.2000', '12.379443']
    noted: param_dic, ex: {'start_date': '10/2017',
                            'qi': 141.5366,
                            'b': 1.2,
                            'secant_deff': 70,
                            'tangent_deff': None,
                            'nominal_deff': None,
                            'life': max_life,

                            'imu': None,
                            'qend': None,
                            'dm': None,
                            'end_date': 8/2012}

    noted: None in the dictionary will be calculated and replaced by a value or date string
    output: [segment_obj], [param_dic]
    '''
    # forecast formula method
    # get all 8 parameters
    decline_method = ls_expression[-2].split('/')[0]

    param_dic = {
        'start_date': None,
        'start_idx': None,
        'qi': None,
        'b': None,
        'secant_deff': None,
        'tangent_deff': None,
        'nominal_deff': None,
        'linear_deff': None,
        'k': None,
        'life': dates_1_life,
        'imu': None,
        'qend': None,
        'dm': None,
        'end_date': None,
        'end_idx': None
    }

    # decide to use start_date or previous segment end_date, also check if MU is the decline method
    try:
        param_dic = get_forecast_start_date_and_cutoff(aries_extract, ls_expression, start_date, param_dic, qualifier,
                                                       propnum, keyword, scenario, section, dates_1_base_date,
                                                       dates_1_life, forecast_datas_params_dic, log_report)
    except Exception:
        pass

    # read qi (need to convert unit to CC's production unit)
    try:
        param_dic, use_nl = read_forecast_qi(aries_extract, ls_expression, start_date, param_dic, qualifier, propnum,
                                             keyword, scenario, section, forecast_datas_params_dic, log_report)
    except Exception:
        use_nl = False

    if param_dic.get('start_date') == param_dic.get('end_date'):
        return [], [], use_nl

    # convert aries keyword to convert keyword dic
    decline_method_dic = {
        'B': 'hyp',
        'EXP': 'exp',
        'FLAT': 'flat',
        'HAR': 'hyp',
        'H': 'hyp',
        'A': 'hyp',
        'PC': 'exp',
        'SPD': 'lin'
    }

    decline_method = check_for_flat_decline_method_in_ls_expression(decline_method, param_dic, ls_expression)
    ls_expression, decline_method, change_made = check_for_valid_b_value(ls_expression, decline_method)

    if change_made:
        log_report.log_error(aries_row=str_join(ls_expression),
                             message=ErrorMsgEnum.change_b_to_exp.value,
                             scenario=scenario,
                             well=propnum,
                             model=ErrorMsgEnum.forecast.value,
                             section=section,
                             severity=ErrorMsgSeverityEnum.warn.value)

    if decline_method == 'B':
        param_dic['b'] = float(ls_expression[-2].split('/')[1])
        if param_dic['b'] == 1.0:
            param_dic['b'] = 0.9999999
        if param_dic['b'] == 0.0:
            param_dic['b'] = 0.0000001
        if ls_expression[-1] == 'X':
            # need to calculate secant_deff
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression, curve_type=decline_method)
            if not valid:
                return [], [], use_nl

        else:
            # hyperbolic (arps)
            param_dic['secant_deff'] = float(ls_expression[-1])

        # determine which key is not None
        param_dic, decline_method = forecast_incline_check(param_dic, decline_method, 'secant_deff', ls_expression,
                                                           propnum, scenario, log_report)

        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method == 'SPD':
        param_dic['b'] = 0
        if ls_expression[-1] == 'X':
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression, curve_type=decline_method)
            if not valid:
                return [], [], use_nl
        else:
            # exponetial (b = 0)
            param_dic['linear_deff'] = float(format_float_str(str(ls_expression[-1])))

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)
        if known_param in ['dm', 'imu']:
            return None
        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)

        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method in ['EXP', 'PC']:
        param_dic['b'] = 0
        if ls_expression[-1] == 'X' or decline_method == 'PC':
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression, curve_type='EXP')
            if not valid:
                return [], [], use_nl
        else:
            # exponetial (b = 0)
            param_dic['secant_deff'] = float(format_float_str(str(ls_expression[-1])))

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method == 'FLAT' or ls_expression[-1] == 'FLAT':
        if ls_expression[-1] == 'FLAT':
            decline_method = 'FLAT'

        if param_dic['qi'] is not None:
            if forecast_side_import and param_dic['qi'] == 0:
                param_dic['qi'] = MINIMUM_FLOWRATE
            param_dic['qend'] = param_dic['qi']
        elif param_dic['qend'] is not None:
            if forecast_side_import and param_dic['qend'] == 0:
                param_dic['qend'] = MINIMUM_FLOWRATE
            param_dic['qi'] = param_dic['qend']
        # special handle for 'X' in the fourth position
        if ls_expression[3] == 'X':
            segment_end_date = process_flat_forecast_when_no_duration(param_dic, ls_expression, start_date,
                                                                      dates_1_life)
            param_dic['end_date'] = segment_end_date.strftime('%m/%d/%Y')

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method == 'HAR':
        param_dic['b'] = 0.9999999
        if ls_expression[-1] == 'X':
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression)  # need to calculate secant_deff
            if not valid:
                return [], [], use_nl
        else:
            # harmonic (b = 0.9999999)
            param_dic['secant_deff'] = float(ls_expression[-1])

        param_dic, decline_method = forecast_incline_check(param_dic, decline_method, 'secant_deff', ls_expression,
                                                           propnum, scenario, log_report)
        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method == 'H':
        param_dic['b'] = float(ls_expression[-2].split('/')[1])
        if param_dic['b'] == 1.0:
            param_dic['b'] = 0.9999999
        if ls_expression[-1] == 'X':
            # need to calculate tangent_deff
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression, curve_type=decline_method)
            if not valid:
                return [], [], use_nl
        else:
            # hyperbolic (arps)
            param_dic['tangent_deff'] = float(ls_expression[-1])

        param_dic, decline_method = forecast_incline_check(param_dic, decline_method, 'tangent_deff', ls_expression,
                                                           propnum, scenario, log_report)

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    elif decline_method == 'A':
        param_dic['b'] = float(ls_expression[-2].split('/')[1])
        if param_dic['b'] == 1.0:
            param_dic['b'] = 0.9999999
        if ls_expression[-1] == 'X':
            # need to calculate nominal_deff
            param_dic, valid = update_deff_in_param_dic(param_dic, ls_expression, curve_type=decline_method)
            if not valid:
                return [], [], use_nl
        else:
            # hyperbolic (arps)
            param_dic['nominal_deff'] = float(ls_expression[-1])

        param_dic, decline_method = forecast_incline_check(param_dic, decline_method, 'nominal_deff', ls_expression,
                                                           propnum, scenario, log_report)

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic)
        known_param = determine_known_param(param_dic)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert[decline_method_dic[decline_method]][known_param](param_dic,
                                                                                                max_date_index)
        # param_dic = check_end_idx(param_dic)
        param_dic = convert_param_dic_idx_to_date(param_dic)

    param_dic, segment_obj, valid = run_time_forecast_segment_check(param_dic, segment_obj, decline_method)
    if not valid:
        return [], [], use_nl

    return [segment_obj], [param_dic], use_nl


def read_list_method_convert_to_segment_obj(  # noqa C901
        ls_expression,
        start_date,
        qualifier,
        propnum,
        keyword,
        scenario,
        section,
        dates_1_life,
        max_date_index,
        forecast_datas_params_dic,
        get_default_format,
        forecast_side_import=False):
    '''
    input: ls_expression, ex: ['11/2020', '6*5000', '12*4500', '#/Y']
                            ex: ['11/2020', '5000', '4900', '4800', '4700', '4500', '#']

    noted: param_dic, ex: {'start_date': '10/2017',
                            'start_idx': None,
                            'qi': 141.5366,
                            'b': 1.2,
                            'secant_deff': None,
                            'tangent_deff': None,
                            'nominal_deff': None,
                            'life': max_life,

                            'imu': None,
                            'qend': None,
                            'dm': None,
                            'end_date': 8/2012,
                            'end_idx': None}

    noted: None in the dictionary will be calculated and replaced by a value or date string
    output: [segment_obj], [param_dic]
    '''
    ls_segment_obj, ls_param_dic = [], []

    if ls_expression[-1] == '#' or ls_expression[-1] == '#/M' or ls_expression[-1] == '#M':
        shift_month = 1
        shift_year = 0
        multiplier = 1

    elif ls_expression[-1] == '#/Y' or ls_expression[-1] == '#Y':
        shift_month = 0
        shift_year = 1
        multiplier = 1

    elif ls_expression[-1] == 'M#' or ls_expression[-1] == 'M#/M' or ls_expression[-1] == 'M#M':
        shift_month = 1
        shift_year = 0
        multiplier = 1000

    elif ls_expression[-1] == 'M#/Y' or ls_expression[-1] == 'M#Y':
        shift_month = 0
        shift_year = 1
        multiplier = 1000

    for idx in range(1, len(ls_expression) - 1):

        param_dic = {
            'start_date': None,
            'start_idx': None,
            'qi': None,
            'b': None,
            'secant_deff': None,
            'tangent_deff': None,
            'nominal_deff': None,
            'life': dates_1_life,
            'imu': None,
            'qend': None,
            'dm': None,
            'end_date': None,
            'end_idx': None
        }

        # fetch start_date from either prev or segment or ls_expression[0]
        if ls_expression[0] != 'X' and idx == 1:
            start_date = pd.to_datetime(ls_expression[0], errors='coerce')
            if pd.isnull(start_date):
                start_date = pd.to_datetime(datetime.datetime.strptime(ls_expression[0], '%m/%y'))
        else:
            total_prev_mu, prev_end_date, prev_end_idx = get_forecast_sum_and_end_date_of_prev_segment_eur(
                qualifier, propnum, keyword, scenario, section, forecast_datas_params_dic)

            start_date = convert_str_date_to_datetime_format(prev_end_date, format='%m/%d/%Y')
            start_date = shift_datetime_date(start_date, days=1)

        if '*' not in str(ls_expression[idx]):
            if ls_expression[0] != 'X' and idx == 1:
                start_date, end_date = process_list_start_date_and_get_end_date(start_date,
                                                                                shift_month,
                                                                                shift_year,
                                                                                forecast=True)
            else:
                start_date, end_date = process_list_start_date_and_get_end_date(start_date,
                                                                                shift_month,
                                                                                shift_year,
                                                                                forecast=True)

            try:
                if (shift_month == 1):
                    param_dic['qi'] = (float(ls_expression[idx]) * multiplier) / DAYS_IN_MONTH
                else:
                    param_dic['qi'] = (float(ls_expression[idx]) * multiplier) / DAYS_IN_YEAR
            except ValueError:
                continue

        elif '*' in str(ls_expression[idx]):
            value = ls_expression[idx].split('*')[1]
            times = ls_expression[idx].split('*')[0]

            start_date, end_date = process_list_start_date_and_get_end_date(start_date,
                                                                            shift_month * int(times),
                                                                            shift_year * int(times),
                                                                            forecast=True)

            try:
                if (shift_month == 1):
                    param_dic['qi'] = (float(value) * multiplier) / DAYS_IN_MONTH
                else:
                    param_dic['qi'] = (float(value) * multiplier) / DAYS_IN_YEAR
            except ValueError:
                continue

        param_dic['start_date'] = start_date
        param_dic['end_date'] = end_date
        if forecast_side_import and param_dic['qi'] == 0:
            param_dic['qi'] = MINIMUM_FLOWRATE
        param_dic['qend'] = param_dic['qi']

        # determine which key is not None
        param_dic = convert_param_dic_date_to_idx(param_dic, list_method=True)

        # convert to segment_obj
        param_dic, segment_obj = aries_convert['flat']['end_idx'](param_dic, max_date_index)
        param_dic = convert_param_dic_idx_to_date(param_dic)

        ls_segment_obj.append(segment_obj)
        ls_param_dic.append(param_dic)

        # need to append param_dic by phase
        # and save forecast_default_document_params to self.forecast_datas_params_dic
        # self.forecast_datas_params_dic[(scenario, qualifier, propnum)] = forecast_default_document_params
        try:
            # get the saved the forecast_default_document_params
            forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
            forecast_datas_params_document['data'][keyword.lower()]['P_dict']['best']['segments'].append(param_dic)
        except Exception:
            # 1st time saving the forecast_default_document_params
            forecast_default_document_params = get_default_format('forecast-datas')

            data_obj = get_data_obj()

            if keyword == 'WTR':
                keyword = 'WATER'

            # forecast_datas collection
            if keyword.lower() == 'gas':
                data_obj['gas']['P_dict']['best']['segments'].append(param_dic)
            elif keyword.lower() == 'oil':
                data_obj['oil']['P_dict']['best']['segments'].append(param_dic)
            elif keyword.lower() == 'water':
                data_obj['water']['P_dict']['best']['segments'].append(param_dic)

            forecast_default_document_params['data'] = data_obj
            forecast_datas_params_dic[(scenario, qualifier, propnum)] = forecast_default_document_params

    return ls_segment_obj, ls_param_dic


def add_spd_method_if_required(expression):
    try:
        date_unit = expression[4]
    except IndexError:
        date_unit = None
    try:
        date_value = expression[3]
    except IndexError:
        date_value = None

    if len(expression) == 5 and date_unit in date_unit_list or len(expression) == 4 and not pd.isnull(
            pd.to_datetime(date_value, errors='coerce')):
        if len(expression) == 4 and not pd.isnull(pd.to_datetime(expression[3], errors='coerce')):
            expression += ['AD', 'SPD', 'X']
        else:
            expression += ['SPD', 'X']
    return expression


def update_based_on_nl(ls_segment_obj, well_id, scenario, dates_data_list, ls_scenarios_id, scenarios_dic, projects_dic,
                       compare_and_save_into_self_data_list):
    if len(ls_segment_obj) > 0:
        dates_default_document = get_well_doc_overlay(dates_data_list, well_id, ls_scenarios_id)
        document_name = str(dates_default_document[CCSchemaEnum.name.value]).rsplit('_', 1)[0]
        dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value] = copy.deepcopy(
            LAST_POS_CASH_FLOW_DICT)
        check_and_remove_well_from_previous_model(dates_data_list, [(well_id, scenario)], well_id, scenario,
                                                  ls_scenarios_id)
        dates_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
        dates_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()
        dates_default_document[CCSchemaEnum.wells.value] = set()
        for _id in ls_scenarios_id:
            if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                dates_default_document[CCSchemaEnum.wells.value].add((_id, well_id))
        compare_and_save_into_self_data_list(dates_default_document,
                                             dates_data_list,
                                             projects_dic,
                                             model_name=document_name,
                                             aries=True)


def check_for_flat_segment_in_date_cut_off(ls_segment_obj, well_id, scenario, dates_data_list, ls_scenarios_id,
                                           scenarios_dic, projects_dic, compare_and_save_into_self_data_list):
    if len(ls_segment_obj) > 0:
        if ls_segment_obj[-1][ForecastEnum.name.value] == ForecastEnum.flat.value:
            if ls_segment_obj[-1][ForecastEnum.q_start.value] == 0 or ls_segment_obj[-1][ForecastEnum.q_end.value] == 0:
                dates_default_document = get_well_doc_overlay(dates_data_list, well_id, ls_scenarios_id)
                if dates_default_document is not None:
                    document_name = str(dates_default_document[CCSchemaEnum.name.value]).rsplit('_', 1)[0]
                    if any('rate' in key
                           for key in dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value]):
                        cut_key = next(
                            key for key in dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value]
                            if 'rate' in key)
                        dates_default_document[EconEnum.econ_function.value][EconEnum.cut_off.value][cut_key] = 0
                        check_and_remove_well_from_previous_model(dates_data_list, [(well_id, scenario)], well_id,
                                                                  scenario, ls_scenarios_id)
                        dates_default_document[CCSchemaEnum.created.value] = datetime.datetime.now()
                        dates_default_document[CCSchemaEnum.updated.value] = datetime.datetime.now()
                        dates_default_document[CCSchemaEnum.wells.value] = set()

                        for _id in ls_scenarios_id:
                            if scenarios_dic[_id][CCSchemaEnum.name.value] == scenario:
                                dates_default_document[CCSchemaEnum.wells.value].add((_id, well_id))
                        compare_and_save_into_self_data_list(dates_default_document,
                                                             dates_data_list,
                                                             projects_dic,
                                                             model_name=document_name,
                                                             aries=True)


def identify_keyword_repitition(keyword, original_keyword, idx, repitition_keyword_dict):
    if keyword in ['OIL', 'GAS', 'WTR']:
        if original_keyword in repitition_keyword_dict:
            if original_keyword == '"':
                if idx - repitition_keyword_dict[original_keyword] == 1:
                    repitition_keyword_dict[original_keyword] = idx
                else:
                    return True
            else:
                return True
        else:
            repitition_keyword_dict[original_keyword] = idx
            repitition_keyword_dict['"'] = idx
    return False


def forecast_formating_isolate_ratio(scenario, qualifier, propnum, segment_obj, keyword, _id, get_default_format,
                                     forecasts_dic, forecast_datas_dic):
    phase, base = keyword.strip().split('/')
    data_obj = get_data_obj()

    phase = 'WATER' if phase == 'WTR' else phase
    base = 'WATER' if base == 'WTR' else base

    if (scenario, _id, qualifier, propnum) in forecast_datas_dic:
        saved_forecast_datas_document = forecast_datas_dic[(scenario, _id, qualifier, propnum)]
        saved_forecast_datas_document['data'][phase.lower()]['basePhase'] = base.lower()
        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            saved_forecast_datas_document['data'][phase.lower()]['P_dict']['best']['segments'].append(segment_obj)

    elif (scenario, _id) in forecasts_dic:
        saved_forecasts_document = forecasts_dic[(scenario, _id)]

        # create new forecast-datas
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        forecast_datas_default_document['_id'] = ObjectId()

        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            data_obj['gas']['P_dict']['best']['segments'].append(segment_obj)

        forecast_datas_default_document['well'] = propnum
        forecast_datas_default_document['forecast'] = saved_forecasts_document['_id']
        data_obj[phase.lower()]['basePhase'] = base.lower()
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id

        # save into self dictionary
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document

    else:
        # create both new forecast and new forecast-datas
        forecasts_default_document = get_default_format('forecasts')
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        forecasts_default_document['_id'] = ObjectId()

        forecast_datas_default_document['_id'] = ObjectId()

        forecasts_default_document['wells'].append(propnum)

        forecasts_default_document['name'] = qualifier.strip()
        forecasts_default_document['project'] = _id

        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            data_obj[phase.lower()]['P_dict']['best']['segments'].append(segment_obj)

        forecast_datas_default_document['wells'].append(propnum)
        forecast_datas_default_document['well'] = propnum
        forecast_datas_default_document['forecast'] = forecasts_default_document['_id']

        data_obj[phase.lower()]['basePhase'] = base.lower()
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id

        # save into self dictionary
        forecasts_dic[(scenario, _id)] = forecasts_default_document
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document


def ratio_forecast_formatting_process(scenario, qualifier, propnum, segment_obj, keyword, _id, ls_scenarios_id,
                                      forecasts_id, forecasts_dic, forecast_datas_dic, scenarios_dic, wells_dic,
                                      get_default_format):
    '''
    put each converted forecast segment in CC's format
    noted: same process as phdwins forecast segment formatting
    '''
    phase, base = keyword.strip().split('/')
    data_obj = get_data_obj()

    phase = 'WATER' if phase == 'WTR' else phase
    base = 'WATER' if base == 'WTR' else base

    # main logic for importing forecast
    if (scenario, _id, qualifier, propnum) in forecast_datas_dic:
        saved_forecast_datas_document = forecast_datas_dic[(scenario, _id, qualifier, propnum)]
        saved_forecast_datas_document['data'][phase.lower()]['basePhase'] = base.lower()
        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            if len(saved_forecast_datas_document['data'][phase.lower()]['P_dict']['best']['segments']) == 0:
                # need to fill plot_idx
                saved_forecast_datas_document['data'][phase.lower()]['p_extra']['plot_idx'] = segment_obj['start_idx']

            saved_forecast_datas_document['data'][phase.lower()]['P_dict']['best']['segments'].append(segment_obj)

    elif (scenario, _id) in forecasts_dic:
        saved_forecasts_document = forecasts_dic[(scenario, _id)]
        saved_forecasts_document = check_if_well_limit_reached_and_append(saved_forecasts_document, propnum, scenario,
                                                                          _id, wells_dic, forecasts_dic, forecasts_id,
                                                                          get_default_format)

        # create new forecast-datas
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        forecast_datas_default_document['_id'] = ObjectId()

        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            data_obj[phase.lower()]['P_dict']['best']['segments'].append(segment_obj)
            # need to fill plot_idx
            data_obj[phase.lower()]['p_extra']['plot_idx'] = segment_obj['start_idx']

        for scenario_id in ls_scenarios_id:
            if scenarios_dic[scenario_id]['name'] == scenario:
                forecast_datas_default_document['wells'].append((scenario_id, propnum))
        forecast_datas_default_document['well'] = wells_dic[str(propnum)]['_id']
        forecast_datas_default_document['forecast'] = saved_forecasts_document['_id']
        data_obj[phase.lower()]['basePhase'] = base.lower()
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id
        forecast_datas_default_document['createdAt'] = datetime.datetime.now()
        forecast_datas_default_document['updatedAt'] = datetime.datetime.now()

        # save into self dictionary
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document

    else:
        # create both new forecast and new forecast-datas
        forecasts_default_document = get_default_format('forecasts')
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        if forecasts_id is not None:
            forecasts_default_document['_id'] = forecasts_id
        else:
            forecasts_default_document['_id'] = ObjectId()

        forecast_datas_default_document['_id'] = ObjectId()

        # forecasts collection
        forecasts_default_document['wells'].append(wells_dic[str(propnum)]['_id'])
        forecasts_default_document['name'] = scenario.strip()
        forecasts_default_document['project'] = _id
        forecasts_default_document['createdAt'] = datetime.datetime.now()
        forecasts_default_document['updatedAt'] = datetime.datetime.now()

        # forecast_datas collection
        if phase.lower() in ['gas', 'oil', 'water']:
            data_obj[phase.lower()]['P_dict']['best']['segments'].append(segment_obj)

        for scenario_id in ls_scenarios_id:
            if scenarios_dic[scenario_id]['name'] == scenario:
                forecast_datas_default_document['wells'].append((scenario_id, propnum))

        forecast_datas_default_document['well'] = wells_dic[str(propnum)]['_id']
        forecast_datas_default_document['forecast'] = forecasts_default_document['_id']
        data_obj[phase.lower()]['basePhase'] = base.lower()
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id
        forecast_datas_default_document['createdAt'] = datetime.datetime.now()
        forecast_datas_default_document['updatedAt'] = datetime.datetime.now()

        # save into self dictionary
        forecasts_dic[(scenario, _id)] = forecasts_default_document
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document


def forecast_formating_isolate(scenario, qualifier, propnum, segment_obj, keyword, _id, get_default_format,
                               forecasts_dic, forecast_datas_dic):
    data_obj = get_data_obj()

    keyword = 'WATER' if keyword == 'WTR' else keyword

    if (scenario, _id, qualifier, propnum) in forecast_datas_dic:
        saved_forecast_datas_document = forecast_datas_dic[(scenario, _id, qualifier, propnum)]

        if keyword.lower() in ['gas', 'oil', 'water']:
            saved_forecast_datas_document['data'][keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)

    elif (scenario, _id) in forecasts_dic:
        saved_forecasts_document = forecasts_dic[(scenario, _id)]

        # create new forecast-datas
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        forecast_datas_default_document['_id'] = ObjectId()

        if keyword.lower() in ['gas', 'oil', 'water']:
            data_obj[keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)

        forecast_datas_default_document['well'] = propnum
        forecast_datas_default_document['forecast'] = saved_forecasts_document['_id']
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id

        # save into self dictionary
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document

    else:
        # create both new forecast and new forecast-datas
        forecasts_default_document = get_default_format('forecasts')
        forecast_datas_default_document = get_default_format('forecast-datas')

        forecasts_default_document['_id'] = ObjectId()
        forecast_datas_default_document['_id'] = ObjectId()

        forecasts_default_document['wells'].append(propnum)

        forecasts_default_document['name'] = qualifier.strip()
        forecasts_default_document['project'] = _id

        # forecast_datas collection
        if keyword.lower() in ['gas', 'oil', 'water']:
            data_obj[keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)

        forecast_datas_default_document['wells'].append(propnum)
        forecast_datas_default_document['well'] = propnum
        forecast_datas_default_document['forecast'] = forecasts_default_document['_id']
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id

        # save into self dictionary
        forecasts_dic[(scenario, _id)] = forecasts_default_document
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document


def forecast_formatting_process(scenario, qualifier, propnum, segment_obj, keyword, _id, ls_scenarios_id, forecasts_id,
                                scenarios_dic, wells_dic, get_default_format, forecast_other_phase, forecasts_dic,
                                forecast_datas_dic):
    '''
    put each converted forecast segment in CC's format
    noted: same process as phdwins forecast segment formatting
    '''
    data_obj = get_data_obj()

    keyword = 'WATER' if keyword == 'WTR' else keyword

    # main logic for importing forecast
    if (scenario, _id, qualifier, propnum) in forecast_datas_dic:
        saved_forecast_datas_document = forecast_datas_dic[(scenario, _id, qualifier, propnum)]

        # forecast_datas collection
        if keyword.lower() in ['gas', 'oil', 'water']:
            if len(saved_forecast_datas_document['data'][keyword.lower()]['P_dict']['best']['segments']) == 0:
                # need to fill plot_idx
                saved_forecast_datas_document['data'][keyword.lower()]['p_extra']['plot_idx'] = segment_obj['start_idx']

            saved_forecast_datas_document['data'][keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)
        else:
            # need to handle other phase forecast in the future
            data_obj['gas']['p_extra']['other_phase'] = keyword.lower()
            forecast_other_phase.add(keyword.lower())

    elif (scenario, _id) in forecasts_dic:
        saved_forecasts_document = forecasts_dic[(scenario, _id)]
        saved_forecasts_document = check_if_well_limit_reached_and_append(saved_forecasts_document, propnum, scenario,
                                                                          _id, wells_dic, forecasts_dic, forecasts_id,
                                                                          get_default_format)

        # create new forecast-datas
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        forecast_datas_default_document['_id'] = ObjectId()

        # forecast_datas collection

        if keyword.lower() in ['gas', 'oil', 'water']:
            data_obj[keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)
            # need to fill plot_idx
            data_obj[keyword.lower()]['p_extra']['plot_idx'] = segment_obj['start_idx']
        else:
            # need to handle other phase forecast in the future
            data_obj['gas']['p_extra']['other_phase'] = keyword.lower()
            forecast_other_phase.add(keyword.lower())
            return

        for scenario_id in ls_scenarios_id:
            if scenarios_dic[scenario_id]['name'] == scenario:
                forecast_datas_default_document['wells'].append((scenario_id, propnum))

        forecast_datas_default_document['well'] = wells_dic[str(propnum)]['_id']
        forecast_datas_default_document['forecast'] = saved_forecasts_document['_id']
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id
        forecast_datas_default_document['createdAt'] = datetime.datetime.now()
        forecast_datas_default_document['updatedAt'] = datetime.datetime.now()

        # save into self dictionary
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document

    else:
        # create both new forecast and new forecast-datas
        forecasts_default_document = get_default_format('forecasts')
        forecast_datas_default_document = get_default_format('forecast-datas')

        # need to give _id to each document
        if forecasts_id is not None:
            forecasts_default_document['_id'] = forecasts_id
        else:
            forecasts_default_document['_id'] = ObjectId()

        forecast_datas_default_document['_id'] = ObjectId()

        # forecasts collection
        forecasts_default_document['wells'].append(wells_dic[str(propnum)]['_id'])
        # forecasts_default_document['name'] = scenario.strip() + '/' + qualifier.strip()
        forecasts_default_document['name'] = scenario.strip()
        forecasts_default_document['project'] = _id
        forecasts_default_document['createdAt'] = datetime.datetime.now()
        forecasts_default_document['updatedAt'] = datetime.datetime.now()

        # forecast_datas collection
        if keyword.lower() in ['gas', 'oil', 'water']:
            data_obj[keyword.lower()]['P_dict']['best']['segments'].append(segment_obj)
            # need to fill plot_idx
            data_obj[keyword.lower()]['p_extra']['plot_idx'] = segment_obj['start_idx']
        else:
            # need to handle other phase forecast in the future
            data_obj['gas']['p_extra']['other_phase'] = keyword.lower()
            forecast_other_phase.add(keyword.lower())
            return

        for scenario_id in ls_scenarios_id:
            if scenarios_dic[scenario_id]['name'] == scenario:
                forecast_datas_default_document['wells'].append((scenario_id, propnum))

        forecast_datas_default_document['well'] = wells_dic[str(propnum)]['_id']
        forecast_datas_default_document['forecast'] = forecasts_default_document['_id']
        forecast_datas_default_document['data'] = data_obj
        forecast_datas_default_document['project'] = _id
        forecast_datas_default_document['createdAt'] = datetime.datetime.now()
        forecast_datas_default_document['updatedAt'] = datetime.datetime.now()

        # save into self dictionary
        forecasts_dic[(scenario, _id)] = forecasts_default_document
        forecast_datas_dic[(scenario, _id, qualifier, propnum)] = forecast_datas_default_document


def auto_fill_ratio_lines(ls, filler=RATIO_FILL_LINES):
    """
    Auto-fills a list of expressions or lines to achieve a desired length.

    This function takes a list of expressions or lines and returns a new list that
    ensures the length of the list is the `MAX_EXPRESSION_LENGTH`. If the input
    list has a length of 7 or more, it returns a sub-list containing the first 7
    elements. If the input list has a length of less than 7, it appends the required
    number of lines from the `RATIO_FILL_LINES` list.

    Args:
        ls (List[str]): The list of expressions or lines to be processed.

    Returns:
        List[str]: A list of expressions or lines with length at most `MAX_EXPRESSION_LENGTH`.
    """
    max_expression_length = len(filler)
    if len(ls) >= max_expression_length:
        return ls[:max_expression_length]

    compensate = max_expression_length - len(ls)

    # Append filler lines to the input list to achieve the desired length
    return ls + filler[-compensate:]


def process_ratio_forecast_keyword(
    aries_extract,
    keyword,
    propnum,
    scenario,
    ls_expression,
    start_date,
    qualifier,
    section,
    ls_scenarios_id,
    check_rate_forecast_dict,
    preceeding_keywords=None,
):

    (dates_1_life, dates_1_base_date, max_date_index, segment_conversion, scenarios_dic, wells_dic, forecasts_id,
     project_id, projects_dic, forecasts_dic, forecast_datas_dic, forecast_datas_params_dic, forecast_other_phase,
     log_report) = itemgetter('dates_1_life', 'dates_1_base_date', 'max_date_index', 'segment_conversion',
                              'scenarios_dic', 'wells_dic', 'forecasts_id', 'project_id', 'projects_dic',
                              'forecasts_dic', 'forecast_datas_dic', 'forecast_datas_params_dic',
                              'forecast_other_phase', 'log_report')(vars(aries_extract))

    preceeding_keywords = {'GAS', 'OIL', 'WTR'} if None else preceeding_keywords
    accepted_phases = ['OIL', 'GAS', 'WTR']
    phase, base = keyword.strip().split('/')
    if base not in preceeding_keywords:
        return True
    if all(item in accepted_phases for item in [phase, base]):
        preceeding_keywords.add(phase)

        # aries defaults any value that isn't 'CUM' for 'LIN' and 'LOG' to Time
        ls_expression = auto_fill_ratio_lines(ls_expression)
        if ls_expression[-2] in ['LIN', 'LOG']:
            ls_expression[-1] = 'TIME'

        phase = 'WATER' if phase == 'WTR' else phase
        base = 'WATER' if base == 'WTR' else base

        ls_expression = update_qstart_when_required(aries_extract, ls_expression, phase, propnum, scenario, qualifier,
                                                    forecast_datas_params_dic)

        ls_segment_obj, ls_param_dic = read_parameters_convert_to_segment_obj_ratio(
            aries_extract, ls_expression, start_date, qualifier, propnum, keyword, section, scenario, dates_1_life,
            dates_1_base_date, max_date_index, forecast_datas_params_dic, log_report)

        if f'{phase.lower()}_rate_forecast' in check_rate_forecast_dict:
            if check_rate_forecast_dict[f'{phase.lower()}_rate_forecast']:
                base_segments = forecast_datas_dic[(scenario, project_id, qualifier,
                                                    propnum)]['data'][base.lower()]['P_dict']['best']['segments']
                ls_expressions = convert_ratio_expression_to_rate_expressions(ls_segment_obj, base_segments, phase,
                                                                              segment_conversion)
                format_forecast_for_converted_ratio(aries_extract, ls_expressions, phase, start_date, scenario, section,
                                                    ls_scenarios_id, qualifier, propnum, forecast_datas_params_dic,
                                                    aries_extract.get_default_format, dates_1_base_date, dates_1_life,
                                                    max_date_index, scenarios_dic, wells_dic, forecasts_dic,
                                                    forecast_datas_dic, forecasts_id, forecast_other_phase,
                                                    projects_dic, log_report)
                log_report.log_error(aries_row=str_join(ls_expression),
                                     message=format_error_msg(ErrorMsgEnum.ratio_to_rate_msg.value, keyword),
                                     scenario=scenario,
                                     well=propnum,
                                     model=ErrorMsgEnum.forecast_stream.value,
                                     section=section,
                                     severity=ErrorMsgSeverityEnum.warn.value)
                return True

        process_segment_to_forecast_dict(keyword,
                                         propnum,
                                         phase,
                                         scenario,
                                         qualifier,
                                         ls_param_dic,
                                         ls_segment_obj,
                                         ls_scenarios_id,
                                         forecasts_id,
                                         wells_dic,
                                         scenarios_dic,
                                         projects_dic,
                                         forecasts_dic,
                                         forecast_datas_dic,
                                         forecast_datas_params_dic,
                                         forecast_other_phase,
                                         aries_extract.get_default_format,
                                         ratio=True)

    return False


def process_rate_forecast_keyword(aries_extract,
                                  keyword,
                                  ls_expression,
                                  start_date,
                                  propnum,
                                  scenario,
                                  qualifier,
                                  section,
                                  ls_scenarios_id,
                                  check_rate_forecast_dict,
                                  preceeding_keywords=None):

    (only_forecast, forecasts_id, dates_1_life, dates_1_base_date, max_date_index, scenarios_dic, wells_dic,
     projects_dic, forecasts_dic, forecast_datas_dic, forecast_datas_params_dic, forecast_other_phase, dates_data_list,
     log_report) = itemgetter('only_forecast', 'forecasts_id', 'dates_1_life', 'dates_1_base_date', 'max_date_index',
                              'scenarios_dic', 'wells_dic', 'projects_dic', 'forecasts_dic', 'forecast_datas_dic',
                              'forecast_datas_params_dic', 'forecast_other_phase', 'dates_data_list',
                              'log_report')(vars(aries_extract))

    preceeding_keywords = {'GAS', 'OIL', 'WTR'} if None else preceeding_keywords
    # forecast
    if keyword in ['GAS', 'OIL', 'WTR']:
        # test only - skip calculate deff currently, need to comment out
        # if ls_expression[-1] == 'X':
        #     return
        if keyword == 'WTR':
            keyword = 'WATER'

        if '#' in str(ls_expression[-1]):
            # list method
            ls_segment_obj, ls_param_dic = read_list_method_convert_to_segment_obj(ls_expression, start_date, qualifier,
                                                                                   propnum, keyword, scenario, section,
                                                                                   dates_1_life, max_date_index,
                                                                                   forecast_datas_params_dic,
                                                                                   aries_extract.get_default_format)

        else:
            # formula method
            ls_expression = add_spd_method_if_required(ls_expression)

            ls_expression = update_qstart_when_required(aries_extract, ls_expression, keyword, propnum, scenario,
                                                        qualifier, forecast_datas_params_dic)

            ls_segment_obj, ls_param_dic, use_nl = read_parameters_convert_to_segment_obj(
                aries_extract, ls_expression, start_date, qualifier, propnum, keyword, section, scenario,
                forecast_datas_params_dic, dates_1_base_date, dates_1_life, max_date_index, log_report)

            if use_nl and not only_forecast:
                update_based_on_nl(ls_segment_obj, propnum, scenario, dates_data_list, ls_scenarios_id, scenarios_dic,
                                   projects_dic, aries_extract.compare_and_save_into_self_data_list)

        process_segment_to_forecast_dict(keyword,
                                         propnum,
                                         keyword,
                                         scenario,
                                         qualifier,
                                         ls_param_dic,
                                         ls_segment_obj,
                                         ls_scenarios_id,
                                         forecasts_id,
                                         wells_dic,
                                         scenarios_dic,
                                         projects_dic,
                                         forecasts_dic,
                                         forecast_datas_dic,
                                         forecast_datas_params_dic,
                                         forecast_other_phase,
                                         aries_extract.get_default_format,
                                         ratio=False)

        if (f'{str(keyword).lower()}_rate_forecast' in check_rate_forecast_dict and not only_forecast):
            check_rate_forecast_dict[f'{str(keyword).lower()}_rate_forecast'] = True
        check_for_flat_segment_in_date_cut_off(ls_segment_obj, propnum, scenario, dates_data_list, ls_scenarios_id,
                                               scenarios_dic, projects_dic,
                                               aries_extract.compare_and_save_into_self_data_list)
    else:
        if section == EconHeaderEnum.forecast_section_key.value:
            log_report.log_error(aries_row=str_join(ls_expression),
                                 message=format_error_msg(ErrorMsgEnum.cc_error_msg.value, keyword),
                                 scenario=scenario,
                                 well=propnum,
                                 model=ErrorMsgEnum.forecast_stream.value,
                                 section=section,
                                 severity=ErrorMsgSeverityEnum.warn.value)


def update_qstart_when_required(aries_extract, ls_expression, keyword, propnum, scenario, qualifier,
                                forecast_datas_params_doc):
    forecast_datas_params_document = forecast_datas_params_doc.get((scenario, qualifier, propnum))
    if forecast_datas_params_document is not None:
        segments = forecast_datas_params_document['data'][keyword.lower()]['P_dict']['best']['segments']
    else:
        segments = []

    if ls_expression[0] == 'X' and len(segments) == 0 and aries_extract.segment_qend is not None:
        ls_expression[0] = aries_extract.segment_qend
    aries_extract.segment_qend = None

    return ls_expression


def process_segment_to_forecast_dict(
    keyword,
    propnum,
    phase,
    scenario,
    qualifier,
    ls_param_dic,
    ls_segment_obj,
    ls_scenarios_id,
    forecasts_id,
    wells_dic,
    scenarios_dic,
    projects_dic,
    forecasts_dic,
    forecast_datas_dic,
    forecast_datas_params_dic,
    forecast_other_phase,
    get_default_format,
    ratio=False,
):
    for param_dic in ls_param_dic:
        data_obj = get_data_obj()
        # get the saved the forecast_default_document_params
        # get forecast_data_param document from self.forecast_datas_params_dic, else add key
        try:
            forecast_datas_params_document = forecast_datas_params_dic[(scenario, qualifier, propnum)]
            forecast_datas_params_document['data'][phase.lower()]['P_dict']['best']['segments'].append(param_dic)
        except KeyError:
            # 1st time saving the forecast_default_document_params
            forecast_default_document_params = get_default_format('forecast-datas')
            # forecast_datas collection
            if phase.lower() in ['gas', 'oil', 'water']:
                data_obj[phase.lower()]['P_dict']['best']['segments'].append(param_dic)

            forecast_default_document_params['data'] = data_obj
            forecast_datas_params_dic[(scenario, qualifier, propnum)] = forecast_default_document_params

    # start processing the segment_obj (follow phdwins procedure)

    for segment_obj in ls_segment_obj:
        for _id in projects_dic:
            if ratio:
                ratio_forecast_formatting_process(scenario, qualifier, propnum, segment_obj, keyword, _id,
                                                  ls_scenarios_id, forecasts_id, forecasts_dic, forecast_datas_dic,
                                                  scenarios_dic, wells_dic, get_default_format)
            else:
                forecast_formatting_process(scenario, qualifier, propnum, segment_obj, keyword, _id, ls_scenarios_id,
                                            forecasts_id, scenarios_dic, wells_dic, get_default_format,
                                            forecast_other_phase, forecasts_dic, forecast_datas_dic)


PHASE_SEGMENT_OBJ = {"P_dict": {"best": {"segments": [], "diagnostics": {}}}, "p_extra": {"plot_idx": ""}}

cumulative_unit_dic = {
    UnitEnum.bbl.value: (ForecastEnum.well_oil_cum.value, 1),
    UnitEnum.mb.value: (ForecastEnum.well_oil_cum.value, 1000),
    UnitEnum.mmb.value: (ForecastEnum.well_oil_cum.value, 1000000),
    UnitEnum.mcf.value: (ForecastEnum.well_gas_cum.value, 1),
    UnitEnum.mmf.value: (ForecastEnum.well_gas_cum.value, 1000),
    UnitEnum.bcf.value: (ForecastEnum.well_gas_cum.value, 1000000),
    UnitEnum.imu.value: (None, 1000),
    UnitEnum.u.value: (None, 1),
    UnitEnum.mu.value: (None, 1000)
}
