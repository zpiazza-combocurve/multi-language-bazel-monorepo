from copy import deepcopy
import math
import numpy as np
import logging
from scipy.optimize import fsolve
from typing import Any
from combocurve.utils.exceptions import get_exception_info
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN_DECLINE, Q_MAX, Q_MIN

from combocurve.science.segment_models.shared.helper import (arps_D_2_D_eff, exp_D_2_D_eff, my_bisect, linear_get_k,
                                                             arps_get_D, exp_get_D)

multi_seg = MultipleSegments()
START_IDX = 'start_idx'
END_IDX = 'end_idx'
Q_START = 'q_start'
Q_END = 'q_end'
D = 'D'
D_EFF = 'D_eff'

ESTIMATE_GRID = (10, 5, 1, 20, 0.5, 30)


class NormalizationTwoFactors:
    def __init__(self, a_targets, b_targets, a_values, b_values) -> None:
        """
            Initialization the required information needed for 2-factor normalziation
            For the IP-EUR 2-factor normalization, a should be the q peak and b should be the EUR
            All the targets and values should only contain numbers

        Args:
          a_targets: the target values of the first normalization variable
          b_targets: the target values of the second normalization variable
          a_values: the actual values of the first normalization variable
          b_values: the actual values of the second normalization variable
        """

        self.a_targets = np.array(a_targets)
        self.b_targets = np.array(b_targets)
        self.a_values = np.array(a_values)
        self.b_values = np.array(b_values)

        self.a_factors = self.check_finiteness(self.a_targets / self.a_values)
        self.b_factors = self.check_finiteness(self.b_targets / self.b_values)

    def check_finiteness(self, target_array) -> None:
        """
            Check the finiteness of the two factors, replace infinte or null values with 1

        Args:
            target_array: the array that needs to be checked
        """

        target_array[~np.isfinite(target_array)] = 1

        return target_array

    def normalization_pipeline(self, wells_data, valid_wells=None) -> list:
        """
            The 2-factor normalization pipeline

        Args:
            wells_data: the wells data needed to run 2-factor normalizaiton, should be a list of well_data, the length
            of the list is the number of wells that needed be run this normalization

        Returns:
            list: the solver multipers for each well
        """

        n = len(self.a_factors)
        if not valid_wells:
            valid_wells = [True] * n

        multipliers = {'nominalEur': [], 'nominalQPeak': [], 'validMask': []}

        for i in range(n):
            if valid_wells[i]:
                for estimate in ESTIMATE_GRID:
                    '''
                    For q peak and EUR 2-factor normalization:
                    Formula: x * [q_0^y + q_1^y + ... + q_peak^y + ... + q_n ^y] = target EUR
                    y: solve the above equation to get y
                    x: self.a_factors[i] * self.a_values[i]**(1 - y), where self.a_values[i] is a q peak of one well
                    '''
                    is_valid = False
                    try:
                        args = (self.a_values[i], self.a_factors[i], self.b_values[i], self.b_factors[i],
                                wells_data[i][wells_data[i] > 0])
                        y = float(fsolve(_normalization_function, estimate, args=args, fprime=_normalization_jacobian))
                        x = self.a_factors[i] * self.a_values[i]**(1 - y)
                        if (math.isclose(np.nansum(x * wells_data[i][wells_data[i] > 0]**y),
                                         float(self.b_values[i] * self.b_factors[i]))
                                and math.isclose(np.nanmax(x * wells_data[i][wells_data[i] > 0]**y),
                                                 float(self.a_values[i] * self.a_factors[i]))):
                            is_valid = True
                            break
                    except Exception as e:
                        error_info = get_exception_info(e)
                        logging.error(error_info['message'], extra={'metadata': {'2_factor_optimiser_input': args}})

                if not is_valid:
                    x = y = 1.0
            else:
                is_valid = False
                x = y = 1.0

            multipliers['nominalEur'].append(y)
            multipliers['nominalQPeak'].append(x)
            multipliers['validMask'].append(is_valid)

        return multipliers


def _normalization_function(y, q_peak, q_factor, eur, eur_factor, data):
    """
        The target function for two factor normalization (q peak and EUR)

    Args:
        y: the exponent that needs to be solved here
        q_peak: the q peak value of the current well
        q_factor: the calculated q peak factor
        eur: the eur value
        eur_factor: the calculated eur_factor
        data: the data of current well

    Returns:
        the function that needs to be solved by fsolver
    """

    return q_factor * np.nansum(data**y) - eur * eur_factor * q_peak**(y - 1)


