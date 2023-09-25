import numpy as np
from combocurve.science.segment_models.shared.helper import arps_get_D, pred_arps, pred_exp, exp_get_D


def det_pred_segment_arps_4(t, t0, q0, t_peak, q_peak, b1, D1, t_elf, b2, D2):
    ret_list = np.zeros(t.shape)
    range_0 = (t < t_peak)
    range_1 = (t >= t_peak) & (t < t_elf)
    range_2 = (t >= t_elf)
    if t_peak == t0:
        D0 = -1
    else:
        D0 = exp_get_D(t0, q0, t_peak, q_peak)

    ret_list[range_0] = pred_exp(t[range_0], t0, q0, D0)

    ret_list[range_1] = pred_arps(t[range_1], t_peak, q_peak, D1, b1)
    q2 = pred_arps(t_elf, t_peak, q_peak, D1, b1)
    ret_list[range_2] = pred_arps(t[range_2], t_elf, q2, D2, b2)
    return ret_list


def det_pred_segment_arps_inc_arps_4(t, t0, q0, b0, t_peak, q_peak, b1, D1, t_elf, b2, D2):
    ret_list = np.zeros(t.shape)
    range_0 = (t < t_peak)
    range_1 = (t >= t_peak) & (t < t_elf)
    range_2 = (t >= t_elf)
    if t_peak == t0:
        D0 = -1
    else:
        D0 = arps_get_D(t0, q0, t_peak, q_peak, b0)

    ret_list[range_0] = pred_arps(t[range_0], t0, q0, D0, b0)
    ret_list[range_1] = pred_arps(t[range_1], t_peak, q_peak, D1, b1)
    q2 = pred_arps(t_elf, t_peak, q_peak, D1, b1)
    ret_list[range_2] = pred_arps(t[range_2], t_elf, q2, D2, b2)
    return ret_list
