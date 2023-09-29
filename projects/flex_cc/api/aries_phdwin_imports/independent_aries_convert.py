# deploy functions
import numpy as np
from copy import deepcopy
from api.aries_phdwin_imports.helpers import (
    flat_template,
    check_exp_inc_dec,
    common_template,
    arps_template,
)

from api.aries_phdwin_imports.aries_forecast_helpers.aries_forecast_conv_func import (handle_adx_log_ratio,
                                                                                      end_idx_limit_check,
                                                                                      get_d_eff_linear, get_k_linear,
                                                                                      get_k_qend, get_k_end_idx,
                                                                                      update_linear_segment)
from combocurve.utils.constants import DAYS_IN_YEAR
from combocurve.science.segment_models.shared.helper import exp_get_D, exp_D_2_D_eff


# aries conversion
# preds
def pred_hyp(qi, b, d, delta_t):
    return qi * np.power(1 + b * d * delta_t, -1 / b)


def pred_exp(qi, d, delta_t):
    return qi * np.exp(-d * delta_t)


# ints
def int_hyp(qi, b, d, delta_t):
    qe = pred_hyp(qi, b, d, delta_t + 1)
    return np.power(qi, b) / (1 - b) / d * (np.power(qi, 1 - b) - np.power(qe, 1 - b))


def int_flat(qi, delta_t):
    return qi * (delta_t + 1)


def int_exp(qi, d, delta_t):
    qe = pred_exp(qi, d, delta_t + 1)
    return (qi - qe) / d


# q_end_t_s
def qend_t_hyp(start_idx, qi, b, d, qend):
    return int(np.ceil((np.power(qi / qend, b) - 1) / b / d)) + start_idx - 1


def qend_t_exp(start_idx, qi, d, qend):
    if qend <= 0:
        qend = 0.01
    return int(np.ceil(np.log(qi / qend) / d)) + start_idx - 1


# imu_t_s
def imu_t_flat(start_idx, qi, imu):
    return int(np.ceil(imu / qi)) + start_idx - 1


def imu_t_hyp(start_idx, qi, b, d, imu):
    qe = np.power(np.power(qi, 1 - b) - (imu * (1 - b) * d / np.power(qi, b)), 1 / (1 - b))
    return qend_t_hyp(start_idx, qi, b, d, qe)


def max_imu_hyp(qi, b, d):
    return qi / ((1 - b) * d)


def imu_t_exp(start_idx, qi, d, imu):
    qe = qi - imu * d
    return qend_t_exp(start_idx, qi, d, qe)


def max_imu_exp(qi, d):
    return qi / d


# dm_t_s
def dm_t_hyp(start_idx, b, d, d_target):
    return int(np.ceil((1 / d_target - 1 / d) / b)) + start_idx - 1


def convert_dm_to_nominal_dm(dm):
    if dm is not None:
        if dm > 0:
            use_dm = -np.log(1 - dm / 100) / DAYS_IN_YEAR
        else:
            use_dm = 0
    else:
        use_dm = 0
    return use_dm


###############
def hyp_d_s(document):
    b = document['b']
    d = document['nominal_deff']
    deff_sec = document['secant_deff']
    deff_tan = document['tangent_deff']
    dm = document['dm']
    if d is not None:
        use_d = d / 100 / DAYS_IN_YEAR
        use_deff_sec = 1 - np.power(1 + DAYS_IN_YEAR * b * d, -1 / b)
        ret_d = d
        ret_deff_sec = use_deff_sec * 100
        ret_deff_tan = (1 - np.exp(-use_d * DAYS_IN_YEAR)) * 100
        use_dm = convert_dm_to_nominal_dm(dm)
        # Converts nominal dm into nominal_dm (daily fraction value)
        # if dm is not None:
        #     if dm > 0:
        #         use_dm = dm / 100 / DAYS_IN_YEAR
        #     else:
        #         use_dm = 0
        # else:
        #     use_dm = 0
    elif deff_sec is not None:
        use_d = (np.power(1 - deff_sec / 100, -b) - 1) / DAYS_IN_YEAR / b
        use_deff_sec = deff_sec / 100
        ret_d = use_d * 100 * DAYS_IN_YEAR
        ret_deff_sec = deff_sec
        ret_deff_tan = (1 - np.exp(-use_d * DAYS_IN_YEAR)) * 100
        use_dm = convert_dm_to_nominal_dm(dm)
        # Converts secant dm into nominal_dm (daily fraction value)
        # if dm is not None:
        #     if dm > 0:
        #         use_dm = (np.power(1 - dm / 100, -b) - 1) / DAYS_IN_YEAR / b
        #     else:
        #         use_dm = 0
        # else:
        #     use_dm = 0
    elif deff_tan is not None:
        use_d = -np.log(1 - deff_tan / 100) / DAYS_IN_YEAR
        ret_d = use_d * 100 * DAYS_IN_YEAR
        use_deff_sec = 1 - np.power(1 + DAYS_IN_YEAR * b * use_d, -1 / b)
        ret_deff_sec = use_deff_sec * 100
        ret_deff_tan = deff_tan
        use_dm = convert_dm_to_nominal_dm(dm)
        # Converts tangent dm into nominal_dm (daily fraction value)
        # if dm is not None:
        #     if dm > 0:
        #         use_dm = -np.log(1 - dm / 100) / DAYS_IN_YEAR
        #     else:
        #         use_dm = 0
        # else:
        #     use_dm = 0

    use = {'D': use_d, 'D_eff': use_deff_sec, 'use_dm': use_dm}
    ret = {'nominal_deff': ret_d, 'secant_deff': ret_deff_sec, 'tangent_deff': ret_deff_tan}
    return ret, use