def _normalization_jacobian(y, q_peak, q_factor, eur, eur_factor, data):
    """Provides the explicit Jacobian for the optimiztion function."""
    return q_factor * np.nansum(
        np.log(data, dtype=float) * data**y) - math.log(q_peak) * eur * eur_factor * q_peak**(y - 1)


def _roots_estimation(eur_factor, well_tc_data, epsilon=0.1):
    """
        The rough roots estimation of the normalizaiton function

    Args:
        eur_factor: the calculated eur_factor
        well_tc_data: the data used in type curve of this current well

    Returns:
        float: the estimation result
    """

    q_start = well_tc_data[0]
    q_end = well_tc_data[-1]

    for data in well_tc_data:
        if data > 0:
            q_start = data
            break

    for prod in reversed(well_tc_data):
        if prod > 0:
            q_end = prod
            break

    x0 = (2 - eur_factor * (2 + np.log(q_end / q_start))) / np.log(q_start / q_end)
    estimate = max(x0, epsilon)

    return estimate


def modify_segments_peak_rate(q_peak_multipler, tc_segments: list[dict[str, Any]], rate_scaled_fields):
    for i, this_seg in enumerate(tc_segments):
        for key in rate_scaled_fields[i]:
            this_seg[key] *= q_peak_multipler


def _get_q_range(segment_slope, q_start, segment_type):
    use_q_min = Q_MIN
    use_q_max = Q_MAX

    if segment_slope == 1 and segment_type != 'flat':
        use_q_min = q_start
    elif segment_slope == -1:
        use_q_max = q_start

    return use_q_min, use_q_max


def _arps_modified_solver(segment, target_eur):
    def calc_eur(d_eff):
        segment['D_eff'] = d_eff
        this_segment_template = MultipleSegments.fill_segment(segment, 'arps_modified', [])
        left_idx = this_segment_template['start_idx']
        right_idx = this_segment_template['end_idx']
        end_data_idx = left_idx - 100
        return multi_seg.eur_precise(0, end_data_idx, left_idx, right_idx, [this_segment_template],
                                     'daily') - target_eur

    def bisect_d_eff(values):
        if type(values) == np.ndarray:
            v1 = calc_eur(values[0])
            v2 = calc_eur(values[1])
            return np.array([v1, v2])
        else:
            return calc_eur(values)

    try:
        calculated_d_eff = my_bisect(bisect_d_eff, D_EFF_MIN_DECLINE, D_EFF_MAX, 1e-5)
        segment['D_eff'] = calculated_d_eff
        reach_target_eur = True
    except Exception as e:
        reach_target_eur = False
        error_info = get_exception_info(e)
        logging.error(error_info['message'], extra={'metadata': error_info})

    return reach_target_eur


