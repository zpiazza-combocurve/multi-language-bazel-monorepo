import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (arps_get_D, arps_modified_get_t_end_from_q_end, pred_arps,
                                                             pred_arps_modified, pred_exp, arps_D_eff_2_D,
                                                             arps_D_2_D_eff, exp_D_2_D_eff, exp_D_eff_2_D, exp_get_D,
                                                             exp_get_t_end_from_q_end, arps_get_t_end_from_q_end,
                                                             arps_sw)
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN, DAYS_IN_YEAR

multi_seg = MultipleSegments()


def get_exp_inc_seg(t0, t_peak, q0, D0, D0_eff):
    exp_seg = multi_seg.get_segment_template('exp_inc')
    exp_seg['start_idx'] = t0
    exp_seg['end_idx'] = t_peak - 1
    exp_seg['q_start'] = q0
    exp_seg['q_end'] = pred_exp(exp_seg['end_idx'], t0, q0, D0)
    exp_seg['D'] = D0
    exp_seg['D_eff'] = D0_eff
    return exp_seg


def get_arps_inc_seg(t0, t_peak, q0, b0, D0, D0_eff):
    arps_inc_seg = multi_seg.get_segment_template('arps_inc')
    arps_inc_seg['start_idx'] = t0
    arps_inc_seg['end_idx'] = t_peak - 1
    arps_inc_seg['q_start'] = q0
    arps_inc_seg['q_end'] = pred_arps(arps_inc_seg['end_idx'], t0, q0, D0, b0)
    arps_inc_seg['D'] = D0
    arps_inc_seg['D_eff'] = D0_eff
    arps_inc_seg['b'] = b0
    return arps_inc_seg