def exp_d_s(document):
    deff_sec = document['secant_deff']

    use_d = -np.log(1 - deff_sec / 100) / DAYS_IN_YEAR
    use_deff_sec = deff_sec / 100

    ret_d = use_d * 100 * DAYS_IN_YEAR
    ret_deff_sec = deff_sec
    ret_deff_tan = deff_sec
    use = {'D': use_d, 'D_eff': use_deff_sec}
    ret = {'nominal_deff': ret_d, 'secant_deff': ret_deff_sec, 'tangent_deff': ret_deff_tan}
    return ret, use


##############################
# flat
def flat_end_idx(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    end_idx = document['end_idx']
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    qend = qi
    imu = int_flat(qi, end_idx - start_idx)
    dm = 0

    ret_doc['b'] = 0
    ret_doc['secant_deff'] = 0
    ret_doc['tangent_deff'] = 0
    ret_doc['nominal_deff'] = 0
    ret_doc['qend'] = qend
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    #############
    this_segment = deepcopy(common_template)
    this_segment.update(flat_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['c'] = qi

    return ret_doc, this_segment


def flat_imu(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    imu = document['imu']

    qend = qi
    end_idx = imu_t_flat(start_idx, qi, imu)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    dm = 0

    ret_doc['b'] = 0
    ret_doc['secant_deff'] = 0
    ret_doc['tangent_deff'] = 0
    ret_doc['nominal_deff'] = 0
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['dm'] = dm
    ret_doc['imu'] = imu

    #############
    this_segment = deepcopy(common_template)
    this_segment.update(flat_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['c'] = qi

    return ret_doc, this_segment


def flat_ratio(document, expression, max_date_index):
    ret_doc = deepcopy(document)
    start_idx = document['start_idx']
    end_idx = document['end_idx']
    qi = document['qi']
    qend = document['qend']

    #############
    this_segment = deepcopy(common_template)
    this_segment.update(flat_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['c'] = qi

    return ret_doc, this_segment


flat = {'end_idx': flat_end_idx, 'imu': flat_imu, 'ratio': flat_ratio}
# hyp


def hyp_qend(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    b = document['b']
    qend = document['qend']

    ret_ds, use_ds = hyp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']

    end_idx = qend_t_hyp(start_idx, qi, b, d, qend)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    imu = int_hyp(qi, b, d, end_idx - start_idx)
    dm = 0
    calc_qend = pred_hyp(qi, b, d, end_idx - start_idx)
    ret_doc.update(ret_ds)
    ret_doc['qend'] = calc_qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment.update(arps_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = calc_qend  # q_end is not the same as given
    this_segment['b'] = b
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def hyp_end_idx(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    b = document['b']
    end_idx = document['end_idx']
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    ret_ds, use_ds = hyp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']

    qend = pred_hyp(qi, b, d, end_idx - start_idx)
    imu = int_hyp(qi, b, d, end_idx - start_idx)
    dm = 0

    ret_doc.update(ret_ds)
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment.update(arps_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['b'] = b
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def hyp_imu(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    b = document['b']
    imu = document['imu']

    ret_ds, use_ds = hyp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']
    end_idx = imu_t_hyp(start_idx, qi, b, d, imu)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    qend = pred_hyp(qi, b, d, end_idx - start_idx)
    dm = 0

    ret_doc.update(ret_ds)
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment.update(arps_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['b'] = b
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def hyp_dm(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    b = document['b']
    dm = document['dm']

    ret_ds, use_ds = hyp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']
    use_dm = use_ds['use_dm']

    end_idx = dm_t_hyp(start_idx, b, d, use_dm)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    qend = pred_hyp(qi, b, d, end_idx - start_idx)
    imu = int_hyp(qi, b, d, end_idx - start_idx)

    ret_doc.update(ret_ds)
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment.update(arps_template)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['b'] = b
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


hyp = {'qend': hyp_qend, 'end_idx': hyp_end_idx, 'imu': hyp_imu, 'dm': hyp_dm}

# exp


def exp_qend(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    qend = document['qend']

    ret_ds, use_ds = exp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']

    end_idx = qend_t_exp(start_idx, qi, d, qend)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    imu = int_exp(qi, d, end_idx - start_idx)
    dm = 0

    ret_doc.update(ret_ds)
    calc_qend = pred_exp(qi, d, end_idx - start_idx)
    ret_doc['qend'] = calc_qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment = check_exp_inc_dec(d, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = calc_qend
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def exp_end_idx(document, max_date_idx):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    end_idx = document['end_idx']

    ret_ds, use_ds = exp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']

    qend = pred_exp(qi, d, end_idx - start_idx)
    imu = int_exp(qi, d, end_idx - start_idx)
    dm = 0

    ret_doc.update(ret_ds)
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment = check_exp_inc_dec(d, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def exp_imu(document, max_date_index):
    ret_doc = deepcopy(document)

    start_idx = document['start_idx']
    qi = document['qi']
    imu = document['imu']
    qend_set = document['qend']
    if qend_set is not None:
        document['secant_deff'] = exp_D_2_D_eff((qi - qend_set) / imu) * 100

    ret_ds, use_ds = exp_d_s(document)

    d = use_ds['D']
    d_eff = use_ds['D_eff']
    end_idx = imu_t_exp(start_idx, qi, d, imu)
    end_idx = end_idx_limit_check(end_idx, max_date_index)
    qend = pred_exp(qi, d, end_idx - start_idx)

    dm = 0

    ret_doc.update(ret_ds)
    ret_doc['qend'] = qend
    ret_doc['end_idx'] = end_idx
    ret_doc['imu'] = imu
    ret_doc['dm'] = dm

    ###################
    this_segment = deepcopy(common_template)
    this_segment = check_exp_inc_dec(d, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = qi
    this_segment['q_end'] = qend
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def ratio_exp_logx(document, expression, max_date_index):
    ret_doc = deepcopy(document)
    start_idx = document['start_idx']
    end_idx = document['end_idx']
    q_start = document['qi']
    q_end = document['qend']
    d = exp_get_D(start_idx, q_start, end_idx, q_end)
    d_eff = exp_D_2_D_eff(d)
    q_end, end_idx = handle_adx_log_ratio(q_start, q_end, d, ret_doc, expression, start_idx, end_idx, max_date_index,
                                          pred_exp)

    this_segment = deepcopy(common_template)
    this_segment = check_exp_inc_dec(d, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = q_start
    this_segment['q_end'] = q_end
    this_segment['D_eff'] = d_eff
    this_segment['D'] = d
    return ret_doc, this_segment


def linear_ratio(document, expression, max_date_index):
    ret_doc = deepcopy(document)
    start_idx = document['start_idx']
    end_idx = document['end_idx']
    q_start = document['qi']
    q_end = document['qend']
    k = get_k_linear(start_idx, q_start, end_idx, q_end)
    d_eff = get_d_eff_linear(k, q_start)
    this_segment = deepcopy(common_template)
    update_linear_segment(d_eff, this_segment)

    # currently not going to handle
    # q_end, end_idx = handle_adx_linear_ratio(q_start, q_end, k, ret_doc, expression, start_idx,
    # end_idx, max_date_index)

    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = q_start
    this_segment['q_end'] = q_end
    this_segment['D_eff'] = d_eff
    this_segment['k'] = k

    return ret_doc, this_segment


def linear_qend(document, max_date_index):
    ret_doc = deepcopy(document)
    q_end = document['qend']
    q_start = document['qi']
    start_idx = document['start_idx']
    d_eff = document['linear_deff'] / 100
    k, end_idx = get_k_end_idx(document, max_date_index)
    this_segment = deepcopy(common_template)
    update_linear_segment(d_eff, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = q_start
    this_segment['q_end'] = q_end
    this_segment['D_eff'] = d_eff
    this_segment['k'] = k

    return ret_doc, this_segment


def linear_end_idx(document, max_date_index):
    ret_doc = deepcopy(document)
    q_start = document['qi']
    start_idx = document['start_idx']
    end_idx = document['end_idx']
    d_eff = document['linear_deff'] / 100
    k, q_end = get_k_qend(document, max_date_index)
    this_segment = deepcopy(common_template)
    update_linear_segment(d_eff, this_segment)
    this_segment['start_idx'] = start_idx
    this_segment['end_idx'] = end_idx
    this_segment['q_start'] = q_start
    this_segment['q_end'] = q_end
    this_segment['D_eff'] = d_eff
    this_segment['k'] = k

    return ret_doc, this_segment


exp = {'qend': exp_qend, 'end_idx': exp_end_idx, 'imu': exp_imu}

linear = {'qend': linear_qend, 'end_idx': linear_end_idx, 'ratio': linear_ratio}

log = {'ratio': ratio_exp_logx}

aries_convert = {'exp': exp, 'flat': flat, 'hyp': hyp, 'log': log, 'lin': linear}