def modify_segment_to_reach_eur(segment, target_eur, q_peak):
    segment_type = segment['name']
    segment_slope = segment['slope']
    reach_target_eur = False

    start_idx = segment[START_IDX]
    end_idx = segment[END_IDX]
    q_start = segment[Q_START]
    b = segment.get('b')

    #use inner functions here to use the my_bisect function
    def q_end_solver(q_end):
        segment[Q_END] = q_end

        if segment_type in ['arps', 'arps_inc']:
            calc_D = arps_get_D(start_idx, q_start, end_idx, q_end, b)
            calc_D_eff = arps_D_2_D_eff(calc_D, b)
            segment[D_EFF] = calc_D_eff
        elif segment_type in ['exp_dec', 'exp_inc']:
            calc_D = exp_get_D(start_idx, q_start, end_idx, q_end)
            calc_D_eff = exp_D_2_D_eff(calc_D)
            segment[D_EFF] = calc_D_eff
        elif segment_type == 'flat':
            segment[Q_START] = q_end

        this_segment_template = multi_seg.fill_segment(segment, segment_type, [])

        left_idx = this_segment_template['start_idx']
        right_idx = this_segment_template['end_idx']
        end_data_idx = left_idx - 100
        return multi_seg.eur_precise(0, end_data_idx, left_idx, right_idx, [this_segment_template],
                                     'daily') - target_eur

    def bisect_solver(values):
        if type(values) == np.ndarray:
            v1 = q_end_solver(values[0])
            v2 = q_end_solver(values[1])
            return np.array([v1, v2])
        else:
            return q_end_solver(values)

    use_q_min, use_q_max = _get_q_range(segment_slope, q_start, segment_type)

    if segment_slope == 1 and segment_type != 'flat':
        use_q_min = segment[Q_START]
    elif segment_slope == -1:
        use_q_max = segment[Q_START]

    if segment_type == 'empty':
        return reach_target_eur
    elif segment_type == 'arps_modified':
        try:
            reach_target_eur = _arps_modified_solver(segment, target_eur)
            segment = multi_seg.fill_segment(segment, segment_type, [])
        except Exception as e:
            reach_target_eur = False
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})
    else:
        #segment_type in ['arps', 'arps_inc', 'exp_dec', 'exp_inc', 'linear', 'flat']
        try:
            calculated_q_end = my_bisect(bisect_solver, use_q_min, use_q_max, 1e-5)
            if calculated_q_end <= q_peak:
                if segment_type in ['arps', 'arps_inc']:
                    new_D = arps_get_D(start_idx, q_start, end_idx, calculated_q_end, b)
                    new_D_eff = arps_D_2_D_eff(new_D, b)
                    segment[D_EFF] = new_D_eff
                    segment[D] = new_D
                    segment[Q_END] = calculated_q_end

                elif segment_type in ['exp_dec', 'exp_inc']:
                    new_D = exp_get_D(start_idx, q_start, end_idx, calculated_q_end)
                    new_D_eff = exp_D_2_D_eff(new_D)
                    segment[D_EFF] = new_D_eff
                    segment[D] = new_D
                    segment[Q_END] = calculated_q_end
                elif segment_type == 'linear':
                    new_k = linear_get_k(start_idx, q_start, end_idx, calculated_q_end)
                    slope = 1 if new_k > 0 else -1
                    segment[Q_END] = calculated_q_end
                    segment['slope'] = slope
                    segment['k'] = new_k
                elif segment_type == 'flat':
                    segment[Q_START] = calculated_q_end
                    segment[Q_END] = calculated_q_end
                    segment['c'] = calculated_q_end
                reach_target_eur = True
        except Exception as e:
            reach_target_eur = False
            error_info = get_exception_info(e)
            logging.error(error_info['message'], extra={'metadata': error_info})

    return reach_target_eur, segment


def modify_segment_decline_rate(use_eur: float, q_peak: float, segments: list[dict[str, Any]]):
    warning = {'status': False, 'message': ''}
    reach_target_eur = False

    if len(segments) == 1:
        segment_target_eur = use_eur
    else:
        segments_without_last = segments[:-1]
        segment_target_eur = use_eur - multi_seg.eur_precise(
            0, segments_without_last[0]['start_idx'] - 100, segments_without_last[0]['start_idx'],
            segments_without_last[-1]['end_idx'], segments_without_last, 'daily')

    if segment_target_eur > 0:
        reach_target_eur, last_segment = modify_segment_to_reach_eur(segments[-1], segment_target_eur, q_peak)
        segments[-1] = last_segment

    if not reach_target_eur:
        warning = {'status': True, 'message': 'The applied type curve can not reach the target values. '}

    return warning


def apply_normalization_to_segments(tc_segments: list[dict[str, Any]], multipliers: dict[str, np.ndarray],
                                    target_eur: float, target_q_peak: float, rate_scaled_fields: list):
    n = len(multipliers['eur'])
    ret_segments = []
    warnings = []

    for i in range(n):
        q_peak_mult = multipliers['qPeak'][i]
        eur_mult = multipliers['eur'][i]

        this_segments = tc_segments[i]
        this_segments_copy = deepcopy(tc_segments[i])

        modify_segments_peak_rate(q_peak_mult, this_segments, rate_scaled_fields)
        warning = modify_segment_decline_rate(target_eur * eur_mult, target_q_peak, this_segments)

        if warning['status'] is False:
            ret_segments.append(this_segments)
        else:
            ret_segments.append(this_segments_copy)

        warnings.append(warning['status'])

    return ret_segments, warnings
