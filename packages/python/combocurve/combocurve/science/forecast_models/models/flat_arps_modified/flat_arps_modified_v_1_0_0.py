from typing import AnyStr, Dict, List, Union
import numpy as np
from copy import copy, deepcopy

from scipy.signal import find_peaks

from combocurve.science.deterministic_forecast.templates import return_template
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.shared.helper import arps_sw, pred_arps, pred_arps_modified
from combocurve.science.forecast_models.shared.segment_shared import arps_modified_para2seg
from combocurve.science.segment_models.models.arps_modified import ArpsModifiedSegment
from combocurve.science.segment_models.models.flat import FlatSegment

from combocurve.science.type_curve.TC_helper import moving_average

from combocurve.science.segment_models.multiple_segments import MultipleSegments

multi_seg = MultipleSegments()


class model_flat_arps_modified(model_parent):
    def __init__(self):
        self.model_name = 'flat_arps_modified'
        self.model_p_name = ['D', 'b2']  #dca_plugin
        self.model_p_fixed_name = [
            't_first', 'minus_t0_t_first', 'minus_t_decline_t_0', 'q0', 'target_D_eff_sw', 'enforce_sw'
        ]  #dca_plugin
        self.registration = {'rate': True, 'probabilistic': False, 'type_curve': True}
        self.default_transform_type = 'not_change'  ##dca_plugin_extension
        self.prob_para_direction = {'D': 1, 'b': -1}
        self.prob_para = ['D', 'b']
        self.TC_c8_para_name = ['D', 'b2']
        self.TC_set_s = None

    ######################################################## determinisitc
    def func(self, t, p, p_fixed):
        [D, b] = p
        [t_first, minus_t0_t_first, minus_t_decline_t_0, q0, target_D_eff_sw, enforce_sw] = p_fixed

        t0 = t_first + minus_t0_t_first
        t_decline = t0 + minus_t_decline_t_0

        sw_idx, _, D_exp, _ = arps_sw(q0, b, D, target_D_eff_sw, t0, 0, np.max(t), enforce_sw)
        q_sw = pred_arps(sw_idx, t_decline, q0, D, b)

        ret_list = np.zeros(t.shape)
        range_flat = (t < t_decline)
        range_marps = (t >= t_decline)

        ret_list[range_flat] = q0  # No need for a prediction on flat period
        ret_list[range_marps] = pred_arps_modified(t[range_marps], t_decline, sw_idx, q0, q_sw, D, b, D_exp)
        return ret_list

    def predict(self, t, p, p_fixed):
        return self.func(t, p, p_fixed)

    def prepare(self, data, t_peak, transformation, p2seg_dict=None):
        transformed_data = transformation(data, t_peak)

        t0 = transformed_data[0, 0]

        t_first = transformed_data[0, 0]
        q_peak = np.max(transformed_data[:, 1])

        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        minus_t_decline_t_0_range = p2seg_dict.get('minus_t_decline_t_0')

        # Determine an appropriate flat period duration
        moving_avg = moving_average(transformed_data[:, 1])
        moving_avg_diffs = np.diff(moving_avg)
        peaks, peak_info = find_peaks(-moving_avg_diffs, prominence=1, width=3)

        # Check that the peak finder did in fact find a decline point.
        if len(peaks) > 0:
            ## If we want to specify a min/max amount of indices to consider when
            # filtered_peak_option_mask = (2 < peaks)  &  (peaks < 24)
            # filtered_peak_options = peaks[filtered_peak_option_mask]

            maximum_prominence_loc = np.argmax(peak_info['prominences'])
            ## Kept in for debugging purposes in the future...
            # maximum_prominence = peak_info['prominences'][maximum_prominence_loc]
            most_prominent_peak_idx = peaks[maximum_prominence_loc]

            # Because the moving average is computed with n=3, we check back 2 indices.  This is an attempt to
            #   ensure that we don't include any declining data into the computation of `q0`.
            q0_mov_avg_idx = most_prominent_peak_idx
            if most_prominent_peak_idx >= 3:
                q0_mov_avg_idx = most_prominent_peak_idx - 2
            q0 = moving_avg[q0_mov_avg_idx]

            t_decline_idx = most_prominent_peak_idx

        # Did not find a decline point, default to point with highest value
        else:
            t_decline_idx = np.min(np.argwhere(transformed_data[:, 0] == t_peak))
            q0 = transformed_data[t_decline_idx, 1]

        if minus_t_decline_t_0_range is not None:
            minus_t_decline_t_0 = get_bounded_value(minus_t_decline_t_0_range, transformed_data[t_decline_idx, 0])

        # Trim data to only fit post-flat
        transformed_data = transformed_data[t_decline_idx:, :]

        p_fixed = [t_first, t0 - t_first, minus_t_decline_t_0, q0, D_lim_eff, enforce_sw]

        q0_left = 1e-2
        if q0_left > q_peak:
            q0_left = np.min(transformed_data[:, 1])

        p_range = [(1e-6, 100), (1e-5, 10)]
        return p_fixed, p_range, transformed_data

    ######################################################################## prob
    # def generate_para_candidates(self, p, p_fixed, para_dict, num):
    #     prob_para = para_dict['prob_para']
    #     n_para = len(prob_para)
    #     sample_num = int(np.power(num, 1 / n_para))
    #     [q0, D, b] = p
    #     return one_seg_arps_para_candidates(prob_para, D, b, para_dict, sample_num)

    # def pred_para_candidates(self, t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life):
    #     pred_exp_arps_wp_para_candidates(t, p_table, p_fixed_table, para_dict, data_end_idx, t_end_life)

    def get_p2seg_dict(self, para_dict, t_first_t_end_data_t_end_life):
        ret = {
            't_first': t_first_t_end_data_t_end_life['t_first'],
            't_end_data': t_first_t_end_data_t_end_life['t_end_data'],
            't_end_life': t_first_t_end_data_t_end_life['t_end_life'],
            'q_final': para_dict['q_final'],
            'D_lim_eff': para_dict['D_lim_eff'],
            'enforce_sw': para_dict['enforce_sw'],
            'minus_t_decline_t_0': para_dict.get('minus_t_decline_t_0')
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        q_final = p2seg_dict['q_final']
        D_lim_eff = p2seg_dict['D_lim_eff']
        enforce_sw = p2seg_dict['enforce_sw']
        #######
        [D, b] = p
        [t_first, minus_t0_t_first, minus_t_decline_t_0, q0, target_D_eff_sw, enforce_sw] = p_fixed
        t_0 = t_first + minus_t0_t_first
        t_decline = round(t_0 + minus_t_decline_t_0)
        ####### flat segment
        flat_seg = multi_seg.get_segment_template('flat')
        flat_seg['start_idx'] = t_0
        ## make sure this segment end is at least segment start
        flat_seg['end_idx'] = t_decline  #np.max([t_end_life, t_decline])
        flat_seg['q_start'] = q0
        flat_seg['q_end'] = q0
        flat_seg['c'] = q0
        ret = [flat_seg]

        ##### arps part

        arps_modified_seg = arps_modified_para2seg(t_decline + 1, t_end_life, q_final, D_lim_eff, enforce_sw, D, b,
                                                   t_decline + 1, q0)
        ret += arps_modified_seg
        return ret

    ######################################################################################### TC
    def TC_buildup(self, p, p_fixed, t_peak, buildup_dict, raito_in_cum_fit=False):
        # no buildup, just return `p` and `p_fixed`
        return p, p_fixed

    def TC_cum_p2seg(self, para, this_p, this_p_fixed, para_insert_list, t_peak, buildup_dict, p2_seg_para):
        for i in range(len(para_insert_list)):
            if para_insert_list[i]['part'] == 'p':
                this_p[para_insert_list[i]['ind']] = para[i]
            else:
                this_p_fixed[para_insert_list[i]['ind']] = para[i]

        return self.p2seg(this_p, this_p_fixed, p2_seg_para)

    def TC_fit_to_bg_data(
        self,
        segments: List[Dict],
        target_bg_info: Dict,
        bg_wells_info: Dict,
        phaseType: AnyStr,
        basePhase: AnyStr,
        TC_para_dict: Dict,
        fpd_index: float,
    ) -> List[Dict]:
        """
        Overrides the function from `parent_model.py`.

        Creates new flat+marps segments based on cum volume method.

        1. Scale the segments to match the prescribed flat rate
        2. Calculate volume from the marps segment
        3. Calculate the EUR of the full TC segments, and scale it based on where the target
             well falls in the background wells distribution.
        4. Determine flat period volume (TC_eur - marps_eur)
        5. Calculate flat duration max(flat_volume / q_flat, 1)
        """
        multi_segs: MultipleSegments = MultipleSegments()
        update_body = return_template(forecastType=phaseType)

        flat_period_bounds: List[int] = TC_para_dict['minus_t_decline_t_0']

        target_bg_values: Dict = np.array(target_bg_info['target_bg_data']['value'], dtype=np.float64)
        target_data_length: int = len(target_bg_values)
        target_well_cum: np.float64 = np.nansum(target_bg_values)

        bg_wells_data: np.array = np.array(bg_wells_info['background_data']['data'], dtype=np.float64)
        truncated_bg_data: np.array = bg_wells_data[:, :target_data_length]
        bg_wells_trunc_cums: np.array = np.nansum(truncated_bg_data, axis=1)
        bg_wells_cums_mean = np.mean(bg_wells_trunc_cums)

        eur_scaler = target_well_cum / bg_wells_cums_mean

        # target_well_percentile = sum(bg_wells_trunc_cums < target_well_cum) / len(bg_wells_trunc_cums)

        q_flat: float = float(TC_para_dict['q_flat'])
        q_multiplier: float = q_flat / segments[-1]['q_start']

        segments_starting_fpd = multi_segs.shift_segments_idx(deepcopy(segments), fpd_index)

        scaled_marps_segment: Dict = multi_segs.scale_segments_q([segments_starting_fpd[-1]], q_multiplier)[0]
        scaled_marps_segment_obj: ArpsModifiedSegment = ArpsModifiedSegment(scaled_marps_segment)
        scaled_marps_segment_eur: float = scaled_marps_segment_obj.integral(scaled_marps_segment['start_idx'],
                                                                            scaled_marps_segment['end_idx'])

        TC_flat_obj: FlatSegment = FlatSegment(segments_starting_fpd[0])
        TC_marps_obj: ArpsModifiedSegment = ArpsModifiedSegment(segments_starting_fpd[-1])

        TC_flat_eur: float = TC_flat_obj.integral(segments_starting_fpd[0]['start_idx'],
                                                  segments_starting_fpd[0]['end_idx'])
        TC_marps_eur: float = TC_marps_obj.integral(segments_starting_fpd[-1]['start_idx'],
                                                    segments_starting_fpd[-1]['end_idx'])
        scaled_TC_eur: float = (TC_flat_eur + TC_marps_eur) * eur_scaler

        flat_period_eur = scaled_TC_eur - scaled_marps_segment_eur
        flat_period_duration = get_bounded_value(flat_period_bounds, np.round(flat_period_eur / q_flat))

        # Create adjusted segment structures.
        flat_segment = {
            **segments_starting_fpd[0],
            'end_idx': segments_starting_fpd[0]['start_idx'] + flat_period_duration - 1,
            'q_start': q_flat,
            'q_end': q_flat,
            'c': q_flat,
        }

        marps_duration = segments_starting_fpd[-1]['end_idx'] - segments_starting_fpd[-1]['start_idx']
        time_before_switch = segments_starting_fpd[-1]['sw_idx'] - segments_starting_fpd[-1]['start_idx']
        marps_segment = {
            **scaled_marps_segment,
            'start_idx': flat_segment['end_idx'] + 1,
            'end_idx': flat_segment['end_idx'] + marps_duration + 1,
            'sw_idx': np.round(flat_segment['end_idx'] + time_before_switch + 1),
        }

        update_body['P_dict']['best']['segments'] = [flat_segment] + [marps_segment]
        return update_body

    def TC_reach_eur(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):

        [D, b] = p
        [t_first, minus_t0_t_first, minus_t_decline_t_0, q0, target_D_eff_sw, enforce_sw] = p_fixed

        start_idx = p2seg_para['t_first']
        t_end_life = p2seg_para['t_end_life']
        t_end_data = p2seg_para['t_end_data']

        original_segments = self.p2seg(p, p_fixed, p2seg_para)
        original_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, original_segments, 'daily')
        this_multiplier = target_eur / original_eur if original_eur > 0 else 0
        this_range = [np.min([this_multiplier, 1]), np.max([this_multiplier, 1])]
        for _ in range(reach_para['step']):
            this_candidates = np.linspace(this_range[0], this_range[1], reach_para['lin_num'])
            this_cal_eur = np.zeros(this_candidates.shape)
            for j in range(this_candidates.shape[0]):
                this_multiplier = this_candidates[j]
                this_p = copy(p)
                this_p_fixed = copy(p_fixed)
                # this_p[0] = this_p[0] * this_multiplier
                this_p_fixed[3] = this_p_fixed[3] * this_multiplier
                this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)
                this_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, this_segments, 'daily')
                this_cal_eur[j] = this_eur

            this_eur_dif = this_cal_eur - target_eur
            pos_idx = np.argwhere(this_eur_dif >= 0).reshape(-1, )
            neg_idx = np.argwhere(this_eur_dif < 0).reshape(-1, )
            if pos_idx.shape[0] > 0 and neg_idx.shape[0] > 0:
                next_cand_idx = [neg_idx[-1], pos_idx[0]]
                next_cand = this_candidates[next_cand_idx]
            else:
                this_eur_dif = np.abs(this_cal_eur - target_eur)
                next_cand = this_candidates[np.argsort(this_eur_dif)[0:2]]
            this_range = [np.min(next_cand), np.max(next_cand)]
        final_multiplier = this_candidates[np.argmin(np.abs(this_eur_dif))]
        this_p = copy(p)
        this_p_fixed = copy(p_fixed)
        # this_p[0] = this_p[0] * final_multiplier
        this_p_fixed[3] = this_p_fixed[3] * final_multiplier
        this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)
        this_eur = multi_seg.eur(0, start_idx - 10, start_idx, t_end_life, this_segments, 'daily')

        return this_segments


def get_bounded_value(bounds: List, value: Union[float, int]) -> Union[float, int]:
    '''
    Gets a value within the range specified by `bounds`.

    Usage:
        get_bounded_value([100,200], 205)
            -> 200
        get_bounded_value([100,200], 136)
            -> 136
        get_bounded_value([100,200], 82)
            -> 100

    Params:
        bounds (List): the min and max of the returned value.
        value: the target return value.

    Returns:
        The `value`, bounded by the `bounds`
    '''
    return min(max(value, bounds[0]), bounds[1])
