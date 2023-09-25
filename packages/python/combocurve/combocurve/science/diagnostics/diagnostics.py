import numpy as np
from combocurve.science.core_function.helper import parse_time_new
from combocurve.science.core_function.error_funcs import errorfunc_s
from combocurve.science.segment_models.shared.helper import convert_monthly_to_daily
from combocurve.shared.constants import DAYS_IN_YEAR, Q_MIN
from combocurve.science.diagnostics.diag_plugin import (get_last_months_prod_avg, get_well_life, item_lists,
                                                        build_default_items, extract_forecast_funcs,
                                                        limit_percentage_range, get_q_peak_items)
#############################


def plus(a, b):
    if (a is None) | (b is None):
        return None
    else:
        return a + b


def minus(a, b):
    if (a is None) | (b is None):
        return None
    else:
        return a - b


def multiply(a, b):
    if (a is None) | (b is None):
        return None
    else:
        return a * b


def divide(a, b):
    if (a is None) | (b is None):
        return None
    else:
        if b == 0:
            return None
        else:
            return a / b


def sself(a, b):
    return a


ops = {'+': plus, '-': minus, '*': multiply, '/': divide, 'self': sself}


class diagnostic:
    def __init__(self):
        self.ops = ops

    def body(self, diag_input):
        ana_out = self.analysis(**diag_input)
        t2_out = self.T2(ana_out)
        return t2_out

    def analysis(self, diag_data, phase_settings, base_forecast_resolution, series, diag_phases,
                 valid_diag_comparison_ids, diag_comparison_resolutions, remove_zeros, treat_nan_as_zero):
        items, item_names = build_default_items()
        header = diag_data['header']
        forecast_data = diag_data['forecast_data']

        sery_phase_funcs = self.get_sery_phase_funcs(forecast_data, diag_phases, series)
        compared_forecast_phase_funcs = self.get_compared_forecast_phase_funcs(diag_data, valid_diag_comparison_ids,
                                                                               diag_phases, 'best')

        ret = {phase: {} for phase in diag_phases}
        ret['main_id'] = diag_data['main_id']
        for phase in diag_phases:
            benchmark_data_freq = forecast_data[phase]['data_freq']
            phase_data_freq, phase_data, phase_cum_data, phase_end_data_idx, start_data_idx = self.get_phase_data(
                phase, benchmark_data_freq, benchmark_data_freq, base_forecast_resolution, diag_data, remove_zeros,
                treat_nan_as_zero)

            phase_time_dict = phase_settings[phase]['time_dict']
            phase_header_items = self.get_header_items(header, item_lists['header'])

            for sery in series:
                sery_phase_forecast_funcs = sery_phase_funcs[sery][phase]
                phase_forecast_items = self.get_forecast_items(sery_phase_forecast_funcs, item_lists['forecast'],
                                                               phase_cum_data, start_data_idx, phase_end_data_idx,
                                                               phase_data_freq)
                phase_error_items = self.get_error_items(sery_phase_forecast_funcs, item_lists['error'], phase_data,
                                                         phase_time_dict, phase_data_freq)

                forecast_data_count_pre = phase_data.shape[0]
                if not sery_phase_forecast_funcs['segments']:
                    forecast_data_count_post = None
                else:
                    forecast_data_count_post = int(
                        sum(phase_data[:, 0] >= sery_phase_forecast_funcs['segments'][0]['start_idx']))

                if forecast_data_count_pre == 0:
                    last_1_month_prod_avg = last_3_month_prod_avg = 0
                else:
                    last_1_month_prod_avg, last_3_month_prod_avg = get_last_months_prod_avg(phase_data, phase_data_freq)

                all_items = {
                    'production_data_count': forecast_data_count_pre,
                    'forecast_data_count': forecast_data_count_post,
                    'well_life': get_well_life(phase_data, sery_phase_forecast_funcs),
                    'last_1_month_prod_avg': last_1_month_prod_avg,
                    'last_3_month_prod_avg': last_3_month_prod_avg
                }
                get_q_peak_items(all_items, diag_data, phase)
                all_items.update(phase_header_items)
                all_items.update(phase_forecast_items)
                all_items.update(phase_error_items)

                # ret
                this_diag = self.apply_ops(all_items, items)

                # comparison
                for comp_forecast_str, comp_funcs in compared_forecast_phase_funcs.items():
                    comp_phase_funcs = comp_funcs[phase]
                    comp_data_freq, _, comp_cum_data, comp_end_data_idx, _ = self.get_phase_data(
                        phase, comp_phase_funcs['data_freq'], benchmark_data_freq,
                        diag_comparison_resolutions[comp_forecast_str], diag_data, remove_zeros, treat_nan_as_zero)
                    this_eur = comp_phase_funcs['eur'](comp_cum_data['all'], comp_end_data_idx, comp_data_freq)
                    this_eur_diff = this_eur - this_diag['eur']
                    if this_eur_diff == 0:
                        this_eur_diff_percent = 0
                    elif this_diag['eur'] == 0:
                        this_eur_diff_percent = None
                    else:
                        this_eur_diff_percent = this_eur_diff / this_diag['eur']
                    this_diag[comp_forecast_str] = {
                        'eur': this_eur,
                        'eur_diff': this_eur_diff,
                        'relative_eur_diff': limit_percentage_range(this_eur_diff_percent)
                    }

                ret[phase][sery] = this_diag

        return ret

    def T2(self, ana_out):
        return ana_out

    def apply_ops(self, component_dict, items):
        ret = {}
        for item in items:
            this_pre_key = item['preceding']['key']
            this_pre_value = component_dict[this_pre_key]

            this_op = item['operation']
            if this_op == 'self':
                this_name = this_pre_key
                this_value = this_pre_value
            else:
                this_post_key = item['posterior']['key']
                this_post_value = component_dict[this_post_key]
                this_name = this_pre_key + this_op + this_post_key
                this_value = self.ops[this_op](this_pre_value, this_post_value)

            ret[this_name] = this_value

        return ret

    def get_header_items(self, header, item_list):
        return {item: header.get(item) for item in item_list}

    def get_forecast_items(self, forecast_funcs, item_list, cum_data, start_data_idx, end_data_idx, data_freq):
        segments = forecast_funcs['segments']
        eur_func = forecast_funcs['eur']
        eur_year_func = forecast_funcs['eur_year']
        ret = {'eur': eur_func(cum_data['all'], end_data_idx, data_freq), 'cum': cum_data['all']}

        ### qi, ti
        if len(segments) == 0:
            b = None
            D_eff = None
            ti = None
            qi = None
            q_end = None
            forecast_end_date = None

            eur1 = cum_data['year_1']
            eur3 = cum_data['year_3']
            eur5 = cum_data['year_5']
            realized_D_eff_sw = None
            forecast_resolution = None
            forecast_start_date = None
        else:
            ti = -1
            b = segments[-1].get('b')
            D_eff = segments[-1].get('D_eff')
            realized_D_eff_sw = segments[-1].get('realized_D_eff_sw')
            forecast_resolution = data_freq
            forecast_start_date = int(segments[0].get('start_idx'))
            qi = segments[0].get('q_start')
            q_end = segments[-1].get('q_end')
            forecast_end_date = int(segments[-1].get('end_idx'))

            if not start_data_idx:
                start_data_idx = forecast_start_date
            eur1 = eur_year_func(cum_data['year_1'], end_data_idx, data_freq, start_data_idx, 1)
            eur3 = eur_year_func(cum_data['year_3'], end_data_idx, data_freq, start_data_idx, 3)
            eur5 = eur_year_func(cum_data['year_5'], end_data_idx, data_freq, start_data_idx, 5)

            #diag_plugin: extract_forecast_funcs split rate and ratio
            if segments[0]['name'] == 'ratio':
                forecast_end_date = int(segments[0].get('end_idx'))
                forecast_start_date = int(segments[0].get('start_idx'))
                ti = None
                if forecast_start_date == 1 and forecast_end_date == 0:
                    qi = None
                    q_end = None
                    forecast_start_date = None
                    forecast_end_date = None
                else:
                    qi = segments[0].get('ratio_q_i')[0]
                    q_end = segments[0].get('ratio_q_end')[0]

        ret.update({
            'ti': ti,
            'qi': qi,
            'forecast_end_date': forecast_end_date,
            'q_end': q_end,
            'b': b,
            'D_eff': D_eff,
            'realized_D_eff_sw': realized_D_eff_sw,
            'forecast_resolution': forecast_resolution,
            'forecast_start_date': forecast_start_date,
            'eur1': eur1,
            'eur3': eur3,
            'eur5': eur5,
        })
        return ret

    def get_error_items(self, forecast_funcs, item_list, phase_data, time_dict, data_freq):
        segments = forecast_funcs['segments']
        time_range = parse_time_new(phase_data, time_dict)
        if len(segments) > 0:
            time_range[0] = max(time_range[0], segments[0]['start_idx'])
            time_range[1] = min(time_range[1], segments[-1]['end_idx'])
            if time_range[1] < time_range[0]:
                time_range[1] = time_range[0]
        else:
            time_range = [1, 0]
        range_mask = (phase_data[:, 0] >= time_range[0]) & (phase_data[:, 0] <= time_range[1])
        nonan_mask = ~(np.isnan(phase_data).any(axis=1))
        comparison_data = phase_data[range_mask & nonan_mask, :]
        if data_freq == 'monthly':
            comparison_data[:, 1] = convert_monthly_to_daily(comparison_data[:, 0], comparison_data[:, 1])

        if comparison_data.shape[0] > 0:
            predict_func = forecast_funcs['predict']
            t = comparison_data[:, 0]
            y_true = comparison_data[:, 1]
            if data_freq == 'monthly':
                y_pred = convert_monthly_to_daily(t, predict_func(t))
            else:
                y_pred = predict_func(t)
            ret = {item: errorfunc_s[item](y_true, y_pred) for item in item_list}

            percentage_columns = ['cum_diff_percentage', 'median_ra', 'median_abs_ra']
            for col in percentage_columns:
                if col in ret:
                    ret[col] = limit_percentage_range(ret[col])

        else:
            ret = {item: None for item in item_list}
            ret['cum_diff'] = None
            ret['cum_diff_percentage'] = None

        return ret

    def get_sery_phase_funcs(self, forecast_data, diag_phases, series):
        sery_phase_funcs = {
            sery: {phase: extract_forecast_funcs(forecast_data, phase, sery)
                   for phase in diag_phases}
            for sery in series
        }
        return sery_phase_funcs

    def get_compared_forecast_phase_funcs(self, diag_data, valid_diag_comparison_ids, diag_phases, compare_sery):
        ret = {}
        for comp_forecast_id in valid_diag_comparison_ids:
            comp_forecast_id_str = str(comp_forecast_id)
            if diag_data.get(comp_forecast_id_str) is not None:
                this_forecast_data = diag_data[comp_forecast_id_str]
                this_forecast_sery_phase_funcs = self.get_sery_phase_funcs(this_forecast_data, diag_phases,
                                                                           [compare_sery])
                ret[comp_forecast_id_str] = this_forecast_sery_phase_funcs[compare_sery]

        return ret

    def get_phase_data(self,
                       phase,
                       phase_data_freq,
                       benchmark_data_freq,
                       resolution,
                       diag_data,
                       remove_zeros=False,
                       treat_nan_as_zero=False):
        use_data_freq = {
            'daily': 'daily',
            'monthly': 'monthly',
            'benchmark': benchmark_data_freq,
            'self': phase_data_freq
        }.get(resolution)
        exception_output = (use_data_freq, np.zeros((0, 2)), {'all': 0, 'year_1': 0, 'year_3': 0, 'year_5': 0}, 0, 0)
        if use_data_freq + '_production' not in diag_data:
            return exception_output

        phase_production = diag_data[use_data_freq + '_production']
        if ('index' not in phase_production) or (phase not in phase_production):
            return exception_output

        phase_data = np.array([phase_production['index'], phase_production[phase]], dtype=float).transpose()
        zero_mask = np.zeros(phase_data.shape[0], dtype=bool)
        nan_mask = np.zeros(phase_data.shape[0], dtype=bool)
        if treat_nan_as_zero:
            nan_mask[:] = np.isnan(phase_data[:, 1])
        if remove_zeros:
            zero_mask[:] = phase_data[:, 1] < Q_MIN
        phase_data[nan_mask, 1] = 0
        phase_data[zero_mask, 1] = None
        if phase_data.shape[0] == 0:
            return exception_output
        phase_cum_data = {}
        phase_cum_data['all'] = np.nansum(phase_data[:, 1])
        phase_cum_data['year_1'] = np.nansum(phase_data[phase_data[:, 0] <= (phase_data[0, 0] + DAYS_IN_YEAR - 1)][:,
                                                                                                                   1])
        phase_cum_data['year_3'] = np.nansum(
            phase_data[phase_data[:, 0] <= (phase_data[0, 0] + DAYS_IN_YEAR * 3 - 1)][:, 1])
        phase_cum_data['year_5'] = np.nansum(
            phase_data[phase_data[:, 0] <= (phase_data[0, 0] + DAYS_IN_YEAR * 5 - 1)][:, 1])

        phase_start_data_idx = phase_data[0, 0]
        phase_end_data_idx = phase_data[-1, 0]
        return use_data_freq, phase_data, phase_cum_data, phase_end_data_idx, phase_start_data_idx