def segment_arps_4_paras2seg(start_idx,
                             t_end_life,
                             q_final,
                             D_lim_eff,
                             end_data_idx,
                             life_idx,
                             enforce_sw,
                             t0,
                             q0,
                             t_peak,
                             q_peak,
                             D1_eff,
                             b1,
                             t1_end,
                             D2,
                             b2,
                             t2_start,
                             q2_start,
                             b0=None,
                             isExp=True):
    '''
    Create the segment objects for either Exp. Incline + Arps + M. Arps models
                                   or     Arps Incline + Arps + M. Arps models.
    The various indices and their locations on the decline curve are below:

           |\    |    |     |                                                          # noqa: W605
          /| \__ |    |     |                                                          # noqa: W605
         / |    \o____|     |                                                          # noqa: W605
        /  |     |    ∆_____|
        -----------------------------
        ^  ^     ^    ^     ^
        |  |     |    |     └ t_final or life_idx (depends on whether cutoff by well life or target q)
        |  |     |    └ sw_idx
        |  |     └ t2_start
        |  └ t_peak
        └ t0

        Parameters:
            start_idx:    The first index (usually 0 for a TC)
            t_end_life:   The final `t` value, as determined by the user-specified Well Life
            q_final:      User-specified cutoff value for `q`
            D_lim_eff
            end_data_idx: Index for final data point
            life_idx:     Max of `end_data_idx` and `t_end_life`
            enforce_sw
            t0:           Start of first segment
            q0:           Initial rate
            t_peak:       `t` value at the data peak
            q_peak:       `q(t_peak)`, peak rate
            D1_eff:       Effective `D` value for the Arps segment
            b1:           `b` value for the Arps segment
            t1_end:       End index for the Arps segment
            D2:           `D` value for the M. Arps segment
            b2:           `b` value for the M. Arps segment
            t2_start:     Start index for the M. Arps segment
            q2_start:     Initial rate for the M. Arps segment
    '''
    if isExp:
        D0 = exp_get_D(t0, q0, t_peak, q_peak)
        D0_eff = exp_D_2_D_eff(D0)
    else:
        D0_MAX = -1.0 / b0 / DAYS_IN_YEAR - 1.0e-5
        D0 = arps_get_D(t0, q0, t_peak, q_peak, b0)
        D0 = min(D0, D0_MAX)
        if abs(D0) < 1.0e-5:
            D0 = -1.0e-5
        D0_eff = arps_D_2_D_eff(D0, b0)

    adjusted_D0_eff = False
    # Ensure that the decline for the exponential portion doesn't shoot off to infinity

    if D0_eff > D_EFF_MAX:
        D0_eff = D_EFF_MAX
        adjusted_D0_eff = True
    elif D0_eff < D_EFF_MIN:
        D0_eff = D_EFF_MIN
        adjusted_D0_eff = True

    # Recalculate the D0 and q0 if new effective decline rate.
    if adjusted_D0_eff:
        # We *could* recalculate these regardless, but I'd rather not in case there are numerical precision issues.
        if isExp:
            D0 = exp_D_eff_2_D(D0_eff)
            q0 = pred_exp(t0, t_peak, q_peak, D0)
        else:
            D0 = arps_D_eff_2_D(D0_eff, b0)
            q0 = pred_arps(t0, t_peak, q_peak, D0, b0)

    D1 = arps_D_eff_2_D(D1_eff, b1)

    D2_eff = arps_D_2_D_eff(D2, b2)

    ###########################################

    ret = []
    #################################################
    # Empty segment before the Exp. Incline/Buildup #
    #################################################

    if t0 > start_idx:
        empty_seg = multi_seg.get_segment_template('empty')
        empty_seg['start_idx'] = start_idx
        empty_seg['end_idx'] = t0 - 1
        empty_seg['q_start'] = -1
        empty_seg['q_end'] = -1
        ret += [empty_seg]

    ###########################################
    # Create the Arps or Exp. Incline/Buildup segment #
    ###########################################
    if t_peak > t0:
        if isExp:
            ret += [get_exp_inc_seg(t0, t_peak, q0, D0, D0_eff)]
        else:
            ret += [get_arps_inc_seg(t0, t_peak, q0, b0, D0, D0_eff)]

    ##########################
    # Create an Arps Segment #
    ##########################

    # First check if we should at least have an Arps segment larger than a single day
    #  Conditions for Arps:
    #   - `t_peak` is less than the `t` cutoff
    #       AND
    #   - `q_peak` is greater than the `q` cutoff
    if (t_peak < t_end_life) and (q_peak > q_final):
        t1_end = np.min([t_end_life, t1_end, int(arps_get_t_end_from_q_end(t_peak, q_peak, D1, b1, q_final))])
        q1_end = pred_arps(t1_end, t_peak, q_peak, D1, b1)

        arps_seg = multi_seg.get_segment_template('arps')
        arps_seg['start_idx'] = t_peak
        arps_seg['end_idx'] = t1_end
        arps_seg['q_start'] = q_peak
        arps_seg['D'] = D1
        arps_seg['D_eff'] = D1_eff
        arps_seg['q_end'] = q1_end
        arps_seg['b'] = b1

        ret += [arps_seg]
    # The peak values don't meet the cutoff criteria, so just add a single-day Arps segment
    else:
        t1_end = t_peak
        q1_end = q_peak

        arps_seg = multi_seg.get_segment_template('arps')
        arps_seg['start_idx'] = t_peak
        arps_seg['end_idx'] = t1_end
        arps_seg['q_start'] = q_peak
        arps_seg['D'] = D1
        arps_seg['D_eff'] = D1_eff
        arps_seg['q_end'] = q1_end
        arps_seg['b'] = b1

        ret += [arps_seg]

    #############################
    # Create an M. Arps Segment #
    #############################

    # Check if we are doing Arps or (Arps + M.Arps)
    #  Conditions for (Arps + M. Arps):
    #   - M. Arps segment `t_start` is less than the `t` cutoff
    #       AND
    #   - M. Arps segment `q_start` is greater than the `q` cutoff
    #       AND
    #   - Arps segment wasn't artificially shortened to a single day
    t2_start = t1_end + 1
    q2_start = pred_arps(t2_start, t1_end, q1_end, D1, b1)
    sw_idx, realized_D_eff_sw, D_exp, D_exp_eff = arps_sw(q2_start, b2, D2, D_lim_eff, t2_start, end_data_idx, life_idx,
                                                          enforce_sw)
    q_sw = pred_arps(sw_idx, t2_start, q2_start, D2, b2)
    if (t2_start < t_end_life) and (q2_start > q_final) and ((t_peak < t_end_life) and (q_peak > q_final)):
        t2_end = np.min(
            [t_end_life,
             int(arps_modified_get_t_end_from_q_end(t2_start, q2_start, D2, b2, sw_idx, D_exp, q_final))])
        q2_end = pred_arps_modified(t2_end, t2_start, sw_idx, q2_start, q_sw, D2, b2, D_exp)

        arps_modify_seg = multi_seg.get_segment_template('arps_modified')
        arps_modify_seg['start_idx'] = t2_start
        arps_modify_seg['end_idx'] = t2_end
        arps_modify_seg['q_start'] = q2_start
        arps_modify_seg['D'] = D2
        arps_modify_seg['D_eff'] = D2_eff
        arps_modify_seg['q_end'] = q2_end
        arps_modify_seg['b'] = b2
        arps_modify_seg['target_D_eff_sw'] = D_lim_eff
        arps_modify_seg['realized_D_eff_sw'] = realized_D_eff_sw
        arps_modify_seg['sw_idx'] = sw_idx
        arps_modify_seg['q_sw'] = q_sw
        arps_modify_seg['D_exp_eff'] = D_exp_eff
        arps_modify_seg['D_exp'] = D_exp

        ret += [arps_modify_seg]
    # The prior Arps segment was sufficient to meet the cutoff criteria, so add a single-day m.arps
    else:
        t2_sw = t2_start
        t2_end = t2_sw
        q2_sw = q2_start
        q2_end = q2_start

        arps_modify_seg = multi_seg.get_segment_template('arps_modified')
        arps_modify_seg['start_idx'] = t2_start
        arps_modify_seg['end_idx'] = t2_end
        arps_modify_seg['q_start'] = q2_start
        arps_modify_seg['D'] = D2
        arps_modify_seg['D_eff'] = D2_eff
        arps_modify_seg['q_end'] = q2_end
        arps_modify_seg['b'] = b2
        arps_modify_seg['target_D_eff_sw'] = D_lim_eff
        arps_modify_seg['realized_D_eff_sw'] = realized_D_eff_sw
        arps_modify_seg['sw_idx'] = t2_sw
        arps_modify_seg['q_sw'] = q2_sw
        arps_modify_seg['D_exp_eff'] = D_exp_eff
        arps_modify_seg['D_exp'] = D_exp

        ret += [arps_modify_seg]

    return ret


