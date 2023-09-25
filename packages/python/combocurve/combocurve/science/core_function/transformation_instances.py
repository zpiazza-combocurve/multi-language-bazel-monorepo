from combocurve.science.core_function.class_transformation import transformation
import numpy as np


##################################################################### filter functions
def not_change(data, _):
    return data


def _after_peak_mask(data, t_peak):
    return data[:, 0] >= t_peak


def after_peak_only(data, t_peak):
    mask = _after_peak_mask(data, t_peak)
    return data[mask, :]


def before_peak_only(data, t_peak):
    mask = ~_after_peak_mask(data, t_peak)
    return data[mask, :]


def before_peak_wp(data, t_peak):
    mask = data[:, 0] <= t_peak
    return data[mask, :]


def transformation_one_body(data, t_peak, data_freq):
    trans = transformation()
    no0_data = trans.apply(data, ['remove_exception'], [{'exceptions': [0]}])
    if no0_data.shape[0] > 10:
        trans_para_dict_s = default_transform_para[data_freq]['trans_para_dict_s']
        trans_ops = default_transform_para[data_freq]['trans_ops']
        clean_data = trans.apply(data, trans_ops, trans_para_dict_s)
    else:
        clean_data = no0_data

    peak_clean = clean_data[clean_data[:, 0] == t_peak, :]
    if peak_clean.shape[0] == 0:
        if data.shape[0] == 0:
            peak_data = np.zeros((0, data.shape[1]))
        else:
            peak_data = data[data[:, 0] == t_peak, :]
        before_data = clean_data[clean_data[:, 0] < t_peak, :]
        after_data = clean_data[clean_data[:, 0] > t_peak, :]
        ret = np.concatenate([before_data, peak_data, after_data], axis=0)
    else:
        clean_data[clean_data[:, 0] == t_peak, 1] = data[data[:, 0] == t_peak, 1]
        ret = clean_data
    return ret


def transformation_one_daily(data, t_peak):
    return transformation_one_body(data, t_peak, 'daily')


def transformation_one_monthly(data, t_peak):
    return transformation_one_body(data, t_peak, 'monthly')


def transformation_three_daily(data, t_peak):
    transformed_data = transformation_one_daily(data, t_peak)
    ret_data = transformed_data[transformed_data[:, 0] >= t_peak, :]
    return ret_data


def transformation_three_monthly(data, t_peak):
    transformed_data = transformation_one_monthly(data, t_peak)
    ret_data = transformed_data[transformed_data[:, 0] >= t_peak, :]
    return ret_data


transform_s = {
    'not_change': {
        'daily': not_change,
        'monthly': not_change
    },
    'after_peak_only': {
        'daily': after_peak_only,
        'monthly': after_peak_only
    },
    'filter_0': {
        'daily': transformation_one_daily,
        'monthly': transformation_one_monthly
    },
    'filter_0_after_peak': {
        'daily': transformation_three_daily,
        'monthly': transformation_three_monthly
    },
    'before_peak_only': {
        'daily': before_peak_only,
        'monthly': before_peak_only
    },
    'before_peak_wp': {
        'daily': before_peak_wp,
        'monthly': before_peak_wp
    },
}

default_transform_para = {
    'daily': {
        'trans_ops': ['remove_exception', 'group'],
        'trans_para_dict_s': [{
            'exceptions': [0]
        }, {
            'groupdays': 3
        }],
    },
    'monthly': {
        'trans_ops': ['remove_exception'],
        'trans_para_dict_s': [{
            'exceptions': [0]
        }],
    }
}
