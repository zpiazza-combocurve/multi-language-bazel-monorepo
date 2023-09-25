from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (arps_modified_switch, arps_D_eff_2_D, arps_D_2_D_eff,
                                                             exp_D_2_D_eff, exp_D_eff_2_D)

multi_seg = MultipleSegments()


def calculate_connect_q(series_forecast, start_idx, model_params):
    warning = ''
    match_seg_idx = None
    for cut_i, cut_segment in enumerate(series_forecast):
        if cut_segment['start_idx'] <= start_idx and cut_segment['end_idx'] >= start_idx:
            break

    if series_forecast[cut_i]['q_start'] == 0:
        exist_non_0 = False
        for i in range(cut_i, -1, -1):
            if series_forecast[i]['q_start'] > 0:
                exist_non_0 = True
                break

        if exist_non_0:
            non0_seg = series_forecast[i]
            match_q_idx = non0_seg['end_idx']
            add_q_start = multi_seg.predict([match_q_idx], [non0_seg])[0]
            match_seg_idx = i
            success = True
        else:
            add_q_start = model_params.get('q_start')
            match_seg_idx = None
            match_q_idx = None
            success = True
            warning = ' Connect to previous q failed due to all previous segments being 0. Use defualt q_start.'
    else:
        non0_seg = series_forecast[cut_i]
        match_q_idx = start_idx
        add_q_start = multi_seg.predict([match_q_idx], [non0_seg])[0]
        match_seg_idx = cut_i
        success = True

    return success, warning, add_q_start, match_seg_idx, match_q_idx


def calculate_match_slope(series_forecast, added_seg, match_seg_idx, match_q_idx):
    warning = ''
    if match_seg_idx is None:
        success = True
        warning = ' Connecting does not apply, hence matching slope does not apply. Use default slope'
        updates = {}
    else:
        mat_segment = series_forecast[match_seg_idx]
        mat_segment_slope = mat_segment['slope']
        added_segment_slope = added_seg['slope']
        if mat_segment_slope == 0:
            success = True
            warning = ' Connected segment is {} which has slope 0. Thus does not match slope.'.format(
                mat_segment['name'])
            updates = {}
        elif added_segment_slope == 0:
            success = True
            warning = ' Added segment is {} which has slope 0. Thus does not match slope.'.format(mat_segment['name'])
            updates = {}
        elif mat_segment_slope != added_segment_slope:
            success = True
            warning = ' Connected segment is {} which has negative sign of slope from added segment.'.format(
                mat_segment['name']) + ' Thus does not match slope.'
            updates = {}
        else:
            success = True
            match_slope = multi_seg.get_segment_object(mat_segment).slope([match_q_idx])[0]
            added_name = added_seg['name']
            update_D = -match_slope / added_seg['q_start']
            if added_name == 'arps':
                b = added_seg['b']
                update_D_eff = arps_D_2_D_eff(update_D, b)
                updates = {'D': update_D, 'D_eff': update_D_eff}
            elif added_name == 'arps_modified':
                b = added_seg['b']
                update_D_eff = arps_D_2_D_eff(update_D, b)
                #                added_q_start = added_seg['q_start']
                #                added_start_idx = added_seg['start_idx']
                updates = {'D': update_D, 'D_eff': update_D_eff}
            else:
                update_D_eff = exp_D_2_D_eff(update_D)
                updates = {'D': update_D, 'D_eff': update_D_eff}

    return success, warning, updates


