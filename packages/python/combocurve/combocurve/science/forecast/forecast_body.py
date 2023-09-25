from copy import deepcopy
import numpy as np
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.science.core_function.class_func1 import func1
from combocurve.science.core_function.class_func3 import func3
from combocurve.science.core_function.class_func4 import func4
from combocurve.science.core_function.class_func5 import func5
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.forecast_models.model_manager import mm

multi_seg = MultipleSegments()


class forecast_body:
    def body(self, well_phase, para_dict, is_deterministic=False):
        f1 = func1()
        well_prod = np.array([well_phase['production']['index'], well_phase['production']['value']],
                             dtype=float).transpose()
        #well_prod = well_prod[~np.isnan(well_prod).any(axis=1), :]  ## remove nan rows
        well_prod[well_prod[:, 1] < 0, 1] = 0  ## change <0 data to 0
        if (well_phase['data_freq'] == 'monthly'):
            well_prod[:, 1] = well_prod[:, 1] / DAYS_IN_MONTH

        cur_phase = well_phase['phase']
        this_model = mm.models[para_dict[cur_phase]['model_name']]
        prob_para = this_model.prob_para
        para_dict[cur_phase]['prob_para'] = prob_para

        fun1input = {
            'data': {
                'idx': well_prod[:, 0].tolist(),
                'value': well_prod[:, 1].tolist()
            },
            'phase': cur_phase,
            'well_id': well_phase['well'],
            'para_dict': para_dict[cur_phase],
            'data_freq': well_phase['data_freq']
        }

        f1_ret = f1.body(fun1input)
        f1_ret['is_deterministic'] = is_deterministic
        goto = deepcopy(f1_ret['goto'])
        # Currently impossible due to removal of ML.
        if goto == 2:
            raise Exception('Reached the ML branch, but ML has been disabled.')
        if goto == 3:
            if is_deterministic:
                out = self.get_deterministic_3_out(f1_ret, this_model, para_dict[cur_phase])
            else:
                out = func3().body(f1_ret)
        elif goto == 4:
            out = func4().body(f1_ret)
        else:
            out = func5().body(f1_ret)  ## should not return anything other than warning message

        well_prod = well_prod[~np.isnan(well_prod).any(axis=1), :]
        out = cal_eur(out, goto, well_prod[:, 0], well_prod[:, 1], para_dict[cur_phase], well_phase['data_freq'])
        if is_deterministic and out['P_dict'] is not None:
            out['ratio'] = {
                'segments': [],
                'diagnostics': {},
                'basePhase': None,
                'x': None,
            }
        if out['P_dict'] is not None:
            if len(out['P_dict']['best']['segments']) > 0:
                out['forecasted'] = True
            else:
                out['forecasted'] = None

        return out, well_prod

    def get_deterministic_3_out(self, f1_ret, this_model, para_dict):
        best_p = f1_ret['fit']['p']
        best_p_fixed = f1_ret['fit']['p_fixed']
        p2seg_dict = this_model.get_p2seg_dict(para_dict, f1_ret)
        best_segs = this_model.p2seg(best_p, best_p_fixed, p2seg_dict)
        for seg in best_segs:
            for k, v in seg.items():
                if type(v) != str:
                    seg[k] = float(v)
        return {
            'P_dict': {
                'best': {
                    'segments': best_segs,
                    'diagnostics': {}
                }
            },
            'diagnostics': {},
            'forecastType': 'rate',
            'forecastSubType': 'automatic',
            'warning': {
                'status': False,
                'message': ''
            }
        }


# Removed fun2. This was only used in ML branch which is currently disabled.


def cal_eur(out, goto, sort_idx, sort_value, para_dict, data_freq):
    if out['P_dict'] is None:
        return out
    best_seg = out['P_dict']['best']['segments']
    if len(best_seg) > 0:
        ### calculate eur ratio
        cum_data = np.sum(sort_value)
        if len(sort_idx) > 0:
            end_data_idx = sort_idx[-1]
        else:
            end_data_idx = out['P_dict']['best']['segments'][0]['start_idx'] - 100
        eur_list = {}
        for sery_name, sery in out['P_dict'].items():
            this_segment = sery['segments']
            this_eur = multi_seg.eur(cum_data, end_data_idx, this_segment[0]['start_idx'], this_segment[-1]['end_idx'],
                                     this_segment, data_freq)
            eur_list[sery_name] = this_eur

        ratio_dict = {}
        for sery_name, sery_eur in eur_list.items():
            if sery_name != 'best':
                if eur_list['P50'] == 0:
                    ratio_dict[sery_name] = 1
                else:
                    ratio_dict[sery_name] = float(sery_eur / eur_list['P50'])
    else:
        percentile_names = ['P' + str(p) for p in para_dict['percentile']]
        ratio_dict = {k: 1 for k in percentile_names}

    out['p_extra'] = {'eur_ratio': ratio_dict}
    return out
