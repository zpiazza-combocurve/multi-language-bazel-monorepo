from copy import copy
import numpy as np
from typing import Any, Dict, List

from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.services.type_curve.tc_normalization_data_models import NORMALIZATION_FACTORS


# Moved to this file to fix circular dependency.
def update_ratio_or_P_dict(update_body, forecast_type):
    if forecast_type == 'ratio':
        update_body['ratio']['segments'] = None
    else:
        update_body['P_dict'] = {'best': {'segments': [], 'diagnostics': {}}}


# Moved to this file to fix circular dependency.
def clean_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    '''
    Proximity optimization results in segments that don't start or end at an integer. This wiggles the segment start
    and ends to the nearest integer.

    Params:
        segments: List of segments to clean up

    Returns:
        List of segments with start/end indices cleaned up.
    '''
    new_segments = copy(segments)
    for i, new_seg in enumerate(new_segments):
        old_seg = segments[i]
        if i == 0:
            new_seg['start_idx'] = round(new_seg['start_idx'])
        else:
            new_seg['start_idx'] = new_segments[i - 1]['end_idx'] + 1
        new_seg['end_idx'] = round(new_seg['end_idx'])
        predict = MultipleSegments([old_seg]).predict_self
        new_seg['q_start'] = float(predict(new_seg['start_idx']))
        new_seg['q_end'] = float(predict(new_seg['end_idx']))
    return new_segments


def proximity_normalization_multipliers_converter(multipliers: list[dict[str, float]]) -> dict[str, np.ndarray]:
    """
    Convert proximity normalization multipliers to the dictionary format

    Args:
        multipliers: the normalization multipliers in proximity document format

    Returns:
        dictionary: the normalization multipliers in dictionary format
    """

    n = len(multipliers)
    organized_mults = {norm_factor: np.ones(n, dtype=float) for norm_factor in NORMALIZATION_FACTORS}

    for i in range(n):
        multiplier = multipliers[i]
        for key in multiplier:
            organized_mults[key][i] = multiplier[key]

    return organized_mults
