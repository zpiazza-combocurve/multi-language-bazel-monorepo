import numpy as np
import pandas as pd
from combocurve.science.segment_models.shared.helper import arps_D_eff_2_D
from combocurve.shared.constants import DAYS_IN_YEAR

RVG_paras = {'minimum_ratio': 0.1}
prob_dtype = np.float32


############################################ para_candidates prediction
def pred_exp_arps_wp_para_candidates(t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
    ###
    D = p_table[:, 1]
    b = p_table[:, 2]
    t_first = p_fixed_table[:, 0]
    minus_t0_t_first = p_fixed_table[:, 1]
    minus_t_peak_t0 = p_fixed_table[:, 2]
    q_peak = p_fixed_table[:, 3]
    t0 = t_first + minus_t0_t_first
    t_peak = t0 + minus_t_peak_t0

    ################
    t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
    ##############
    D_mat = np.concatenate([D.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    b_mat = np.concatenate([b.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    ###
    range_1 = (t_mat >= t_peak_mat)
    ###
    ret = np.zeros(t_mat.shape, dtype=prob_dtype)
    ###
    ret[range_1] = q_peak_mat[range_1] * np.power(
        1 + b_mat[range_1] * D_mat[range_1] * (t_mat[range_1] - t_peak_mat[range_1]), -1 / b_mat[range_1])
    return ret


def pred_arps_wp_para_candidates(t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
    D_eff = p_table[:, 0]
    b = p_table[:, 1]
    D = arps_D_eff_2_D(D_eff, b)
    t_first = p_fixed_table[:, 0]
    minus_t_peak_t_first = p_fixed_table[:, 1]
    q_peak = p_fixed_table[:, 2]
    t_peak = t_first + minus_t_peak_t_first
    #################
    t_mat = np.array([t] * p_table.shape[0], dtype=prob_dtype)
    ####
    D_mat = np.concatenate([D.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    b_mat = np.concatenate([b.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    t_peak_mat = np.concatenate([t_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    q_peak_mat = np.concatenate([q_peak.astype(prob_dtype).reshape(-1, 1)] * t_mat.shape[1], axis=1)
    ###
    range_1 = (t_mat >= t_peak_mat)
    ###
    ret = np.zeros(t_mat.shape, dtype=prob_dtype)
    ###
    ret[range_1] = q_peak_mat[range_1] * np.power(
        1 + b_mat[range_1] * D_mat[range_1] * (t_mat[range_1] - t_peak_mat[range_1]), -1 / b_mat[range_1])
    #        ret[ret<q_final] = 0
    return ret


################################################################################## RVG
def generate_flat_distribution(this_para_range, this_para, num):
    this_para_dif = this_para_range[1] - this_para_range[0]
    this_para_mid = (this_para_range[1] + this_para_range[0]) / 2
    if this_para < this_para_mid:
        use_this_para_range = [this_para_range[0], this_para_range[0] + 2 * (this_para - this_para_range[0])]
        if 2 * (this_para - this_para_range[0]) < this_para_dif * RVG_paras['minimum_ratio']:
            use_this_para_range = [this_para_range[0], this_para_range[0] + RVG_paras['minimum_ratio'] * this_para_dif]
    else:
        use_this_para_range = [this_para_range[1] - 2 * (this_para_range[1] - this_para), this_para_range[1]]
        if 2 * (this_para_range[1] - this_para) < this_para_dif * RVG_paras['minimum_ratio']:
            use_this_para_range = [this_para_range[1] - RVG_paras['minimum_ratio'] * this_para_dif, this_para_range[1]]

    this_para_paras = np.random.rand(num) * (use_this_para_range[1] - use_this_para_range[0]) + use_this_para_range[0]

    return this_para_paras


def generate_edge_heavy_flat_distribution(this_para_range, this_para, num):
    this_para_dif = this_para_range[1] - this_para_range[0]
    this_para_mid = (this_para_range[1] + this_para_range[0]) / 2
    if this_para < this_para_mid:
        use_this_para_range = [this_para_range[0], this_para_range[0] + 2 * (this_para - this_para_range[0])]
        if 2 * (this_para - this_para_range[0]) < this_para_dif * RVG_paras['minimum_ratio']:
            use_this_para_range = [this_para_range[0], this_para_range[0] + RVG_paras['minimum_ratio'] * this_para_dif]
    else:
        use_this_para_range = [this_para_range[1] - 2 * (this_para_range[1] - this_para), this_para_range[1]]
        if 2 * (this_para_range[1] - this_para) < this_para_dif * RVG_paras['minimum_ratio']:
            use_this_para_range = [this_para_range[1] - RVG_paras['minimum_ratio'] * this_para_dif, this_para_range[1]]

    seg = 10
    seg_dif = (use_this_para_range[1] - use_this_para_range[0]) / 10
    frac = 10 + 2
    sample_num = int(num / frac)
    rem_num = num - sample_num * frac
    ret = []
    for i in range(seg):
        if i == 0 or i == seg - 1:
            this_num = 2 * sample_num
        else:
            this_num = sample_num
        this_range = [use_this_para_range[0] + i * seg_dif, use_this_para_range[0] + (i + 1) * seg_dif]
        ret += [np.random.rand(this_num) * (this_range[1] - this_range[0]) + this_range[0]]

    ret += [np.random.rand(rem_num) * (use_this_para_range[1] - use_this_para_range[0]) + use_this_para_range[0]]
    ret = np.concatenate(ret)
    return ret


def one_seg_arps_para_candidates(prob_para, D_eff, b, para_dict, sample_num):
    ret_dict = {}
    for v in prob_para:
        if v == 'D_eff':
            D_eff_paras = generate_edge_heavy_flat_distribution(para_dict['D_eff'], D_eff, sample_num)
            ret_dict['D_eff'] = D_eff_paras
        elif v == 'b':
            ret_dict['b'] = generate_edge_heavy_flat_distribution(para_dict['b'], b, sample_num)

    if ('D_eff' in prob_para) and ('b' in prob_para):
        ret_dict['D'] = (np.power(1 - ret_dict['D_eff'], -ret_dict['b']) - 1) / DAYS_IN_YEAR / ret_dict['b']
    elif ('D_eff' in prob_para) and ('b' not in prob_para):
        ret_dict['D'] = (np.power(1 - ret_dict['D_eff'], -b) - 1) / DAYS_IN_YEAR / b

    # return pd.DataFrame(ret_dict)[prob_para]
    store_list = []
    for name in prob_para:
        store_list += [ret_dict[name]]

    mesh_items = np.meshgrid(*store_list)
    ret = {}
    for i, name in enumerate(prob_para):
        ret[name] = mesh_items[i].flatten()

    return pd.DataFrame(ret)[prob_para]
