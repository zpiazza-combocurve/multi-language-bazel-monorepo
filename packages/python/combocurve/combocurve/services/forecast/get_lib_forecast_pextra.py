import numpy as np
from combocurve.science.core_function.error_funcs import errorfunc_s
from combocurve.science.optimization_module.optimizers import optimizers


def get_lib_forecast_info(raw_data, best_fit_segments):
    ### raw_data need to adjusted to daily format
    ### 0's should be included

    no0_data = raw_data[raw_data[:, 1] > 0, :]
    ret = {}
    ### get t_peak
    if len(best_fit_segments) == 0:
        t_peak = None
        q_peak = None
    else:
        t_peak = best_fit_segments[0]['start_idx']
        q_peak = best_fit_segments[0]['q_start']
        for seg in best_fit_segments:
            if seg['q_start'] > q_peak:
                t_peak = seg['start_idx']
                q_peak = seg['q_start']

            if seg['q_end'] > q_peak:
                t_peak = seg['end_idx']
                q_peak = seg['q_end']

    ret['t_peak'] = t_peak
    ret['q_peak'] = q_peak

    ### t_first, q_first
    if raw_data.shape[0] == 0:
        ret['t_first'] = None
        ret['q_first'] = None
    else:
        ret['t_first'] = raw_data[0, 0]
        ret['q_first'] = raw_data[0, 1]

    ### t0, q0
    if no0_data.shape[0] == 0:
        ret['t0'] = None
        ret['q0'] = None
    else:
        ret['t0'] = no0_data[0, 0]
        ret['q0'] = no0_data[0, 1]

    ############################ get build_up information
    if no0_data.shape[0] > 0:
        t_buildup = t_peak - ret['t_first']
        if t_buildup == 0:
            D0 = None
            D0_no0 = None
        else:

            def alpha(p, *args):
                [q_first] = p
                bp_data, q_peak, t_peak, t_first = args
                t = bp_data[:, 0]
                y_true = bp_data[:, 1]
                D0 = (np.log(q_first) - np.log(q_peak)) / (t_peak - t_first)
                pred = q_peak * np.exp(-D0 * (t - t_peak))
                return errorfunc_s['log_mpe_add_eps'](y_true, pred)

            bp_data = raw_data[raw_data[:, 0] <= t_peak, :]
            no0_bp_data = bp_data[bp_data[:, 1] > 0, :]
            t_first = ret['t_first']

            min_q = np.min(bp_data[:, 1])
            max_q = np.max(bp_data[:, 0])
            if max_q == 0:
                D0 = None
                D0_no0 = None
            else:
                if min_q == 0:
                    min_q = min(1e-10, max_q)

                arg_first = bp_data, q_peak, t_peak, t_first
                optimization_para_dict = {
                    "seed": 1,
                    'random_seeds': [1, 2, 3],
                    'args': arg_first,
                    'bounds': [(min_q, max_q)],
                    'popsize': 15
                }
                result = optimizers['my_differential_evolution'](alpha, optimization_para_dict)
                q_first = result.x[0]
                D0 = (np.log(q_first) - np.log(q_peak)) / (t_peak - t_first)
                t0 = ret['t0']
                if t0 != t_first:
                    arg_no0 = no0_bp_data, q_peak, t_peak, t0
                    optimization_para_dict = {
                        "seed": 1,
                        'random_seeds': [1, 2, 3],
                        'args': arg_no0,
                        'bounds': [(min_q, max_q)],
                        'popsize': 15
                    }
                    result = optimizers['my_differential_evolution'](alpha, optimization_para_dict)
                    q_first_no0 = result.x[0]
                    D0_no0 = (np.log(q_first_no0) - np.log(q_peak)) / (t_peak - t0)
                else:
                    D0_no0 = D0

    else:
        t_buildup = None
        D0 = None
        D0_no0 = None
    ret['t_buildup'] = t_buildup
    ret['D0'] = D0
    ret['D0_no0'] = D0_no0
    return ret
