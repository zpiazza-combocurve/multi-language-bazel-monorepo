"""
Created on Tue Apr 30 18:24:14 2019

@author: scofi
"""

## deploy functions
import datetime
import numpy as np
from copy import deepcopy
from combocurve.shared.date import days_from_1900
from api.aries_phdwin_imports.helpers import (templates, check_exp_inc_dec, check_arps_modified_segment)
from combocurve.shared.aries_import_enums import ForecastEnum
from combocurve.shared.phdwin_import_constants import PhdHeaderCols

from combocurve.utils.constants import DAYS_IN_YEAR, DAYS_IN_MONTH
from combocurve.science.segment_models.shared.helper import (exp_get_D, exp_D_2_D_eff, arps_sw, arps_get_D_delta,
                                                             arps_get_idx_from_D_new, exp_D_eff_2_D)

NEAR_ZERO_RATIO_VALUE = 0.0001


### phdwin conversion
def convert_exp_inc(document, this_ret):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    deff_phd = document['deff']
    d = -np.log(1 - deff_phd / 100) / DAYS_IN_YEAR
    q_start = document['qi']

    this_ret['D'] = d
    this_ret['D_eff'] = deff_phd / 100
    this_ret['start_idx'] = start_idx
    this_ret['end_idx'] = end_idx
    this_ret['q_start'] = q_start
    this_ret['q_end'] = q_start * np.exp(-d * (end_idx - start_idx))
    return this_ret


def convert_exp_dec(document, this_ret):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    deff_phd = document['deff']
    d = -np.log(1 - deff_phd / 100) / DAYS_IN_YEAR
    q_start = document['qi']

    this_ret['D'] = d
    this_ret['D_eff'] = deff_phd / 100
    this_ret['start_idx'] = start_idx
    this_ret['end_idx'] = end_idx
    this_ret['q_start'] = q_start
    this_ret['q_end'] = q_start * np.exp(-d * (end_idx - start_idx))
    return this_ret


def convert_arps(document, this_ret):
    start_date = datetime.date(document[PhdHeaderCols.start_year.name], document[PhdHeaderCols.start_month.name],
                               document[PhdHeaderCols.start_day.name])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document[PhdHeaderCols.end_year.name], document[PhdHeaderCols.end_month.name],
                             document[PhdHeaderCols.end_day.name])
    end_idx = days_from_1900(end_date)
    deff_phd = document[ForecastEnum.deff_phd.value]
    b = document[ForecastEnum.b.value]
    d = -np.log(1 - deff_phd / 100) / DAYS_IN_YEAR
    value = (DAYS_IN_YEAR * b * d) + 1
    if value < 0:
        deff_inpt = 1 - -np.power(abs(value), -1 / b)
    else:
        deff_inpt = 1 - np.power(value, -1 / b)
    q_start = document[ForecastEnum.qi.value]
    this_ret[ForecastEnum.b.value] = b
    this_ret[ForecastEnum.d_eff.value] = deff_inpt
    if d < 0:
        del this_ret[ForecastEnum.b.value]
        this_ret[ForecastEnum.slope.value] = 1
        this_ret[ForecastEnum.d_eff.value] = deff_phd / 100
        this_ret[ForecastEnum.name.value] = ForecastEnum.exp_inc.value
    this_ret[ForecastEnum.d.value] = d
    this_ret[ForecastEnum.start_index.value] = start_idx
    this_ret[ForecastEnum.end_index.value] = end_idx
    this_ret[ForecastEnum.q_start.value] = q_start
    this_ret[ForecastEnum.q_end.value] = q_start * np.power(1 + b * d * (end_idx - start_idx), -1 / b)
    return this_ret


