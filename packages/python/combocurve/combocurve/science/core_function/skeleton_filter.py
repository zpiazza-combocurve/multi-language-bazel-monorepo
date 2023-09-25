from copy import deepcopy
import numpy as np
from combocurve.science.core_function.helper import parse_time_new
from combocurve.science.core_function.class_transformation import filters, modifiers

#Below this, values are considered 0
ZERO_THRESHOLD = 1e-10


class filtering:

    def __init__(self, data_freq):
        self.data_freq = data_freq

    def set_freq(self, data_freq):
        self.data_freq = data_freq

    def body(self, entire_data, para_dict):
        valid_idx = para_dict['valid_idx']
        if valid_idx is None:
            time_dict = para_dict['time_dict']
            remove_0 = para_dict['remove_0']
            value_range = para_dict['value_range']
            percentile_range = para_dict['percentile_range']
            # Percentile ranges close to the boundary filter out unexpectedly much data.
            if percentile_range[0] <= 1:
                percentile_range[0] = 0
            if percentile_range[1] >= 99:
                percentile_range[1] = 100
            internal_filter_level = para_dict['internal_filter']
            moving_average_days = para_dict.get('moving_average_days', int(0))

            # Apply rolling average. Modifies values as opposed to masking values. Needs int indices.
            # Inside modifiers().moving average, we'll 0 fill missing data values.
            smoothed_entire_data = entire_data
            moving_average_days = int(moving_average_days)
            if moving_average_days > 0:
                # Have to pay a memory price to keep entire data intact
                smoothed_entire_data = deepcopy(entire_data)
                smoothed_entire_data[:, :2] = modifiers().moving_average(entire_data[:, :2], moving_average_days,
                                                                         self.data_freq)

            # Masking
            #First filter on time
            time_range = parse_time_new(smoothed_entire_data, time_dict)
            time_mask = (smoothed_entire_data[:, 0] >= time_range[0]) & (smoothed_entire_data[:, 0] <= time_range[1])
            #Find values that are 0
            zero_mask = smoothed_entire_data[:, 1] <= ZERO_THRESHOLD
            #Second Filter on values and/or percentile AFTER filtering on time
            if value_range is not None:
                value_mask = (smoothed_entire_data[:, 1] >= value_range[0]) & (smoothed_entire_data[:, 1] <=
                                                                               value_range[1])
            else:
                value_mask = np.ones(smoothed_entire_data.shape[0], dtype=bool)
            ###
            if smoothed_entire_data.shape[0] == 0:
                percentile_mask = np.ones(smoothed_entire_data.shape[0], dtype=bool)
            elif percentile_range is not None:
                percentile_mask = np.ones(smoothed_entire_data.shape[0], dtype=bool)
                percentile_value = np.nanpercentile(smoothed_entire_data[:, 1], percentile_range)
                percentile_mask[time_mask] = (smoothed_entire_data[time_mask, 1] >= percentile_value[0]) & (
                    smoothed_entire_data[time_mask, 1] <= percentile_value[1])
            else:
                percentile_mask = np.ones(smoothed_entire_data.shape[0], dtype=bool)
            #Internal mask depends on no previous filtering
            internal_mask = self.internal_filter(smoothed_entire_data, internal_filter_level)
            #If remove_0, always remove 0
            #If ~remove_0, always keep 0
            if remove_0:
                mask = time_mask & value_mask & percentile_mask & internal_mask & ~zero_mask
            else:
                mask = (time_mask & value_mask & percentile_mask & internal_mask) | (zero_mask & time_mask)
            filtered_data = smoothed_entire_data[mask, :]
        else:
            valid_idx_mask = np.isin(entire_data[:, 0], valid_idx)

            filtered_data = entire_data[valid_idx_mask, :]
            time_range = [-100000, 100000]
        return filtered_data, time_range

    def internal_filter(self, filtered_data, level):
        '''
        low = {'dens_dist': 0.15, 'dens_ratio': 0.03}
        mid = {'dens_dist': 0.15, 'dens_ratio': 0.15}
        high = {'dens_dist': 0.15, 'dens_ratio': 0.4, 'max_remove_ratio': 0.25}
        very_high = {'dens_dist': 0.15, 'dens_ratio': 0.55, 'max_remove_ratio': 0.325}
        '''
        if level == 'none':
            return np.ones(filtered_data.shape[0], dtype=bool)

        internal_filter_ops = 'smoothed_outlier'
        filter_density = filters()

        #Deprecated parameters for density_outlier
        #old_internal_filter_params_monthly = {
        #    'low': {
        #        'dens_dist': 0.15,
        #        'dens_ratio': 0.03
        #    },
        #    'mid': {
        #        'dens_dist': 0.15,
        #        'dens_ratio': 0.15
        #    },
        #    'high': {
        #        'dens_dist': 0.15,
        #        'dens_ratio': 0.4,
        #        'max_remove_ratio': 0.25
        #    },
        #    'very_high': {
        #        'dens_dist': 0.15,
        #        'dens_ratio': 0.55,
        #        'max_remove_ratio': 0.325
        #    }
        #}.get(level)

        #old_internal_filter_params_daily = {
        #    'low': {
        #        'dens_dist': 0.08,
        #        'dens_ratio': 0.03
        #    },
        #    'mid': {
        #        'dens_dist': 0.08,
        #        'dens_ratio': 0.15
        #    },
        #    'high': {
        #        'dens_dist': 0.08,
        #        'dens_ratio': 0.4,
        #        'max_remove_ratio': 0.25
        #    },
        #    'very_high': {
        #        'dens_dist': 0.08,
        #        'dens_ratio': 0.6,
        #        'max_remove_ratio': 0.325
        #    }
        #}.get(level)

        internal_filter_params_monthly = {
            'low': {
                'window': 10,
                'thresholds': [[99, 80, 0.01], [95, 80, 0.006]],
                'is_daily': False
            },
            'mid': {
                'window': 10,
                'thresholds': [[95, 80, 0.01], [80, 75, 0.006]],
                'is_daily': False
            },
            'high': {
                'window': 10,
                'thresholds': [[95, 80, 0.01], [75, 70, 0.001]],
                'is_daily': False
            },
            'very_high': {
                'window': 10,
                'thresholds': [[95, 85, 0.006], [67.5, 65, 0.001]],
                'is_daily': False
            }
        }.get(level)

        internal_filter_params_daily = {
            'low': {
                'window': 100,
                'thresholds': [[99, 80, 0.01], [95, 80, 0.006]],
                'is_daily': True
            },
            'mid': {
                'window': 100,
                'thresholds': [[95, 80, 0.006], [85, 80, 0.006]],
                'is_daily': True
            },
            'high': {
                'window': 100,
                'thresholds': [[95, 80, 0.006], [75, 70, 0.001]],
                'is_daily': True
            },
            'very_high': {
                'window': 100,
                'thresholds': [[95, 80, 0.006], [60, 57.5, 0.001]],
                'is_daily': True
            }
        }.get(level)

        if self.data_freq == 'daily':
            internal_filter_params = internal_filter_params_daily
        else:
            internal_filter_params = internal_filter_params_monthly

        #Deprecated driver for density_filter
        #density_filtered_data = non_zero_data
        #density_filtered_mask = np.ones(non_zero_data.shape[0], dtype=bool)

        #run_times = 2
        #if level == 'low':
        #    run_times = 1

        #for i in range(run_times):
        #    this_filtered_mask = filter_density.apply(density_filtered_data, internal_filter_ops,
        #                                              internal_filter_params, True)
        #    if density_filtered_data.shape[0] != 0:
        #        peak_idx = np.argmax(density_filtered_data[:, 1])
        #        if peak_idx >= 1 and not this_filtered_mask[peak_idx]:
        #            this_filtered_mask[peak_idx - 1] = False
        #    density_filtered_mask[density_filtered_mask] = this_filtered_mask
        #    density_filtered_data = non_zero_data[density_filtered_mask, :]

        #zero_mask[~zero_mask] = density_filtered_mask
        #return zero_mask

        return filter_density.apply(filtered_data, internal_filter_ops, internal_filter_params, True)
