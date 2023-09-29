import numpy as np
import re
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.segment_models.shared.helper import (pred_exp, pred_arps, pred_linear, arps_get_D_delta,
                                                             arps_D_2_D_eff, linear_k_2_D_eff)

multi_seg = MultipleSegments()
BASE_DATE_NP = np.datetime64('1900-01-01')


def _check_arps_if_extendable(seg):
    return (1 - seg['b'] * seg['D'] * 0.5) > 0


def _get_flat_segment(start_idx, q_start):
    return {
        'name': 'flat',
        'slope': 0,
        'c': q_start,
        'q_start': q_start,
        'q_end': q_start,
        'start_idx': start_idx,
        'end_idx': start_idx + 1
    }


# adjust_export_segment
def adjust_segments(segments):
    ret = []
    for seg in segments:
        ret += _adjust_segment(seg)
    return ret


def _adjust_segment(seg: dict) -> list[dict]:
    segment_type = seg['name']
    new_end_idx = seg['end_idx'] + 1

    if segment_type in ['exp_inc', 'exp_dec']:
        new_q_start = pred_exp(seg['start_idx'] - 0.5, seg['start_idx'], seg['q_start'], seg['D'])
        new_q_end = pred_exp(seg['end_idx'] + 0.5, seg['start_idx'], seg['q_start'], seg['D'])
        return [{**seg, 'q_start': new_q_start, 'q_end': new_q_end, 'end_idx': new_end_idx}]
    elif segment_type in ['arps', 'arps_inc']:
        if _check_arps_if_extendable(seg):
            new_start_idx = seg['start_idx'] - 0.5
        else:
            new_start_idx = seg['start_idx'] + 0.5

        new_q_end = pred_arps(seg['end_idx'] + 0.5, seg['start_idx'], seg['q_start'], seg['D'], seg['b'])
        new_q_start = pred_arps(new_start_idx, seg['start_idx'], seg['q_start'], seg['D'], seg['b'])
        new_d = arps_get_D_delta(seg['D'], seg['b'], new_start_idx - seg['start_idx'])
        new_d_eff = arps_D_2_D_eff(new_d, seg['b'])

        new_seg = {
            **seg, 'q_start': new_q_start,
            'q_end': new_q_end,
            'D': new_d,
            'D_eff': new_d_eff,
            'end_idx': new_end_idx
        }

        if _check_arps_if_extendable(seg):
            return [new_seg]
        else:
            return [_get_flat_segment(seg['start_idx'], seg['q_start']), {**new_seg, 'start_idx': seg['start_idx'] + 1}]

    elif segment_type == 'arps_modified':
        if _check_arps_if_extendable(seg):
            new_start_idx = seg['start_idx'] - 0.5
        else:
            new_start_idx = seg['start_idx'] + 0.5

        if seg['end_idx'] + 0.5 <= seg['sw_idx']:
            new_q_end = pred_arps(seg['end_idx'] + 0.5, seg['start_idx'], seg['q_start'], seg['D'], seg['b'])
        else:
            new_q_end = pred_exp(seg['end_idx'] + 0.5, seg['sw_idx'], seg['q_sw'], seg['D_exp'])

        new_q_start = pred_arps(new_start_idx, seg['start_idx'], seg['q_start'], seg['D'], seg['b'])
        new_d = arps_get_D_delta(seg['D'], seg['b'], new_start_idx - seg['start_idx'])
        new_d_eff = arps_D_2_D_eff(new_d, seg['b'])

        new_seg = {
            **seg, 'q_start': new_q_start,
            'q_end': new_q_end,
            'D': new_d,
            'D_eff': new_d_eff,
            'end_idx': new_end_idx
        }

        if _check_arps_if_extendable(seg):
            return [new_seg]
        else:
            return [_get_flat_segment(seg['start_idx'], seg['q_start']), {**new_seg, 'start_idx': seg['start_idx'] + 1}]

    elif segment_type == 'linear':
        k = seg.get('k')
        if not k:
            return [{**seg, 'end_idx': new_end_idx}]

        naive_q_start = pred_linear(seg['start_idx'] - 0.5, seg['q_start'], seg['start_idx'], k)
        naive_q_end = pred_linear(seg['end_idx'] + 0.5, seg['q_start'], seg['start_idx'], k)
        if k > 0 and naive_q_start <= 0:
            new_q_start = pred_linear(seg['start_idx'] + 0.5, seg['q_start'], seg['start_idx'], k)
            new_d_eff = linear_k_2_D_eff(k, new_q_start)
            return [
                _get_flat_segment(seg['start_idx'], seg['q_start']), {
                    **seg, 'q_start': new_q_start,
                    'D_eff': new_d_eff,
                    'q_end': naive_q_end,
                    'start_idx': seg['start_idx'] + 1,
                    'end_idx': new_end_idx
                }
            ]

        new_d_eff = linear_k_2_D_eff(k, naive_q_start)
        if k < 0 and naive_q_end <= 0:
            new_q_end = pred_linear(seg['end_idx'] - 0.5, seg['q_start'], seg['start_idx'], k)
            return [
                {
                    **seg, 'q_start': naive_q_start,
                    'D_eff': new_d_eff,
                    'q_end': new_q_end
                },
                {  ## the formatter makes this place weird, doing this to hack around linter
                    **_get_flat_segment(seg['end_idx'], seg['q_end'])
                }
            ]

        return [{**seg, 'q_start': naive_q_start, 'D_eff': new_d_eff, 'q_end': naive_q_end, 'end_idx': new_end_idx}]

    else:  ## flat/empty
        return [{**seg, 'end_idx': new_end_idx}]


def clean_filename(filename):
    return re.sub(r'\W', '_', filename)