def convert_arps_modified(document, this_ret):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    end_life_idx = end_idx
    this_ret['start_idx'] = start_idx
    this_ret['end_idx'] = end_idx
    deff_phd = np.abs(document['deff'])
    b = document['b']
    d = -np.log(1 - np.abs(deff_phd / 100)) / DAYS_IN_YEAR
    value = DAYS_IN_YEAR * b * d + 1
    if value < 0:
        deff_inpt = 1 - -np.power(abs(value), -1 / b)
    else:
        deff_inpt = 1 - np.power(value, -1 / b)
    q_start = document['qi']
    d_lim_eff = np.abs(document['dm'] / 100)

    # d_lim = -np.log(1 - np.abs(document['dm'] / 100)) / DAYS_IN_YEAR
    # value = DAYS_IN_YEAR * b * d_lim + 1
    # if value < 0:
    #     d_lim_eff = 1 - -np.power(abs(value), -1 / b)
    # else:
    #     d_lim_eff = 1 - np.power(value, -1 / b)

    ##### arps part
    this_ret['b'] = b
    this_ret['D'] = d
    this_ret['D_eff'] = deff_inpt
    this_ret['q_start'] = q_start

    f_arps = lambda t, t0, fq, fb, fD: fq * np.power(1 + fb * fD * (t - t0), -1 / fb)  # noqa: E731

    #### exp part
    idx_sw, realized_d_eff_sw, d_exp, d_exp_eff = arps_sw(q_start, b, d, d_lim_eff, start_idx, start_idx - 10,
                                                          end_life_idx, True)  # noqa: E731
    q_sw = f_arps(idx_sw, start_idx, q_start, b, d)

    f_exp = lambda t, t_sw, q_exp, D_exp: q_exp * np.exp(-D_exp * (t - t_sw))  # noqa: E731
    this_ret['q_sw'] = q_sw
    this_ret['sw_idx'] = idx_sw
    this_ret['D_exp'] = d_exp
    this_ret['realized_D_eff_sw'] = realized_d_eff_sw
    this_ret['target_D_eff_sw'] = d_lim_eff
    this_ret['D_exp_eff'] = d_exp_eff
    if idx_sw < end_life_idx:
        q_end = f_exp(end_life_idx, idx_sw, q_sw, d_exp)
    else:
        q_end = f_arps(end_life_idx, start_idx, q_start, b, d)

    this_ret['q_end'] = q_end

    this_ret = check_arps_modified_segment(this_ret)

    return this_ret


def convert_flat(document, this_ret):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    this_ret['start_idx'] = start_idx
    this_ret['end_idx'] = end_idx
    this_ret['q_start'] = document['qi']
    this_ret['q_end'] = document['qi']
    this_ret['c'] = document['qi']
    return this_ret


def ratio(document, this_ret):
    start_date = datetime.date(document[PhdHeaderCols.start_year.name], document[PhdHeaderCols.start_month.name],
                               document[PhdHeaderCols.start_day.name])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document[PhdHeaderCols.end_year.name], document[PhdHeaderCols.end_month.name],
                             document[PhdHeaderCols.end_day.name])
    end_idx = days_from_1900(end_date)
    qi = document.get(ForecastEnum.qi.value)
    qend = document.get(ForecastEnum.qend.value)
    if document['typecurve'] == 6 or (qi == qend):
        if document['typecurve'] == 6:
            value = document.get('ratio_value')
        else:
            value = qi

        if value is not None:
            this_ret[ForecastEnum.name.value] = 'flat'
            this_ret[ForecastEnum.name.value] += '_' + ForecastEnum.ratio.value
            this_ret[ForecastEnum.start_index.value] = start_idx
            this_ret[ForecastEnum.end_index.value] = end_idx
            this_ret[ForecastEnum.q_start.value] = value
            this_ret[ForecastEnum.q_end.value] = value
            this_ret[ForecastEnum.slope.value] = 0
            this_ret[ForecastEnum.c.value] = value
    else:
        qi = NEAR_ZERO_RATIO_VALUE if qi == 0 else qi
        qend = NEAR_ZERO_RATIO_VALUE if qend == 0 else qend
        # multiplier = get_multiplier_phdwin_ratio(document)
        multiplier = 1
        d = exp_get_D(start_idx, (qi * DAYS_IN_MONTH) * multiplier, end_idx, qend * multiplier)
        d_eff = exp_D_2_D_eff(d)
        this_ret = check_exp_inc_dec(d, this_ret)
        this_ret[ForecastEnum.name.value] += '_' + ForecastEnum.ratio.value
        this_ret[ForecastEnum.start_index.value] = start_idx
        this_ret[ForecastEnum.end_index.value] = end_idx
        this_ret[ForecastEnum.q_start.value] = (qi * DAYS_IN_MONTH) * multiplier
        this_ret[ForecastEnum.q_end.value] = qend * multiplier
        this_ret[ForecastEnum.d_eff.value] = d_eff
        this_ret[ForecastEnum.d.value] = d
    return this_ret


