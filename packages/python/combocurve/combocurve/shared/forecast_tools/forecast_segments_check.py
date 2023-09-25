from enum import Enum


class SegNames(Enum):
    empty = 'empty'
    flat = 'flat'
    linear = 'linear'
    exp_inc = 'exp_inc'
    exp_dec = 'exp_dec'
    arps = 'arps'
    arps_inc = 'arps_inc'
    arps_modified = 'arps_modified'


class SegDictKeys(Enum):
    name = 'name'
    #
    q_start = 'q_start'
    q_end = 'q_end'
    start_idx = 'start_idx'
    end_idx = 'end_idx'
    #
    slope = 'slope'
    d_eff = 'D_eff'
    d = 'D'
    b = 'b'
    #
    target_d_eff_sw = 'target_D_eff_sw'
    realized_d_eff_sw = 'realized_D_eff_sw'
    sw_idx = 'sw_idx'
    q_sw = 'q_sw'
    d_exp_eff = 'D_exp_eff'
    d_exp = 'D_exp'


def slope_check(slope, seg_name, seg_error_list):
    error_dict = {SegDictKeys.slope.value: slope}
    if slope is None:
        seg_error_list.append(error_dict)
    else:
        slope_check_1 = (seg_name in [
            SegNames.arps.value,
            SegNames.arps_modified.value,
            SegNames.exp_dec.value,
        ]) and (slope != -1)
        slope_check_2 = (seg_name in [SegNames.flat.value, SegNames.empty.value]) and (slope != 0)
        slope_check_3 = (seg_name == SegNames.exp_inc.value) and (slope != 1)

        if slope_check_1 or slope_check_2 or slope_check_3:
            seg_error_list.append(error_dict)


def d_eff_check(d_eff, seg_name, seg_error_list):
    error_dict = {SegDictKeys.d_eff.value: d_eff}
    if d_eff is None:
        seg_error_list.append(error_dict)
    else:
        d_eff_check_1 = (seg_name in [
            SegNames.arps.value,
            SegNames.arps_modified.value,
            SegNames.exp_dec.value,
        ]) and (d_eff <= 0 or d_eff >= 1)
        d_eff_check_2 = (seg_name in [SegNames.exp_inc.value, SegNames.arps_inc.value]) and (d_eff >= 0)
        if d_eff_check_1 or d_eff_check_2:
            seg_error_list.append(error_dict)


def d_check(d, seg_name, seg_error_list):
    error_dict = {SegDictKeys.d.value: d}
    if d is None:
        seg_error_list.append(error_dict)
    else:
        d_check_1 = (seg_name in [
            SegNames.arps.value,
            SegNames.arps_modified.value,
            SegNames.exp_dec.value,
        ]) and (d <= 0)
        d_check_2 = (seg_name in [SegNames.exp_inc.value, SegNames.arps_inc.value]) and (d >= 0)
        if d_check_1 or d_check_2:
            seg_error_list.append(error_dict)


def check_segment(segment, prev_seg_end_idx):
    seg_error_list = []
    seg_name = segment.get(SegDictKeys.name.value)

    if seg_name not in [element.value for element in SegNames]:
        seg_error_list.append({SegDictKeys.name.value: seg_name})

    # start_idx
    start_idx = segment.get(SegDictKeys.start_idx.value)
    if (start_idx is None) or (prev_seg_end_idx and start_idx != prev_seg_end_idx + 1):
        seg_error_list.append({SegDictKeys.start_idx.value: start_idx})

    # end_idx
    end_idx = segment.get(SegDictKeys.end_idx.value)
    if (end_idx is None) or (end_idx < start_idx):
        seg_error_list.append({SegDictKeys.end_idx.value: end_idx})

    if seg_name != SegNames.empty.value:
        # q_start
        q_start = segment.get(SegDictKeys.q_start.value)
        if (q_start is None) or (q_start < 0) or (q_start == 0 and seg_name != SegNames.flat.value):
            seg_error_list.append({SegDictKeys.q_start.value: q_start})
        # q_end
        q_end = segment.get(SegDictKeys.q_end.value)
        if (q_end is None) or (q_end < 0) or (q_end == 0 and seg_name != SegNames.flat.value):
            seg_error_list.append({SegDictKeys.q_end.value: q_end})

    # slope
    slope = segment.get(SegDictKeys.slope.value)
    slope_check(slope, seg_name, seg_error_list)

    if seg_name in [
            SegNames.arps.value,
            SegNames.arps_inc.value,
            SegNames.arps_modified.value,
            SegNames.exp_dec.value,
            SegNames.exp_inc.value,
    ]:
        # D_eff
        d_eff = segment.get(SegDictKeys.d_eff.value)
        d_eff_check(d_eff, seg_name, seg_error_list)

        # D
        d = segment.get(SegDictKeys.d.value)
        d_check(d, seg_name, seg_error_list)

    if seg_name in [SegNames.arps.value, SegNames.arps_inc.value, SegNames.arps_modified.value]:
        # b
        b = segment.get(SegDictKeys.b.value)
        if (b is None) or (b <= 0 and seg_name in [SegNames.arps.value, SegNames.arps_modified.value
                                                   ]) or (b >= 0 and seg_name == SegNames.arps_inc.value):
            seg_error_list.append({SegDictKeys.b.value: b})

    if seg_name == SegNames.arps_modified.value:
        # target_D_eff_sw
        target_d_eff_sw = segment.get(SegDictKeys.target_d_eff_sw.value)
        if (target_d_eff_sw is None) or (target_d_eff_sw <= 0) or (target_d_eff_sw >= 1):
            seg_error_list.append({SegDictKeys.b.value: b})

    return seg_error_list, end_idx


def check_forecast_segments(segments):
    segments_valid_bool = True
    prev_seg_end_idx = None

    ret_dict = {}

    for i, segment in enumerate(segments):
        seg_error_list, end_idx = check_segment(segment, prev_seg_end_idx)
        if seg_error_list:
            segments_valid_bool = False
            ret_dict[f'sef_{i}'] = {'error_list': seg_error_list, 'segment': segment}

        prev_seg_end_idx = end_idx

    return segments_valid_bool, ret_dict
