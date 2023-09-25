import numpy as np
import pandas as pd
from scipy.optimize.optimize import OptimizeResult
from scipy.optimize import differential_evolution
from combocurve.science.core_function.error_funcs import log_mpe_add_eps
from combocurve.science.deterministic_forecast.templates import return_template
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.forecast_models.shared.prob_shared import generate_edge_heavy_flat_distribution
from combocurve.science.core_function.penalization import (b_penalty_quartic, b_penalty_quartic_prob, b_prior_penalty,
                                                           no_penalization, t_elf_prior_penalty)
from combocurve.science.core_function.penalization import B_PENALTY_PERCENTAGE
from copy import deepcopy
from typing import Any, AnyStr, Callable, Dict, List, Optional, Tuple
from combocurve.science.core_function.transformation_instances import not_change
from combocurve.science.core_function.transformation_instances import transform_s
from combocurve.science.segment_models.shared.helper import arps_D_eff_2_D, exp_D_eff_2_D, pred_arps, pred_exp
from combocurve.services.proximity_forecast.proximity_helpers import clean_segments, update_ratio_or_P_dict

multi_seg = MultipleSegments()
RVG_paras = {'minimum_ratio': 0.1}

prob_dtype = np.float32

ParameterRange = Tuple[float, float]


class model_parent:
    default_transform_type: str
    _segments: List[Dict[str, Any]]
    model_name: str
    model_p_name: List[str]
    model_p_fixed_name: List[str]

    def get_penalize_params(self, para_dict):
        if self.model_name in [
                'arps_modified_wp', 'arps_wp', 'arps_modified_free_peak', 'exp_dec_arps_modified_free_peak_different',
                'exp_dec_arps_modified_free_peak_same'
        ]:
            penalization_params = {
                'type': 'default',
                'params': {
                    'percentage': B_PENALTY_PERCENTAGE,
                    'data_thld': 12,
                    'time_thld': 1826.25
                },
                'b_range': para_dict['b']
            }
        elif self.model_name == 'segment_arps_4_wp':
            penalization_params = {
                'type': 'default',
                'params': {
                    'percentage': B_PENALTY_PERCENTAGE,
                    'data_thld': 12,
                    'time_thld': 1826.25
                },
                'b_range': para_dict['b2']
            }
        elif self.model_name == 'arps_fulford':
            penalization_params = {
                'type': 'fulford',
                'b_prior': para_dict['b_prior'],
                'b_strength': para_dict['b_strength'],
                'is_fixed_peak': True,
                'b_range': para_dict['b'],
                'b_idx': 1,
                't_elf_range': None,
                't_elf_idx': None
            }
        elif self.model_name == 'arps_modified_fulford':
            penalization_params = {
                'type': 'fulford',
                'b_prior': para_dict['b_prior'],
                'b_strength': para_dict['b_strength'],
                'is_fixed_peak': True,
                'b_range': para_dict['b'],
                'b_idx': 1,
                't_elf_range': None,
                't_elf_idx': None
            }
        elif self.model_name == 'arps_modified_fp_fulford':
            penalization_params = {
                'type': 'fulford',
                'b_prior': para_dict['b_prior'],
                'b_strength': para_dict['b_strength'],
                'is_fixed_peak': False,
                'b_range': para_dict['b'],
                'b_idx': 1,
                't_elf_range': None,
                't_elf_idx': None
            }
        elif self.model_name == 'arps_linear_flow_fulford':
            penalization_params = {
                'type': 'fulford',
                'b_prior': para_dict['b_prior'],
                'b_strength': para_dict['b_strength'],
                'is_fixed_peak': True,
                'b_range': para_dict['b2'],
                'b_idx': 2,
                't_elf_range': para_dict['minus_t_elf_t_peak'],
                't_elf_idx': 1
            }
        else:
            penalization_params = None
        return penalization_params

    def get_penalize(self, transformed_data, penalization_params):
        if (penalization_params is None):
            return no_penalization
        if self.model_name not in [
                'arps_modified_wp', 'arps_wp', 'segment_arps_4_wp', 'arps_modified_free_peak',
                'exp_dec_arps_modified_free_peak_different', 'exp_dec_arps_modified_free_peak_same', 'arps_fulford',
                'arps_modified_fulford', 'arps_linear_flow_fulford', 'arps_modified_fp_fulford'
        ]:
            return no_penalization

        if penalization_params['type'] not in ['default', 'normalize_b', 'fulford']:
            return no_penalization

        if penalization_params['type'] == 'fulford':
            # In first case we regularize on t_elf.
            if penalization_params['t_elf_range'] is not None:
                if penalization_params['b_strength'] == 0:
                    return lambda data_loss, p, p_fixed: t_elf_prior_penalty(p, **penalization_params) + data_loss
                else:
                    return lambda data_loss, p, p_fixed: b_prior_penalty(
                        p, **penalization_params) + t_elf_prior_penalty(p, **penalization_params) + data_loss

            else:
                if penalization_params['b_strength'] == 0:
                    return lambda data_loss, p, p_fixed: data_loss
                else:
                    return lambda data_loss, p, p_fixed: b_prior_penalty(p, **penalization_params) + data_loss

        data_points = transformed_data.shape[0]
        if transformed_data.shape[0] > 0:
            time_range = transformed_data[-1][0] - transformed_data[0][0]
        else:
            time_range = 0

        ###b index in each model:
        if self.model_name in ['arps_modified_wp', 'arps_wp', 'arps_modified_free_peak']:
            idx = 1
        elif self.model_name in [
                'segment_arps_4_wp', 'exp_dec_arps_modified_free_peak_different', 'exp_dec_arps_modified_free_peak_same'
        ]:
            idx = 3

        #b_avg = np.mean(np.array(p_range[-1]))
        return lambda data_loss, p, p_fixed: b_penalty_quartic(data_loss, p, p_fixed, idx, penalization_params[
            'b_range'], data_points, time_range, penalization_params['params']['percentage'], penalization_params[
                'params']['data_thld'], penalization_params['params']['time_thld'])

    def get_penalize_prob(self, transformed_data, penalization_params):
        if (penalization_params is None):
            return no_penalization
        if self.model_name not in ['arps_modified_wp', 'arps_wp', 'segment_arps_4_wp', 'arps_modified_free_peak']:
            return no_penalization

        if penalization_params['type'] not in ['default', 'normalize_b']:
            return no_penalization

        data_points = transformed_data.shape[0]
        if transformed_data.shape[0] > 0:
            time_range = transformed_data[-1][0] - transformed_data[0][0]
        else:
            time_range = 0

        ###b index in each model:
        if self.model_name in ['arps_modified_wp', 'arps_wp', 'arps_modified_free_peak']:
            idx = 1
        elif self.model_name == 'segment_arps_4_wp':
            idx = 3

        #b_avg = np.mean(np.array(p_range[-1]))
        return lambda data_loss, p_table, p_fixed_table: b_penalty_quartic_prob(
            data_loss, p_table, p_fixed_table, idx, penalization_params['b_range'], data_points, time_range,
            penalization_params['params']['percentage'], penalization_params['params'][
                'data_thld'], penalization_params['params']['time_thld'])

    def generate_para_fit(self, para_dict):
        prob_para = para_dict['prob_para']
        np_p_name = np.array(self.model_p_name)
        ret_para_fit = []
        for i, name in enumerate(list(self.prob_para_direction.keys())):
            if name in prob_para:
                ind = np.argwhere(np_p_name == name)[0, 0]
                ret_para_fit += [{'name': name, 'ind': ind}]

        return ret_para_fit

    def create_para_hash(self, para_name):
        p_name = self.model_p_name
        p_fixed_name = self.model_p_fixed_name
        para_hash = {}
        for name in para_name:
            this_hash = {}
            this_hash['goto_p'] = (name in p_name)
            if this_hash['goto_p']:
                this_hash['ind'] = np.argwhere(np.array(p_name) == name)[0, 0]
            else:
                this_hash['ind'] = np.argwhere(np.array(p_fixed_name) == name)[0, 0]
            para_hash[name] = this_hash

        return para_hash

    def hirchy_dict2flat_dict(self, P_dict, percentiles, para_name):
        ret_dict = {}
        p_name = self.model_p_name
        p_fixed_name = self.model_p_fixed_name
        para_hash = self.create_para_hash(para_name)
        for i in range(len(p_name)):
            this_name = 'best_' + p_name[i]
            ret_dict[this_name] = P_dict['best']['p'][i]

        for i in range(len(p_fixed_name)):
            this_name = 'best_' + p_fixed_name[i]
            ret_dict[this_name] = P_dict['best']['p_fixed'][i]

        for perc in percentiles:
            p_name = 'P' + str(perc)
            for name in para_name:
                this_name = p_name + '_' + name
                if para_hash[name]['goto_p']:
                    ret_dict[this_name] = P_dict[p_name]['p'][para_hash[name]['ind']]
                else:
                    ret_dict[this_name] = P_dict[p_name]['p_fixed'][para_hash[name]['ind']]

        return ret_dict

    def flat_dict2hirchy_dict(self, flat_dict, percentiles, para_name):
        ret_dict = {}
        p_name = self.model_p_name
        p_fixed_name = self.model_p_fixed_name
        para_hash = self.create_para_hash(para_name)
        best_p = []
        for name in p_name:
            if name in para_name:
                best_p += [0]
            else:
                best_p += [flat_dict['best_' + name]]
        best_p = np.array(best_p, dtype=float)

        best_p_fixed = []
        for name in p_fixed_name:
            if name in para_name:
                best_p_fixed += [0]
            else:
                best_p_fixed += [flat_dict['best_' + name]]
        best_p_fixed = np.array(best_p_fixed, float)

        for perc in percentiles:
            p_name = 'P' + str(perc)
            this_p = deepcopy(best_p)
            this_p_fixed = deepcopy(best_p_fixed)
            for name in para_name:
                this_name = p_name + '_' + name
                if para_hash[name]['goto_p']:
                    this_p[para_hash[name]['ind']] = flat_dict[this_name]
                else:
                    this_p_fixed[para_hash[name]['ind']] = flat_dict[this_name]

            ret_dict[p_name] = {'p': np.array(this_p), 'p_fixed': np.array(this_p_fixed)}

        return ret_dict

    def single_exp_dec_para_candidates(self, p, p_fixed, para_dict, num):
        prob_para = para_dict['prob_para']
        n_para = len(prob_para)
        sample_num = int(np.power(num, 1 / n_para))
        para_fit = self.generate_para_fit(para_dict)
        ret_dict = {}
        for i, name in enumerate(prob_para):
            p_ind = para_fit[i]['ind']
            this_para = p[p_ind]
            this_para_paras = generate_edge_heavy_flat_distribution(para_dict[name], this_para, sample_num)
            ret_dict[name] = this_para_paras
        # return pd.DataFrame(ret_dict)[prob_para]
        store_list = []
        for name in prob_para:
            store_list += [ret_dict[name]]

        mesh_items = np.meshgrid(*store_list)
        ret = {}
        for i, name in enumerate(prob_para):
            ret[name] = mesh_items[i].flatten()
        return pd.DataFrame(ret)[prob_para]

    def exp_plus_dec_reach(
        self,
        p,
        p_fixed,
        target_eur,
        p2seg_para,
        reach_para={
            'step': 3,
            'lin_num': 10
        },
    ):
        orig_seg = self.p2seg(p, p_fixed, p2seg_para)
        start_idx = p2seg_para['t_first']
        t_end_life = p2seg_para['t_end_life']
        t_end_data = p2seg_para['t_end_data']
        orig_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, orig_seg, 'daily')
        if target_eur == 0:
            this_segments = [multi_seg.get_segment_template('flat')]
            this_segments[0]['start_idx'] = start_idx
            this_segments[0]['end_idx'] = t_end_life
            this_segments[0]['c'] = 0
            this_eur = 0
        else:
            this_multiplier = target_eur / orig_eur
            this_range = [np.min([this_multiplier, 1]), np.max([this_multiplier, 1])]
            for i in range(reach_para['step']):
                this_candidates = np.linspace(this_range[0], this_range[1], reach_para['lin_num'])
                this_cal_eur = np.zeros(this_candidates.shape)
                for j in range(this_candidates.shape[0]):
                    this_multiplier = this_candidates[j]
                    this_p, this_p_fixed = self.scale_parameter(p, p_fixed, 'q0', this_multiplier)
                    this_p, this_p_fixed = self.scale_parameter(this_p, this_p_fixed, 'q_peak', this_multiplier)
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
            this_p, this_p_fixed = self.scale_parameter(p, p_fixed, 'q0', final_multiplier)
            this_p, this_p_fixed = self.scale_parameter(this_p, this_p_fixed, 'q_peak', final_multiplier)
            this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)
            this_eur = multi_seg.eur(0, start_idx - 10, start_idx, t_end_life, this_segments, 'daily')
        return this_segments

    def arps_inc_reach(self, p, p_fixed, target_eur, p2seg_para, reach_para={'step': 3, 'lin_num': 10}):
        orig_seg = self.p2seg(p, p_fixed, p2seg_para)
        start_idx = p2seg_para['t_first']
        t_end_life = p2seg_para['t_end_life']
        t_end_data = p2seg_para['t_end_data']
        orig_eur = multi_seg.eur(0, t_end_data, start_idx, t_end_life, orig_seg, 'daily')
        if target_eur == 0:
            this_segments = [multi_seg.get_segment_template('flat')]
            this_segments[0]['start_idx'] = start_idx
            this_segments[0]['end_idx'] = t_end_life
            this_segments[0]['c'] = 0
        else:
            this_multiplier = target_eur / orig_eur
            this_p, this_p_fixed = self.deepcopy_parameters(p, p_fixed)
            this_p[0] = this_p[0] * this_multiplier
            this_segments = self.p2seg(this_p, this_p_fixed, p2seg_para)

        return this_segments

    def exp_plus_dec_cum_p2seg(
        self,
        para,
        this_p,
        this_p_fixed,
        para_insert_list,
        t_peak,
        buildup_dict,
        p2_seg_para,
    ):
        params = self.get_parameters_as_dict(this_p, this_p_fixed)
        build_ratio = params['q0'] / params['q_peak']
        # TODO: see if the below loop can be optimized out using new utility functions.
        for i in range(len(para_insert_list)):
            if para_insert_list[i]['part'] == 'p':
                this_p[para_insert_list[i]['ind']] = para[i]
            else:
                this_p_fixed[para_insert_list[i]['ind']] = para[i]

        this_p, this_p_fixed = self.TC_buildup(this_p, this_p_fixed, t_peak, buildup_dict, build_ratio)
        return self.p2seg(this_p, this_p_fixed, p2_seg_para)

    def get_parameters_as_dict(self, p: list, p_fixed: list) -> dict[str, Any]:
        '''
        This function returns the parameters as a dictionary.

        Args:
            p (list): list of free parameters
            p_fixed (list): list of fixed parameters

        Returns:
            dict[str, Any]: dictionary of parameters
        '''
        ret = {}
        for i in range(len(self.model_p_name)):
            ret[self.model_p_name[i]] = p[i]
        for i in range(len(self.model_p_fixed_name)):
            ret[self.model_p_fixed_name[i]] = p_fixed[i]
        return ret

    def pdict_to_p_and_p_fixed(self, pdict: dict[str, Any]) -> tuple[list, list]:
        '''
        This function returns the parameters as a dictionary.

        Args:
            p (list): list of free parameters
            p_fixed (list): list of fixed parameters

        Returns:
            dict[str, Any]: dictionary of parameters
        '''
        p, p_fixed = [], []

        for i in range(len(self.model_p_name)):
            p += [pdict[self.model_p_name[i]]]

        for i in range(len(self.model_p_fixed_name)):
            p_fixed += [pdict[self.model_p_fixed_name[i]]]

        return p, p_fixed

    def scale_parameter(self, p: list, p_fixed: list, parameter: str, scale: float = 1.0) -> tuple[list, list]:
        '''
        Scale the parameter specfied by name by the scale factor.  Does not modify the value in-place.

        Args:
            p (list): list of free parameters
            p_fixed (list): list of fixed parameters
            parameter (str): name of parameter to scale
            scale (float): scale factor

        Returns:
            tuple[list, list]: tuple of parameters, with the correct one scaled.
        '''
        parameters = self.get_parameters_as_dict(p, p_fixed)
        parameters[parameter] = parameters[parameter] * scale
        return self.pdict_to_p_and_p_fixed(parameters)

    def set_parameter(self, p, p_fixed, parameter, value):
        '''
        Set the parameter specfied by name to the value.  Does not modify the value in-place.

        Args:
            p (list): list of free parameters
            p_fixed (list): list of fixed parameters
            parameter (str): name of parameter to set
            value (float): value to set parameter to

        Returns:
            tuple[list, list]: tuple of parameters, with the correct one set.
        '''
        parameters = self.get_parameters_as_dict(p, p_fixed)
        parameters[parameter] = value
        return self.pdict_to_p_and_p_fixed(parameters)

    def deepcopy_parameters(self, p: list, p_fixed: list) -> tuple[list, list]:
        '''
        This function returns a deep copy of the parameters.

        Args:
            p (list): list of free parameters
            p_fixed (list): list of fixed parameters

        Returns:
            tuple[list, list]: tuple of deep copies of parameters
        '''
        return deepcopy(p), deepcopy(p_fixed)

    def make_D1_eff_in_range(self, D1_eff, D1_eff_range):
        if D1_eff < D1_eff_range[0]:
            D1_eff = D1_eff_range[0]
        if D1_eff > D1_eff_range[1]:
            D1_eff = D1_eff_range[1]
        return D1_eff

    def prepare(
        self,
        data: np.ndarray,
        t_peak: np.float64,
        transformation: Callable,
    ) -> Tuple[List[float], Tuple[ParameterRange, ...], np.ndarray]:
        """prepare is a base method that transforms data, returns fixed parameters,
        and returns parameter ranges based on the (sometimes) transformed data.

        Args:
            data (np.ndarray): array of data the has the shape (3, n) where the
            channels represent (time, normalized fluid amount, boolean mask)
            t_peak (np.float64): x axis location of the chosen "peak" in the data
            transformation (Callable): function that transforms the data (see
            specific class implmentation for this)

        Returns : tuple(
            fixed parameters,
            dynamic parameter ranges,
            transformated data,
        )
        """
        raise NotImplementedError

    def func(self, t: np.ndarray, p: List[Any], p_fixed: List[Any]) -> np.ndarray:
        """func takes in data, parameters (ompimizable/fixed), and returns
        predicted values transformed by the paramters.

        Args:
            t (int): TODO
            p (List[Any]): TODO
            p_fixed (List[Any]): TODO

        Returns: TODO

        """
        raise NotImplementedError

    def predict(self, t: np.ndarray, p: List[Any], p_fixed: List[Any]) -> np.ndarray:
        """TODO: Docstring for predict.

        Args:
            t (int): TODO
            p (List[Any]): TODO
            p_fixed (List[Any]): TODO

        Returns: TODO

        """
        raise NotImplementedError

    def predict_cum_volume(self, t, p, p_fixed, p2seg_dict):
        if np.any(np.isnan(p)):
            return np.full(t.shape, np.nan)

        segments: list[dict] = self.p2seg(p, p_fixed, p2seg_dict)
        # Horrific hack, figure this out.
        is_monthly = np.all(np.diff(np.array(t)) >= 28)
        if is_monthly:
            return multi_seg.predict_monthly_volumes_relative(t, segments)
        else:
            return multi_seg.predict(t, segments, 0)

    def prepare_segments(
        self,
        data: np.ndarray,
        t_peak: float,
        data_freq: str,
        filter_type: Optional[str] = None,
        p2seg_dict: Optional[Dict] = None,
    ) -> Tuple[List[float], List[List[ParameterRange]], List[np.ndarray]]:
        """TODO: prepare segment take in data, peak time, and date frequency to
        return ompimizable parameter ranges, and data slice for each section.

        Args:
            data (np.ndarray): time series well data
            t_peak (float): peak time
            data_freq (str): date frequency ( see
            combocurve.science.core_function.transformation_instancestransform_s )
            filter_type (Optional[str]): optional user defined filter type to use
            p2seg_dict (Optional[Dict]): Optional p2seg dictionary to pass to the prep funcs

        Returns: Tuple[List[float], List[List[ParameterRange]], List[np.ndarray]]
            tuple(
                model fixed parameter values,
                ranges for optimizable parameter for each segment,
                data transformed/sliced for each segment,
            )
        """
        # Find the paramater ranges and transform data per segement.
        p_ranges, transformed_datas = [], []

        # Get fixed parameter names and paramater ranges for all params.
        p_fixed, p_range, _ = self.prepare(data, t_peak, not_change, p2seg_dict)
        for segment in self.segments:
            # If user defined filter use that for the segment instead.
            if filter_type:
                segment['transform_type'] = filter_type

            # Transformat data with segment transformer.
            transform_type = segment["transform_type"]
            transformer: Callable = transform_s[transform_type][data_freq]
            transformed_data = transformer(data, t_peak)
            transformed_datas.append(transformed_data)

            # Map segment parameter values using indicies from model param names.
            p_seg_ranges = list(map(lambda x: p_range[self.model_p_name.index(x)], segment["p"]))
            p_ranges.append(p_seg_ranges)

        return p_fixed, p_ranges, transformed_datas

    def TC_fit_to_bg_data(
        self,
        segments: List[Dict],
        target_bg_info: Dict,
        bg_wells_info: Dict,
        phaseType: AnyStr,
        basePhase: AnyStr,
        TC_para_dict: Dict,
        fpd_index: float,
    ) -> Dict:
        """
        This is the default behaviour for applying TC segments to well production data. Can be
          overridden in the models subclassing this one.

        For usage examples, consult proximity_forecast_service.py:616

        Args:
            segments (List[Dict]): The TC segments that need to be modified to fit the prod data
            target_bg_info (Dict): A dictionary containing various pieces of background info.
            bg_wells_info (Dict): Contains prod and EUR data from bg wells.
            phaseType (Str): The type of the phase [rate/ratio]
            basePhase (Str): If phaseType == 'ratio', this is the base phase.
            TC_para_dict (Dict): Contains the TC generation parameters.  May be removed in the future.
            fpd_index (float): The index (days from 1900) of the well's first prod date.  Falls back to today.
        Returns:
            Forecast Body return template, with newly shifted segments.
        """
        multi_segs: MultipleSegments = MultipleSegments()
        target_bg_data: Dict = target_bg_info['target_bg_data']
        update_body = return_template(forecastType=phaseType)

        x_data: np.array = np.array(target_bg_data['index'], dtype=np.float64)
        y_data: np.array = np.array(target_bg_data['value'], dtype=np.float64)
        x_data = x_data[~np.isnan(y_data)]
        y_data = y_data[~np.isnan(y_data)].astype(np.float64)

        offset = np.min(x_data)

        # HACK: Preshift the segments to start at 0.  We shouldn't need to do this,
        #   but the boundaries are getting messy.
        segment_offset = segments[0]['start_idx']
        segments: List[Dict] = multi_segs.shift_segments_idx(segments, -segment_offset)

        # We need to work on a better way of calculating the shift boundaries...
        # left_bound = x_data[0] - segments[-1]['end_idx']
        right_bound = x_data[-1] - segments[0]['start_idx']
        # Using `offset` as a hacky way to ensure curve doesn't fly off to the left
        shift_boundaries = (offset, right_bound)

        def _optimization_fn(x, *args):
            m, x0 = x
            x_values, actual_y_values = args

            # Shift and scale the segments...
            scaled_segments = multi_segs.scale_segments_q(deepcopy(segments), m)
            if phaseType == 'rate':
                shifted_scaled_segments = multi_segs.shift_segments_idx(scaled_segments, x0)
            else:
                shifted_scaled_segments = multi_segs.shift_segments_idx(scaled_segments, offset)

            shifted_scaled_segments[-1] = {**shifted_scaled_segments[-1], 'end_idx': 1000000}

            forecasted_y_values = multi_segs.predict(x_values, shifted_scaled_segments)
            error = log_mpe_add_eps(actual_y_values, forecasted_y_values) / sum(forecasted_y_values > 0)
            return error

        opt_result: OptimizeResult = differential_evolution(_optimization_fn, ((0, 1000), shift_boundaries),
                                                            (x_data, y_data),
                                                            seed=1)

        if opt_result.success:

            m, x0 = opt_result.x
            scaled_segments = multi_segs.scale_segments_q(deepcopy(segments), m)
            if phaseType == 'rate':
                shifted_scaled_segments = multi_segs.shift_segments_idx(scaled_segments, x0)
            else:
                shifted_scaled_segments = multi_segs.shift_segments_idx(scaled_segments, offset)
            segments = clean_segments(shifted_scaled_segments)

            update_ratio_or_P_dict(update_body, phaseType)
            if phaseType == 'ratio':
                update_body['ratio'] = {'segments': segments, 'basePhase': basePhase, 'x': 'time', 'diagnostics': {}}
                update_body['P_dict'] = {}
            else:
                update_body['P_dict']['best']['segments'] = segments

            return update_body
        else:
            return {
                'warning': {
                    'status': True,
                    'message': f'Could not find optimal parameters to apply proximity fit: {opt_result.message}'
                }
            }

    @property
    def segments(self) -> List[Dict[str, Any]]:
        result = getattr(self, "_segments", None)
        if result:
            return self._segments
        return [
            {
                'p': self.model_p_name,
                'transform_type': self.default_transform_type,
            },
        ]


