from combocurve.shared.constants import PHASES
from copy import deepcopy
from combocurve.shared.date import days_from_1900
from datetime import date, datetime


def check_None_and_update(input_dict, key, value):
    if value is not None:
        input_dict[key] = value


# TODO: We should validate all of the setting fields from the front end here.
def _adjust_edge_values(raw_para_dict):
    if raw_para_dict['time_dict']['mode'] != 'absolute_range':
        raw_para_dict['time_dict']['absolute_range'] = None

    if 'b' in raw_para_dict and raw_para_dict['b'][0] == 0:
        raw_para_dict['b'][0] = 1e-5

    if 'b' in raw_para_dict and raw_para_dict['b'][1] == 0:
        raw_para_dict['b'][1] = 1e-5

    if 'q_final' in raw_para_dict and raw_para_dict['q_final'] == 0:
        raw_para_dict['q_final'] = 1e-2

    if 'b2' in raw_para_dict and raw_para_dict['b2'][0] == 0:
        raw_para_dict['b2'][0] = 1e-5

    if 'b2' in raw_para_dict and raw_para_dict['b2'][1] == 0:
        raw_para_dict['b2'][1] = 1e-5

    for time_range in ['minus_t1_t_peak', 'minus_t_elf_t_peak']:
        if time_range in raw_para_dict:
            raw_para_dict[time_range][0] = max(raw_para_dict[time_range][0] - 1, 0)
            raw_para_dict[time_range][1] = max(raw_para_dict[time_range][1] - 1, 0)

    adjust_D_eff_values(raw_para_dict)


def adjust_D_eff_values(raw_para_dict):
    model_name = raw_para_dict.get('model_name')

    if 'D_lim_eff' in raw_para_dict:
        if type(raw_para_dict['D_lim_eff']) == list:
            raw_para_dict['D_lim_eff'][0] /= 100
            raw_para_dict['D_lim_eff'][1] /= 100
        else:
            raw_para_dict['D_lim_eff'] /= 100

    if raw_para_dict.get('enforce_sw') and raw_para_dict.get('D_lim_eff'):
        D_eff_lower_bound = raw_para_dict.get('D_lim_eff')
    else:

        if model_name == 'arps_inc':
            D_eff_lower_bound = 1e-5 - 1000000
        else:
            D_eff_lower_bound = 1e-5

    D_eff_params = ['D_eff', 'D1_eff', 'D_eff_exp', 'D_eff_arps', 'D2_eff']

    if model_name == 'exp_dec_arps_modified_free_peak_different':
        D_eff_params = ['D_eff_arps']
        raw_para_dict['D_eff_exp'][0] /= 100
        raw_para_dict['D_eff_exp'][1] /= 100

    for D_key in D_eff_params:
        if D_key in raw_para_dict:
            raw_para_dict[D_key][0] /= 100
            raw_para_dict[D_key][1] /= 100
            if raw_para_dict[D_key][0] < D_eff_lower_bound:
                raw_para_dict[D_key][0] = D_eff_lower_bound

            if raw_para_dict[D_key][1] < D_eff_lower_bound:
                raw_para_dict[D_key][1] = D_eff_lower_bound


def get_para_dicts(settings):
    ret = {}
    for phase in PHASES:
        phase_para_dict = {**settings['shared'], **settings[phase], 'valid_idx': settings.get('valid_idx')}
        _adjust_edge_values(phase_para_dict)
        ret[phase] = phase_para_dict
    return ret


def adjust_para_dict_for_header_range(para_dicts, cur_phase, well_phase):
    this_para_dicts = deepcopy(para_dicts)
    if (this_para_dicts[cur_phase]['time_dict']['mode'] == 'header_range'):
        date_headers = para_dicts[cur_phase]['time_dict']['header_range']
        this_para_dicts[cur_phase]['time_dict']['mode'] = 'absolute_range'
        abs_range = [-100000, 100000]
        ## hornor the order user provide instead of we decide based on the sign of range[0] - range[1]
        for i in range(2):
            this_date = well_phase['headers'].get(date_headers[i])
            if this_date and type(this_date) in [date, datetime]:
                abs_range[i] = days_from_1900(well_phase['headers'].get(date_headers[i]))

        this_para_dicts[cur_phase]['time_dict']['absolute_range'] = abs_range
    return this_para_dicts


def get_para_dict_date_headers(phases, para_dicts):
    date_headers = dict.fromkeys(phases)
    for phase in phases:
        if para_dicts[phase]['time_dict']['mode'] == 'header_range':
            date_headers[phase] = para_dicts[phase]['time_dict']['header_range']
        else:
            date_headers[phase] = []

    all_date_headers = []
    for phase in phases:
        for one_header in date_headers[phase]:
            if one_header not in all_date_headers:
                all_date_headers += [one_header]
    return all_date_headers