def arps_modified_para2seg(end_data_idx, t_end_life, q_final, D_lim_eff, enforce_sw, D, b, t_peak, q_peak):
    D_eff = arps_D_2_D_eff(D, b)
    life_idx = np.max([end_data_idx, t_end_life])
    sw_idx, realized_D_eff_sw, D_exp, D_exp_eff = arps_sw(q_peak, b, D, D_lim_eff, t_peak, end_data_idx, life_idx,
                                                          enforce_sw)

    q_sw = pred_arps(sw_idx, t_peak, q_peak, D, b)
    q_end_data = pred_arps(end_data_idx, t_peak, q_peak, D, b)

    if q_final >= q_end_data:
        t_final = end_data_idx
    else:
        if q_final >= q_sw:
            t_final = int(np.floor(arps_get_t_end_from_q_end(t_peak, q_peak, D, b, q_final)))
        else:
            t_final = int(np.floor(exp_get_t_end_from_q_end(sw_idx, q_sw, D_exp, q_final)))

    t_shut = np.min([t_end_life, t_final])
    t_shut = np.max([t_shut, t_peak])  ## make sure this segment end is at least segment start
    if t_shut > sw_idx:
        q_end = pred_exp(t_shut, sw_idx, q_sw, D_exp)
    else:
        q_end = pred_arps(t_shut, t_peak, q_peak, D, b)
    ###############
    arps_modify_seg = multi_seg.get_segment_template('arps_modified')
    arps_modify_seg['start_idx'] = t_peak
    arps_modify_seg['end_idx'] = t_shut
    arps_modify_seg['q_start'] = q_peak
    arps_modify_seg['D'] = D
    arps_modify_seg['D_eff'] = D_eff
    arps_modify_seg['b'] = b
    arps_modify_seg['target_D_eff_sw'] = D_lim_eff
    arps_modify_seg['realized_D_eff_sw'] = realized_D_eff_sw
    arps_modify_seg['sw_idx'] = sw_idx
    arps_modify_seg['q_sw'] = q_sw
    arps_modify_seg['D_exp_eff'] = D_exp_eff
    arps_modify_seg['D_exp'] = D_exp
    arps_modify_seg['q_end'] = q_end

    return [arps_modify_seg]