class model_segment_arps_4_parent(model_parent):
    def segment_arps_4_wp_set_before_peak(self, p, p_fixed):
        ret_p, ret_p_fixed = self.set_parameter(p, p_fixed, 'D1_eff', 0.99)
        ret_p, ret_p_fixed = self.set_parameter(p, p_fixed, 'minus_t_elf_t_peak', 60)
        ret_p, ret_p_fixed = self.set_parameter(p, p_fixed, 'b2', 1.1)

        return ret_p, ret_p_fixed

    def segment_arps_4_wp_set_after_peak(self, p, p_fixed, isExp=True):
        parameters = self.get_parameters_as_dict(p, p_fixed)
        q_peak = parameters['q_peak']

        old_minus_t0_t_first = parameters['minus_t0_t_first']
        old_minus_t_peak_t0 = parameters['minus_t_peak_t0']

        ret_p, ret_p_fixed = self.set_parameter(p, p_fixed, 'minus_t0_t_first', 0)
        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'minus_t_peak_t0',
                                                (old_minus_t_peak_t0 + old_minus_t0_t_first))

        adjusted_parameters = self.get_parameters_as_dict(ret_p, ret_p_fixed)
        new_t_first = adjusted_parameters['t_first']
        new_minus_t0_t_first = adjusted_parameters['minus_t0_t_first']
        new_minus_t_peak_t0 = adjusted_parameters['minus_t_peak_t0']
        new_t_peak = new_t_first + new_minus_t0_t_first + new_minus_t_peak_t0

        if isExp:
            backcasted_q0 = pred_exp(new_t_first, new_t_peak, q_peak, exp_D_eff_2_D(-100))
        else:
            b0 = parameters['b0']
            backcasted_q0 = pred_arps(new_t_first, new_t_peak, q_peak, arps_D_eff_2_D(-100, b0), b0)

        ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'q0', np.max([1e-3, backcasted_q0]))
        return ret_p, ret_p_fixed

    # build up
    def segment_arps_4_wp_buildup(
        self,
        p,
        p_fixed,
        t_peak,
        buildup_dict,
        raito_in_cum_fit=False,
        isExp=True,
    ):
        ret_p, ret_p_fixed = self.deepcopy_parameters(p, p_fixed)
        parameters = self.get_parameters_as_dict(p, p_fixed)

        q_peak = parameters['q_peak']

        t_first = parameters['t_first']
        minus_t0_t_first = parameters['minus_t0_t_first']
        minus_t_peak_t0 = parameters['minus_t_peak_t0']

        calculated_t_peak = t_first + minus_t0_t_first + minus_t_peak_t0

        if calculated_t_peak != t_peak:
            raise Exception('t_peak does not match fit result')
        if buildup_dict['apply']:
            t0 = t_peak - buildup_dict['days']
            if buildup_dict['apply_ratio']:
                q0 = q_peak * buildup_dict['buildup_ratio']
            else:
                q0 = parameters['q0']
                buildup_time = minus_t0_t_first + minus_t_peak_t0
                if buildup_time == 0:
                    q0 = q_peak
                else:
                    if isExp:
                        D0 = np.log(q_peak / q0) / buildup_time
                        q0 = q_peak * np.exp(-D0 * buildup_dict['days'])
                    else:
                        b0 = parameters['b0']
                        D0 = (np.power(q0 / q_peak, b0) - 1) / b0 / buildup_time
                        q0 = q_peak * np.power(1 + b0 * D0 * buildup_dict['days'], 1 / b0)

            ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'q0', q0)
            ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 't_first', t0)
            ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'minus_t0_t_first', 0)
            ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'minus_t_peak_t0', buildup_dict['days'])

        if raito_in_cum_fit:
            ret_p, ret_p_fixed = self.set_parameter(ret_p, ret_p_fixed, 'q0', q_peak * raito_in_cum_fit)

        return ret_p, ret_p_fixed
