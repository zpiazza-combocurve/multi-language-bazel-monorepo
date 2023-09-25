from combocurve.science.forecast_models.models.arps_inc import model_arps_inc
from combocurve.science.segment_models.shared.helper import arps_D_eff_2_D
from combocurve.science.forecast_models.shared.segment_shared import arps_inc_ratio_para_2_seg


class model_ratio_t_arps_inc(model_arps_inc):
    def __init__(self):
        super().__init__()
        self.model_name = 'ratio_t_arps_inc'

    def get_p2seg_dict(self, para_dict, t_end_data_t_end_life):
        ret = {
            't_end_data': t_end_data_t_end_life['t_end_data'],
            't_end_life': t_end_data_t_end_life['t_end_life'],
        }
        return ret

    def p2seg(self, p, p_fixed, p2seg_dict):
        t_end_life = p2seg_dict['t_end_life']
        t_end_data = p2seg_dict['t_end_data']

        [q_first, D_eff, b] = p
        D = arps_D_eff_2_D(D_eff, b)
        [t_first] = p_fixed

        return arps_inc_ratio_para_2_seg(t_end_life, t_end_data, None, D, b, t_first, q_first)