def get_phdwin_arps_mod_parameters(start_idx, qi, b, d, d_lim_eff, initial=False):

    d_lim = exp_D_eff_2_D(d_lim_eff)
    d_last = arps_get_D_delta(d, b, 0)

    if d_last > d_lim:
        sw_idx = arps_get_idx_from_D_new(start_idx, d, d_lim, b)
    else:
        sw_idx = start_idx
        return False, None, None, None

    d_sw = arps_get_D_delta(d, b, sw_idx - start_idx)

    q_sw = get_arps_mod_flow_rate(sw_idx, start_idx, qi, b, d, initial=initial)

    return True, q_sw, d_sw, sw_idx


def get_arps_mod_flow_rate(t, t0, fq, fb, fd, initial=False):
    if initial:
        return fq / np.power(1 + fb * fd * (t - t0), -1 / fb)
    else:
        return fq * np.power(1 + fb * fd * (t - t0), -1 / fb)


def convert_deff_to_d(deff):
    return -np.log(1 - deff) / DAYS_IN_YEAR


convert_s = {
    ForecastEnum.exp_inc.value: convert_exp_inc,
    ForecastEnum.exp_dec.value: convert_exp_dec,
    ForecastEnum.arps.value: convert_arps,
    ForecastEnum.arps_modified.value: convert_arps_modified,
    ForecastEnum.flat.value: convert_flat,
    ForecastEnum.ratio.value: ratio,
}


class PhdwinConvert:
    def __init__(self):
        self.convert_s = convert_s
        self.templates = templates

    def get_template(self, name):
        com_dict = deepcopy(self.templates['common'])
        name_dict = deepcopy(self.templates[name])
        com_dict.update(name_dict)
        return com_dict

    def t1(self, raw_document):
        ret_doc = deepcopy(raw_document)
        ret_doc[PhdHeaderCols.start_year.name] = int(ret_doc[PhdHeaderCols.start_year.name])
        ret_doc[PhdHeaderCols.start_month.name] = int(ret_doc[PhdHeaderCols.start_month.name])
        ret_doc[PhdHeaderCols.start_day.name] = int(ret_doc[PhdHeaderCols.start_day.name])
        ret_doc[PhdHeaderCols.end_year.name] = int(ret_doc[PhdHeaderCols.end_year.name])
        ret_doc[PhdHeaderCols.end_month.name] = int(ret_doc[PhdHeaderCols.end_month.name])
        ret_doc[PhdHeaderCols.end_day.name] = int(ret_doc[PhdHeaderCols.end_day.name])
        ret_doc[ForecastEnum.qi.value] = float(ret_doc[ForecastEnum.qi.value]) / DAYS_IN_MONTH
        # ret_doc['qend'] = ret_doc['qend']/days_in_month
        return ret_doc

    def convert(self, segname, document):
        if document[ForecastEnum.deff_phd.value] == 100:
            document[ForecastEnum.deff_phd.value] = 99.999
        clean_doc = self.t1(document)
        this_ret = self.get_template(segname)
        ret = self.convert_s[segname](clean_doc, this_ret)
        return ret
