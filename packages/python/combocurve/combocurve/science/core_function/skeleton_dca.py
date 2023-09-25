from copy import deepcopy
from enum import Enum, auto
from typing import Tuple

import numpy as np

from combocurve.science.optimization_module.optimizers import optimizers
from combocurve.science.core_function.setting_parameters import error_type
from combocurve.science.core_function.error_funcs import errorfunc_s
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.segment_models.shared.helper import calculate_true_monthly_cum, pred_exp, exp_get_D
from combocurve.science.forecast_models.shared.parent_model import model_parent

E = np.exp(1)


class RegressionType(Enum):
    RATE = auto()
    CUM = auto()


class get_dca:
    def __init__(self, random_seed=1):
        self.error_type = error_type
        self.data_freq = None
        self.optimizer = 'my_differential_evolution'
        self.pop_size = 15
        self.random_seed = random_seed
        self.random_seeds = []
        self.max_ite = None

    def get_optimization_para_dict(self):
        """get_optimization_para_dict
        Returns: dictionary that represents all the named arguments to
        'scipy.optimize.differential_evolution'
        """
        return {
            "popsize": self.pop_size,
            "seed": self.random_seed,
            "maxiter": self.max_ite,
            'random_seeds': self.random_seeds
        }

    def set_optimizer(self, optimizer):
        self.optimizer = optimizer

    def set_seed(self, seed):
        self.random_seed = seed

    def set_seeds(self, seeds):
        self.random_seeds = seeds

    def set_maxite(self, max_ite):
        self.max_ite = max_ite

    def set_errortype(self, errortype):
        self.error_type = errortype

    def set_pop_size(self, pop_size):
        self.pop_size = pop_size

    def set_freq(self, data_freq):
        self.data_freq = data_freq

    def get_params(
        self,
        data,
        t_peak,
        label,
        model_name,
        ranges=None,
        filter_type: str = None,
        penalization_params=None,
        using_weight=False,
        p2seg_dict=None,
        regression_type: RegressionType = RegressionType.RATE,
        resolution: str = None,
    ) -> Tuple[Tuple[float, ...], Tuple[float, ...]]:
        # Select model based on name.
        this_model: model_parent = mm.models[model_name]

        # Set error type for Fulford models.
        if model_name in ['arps_fulford', 'arps_modified_fulford', 'arps_linear_flow_fulford']:
            self.set_errortype('mean_residual_normal_ll')

        # Split data in segements.
        p_fixed, p_range_segments, data_transformed_segments = this_model.prepare_segments(
            data, t_peak, self.data_freq, filter_type, p2seg_dict)

        # Keep track of parameter's state between optimizer callbacks.
        p_state = [None for _ in range(len(this_model.model_p_name))]
        # For each segment: get indicies, set initial parameter state, user
        # defined ranges if any..
        p_idxx_segments = []
        for p_range, data_transformed, segment in zip(p_range_segments, data_transformed_segments, this_model.segments):
            # Get the indicies of the parameters used in this segment.
            p_idxx = list(map(this_model.model_p_name.index, segment["p"]))
            p_idxx_segments.append(p_idxx)

            # If user defines parameter ranges, redefine them.
            if ranges is not None:
                # Update all (if any) user defined ranges indicies that apply to
                # current segment.
                for ind, range_ in zip(ranges['ind'], ranges['range']):
                    if ind in p_idxx:
                        p_range[p_idxx.index(ind)] = range_

            # Use each parameter bound's mean as default parameter state.
            for p_idx, p_bounds in zip(p_idxx, p_range):
                p_bounds_mean = np.array(p_bounds).mean()
                p_state[p_idx] = p_bounds_mean

        # For each data segment, update the model's optimal parameters.
        for p_range, data_transformed, p_idxx in zip(p_range_segments, data_transformed_segments, p_idxx_segments):
            # Create penalization function from data and user parameters.
            penalize_func = this_model.get_penalize(data_transformed, penalization_params)
            # Setup kw dict for scipy.optimize.differential_evolution.
            optimization_para_dict = self.get_optimization_para_dict()
            # See 'self.diff_evo_callback'.

            # Only calculate true monthly cumulative if regression type is 'cum'.
            cum_true = None
            if regression_type == RegressionType.CUM and resolution == 'monthly':
                cum_true = calculate_true_monthly_cum(data_transformed)

            cum_params = {
                'cum_true': cum_true,
                'predict_cum_volume': this_model.predict_cum_volume,
                'resolution': resolution,
            }

            optimization_para_dict['args'] = (
                this_model.func,
                penalize_func,
                errorfunc_s[self.error_type],
                data_transformed,
                p_fixed,
                using_weight,
                p_state,
                p_idxx,
                regression_type,
                p2seg_dict,
                cum_params,
            )
            optimization_para_dict['bounds'] = p_range

            # If no data than use the mean parameter bounds for the segment.
            if len(data_transformed) == 0:
                continue
            # Feed parameters to optimizer for optimizing... and get result.
            result = optimizers[self.optimizer](self.diff_evo_callback, optimization_para_dict)
            # Parameter state needs one last update.
            for i, p_idx in enumerate(p_idxx):
                p_state[p_idx] = result.x[i]

        # Convert p_state to numpy array.
        p_state = np.array(p_state)

        return p_state, p_fixed

    def diff_evo_callback(self, p_state_segment, *args):
        # Expand args set in 'self.get_params' loops.
        (
            func,
            penalize_func,
            err_func,
            transformed_data,
            fixed_p,
            using_weight,
            p_state,
            p_idxx,
            regression_type,
            p2seg_dict,
            cum_params,
        ) = args

        # Get updated parameters whose names are used in this segment.
        for i, p_idx in enumerate(p_idxx):
            p_state[p_idx] = p_state_segment[i]

        if using_weight:
            weight = transformed_data[:, 2]
        else:
            weight = None

        resolution = cum_params.get('resolution')
        cum_true = cum_params.get('cum_true')
        predict_cum_volume_func = cum_params.get('predict_cum_volume')

        if regression_type == RegressionType.CUM and resolution == 'monthly':
            cum_true = np.copy(cum_true)
            cum_pred = predict_cum_volume_func(transformed_data[:, 0], p_state, fixed_p, p2seg_dict)
            # Uncomment below to use full cums, instead of month-to-month cums
            cum_true = np.cumsum(cum_true)
            cum_pred = np.cumsum(cum_pred)
            loss = err_func(cum_true, cum_pred, weight)

        else:
            # Default behavior, currently only for `RegressionType.RATE`
            pred = func(transformed_data[:, 0], p_state, fixed_p)
            loss = err_func(transformed_data[:, 1], pred, weight)

        loss_penalized = penalize_func(loss, p_state, fixed_p)
        return loss_penalized

    def update_para(self, p, p_fixed, model_name, para_name, para_value):
        """update_para takes in both lists of parameters ( optimizable and fixed )
        as well as the name and value of the parameter to update.

        If the parameter (optimizable and/or fixed) has the same corresponding
        name 'para_name', as specified by the models name parameters, then it
        will be updated to the new parameter value 'para_value'.
        """

        model_p_name = mm.models[model_name].model_p_name
        model_p_fixed_name = mm.models[model_name].model_p_fixed_name
        ret_p = deepcopy(p)
        ret_p_fixed = deepcopy(p_fixed)
        for i, name in enumerate(model_p_name):
            if name == para_name:
                ret_p[i] = para_value

        for i, name in enumerate(model_p_fixed_name):
            if name == para_name:
                ret_p_fixed[i] = para_value

        return ret_p, ret_p_fixed

    def get_q0(self, transformed_data, t_peak, using_weight):
        t0 = transformed_data[0, 0]
        bp_mask = transformed_data[:, 0] <= t_peak
        bp_data = transformed_data[bp_mask, :]
        q_peak = bp_data[-1, 1]
        if bp_data.shape[0] > 1:

            def err(x):
                q0 = x[0]
                D0 = exp_get_D(t0, q0, t_peak, q_peak)
                t_pred = bp_data[:, 0]
                y_pred = pred_exp(t_pred, t0, q0, D0)
                y_true = bp_data[:, 1]
                if using_weight:
                    weight = bp_data[:, 2]
                else:
                    weight = None

                return errorfunc_s[self.error_type](y_true, y_pred, weight)

            optimization_para_dict = self.get_optimization_para_dict()
            q0_left = 1e-2
            if q0_left >= q_peak:
                q0_left = np.min(bp_data[:, 1])
            optimization_para_dict['bounds'] = [(q0_left, q_peak)]
            result = optimizers[self.optimizer](err, optimization_para_dict)
            q0 = result.x[0]
        else:
            q0 = q_peak
        return q0

    def get_range(self, model_name, para_dict, label):
        ret_ind = []
        ret_range = []
        model_p_name = mm.models[model_name].model_p_name
        name_list = np.array(model_p_name)
        for name in list(para_dict.keys()):
            ind_list = np.argwhere(name_list == name)
            if (len(ind_list) == 0):
                continue
            else:
                ret_ind += [ind_list[0, 0]]
                # The user supplied ranges are not exactly equal to parameters used in fit for this model.
                # Need to modify.
                if model_name == 'arps_linear_flow_fulford' and name == 'minus_t_elf_t_peak':
                    t_low = para_dict[name][0] / (E - 1)
                    t_high = para_dict[name][1] / (E - 1)
                    ret_range += [(t_low, t_high)]
                else:
                    ret_range += [tuple(para_dict[name])]

        ret_dict = {'ind': ret_ind, 'range': ret_range}
        return ret_dict