def arps_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak):
    D_eff = arps_D_2_D_eff(D, b)
    q_end_data = pred_arps(t_end_data, t_peak, q_peak, D, b)

    if q_final >= q_end_data:
        t_final = t_end_data
    else:
        t_final = int(np.floor(arps_get_t_end_from_q_end(t_peak, q_peak, D, b, q_final)))

    t_shut = np.min([t_final, t_end_life])
    t_shut = np.max([t_shut, t_peak])  ## make sure this segment end is at least segment start
    q_shut = pred_arps(t_shut, t_peak, q_peak, D, b)
    ret = []
    #### arps segment
    arps_seg = multi_seg.get_segment_template('arps')
    arps_seg['start_idx'] = t_peak
    arps_seg['end_idx'] = t_shut
    arps_seg['q_start'] = q_peak
    arps_seg['D'] = D
    arps_seg['D_eff'] = D_eff
    arps_seg['q_end'] = q_shut
    arps_seg['b'] = b

    ret += [arps_seg]
    return ret


def arps_inc_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak):

    if t_end_data < t_peak:
        t_end_data = t_end_life

    D_eff = arps_D_2_D_eff(D, b)
    q_end_data = pred_arps(t_end_data, t_peak, q_peak, D, b)

    if q_final <= q_end_data:
        t_final = t_end_data
    else:
        t_final = int(np.floor(arps_get_t_end_from_q_end(t_peak, q_peak, D, b, q_final)))

    t_shut = np.min([t_final, t_end_life])
    t_shut = np.max([t_shut, t_peak])  ## make sure this segment end is at least segment start
    q_shut = pred_arps(t_shut, t_peak, q_peak, D, b)
    ret = []
    #### arps segment
    arps_seg = multi_seg.get_segment_template('arps_inc')
    arps_seg['start_idx'] = t_peak
    arps_seg['end_idx'] = t_shut
    arps_seg['q_start'] = q_peak
    arps_seg['D'] = D
    arps_seg['D_eff'] = D_eff
    arps_seg['q_end'] = q_shut
    arps_seg['b'] = b

    ret += [arps_seg]
    return ret


def arps_inc_ratio_para_2_seg(t_end_life, t_end_data, q_final, D, b, t_peak, q_peak):

    D_eff = arps_D_2_D_eff(D, b)

    t_shut = np.max([t_end_life, t_peak])  ## make sure this segment end is at least segment start
    q_shut = pred_arps(t_shut, t_peak, q_peak, D, b)
    ret = []
    #### arps segment
    arps_seg = multi_seg.get_segment_template('arps_inc')
    arps_seg['start_idx'] = t_peak
    arps_seg['end_idx'] = t_shut
    arps_seg['q_start'] = q_peak
    arps_seg['D'] = D
    arps_seg['D_eff'] = D_eff
    arps_seg['q_end'] = q_shut
    arps_seg['b'] = b

    ret += [arps_seg]
    return ret


def exp_para_2_seg(t_end_life, t_end_data, q_final, D_eff, t_peak, q_peak):
    D = exp_D_eff_2_D(D_eff)
    #q_end_data = pred_exp(t_end_data, t_peak, q_peak, D)
    t_final = int(np.floor(exp_get_t_end_from_q_end(t_peak, q_peak, D, q_final)))
    t_shut = np.min([t_final, t_end_life])
    t_shut = np.max([t_end_data, t_shut])
    t_shut = np.max([t_shut, t_peak])  ## make sure this segment end is at least segment start_idx

    q_shut = pred_exp(t_shut, t_peak, q_peak, D)
    ret = []
    #### arps segment
    exp_seg = multi_seg.get_segment_template('exp_dec')
    exp_seg['start_idx'] = t_peak
    exp_seg['end_idx'] = t_shut
    exp_seg['q_start'] = q_peak
    exp_seg['D'] = D
    exp_seg['D_eff'] = D_eff
    exp_seg['q_end'] = q_shut

    ret += [exp_seg]

    return ret
