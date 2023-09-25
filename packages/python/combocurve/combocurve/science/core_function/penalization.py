import numpy as np
from typing import List
from combocurve.science.core_function.error_funcs import normal_ll

#Penalty for b using a quartic function
# (b-b_avg)**4
B_PENALTY_PERCENTAGE = 0.65
# Hard coded z-scores
NORM_P51 = 0.02506890825871106
NORM_P55 = 0.12566134685507416
NORM_P60 = 0.2533471031357997
NORM_P80 = 0.8416212335729143
NORM_P90 = 1.2815515655446004
NORM_P999 = 3.090232306167813
NORM_P10P90 = 2.5631031310892007
b_normalize_default = {'percentage': B_PENALTY_PERCENTAGE, 'data_thld': 12, 'time_thld': 1826.25}


def no_penalization(data_loss, p, p_fixed):
    return data_loss


def b_penalty_quartic(data_loss,
                      p,
                      p_fixed,
                      idx,
                      b_range,
                      data_points,
                      time_range,
                      percentage=B_PENALTY_PERCENTAGE,
                      data_thld=12,
                      time_thld=1826.25):

    if b_range[1] - b_range[0] <= 0.01:
        return data_loss

    b_avg = np.mean(np.array(b_range))
    data_penalty = 0
    time_penalty = 0

    data_flag = False
    time_flag = False

    b = p[idx]
    new_b = (b - b_range[0]) * b_avg * 2 / (b_range[1] - b_range[0])
    if data_points < data_thld:
        data_penalty = data_points / data_thld * percentage
        data_flag = True

    if time_range > 0 and time_range < time_thld:
        time_penalty = time_range / time_thld * percentage
        time_flag = True
    elif time_range == 0:
        time_penalty = percentage
        time_flag = True

    if data_flag is False and time_flag is False:
        loss = data_loss
    else:
        loss = (np.power(
            (new_b - b_avg), 2) / np.power(b_avg, 2) * percentage + 1) * (data_penalty + time_penalty + 1) * data_loss
        #loss = (abs(new_b - b_avg) * percentage + 1) * (data_penalty + time_penalty + 1) * data_loss

    return loss


def b_penalty_quartic_prob(data_loss,
                           p_table,
                           p_fixed_table,
                           idx,
                           b_range,
                           data_points,
                           time_range,
                           percentage=B_PENALTY_PERCENTAGE,
                           data_thld=12,
                           time_thld=1826.25):

    if b_range[1] - b_range[0] <= 0.01:
        return data_loss

    b_avg = np.mean(np.array(b_range))
    data_penalty = 0
    time_penalty = 0

    data_flag = False
    time_flag = False

    b_list = p_table[:, idx]
    new_b_list = (b_list - b_range[0]) * b_avg * 2 / (b_range[1] - b_range[0])

    if data_points < data_thld:
        data_penalty = data_points / data_thld * percentage
        data_flag = True

    if time_range > 0 and time_range < time_thld:
        time_penalty = time_range / time_thld * percentage
        time_flag = True
    elif time_range == 0:
        time_penalty = percentage
        time_flag = True

    if data_flag is False and time_flag is False:
        loss = data_loss
    else:
        loss = (np.power((new_b_list - b_avg), 2) / np.power(b_avg, 2) * percentage + 1) * (data_penalty + time_penalty
                                                                                            + 1) * data_loss
        #loss = (abs(new_b_list - b_avg) * percentage + 1) * (data_penalty + time_penalty + 1) * data_loss
    return loss


def b_prior_penalty(p: list, b_idx: int, b_range: List[float], b_prior: float, b_strength: str, is_fixed_peak: bool,
                    **_) -> float:
    '''Penalization function that regularizes on b.'''
    (low, high) = b_range
    b = p[b_idx]

    if b_strength == 'None':
        return 0.0
    elif b_strength == 'Low':
        percentile = NORM_P80 if is_fixed_peak else NORM_P51
    elif b_strength == 'Medium':
        percentile = NORM_P90 if is_fixed_peak else NORM_P55
    elif b_strength == 'High':
        percentile = NORM_P999 if is_fixed_peak else NORM_P60

    # If frontend passes low > high, make the value 0. This sets sigma so that
    sigma = max(high - low, 0) / (2 * percentile)
    if sigma <= 1e-10:
        # Nowhere for b to move, so just return no penalization.
        return 0.0
    loss = normal_ll(b, b_prior, sigma)
    return loss


def t_elf_prior_penalty(p: list, t_elf_idx: int, t_elf_range: List[int], **_) -> float:
    '''Penalization function that regularizes telf.'''
    t_elf = p[t_elf_idx]
    [p90, p10] = t_elf_range
    # Possible that range is coming in with P10 = P90. Just deactivate loss function in that case, since t_elf is
    # pegged.
    if p10 == p90:
        return 0.0
    mu = np.log(p10 * p90) / 2.0
    sigma = np.log(p10 / p90) / NORM_P10P90
    loss = normal_ll(np.log(t_elf), mu, sigma) + np.log(t_elf)
    return loss