def add_seg_init_exp_inc(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('exp_inc')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['D_eff'] = params['D_eff']
    added_seg['D'] = exp_D_eff_2_D(params['D_eff'])
    if len(series_forecasts) == 0:
        success = True
        ret_warning = ''
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                if params['match_previous_slope']:
                    slope_success, slope_warning, slope_updates = calculate_match_slope(
                        series_forecasts, added_seg, match_seg_idx, match_q_idx)
                    ret_warning += slope_warning
                    success = slope_success
                    if not slope_success:
                        added_seg = None
                    else:
                        added_seg.update(slope_updates)
                        success = True
        else:
            success = True
            ret_warning = ''
    return success, ret_warning, added_seg


def add_seg_init_exp_dec(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('exp_dec')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['D_eff'] = params['D_eff']
    added_seg['D'] = exp_D_eff_2_D(params['D_eff'])
    if len(series_forecasts) == 0:
        ret_warning = ''
        success = True
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                if params['match_previous_slope']:
                    slope_success, slope_warning, slope_updates = calculate_match_slope(
                        series_forecasts, added_seg, match_seg_idx, match_q_idx)
                    ret_warning += slope_warning
                    success = slope_success
                    if not slope_success:
                        added_seg = None
                    else:
                        added_seg.update(slope_updates)
                        success = True
        else:
            ret_warning = ''
            success = True
    return success, ret_warning, added_seg


def add_seg_init_arps(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('arps')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['D_eff'] = params['D_eff']
    added_seg['b'] = params['b']
    added_seg['D'] = arps_D_eff_2_D(params['D_eff'], params['b'])
    if len(series_forecasts) == 0:
        ret_warning = ''
        success = True
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                if params['match_previous_slope']:
                    slope_success, slope_warning, slope_updates = calculate_match_slope(
                        series_forecasts, added_seg, match_seg_idx, match_q_idx)
                    ret_warning += slope_warning
                    success = slope_success
                    if not slope_success:
                        added_seg = None
                    else:
                        added_seg.update(slope_updates)
                        success = True
        else:
            ret_warning = ''
            success = True
    return success, ret_warning, added_seg


def add_seg_init_arps_inc(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('arps_inc')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['D_eff'] = params['D_eff']
    added_seg['b'] = params['b']
    added_seg['D'] = arps_D_eff_2_D(params['D_eff'], params['b'])
    if len(series_forecasts) == 0:
        ret_warning = ''
        success = True
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                if params['match_previous_slope']:
                    slope_success, slope_warning, slope_updates = calculate_match_slope(
                        series_forecasts, added_seg, match_seg_idx, match_q_idx)
                    ret_warning += slope_warning
                    success = slope_success
                    if not slope_success:
                        added_seg = None
                    else:
                        added_seg.update(slope_updates)
                        success = True
        else:
            ret_warning = ''
            success = True
    return success, ret_warning, added_seg


def add_seg_init_arps_modified(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('arps_modified')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['D_eff'] = params['D_eff']
    added_seg['b'] = params['b']
    added_seg['D'] = arps_D_eff_2_D(params['D_eff'], params['b'])
    added_seg['target_D_eff_sw'] = params['target_D_eff_sw']
    if len(series_forecasts) == 0:
        ret_warning = ''
        success = True
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                if params['match_previous_slope']:
                    slope_success, slope_warning, slope_updates = calculate_match_slope(
                        series_forecasts, added_seg, match_seg_idx, match_q_idx)
                    success = slope_success
                    ret_warning += slope_warning
                    if not slope_success:
                        added_seg = None
                    else:
                        added_seg.update(slope_updates)
        else:
            ret_warning = ''
            success = True

    if added_seg is not None:
        D_lim_eff = added_seg['target_D_eff_sw']
        b = added_seg['b']
        D = added_seg['D']
        added_start_idx = added_seg['start_idx']
        switch_info = arps_modified_switch(added_start_idx, b, D, D_lim_eff)
        realized_D_eff_sw = switch_info['realized_D_eff_sw']
        sw_idx = switch_info['sw_idx']
        D_exp = switch_info['D_exp']
        D_exp_eff = switch_info['D_exp_eff']

        use_arps_seg = {'name': 'arps'}
        for k in ['q_start', 'start_idx', 'D', 'b']:
            use_arps_seg[k] = added_seg[k]
        q_sw = multi_seg.get_segment_object(use_arps_seg).predict([sw_idx])[0]
        updates = {
            'q_sw': q_sw,
            'sw_idx': sw_idx,
            'realized_D_eff_sw': realized_D_eff_sw,
            'D_exp': D_exp,
            'D_exp_eff': D_exp_eff
        }
        added_seg.update(updates)

    return success, ret_warning, added_seg


def add_seg_init_flat(series_forecasts, start_idx, params):
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('flat')
    added_seg['start_idx'] = start_idx
    added_seg['q_start'] = params['q_start']
    added_seg['c'] = params['q_start']
    if len(series_forecasts) == 0:
        ret_warning = ''
        success = True
    else:
        if params['connect_to_previous']:
            connect_success, connect_warning, add_q_start, match_seg_idx, match_q_idx = calculate_connect_q(
                series_forecasts, start_idx, params)
            ret_warning += connect_warning
            success = connect_success
            if not connect_success:
                added_seg = None
            else:
                added_seg['q_start'] = add_q_start
                added_seg['c'] = add_q_start
        else:
            ret_warning = ''
            success = True
    return success, ret_warning, added_seg


def add_seg_init_empty(series_forecasts, start_idx, param):
    success = True
    ret_warning = ''
    added_seg = multi_seg.get_segment_template('empty')
    added_seg['start_idx'] = start_idx

    return success, ret_warning, added_seg


add_seg_init = {
    'exp_inc': add_seg_init_exp_inc,
    'exp_dec': add_seg_init_exp_dec,
    'arps': add_seg_init_arps,
    'arps_modified': add_seg_init_arps_modified,
    'flat': add_seg_init_flat,
    'empty': add_seg_init_empty,
    'arps_inc': add_seg_init_arps_inc
}
