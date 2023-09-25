from datetime import date
from typing import Iterable, List
import numpy as np
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.shared.date import date_array_to_idx_array, date_from_index, days_from_1900, last_day_of_month

from .models import exp_inc, exp_dec, arps, arps_inc, arps_modified, flat, empty, linear
from .shared.segment_parent import SegmentParent
from .shared.helper import sum_forecast_by_month, sum_forecast_by_month_relative
from copy import deepcopy
from typing import Any

RATIO_EUR_INTERVAL = 30

base_time = np.datetime64('1900-01-01')


class MultipleSegments(object):
    def __init__(self, segments: list[dict] = None):
        """Initialize forecast segments

        Args:
          segments: A list of dictionaries contain forecast segments

        Returns:
          None
        """
        self.segment_parent = SegmentParent()
        if segments is not None:
            # TODO: Fix type hint
            self.segments: List[SegmentParent] = [self.get_segment_object(seg) for seg in segments]
        else:
            self.segments = None

    def get_segment_template(self, name: str) -> dict:
        """Get the default forecast segment template

        Args:
          name: The name of the forecast segment

        Returns:
          dict: The template of the default forecast segment
        """
        return self.segment_parent.get_default_template(name)

    def get_segment_object(self, segment: dict) -> object:
        """Get the forecast segment object

        Args:
          segment: The dictionary of the forecast segment

        Returns:
          object: the forecast segment object
        """
        segment_dict = {
            'exp_inc': exp_inc.ExpIncSegment,
            'exp_dec': exp_dec.ExpDecSegment,
            'arps': arps.ArpsSegment,
            'arps_inc': arps_inc.ArpsincSegment,
            'arps_modified': arps_modified.ArpsModifiedSegment,
            'flat': flat.FlatSegment,
            'empty': empty.EmptySegment,
            'linear': linear.LinearSegment
        }
        return segment_dict[segment['name']](segment)

    @staticmethod
    def fill_segment(segment: dict, segment_type: str, error_list: list) -> dict:
        """Fill the forecast segment dictonary for you if you have the needed segment information

        Args:
          segment: The dictionary of the forecast segment
          segment_type: The type of the forecast segment, for example: exp_inc, arps and etc.
          error_list: An error list used when the forecast segment can not be filled

        Returns:
          dict: The filled forecast segments or the original segment
        """
        fill_function_dict = {
            'exp_inc': exp_inc.ExpIncSegment.fill,
            'exp_dec': exp_dec.ExpDecSegment.fill,
            'arps': arps.ArpsSegment.fill,
            'arps_inc': arps_inc.ArpsincSegment.fill,
            'arps_modified': arps_modified.ArpsModifiedSegment.fill,
            'flat': flat.FlatSegment.fill,
            'empty': empty.EmptySegment.fill,
            'linear': linear.LinearSegment.fill
        }

        if len(error_list) == 0 and segment_type in fill_function_dict:
            return fill_function_dict[segment_type](segment)
        else:
            return segment

    def scale_segments_q(self, input_segments: list[dict], multiplier: float, start_idx: int = 0) -> list[dict]:
        """Scale the forecast segments by the input multiplier, which mean move up or down the forecast segments.

        Args:
          input_segments: A list of dictionaries contain forecast segments
          multiplier: The multiplier will be used for the forecast segments
          start_idx: The index that scaling starts

        Returns:
          list[dict]: The scaled forecast segments
        """
        ret_segments = deepcopy(input_segments)
        segs_to_scale = MultipleSegments(ret_segments[start_idx:])
        for i, seg in enumerate(segs_to_scale.segments):
            for field in seg.get_rate_scaled_fields():
                ret_segments[i][field] *= multiplier
        return ret_segments

    def shift_segments_idx(self, input_segments: list[dict], delta_t: int, start_segment_index: int = 0) -> list[dict]:
        """Shift the forecast segments by delta_t, which mean move left or right the forecast segments.

        Args:
          input_segments: a list of dictionaries contain forecast segments
          delta_t: the time uses to shift forecast segments
          start_segment_index: The index that shifting starts

        Returns:
          list[dict]: The shifted forecast segments
        """
        ret_segments = deepcopy(input_segments)
        segs_to_shift = MultipleSegments(ret_segments[start_segment_index:])
        for i, seg in enumerate(segs_to_shift.segments):
            for field in seg.get_idx_shift_fields():
                ret_segments[i][field] += delta_t
        return ret_segments

    def predict(self, raw_t: list, forecast_segments: list[dict], to_fill: float = 0) -> np.ndarray:
        """Predict the daily forecast volumes for indexes in raw_t, not for monthly volumes

        Args:
          raw_t: a list of indexes
          forecast_segments: a list of dictionaries contain forecast segments
          to_fill: a float number to fill the volumes result

        Returns:
          np.ndarray: The predicted daily forecast volumes
        """
        t = np.array(raw_t)
        ret = np.full(t.shape, to_fill, dtype=float)
        for seg in forecast_segments:
            this_segment_object = self.get_segment_object(seg)
            this_range = (t <= seg['end_idx']) & (t >= seg['start_idx'])
            ret[this_range] = this_segment_object.predict(t[this_range])

        return ret

    def predict_monthly_volumes(self, raw_t: list, forecast_segments: list[dict]) -> np.ndarray:
        """Predict the monthly forecast volumes for indexes in raw_t, not for daily volumes

        Args:
          raw_t: A list of indexes
          forecast_segments: A list of dictionaries contain forecast segments

        Returns:
          np.ndarray: The predicted monthly forecast volumes
        """
        # Use this function to predict monthly volumes.
        first_date: date = date_from_index(raw_t[0])
        last_date: date = date_from_index(raw_t[-1])
        start_of_first_month = days_from_1900(date(first_date.year, first_date.month, 1))
        end_of_last_month = days_from_1900(last_day_of_month(last_date))
        t = np.arange(start_of_first_month, end_of_last_month + 1)
        daily_volumes = self.predict(t, forecast_segments)
        monthly_volumes, forecast_month = sum_forecast_by_month(daily_volumes, t)
        ret_mask = np.isin(date_array_to_idx_array(forecast_month, 'monthly'), raw_t)

        return monthly_volumes[ret_mask]

    def predict_monthly_volumes_relative(self, raw_t: Iterable, forecast_segments: list[dict]) -> np.array:
        """
        Predict the monthly forecast volumes for the relative indexes in raw_t.

        Args:
          raw_t: An Iterable of indexes
          forecast_segments: A list of dictionaries contain forecast segments

        Returns:
          np.array: The predicted monthly forecast volumes
        """
        start = raw_t[0]
        monthly_idx = raw_t

        if len(raw_t) > 1:
            end = raw_t[-1]
        else:
            end = start + round(DAYS_IN_MONTH)
            monthly_idx = np.concatenate((raw_t, [end]))

        t = np.arange(start, end + 1)
        daily_volumes = self.predict(t, forecast_segments)
        monthly_volumes = sum_forecast_by_month_relative(daily_volumes, t, monthly_idx)

        ret_mask = np.isin(monthly_idx, raw_t)

        ret = monthly_volumes[ret_mask]
        return ret

    def predict_self(self, raw_t: list) -> np.ndarray:
        """Predict the forecast volumes for indexes in raw_t for forecast segments of the current object

        Args:
          raw_t: A list of indexes

        Returns:
          np.ndarray: The predicted forecast volumes
        """
        t = np.array(raw_t)
        ret = np.zeros(t.shape)
        for this_segment_object in self.segments:
            this_range = (t <= this_segment_object.segment['end_idx']) & (t >= this_segment_object.segment['start_idx'])
            ret[this_range] = this_segment_object.predict(t[this_range])

        return ret

    def predict_time_ratio(self, raw_t: list, ratio_t_segments: list[dict], base_segment: list[dict]) -> np.ndarray:
        """Predict the daily forecast volumes for ratio segments, not for monthly volumes

        Args:
          raw_t: A list of indexes
          ratio_t_segments: A list of dictionaries contain ratio forecast segments
          base_segment: A list of dictionaries contain base forecast segments

        Returns:
          np.ndarray: The predicted daily forecast volumes for ratil segments
        """
        base_pred = self.predict(raw_t, base_segment)
        ratio_pred = self.predict(raw_t, ratio_t_segments)
        return base_pred * ratio_pred

    def predict_monthly_time_ratio(self, raw_t: list, ratio_t_segments: list[dict],
                                   base_segment: list[dict]) -> np.ndarray:
        """Predict the monthly forecast volumes for ratio segments, not for daily volumes

        Args:
          raw_t: A list of indexes
          ratio_t_segments: A list of dictionaries contain ratio forecast segments
          base_segment: A list of dictionaries contain base forecast segments

        Returns:
          np.ndarray: The predicted monthly forecast volumes for ratil segments
        """
        first_date: date = date_from_index(raw_t[0])
        last_date: date = date_from_index(raw_t[-1])
        start_of_first_month = days_from_1900(date(first_date.year, first_date.month, 1))
        end_of_last_month = days_from_1900(last_day_of_month(last_date))
        t = np.arange(start_of_first_month, end_of_last_month + 1)
        daily_volumes = self.predict_time_ratio(t, ratio_t_segments, base_segment)
        monthly_volumes, forecast_month = sum_forecast_by_month(daily_volumes, t)
        ret_mask = np.isin(date_array_to_idx_array(forecast_month, 'monthly'), raw_t)

        return monthly_volumes[ret_mask]

    def eur(self, cum_data: float, end_data_idx: int, left_idx: int, right_idx: int, forecast_segments: list[dict],
            data_freq: str) -> float:
        """ BEWARE OF USE, RESULTS ARE INACCURATE Calculate the EUR for rate forecast segments

        Args:
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          right_idx: one of the right boundries used when calcuating EUR
          forecast_segments: A list of dictionaries contain rate forecast segments
          data_freq: daily or monthly

        Returns:
          float: The EUR for the rate forecast segments
        """
        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left_idx = np.max([end_data_idx + 1, left_idx])
        ret = cum_data
        for seg in forecast_segments:
            this_segment_object = self.get_segment_object(seg)
            this_add = 0
            if seg['end_idx'] >= left_idx:
                start_idx = max(seg['start_idx'], left_idx)
                end_idx = min(seg['end_idx'], right_idx)
                this_add = 0
                if start_idx < end_idx:
                    this_add += this_segment_object.predict(start_idx) + this_segment_object.predict(end_idx)
                    this_add += this_segment_object.integral(start_idx + 0.5, end_idx - 0.5)
                elif start_idx == end_idx:
                    this_add += this_segment_object.predict(start_idx)

            ret += this_add

        return ret

    def eur_self(self, cum_data: float, end_data_idx: int, left_idx: int, right_idx: int, data_freq: str) -> float:
        """BEWARE OF USE, RESULTS ARE INACCURATE. Calculate the EUR for rate forecast segments for forecast segments
           of the current object.

        Args:
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          right_idx: one of the right boundries used when calcuating EUR
          data_freq: daily or monthly

        Returns:
          float: The EUR for the rate forecast segments
        """
        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left_idx = np.max([end_data_idx + 1, left_idx])
        ret = cum_data
        for this_segment_object in self.segments:
            seg = this_segment_object.segment
            this_add = 0
            if seg['end_idx'] >= left_idx:
                start_idx = max(seg['start_idx'], left_idx)
                end_idx = min(seg['end_idx'], right_idx)
                this_add = 0
                this_slope = seg['slope']
                if start_idx <= end_idx:
                    if this_slope >= 0:
                        this_add += this_segment_object.predict(end_idx)
                        this_add += this_segment_object.integral(start_idx - 0.5, end_idx - 0.5)
                    else:
                        this_add += this_segment_object.predict(start_idx)
                        this_add += this_segment_object.integral(start_idx + 0.5, end_idx + 0.5)

            ret += this_add

        return ret

    def eur_precise(self, cum_data, end_data_idx, left_idx, right_idx, forecast_segments, data_freq):
        '''Preferred method for finding EUR of rate segments. Precisely sums volumes.'''
        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left = int(max(end_data_idx + 1, left_idx))
        right = int(right_idx)
        time_idx = [*range(left, right + 1)]
        ret = cum_data + self.predict(time_idx, forecast_segments).sum()
        return ret

    def ratio_eur(self, cum_data: float, end_data_idx: int, left_idx: int, right_idx: int, ratio_t_segments: list[dict],
                  base_segments: list[dict], data_freq: str) -> float:
        """Calculate the EUR for ratio forecast segments. Preferred method for finding EUR of ratio segments

        Args:
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          right_idx: one of the right boundries used when calcuating EUR
          ratio_t_segments: A list of dictionaries contain ratio forecast segments
          base_segments: A list of dictionaries contain base forecast segments
          data_freq: daily or monthly

        Returns:
          float: The EUR for the ratio forecast segments
        """
        '''Preferred method for finding EUR of ratio segments. Precisely sums volumes.'''
        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left_idx = np.max([end_data_idx + 1, left_idx])

        t = np.arange(left_idx, right_idx + 1)
        ret = self.predict_time_ratio(t, ratio_t_segments, base_segments)
        ret = np.sum(ret)
        ret += cum_data

        return ret

    def ratio_eur_interval(self, cum_data: float, end_data_idx: int, left_idx: int, right_idx: int,
                           ratio_t_segments: list[dict], base_segments: list[dict], data_freq: str) -> float:
        """BEWARE OF USE, RESULTS ARE INACCURATE. Calculate the EUR for ratio forecast segments, use interval to select
           indexes to speed up the calculation. This method trades calcuation accuracy for speed.

        Args:
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          right_idx: one of the right boundries used when calcuating EUR
          ratio_t_segments: A list of dictionaries contain ratio forecast segments
          base_segments: A list of dictionaries contain base forecast segments
          data_freq: daily or monthly

        Returns:
          float: The EUR for the ratio forecast segments
        """
        use_end_data_idx = end_data_idx
        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            use_end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1
                                - np.datetime64('1900-01-01')).astype(int)

        if (ratio_t_segments is None or len(ratio_t_segments) == 0 or base_segments is None or len(base_segments) == 0):
            return cum_data

        use_left_idx = np.max(
            [use_end_data_idx + 1, left_idx, ratio_t_segments[0]['start_idx'], base_segments[0]['start_idx']])
        use_right_idx = np.min([
            right_idx, ratio_t_segments[len(ratio_t_segments) - 1]['end_idx'],
            base_segments[len(base_segments) - 1]['end_idx']
        ])

        if (use_left_idx >= use_right_idx):
            return cum_data

        ratio_pred_idx_min = use_left_idx + 14
        ratio_pred_idx_max = use_right_idx + RATIO_EUR_INTERVAL
        pred_idx = np.arange(int(np.ceil(
            (ratio_pred_idx_max - ratio_pred_idx_min) / RATIO_EUR_INTERVAL))) * RATIO_EUR_INTERVAL + ratio_pred_idx_min
        pred_check_idx = pred_idx + 15
        pred = self.predict_time_ratio(pred_idx, ratio_t_segments, base_segments)
        right_stop_index = np.argwhere(pred_check_idx > use_right_idx)[0, 0]
        if (right_stop_index == 0):
            return cum_data + (use_right_idx - use_left_idx + 1) * pred[right_stop_index]

        return cum_data + np.sum(pred[:right_stop_index]) * RATIO_EUR_INTERVAL + (
            use_right_idx - pred_check_idx[right_stop_index - 1]) * pred[right_stop_index]

    def arr_eur(self, arr_right_idx: list, cum_data: float, end_data_idx: int, left_idx: int,
                forecast_segments: list[dict], data_freq: str) -> np.ndarray:
        """Calculate the EURs of the given right indexes for rate forecast segments

        Args:
          arr_right_idx: a list of right boundries used when calcuating EURs
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          forecast_segments: A list of dictionaries contain rate forecast segments
          data_freq: daily or monthly

        Returns:
          np.ndarray: The list of EURs of given right indexes for rate forecast segments
        """

        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left_idx = np.max([end_data_idx + 1, left_idx])
        ret = np.zeros(arr_right_idx.shape)

        ## before left_idx
        ret[arr_right_idx < left_idx] = cum_data
        ## within forecast
        for i, seg in enumerate(forecast_segments):
            this_segment_object = self.get_segment_object(seg)
            this_arr_mask = (arr_right_idx >= seg['start_idx']) & (arr_right_idx <= seg['end_idx'])
            this_arr_val = self.eur(cum_data, end_data_idx, left_idx, forecast_segments[-1]['end_idx'],
                                    forecast_segments[:i], data_freq) * np.ones(this_arr_mask.sum())
            this_arr_right_idx = arr_right_idx[this_arr_mask]
            if seg['end_idx'] >= left_idx:
                start_idx = max(seg['start_idx'], left_idx)
                this_add = np.zeros(this_arr_right_idx.shape)
                integral_part_mask = this_arr_right_idx >= start_idx
                integral_right_idx = this_arr_right_idx[integral_part_mask]

                if integral_right_idx.shape[0] > 0:
                    this_integral_val = this_segment_object.arr_integral(start_idx + 0.5, integral_right_idx + 0.5)
                    this_integral_val += this_segment_object.predict(start_idx)
                    this_add[integral_part_mask] = this_integral_val

                this_arr_val[integral_part_mask] = this_arr_val[integral_part_mask] + this_add

            ret[this_arr_mask] = this_arr_val
        ## after forecast
        if len(forecast_segments) > 0:
            ret[arr_right_idx >= forecast_segments[-1]['end_idx']] = self.eur(cum_data, end_data_idx, left_idx,
                                                                              forecast_segments[-1]['end_idx'],
                                                                              forecast_segments, data_freq)
        return ret

    def cum_from_t(self, time: list, production: Any, forecast_segments: list[dict],
                   data_freq: str) -> np.ndarray:  # noqa:C901
        """calculate the cumulative sum for the time indexes of rate forecast segments

        Args:
          time: a list of time indexes
          production: the phase production data
          forecast_segments: A list of dictionaries contain forecast segments
          data_freq: daily or monthly

        Returns:
          np.ndarray: The list of cumulative sum for the time indexes

        """
        time = np.array(time, dtype=int)
        ## TODO: need an optimization
        cum = np.zeros(time.shape)
        # start time is earlier than the first production day
        if production.shape[0] > 0:
            if data_freq == 'daily':
                data_start_idx = production[0, 0]
                data_end_idx = production[-1, 0]
            else:
                data_start_idx = ((int(production[0, 0]) + base_time).astype('datetime64[M]').astype('datetime64[D]')
                                  - base_time).astype(int)
                next_month_start_date = ((int(production[-1, 0]) + base_time).astype('datetime64[M]')
                                         + 1).astype('datetime64[D]')
                data_end_idx = (next_month_start_date - 1 - base_time).astype(int)
        else:
            if len(forecast_segments) > 0:
                data_end_idx = forecast_segments[0]['start_idx'] - 100
                data_start_idx = data_end_idx + 10
            else:
                return np.zeros(time.shape)

        ### before
        before_production_mask = time < data_start_idx
        cum[before_production_mask] = 0

        ###
        within_production_mask = (time >= data_start_idx) & (time <= data_end_idx)
        if within_production_mask.any():
            within_time = time[within_production_mask]

            within_time_date = base_time + within_time
            within_time_month_start_date_idx = (within_time_date.astype('datetime64[M]').astype('datetime64[D]')
                                                - base_time).astype(int)

            within_cum = np.zeros(within_time.shape[0])
            within_time_index = np.zeros(within_time.shape[0])
            before_months_sum = np.zeros(within_time.shape[0])
            for i in range(within_time.shape[0]):
                target_time = within_time[i]

                if data_freq == 'daily':
                    # before_target_mask = production[:, 0] <= target_time
                    # within_cum[i] = np.sum(production[before_target_mask, 1])
                    if i == 0:
                        j = 0
                        tmp_cum = 0
                    else:
                        j = int(within_time_index[i - 1])
                        tmp_cum = within_cum[i - 1]
                    while (j < production.shape[0] and target_time >= production[j, 0]):
                        if ~np.isnan(production[j, 1]):
                            tmp_cum += production[j, 1]
                        j += 1
                    within_time_index[i] = j
                    within_cum[i] = tmp_cum
                else:
                    target_month_idx = within_time_month_start_date_idx[i]
                    # before_target_mask = production[:, 0] < target_month_idx
                    # before_months_sum = np.nansum(production[before_target_mask, 1])
                    if i == 0:
                        j = 0
                        tmp_cum = 0
                    else:
                        j = int(within_time_index[i - 1])
                        tmp_cum = before_months_sum[i - 1]
                    while (j < production.shape[0] and target_month_idx >= production[j, 0]):
                        if ~np.isnan(production[j, 1]):
                            tmp_cum += production[j, 1]
                        j += 1
                    within_time_index[i] = j
                    before_months_sum[i] = tmp_cum

                    a = ((target_month_idx + base_time).astype('datetime64[M]') + 1).astype('datetime64[D]')
                    days_in_this_month = (a - (target_month_idx + base_time)).astype(int)
                    days_passed_for_target = target_time - target_month_idx + 1

                    production_month_start = production[:, 0].astype(int) - 14
                    this_month_val_match = np.argwhere(production_month_start == target_month_idx)
                    if this_month_val_match.shape[0] > 0:
                        production_of_this_month = production[this_month_val_match[0, 0], 1]
                    else:
                        production_of_this_month = 0
                    if np.isnan(production_of_this_month):
                        production_of_this_month = 0
                    interpolation_sum = production_of_this_month * days_passed_for_target / days_in_this_month
                    within_cum[i] = before_months_sum[i] + interpolation_sum

            cum[within_production_mask] = within_cum

        #### after_production
        after_production_mask = time > data_end_idx
        if after_production_mask.any():
            after_production_time = time[after_production_mask]
            after_production_cum = np.zeros(after_production_time.shape)
            summation_prod = np.nansum(production[:, 1])
            ### summation_left
            summation_left = data_end_idx + 1
            after_production_cum = self.arr_eur(after_production_time, summation_prod, data_end_idx, summation_left,
                                                forecast_segments, data_freq)
            cum[after_production_mask] = after_production_cum
        return cum

    def cum_from_t_ratio(self, use_time: list, production: Any, ratio_segments: list[dict], base_segments: list[dict],
                         data_freq: str) -> np.ndarray:
        """calculate the cumulative sum for the time indexes of ratio forecast segments

        Args:
          use_time: a list of time indexes
          production: the phase production data
          ratio_segments: A list of dictionaries contain ratio forecast segments
          base_segments: A list of dictionaries contain base forecast segments
          data_freq: daily or monthly

        Returns:
          np.ndarray: The list of cumulative sum for the time indexes
        """
        use_time = np.array(use_time, dtype=int)
        ret = np.zeros(use_time.shape, dtype=float)

        data_length = production.shape[0]
        forecats_valid = len(ratio_segments) > 0 and len(base_segments) > 0
        if (data_length == 0) and not forecats_valid:
            return ret

        index_arr = np.array(production[:, 0], dtype=int)
        cum_data = np.nansum(production[:, 1])
        if (data_length > 0):
            last_idx = index_arr[-1]
            if (data_freq == 'daily'):
                data_start_idx = index_arr[0]
                data_end_idx = last_idx
            else:
                data_start_idx = index_arr[0] - 14
                data_end_idx = (((base_time + last_idx).astype('datetime64[M]') + 1).astype('datetime64[D]') - 1
                                - base_time).astype(int)

        else:
            data_end_idx = int(ratio_segments[0]['start_idx']) - 1
            data_start_idx = data_end_idx + 1

        ratio_pred_idx_min = data_end_idx + 15
        ratio_pred_idx_max = max(use_time) + 30
        pred_idx = np.arange(int(np.ceil(
            (ratio_pred_idx_max - ratio_pred_idx_min) / 30))) * RATIO_EUR_INTERVAL + ratio_pred_idx_min
        pred_check_idx = pred_idx + 15

        pred = self.predict_time_ratio(pred_idx, ratio_segments, base_segments)
        pred_cumsum = RATIO_EUR_INTERVAL * np.cumsum(pred)

        ##### part 1, before data_start_idx
        part1_mask = use_time < data_start_idx
        ret[part1_mask] = 0

        ##### part 2, between data_start_idx and data_end_idx
        part2_mask = (use_time >= data_start_idx) & (use_time <= data_end_idx)
        ret[part2_mask] = self.cum_from_t(use_time[part2_mask], production, [], data_freq)
        ##### part 3, after data_end_idx and before forecast_ends
        if len(ratio_segments) > 0:
            forecast_start_idx = ratio_segments[0]['start_idx']
            forecast_end_idx = ratio_segments[-1]['end_idx']
        else:
            forecast_start_idx = data_start_idx
            forecast_end_idx = data_end_idx

        part3_mask = (use_time > data_end_idx) & (use_time <= forecast_end_idx)
        part3_time = use_time[part3_mask]
        if part3_time.shape[0] > 0:
            idx_check = 0
            idx_time = 0
            while (part3_time[idx_time] > pred_check_idx[idx_check]):
                idx_check += 1
            ### we get pred_check_idx[idx_check - 1] < part3_time[idx_time] <= pred_check_idx[idx_check]
            part3_value = []

            for idx_time in range(len(part3_time)):
                this_time = part3_time[idx_time]
                while (this_time > pred_check_idx[idx_check]):
                    idx_check += 1

                if idx_check == 0:
                    part3_value += [cum_data + (this_time - data_end_idx) * pred[idx_check]]
                else:
                    part3_value += [
                        cum_data + (pred_cumsum[idx_check - 1]) +
                        (this_time - pred_check_idx[idx_check - 1]) * pred[idx_check]
                    ]
            ret[part3_mask] = np.array(part3_value, dtype=float)

        ##### part4, after end_forecast
        part4_mask = (use_time > forecast_end_idx)
        eur = self.ratio_eur_interval(cum_data, data_end_idx, forecast_start_idx, forecast_end_idx, ratio_segments,
                                      base_segments, data_freq)
        ret[part4_mask] = eur

        return ret

    def merge_empty(self, segments: list[dict]) -> list[dict]:
        """Merge empty forecast segments (segment name is empty or segment name is flat and q start is zero)

        Args:
          segments: A list of dictionaries contain forecast segments

        Returns:
          list[dict]: Forecast segments after empty segments are merged
        """
        copy_segs = deepcopy(segments)
        merge_idx_pair = []
        cur_left = None
        cur_right = None
        for i, this_seg in enumerate(copy_segs):
            if this_seg['name'] == 'empty' or (this_seg['name'] == 'flat' and this_seg['q_start'] == 0):
                if cur_left is None:
                    cur_left = i
                else:
                    cur_right = i
            else:
                if cur_left is not None:
                    cur_left = None
                    cur_right = None
                    if cur_right is not None:
                        merge_idx_pair += [[cur_left, cur_right]]
                    else:
                        continue
                else:
                    continue

        if cur_right is not None:
            merge_idx_pair += [[cur_left, cur_right]]

        n_merge = len(merge_idx_pair)
        if n_merge == 0:
            ret = copy_segs
        else:
            ret = []
            last_idx = 0
            for i in range(n_merge):
                [this_left, this_right] = merge_idx_pair[i]
                ret += copy_segs[last_idx:this_left]
                this_seg = self.get_segment_template('empty')
                this_seg['start_idx'] = copy_segs[this_left]['start_idx']
                this_seg['end_idx'] = copy_segs[this_right]['end_idx']
                ret += [this_seg]
                last_idx = this_right + 1

            ret += copy_segs[last_idx:]

        return ret

    def _add_shutin(self, shutin_seg_para: dict, adjusted_segments: list[dict], stack_multiplier: bool) -> list[dict]:
        """Add shutin segment in the forecast segments

        Args:
          shutin_seg_para: A dictionary contains the details to add shutin segments
          adjusted_segments: A list of dictionaries contain forecast segments
          stack_multiplier: True of False to apply the multiplier

        Returns:
          list[dict]: The forecast segments with shutin period added
        """
        ### assume adjusted_segments does not have consecutive empty segments
        rep = adjusted_segments  # keep this in here due to removed deepcopy in HOTFIX CC-18132
        shut_start = shutin_seg_para['start_idx']
        shut_end = shutin_seg_para['end_idx']
        new_shutin = self.get_segment_template('empty')
        new_shutin['start_idx'] = shut_start
        new_shutin['end_idx'] = shut_end
        shutin_multiplier = shutin_seg_para['multiplier']
        adj_new_shutin = {'multiplier': 1, 'segment': new_shutin}
        adjusted_seg_idx = -1
        for i, segment_para in enumerate(adjusted_segments):
            this_seg = segment_para['segment']
            this_start = this_seg['start_idx']
            this_end = this_seg['end_idx']
            if (this_start >= shut_start):  ## should plug in before here
                adjusted_seg_idx = i
                start_cut = False
                break
            elif (this_start < shut_start) and (shut_start <= this_end):  ## this_segment was cut
                adjusted_seg_idx = i
                start_cut = True
                break
            elif (this_end < shut_start):
                continue

        if adjusted_seg_idx == -1:
            ret = rep
        else:
            segment_para = adjusted_segments[i]
            this_multiplier = segment_para['multiplier']
            this_seg = segment_para['segment']
            this_segment_object = self.get_segment_object(this_seg)
            this_start = this_seg['start_idx']
            this_end = this_seg['end_idx']
            this_name = this_seg['name']
            if this_name == 'empty' or (this_name == 'flat' and this_seg['q_start'] == 0):
                if (shut_end > this_end) and (i < len(rep) - 1):
                    left = rep[:i] + [adj_new_shutin]
                    right = rep[(i + 1):]
                    next_seg = adjusted_segments[i + 1]['segment']
                    next_start = next_seg['start_idx']
                    if shut_end >= next_start:
                        offset = shut_end + 1 - next_start
                    else:
                        offset = 0
                else:
                    left = rep[:i]
                    right = rep[i:]
                    offset = 0
            else:
                if shut_end < this_start:
                    left = rep[:i]
                    right = rep[i:]
                    offset = 0
                else:
                    if start_cut:
                        cut_first, cut_second = this_segment_object.cut(shut_start)
                        adj_cut_first_seg = {'multiplier': this_multiplier, 'segment': cut_first}
                        adj_cut_second_seg = {'multiplier': this_multiplier, 'segment': cut_second}
                        left = rep[:i] + [adj_cut_first_seg, adj_new_shutin]
                        right = [adj_cut_second_seg] + rep[(i + 1):]
                        offset = int(shut_end - shut_start + 1)
                    else:
                        left = rep[:i] + [adj_new_shutin]
                        right = rep[i:]
                        offset = int(shut_end + 1 - this_start)

            for adj_seg in right:
                this_seg = adj_seg['segment']
                this_name = this_seg['name']
                if stack_multiplier:
                    adj_seg['multiplier'] *= shutin_multiplier
                else:
                    adj_seg['multiplier'] = shutin_multiplier
                this_seg['start_idx'] += offset
                this_seg['end_idx'] += offset
                if this_name == 'arps_modified':
                    this_seg['sw_idx'] += offset

            ret = left + right
        return ret

    def __correct_for_scale_shut_in_date(self, shutin: dict, segments: list[dict]) -> list[dict]:
        '''
        correct forecast segments for scale post shut-in dates

        Args:
          shutin: A dictionary contains the details of shutin segment
          segments: A list of dictionaries contain forecast segments

        Returns:
          list[dict]: The forecast segments with scale post shut-in dates corrected
        '''
        # consider old models
        if 'scale_post_shut_in_end_idx' not in shutin.keys():
            return segments

        shutin_start, shutin_end = shutin['start_idx'], shutin['end_idx']
        shutin_multiplier = shutin['multiplier']
        scale_end = shutin['scale_post_shut_in_end_idx']
        corrected_segments = []

        for i, seg in enumerate(segments):
            if seg['segment']['start_idx'] == shutin_start and seg['segment']['end_idx'] == shutin_end:
                for j in range(i, len(segments)):
                    if scale_end < segments[j]['segment']['start_idx'] or scale_end > segments[j]['segment']['end_idx']:
                        corrected_segments.append(segments[j])
                    else:
                        if segments[j]['segment']['start_idx'] == scale_end:
                            adj_seg = segments[j]
                            adj_seg['multiplier'] /= shutin_multiplier
                            corrected_segments.append(adj_seg)
                        elif segments[j]['segment']['end_idx'] == scale_end:
                            corrected_segments.append(segments[j])
                        else:
                            adj_seg = segments[j]
                            this_segment_object = self.get_segment_object(adj_seg['segment'])
                            left, right = this_segment_object.cut(scale_end + 1)
                            corr_seg = [{
                                'multiplier': adj_seg['multiplier'],
                                'segment': left
                            }, {
                                'multiplier': adj_seg['multiplier'],
                                'segment': right
                            }]
                            corrected_segments.append(corr_seg[0])
                            corr_seg[1]['multiplier'] /= shutin_multiplier
                            corrected_segments.append(corr_seg[1])
                        if j != len(segments) - 1:
                            for k in range(j + 1, len(segments)):
                                adj_seg = segments[k]
                                adj_seg['multiplier'] /= shutin_multiplier
                                corrected_segments.append(adj_seg)
                        break
                break
            else:
                corrected_segments.append(seg)
        return corrected_segments

    def apply_shutin(self, plugin_shutin_s: list[dict], orig_segments: list[dict],
                     apply_shutin_para: dict) -> list[dict]:
        """Add shutin segments in the forecast segments

        Args:
          plugin_shutin_s: a list of dictionary contains the details to add shutin segments
          orig_segments: a list of dictionaries contain forecast segments
          apply_shutin_para:  a dictionary contains the details of stack multiplier

        Returns:
          list[dict]: The forecast segments with shutin period added and multiplier applied
        """
        adjusted_segments = []
        merged_empty_segments = self.merge_empty(orig_segments)
        for this_seg in merged_empty_segments:
            adjusted_segments += [{'multiplier': 1, 'segment': this_seg}]

        for shutin in plugin_shutin_s:
            adjusted_segments = self._add_shutin(shutin, adjusted_segments, apply_shutin_para['stack_multiplier'])

            # correct segments for scale post shut-in dates
            adjusted_segments = self.__correct_for_scale_shut_in_date(shutin, adjusted_segments)

        ret = []
        for adj_seg in adjusted_segments:
            this_seg = adj_seg['segment']
            this_name = this_seg['name']
            this_seg['q_start'] *= adj_seg['multiplier']
            this_seg['q_end'] *= adj_seg['multiplier']
            if this_name == 'arps_modified':
                this_seg['q_sw'] *= adj_seg['multiplier']
            ret += [this_seg]
        return ret

    def ratio_eur_interval_old(self, cum_data: float, end_data_idx: int, left_idx: int, right_idx: int, interval: int,
                               lists_ratio: list[dict], lists_base: list[dict], data_freq: str) -> float:
        """Calculate the EUR for ratio forecast segments, use interval to select indexes to speed up the calculation.
           This method trades calcuation accuracy for speed. This is the old version.

        Args:
          cum_data: the cumulative sum of the phase production data
          end_data_idx: the index where the production ends
          left_idx: one of the left boundries used when calcuating EUR
          right_idx: one of the right boundries used when calcuating EUR
          interval: the interval use to speed up the calculation
          lists_ratio: A list of dictionaries contain ratio forecast segments
          lists_base: A list of dictionaries contain base forecast segments
          data_freq: daily or monthly

        Returns:
          float: The EUR for the ratio forecast segments
        """

        if data_freq == 'monthly':
            end_data_month = (np.datetime64('1900-01-01') + int(end_data_idx)).astype('datetime64[M]')
            end_data_idx = ((end_data_month + 1).astype('datetime64[D]') - 1 - np.datetime64('1900-01-01')).astype(int)

        left_idx = np.max([end_data_idx + 1, left_idx])

        if lists_ratio == [] or lists_base == []:
            return cum_data

        left_idx_ratio, left_idx_base = lists_ratio[0]['start_idx'], lists_base[0]['start_idx']
        right_idx_ratio, right_idx_base = lists_ratio[-1]['end_idx'], lists_base[-1]['end_idx']
        left_idx = np.max([left_idx, left_idx_ratio, left_idx_base])
        right_idx = np.min([right_idx, right_idx_ratio, right_idx_base])

        if left_idx >= right_idx:
            return cum_data

        time_line = np.arange(left_idx + interval // 2, right_idx + 1, interval)
        remainder = (right_idx - left_idx + 1) % interval
        prod_ratio = np.zeros(time_line.shape[0])
        prod_base = np.zeros(time_line.shape[0])
        ratio_left = base_left = 0
        remainder_idx = right_idx - remainder // 2

        for seg in lists_ratio:
            this_segment_object = self.get_segment_object(seg)
            this_range = (time_line <= seg['end_idx']) & (time_line >= seg['start_idx'])
            prod_ratio[this_range] = this_segment_object.predict(time_line[this_range])
            #Find the segment of remainder and calcuate the EUR of the remainder.
            if remainder != 0 and seg['end_idx'] >= remainder_idx and seg['start_idx'] < remainder_idx:
                ratio_left += this_segment_object.predict(remainder_idx) * remainder

        for seg in lists_base:
            this_segment_object = self.get_segment_object(seg)
            this_range = (time_line <= seg['end_idx']) & (time_line >= seg['start_idx'])
            prod_base[this_range] = this_segment_object.predict(time_line[this_range])
            #Find the segment of remainder and calcuate the EUR of the remainder.<
            if remainder != 0 and seg['end_idx'] >= remainder_idx and seg['start_idx'] < remainder_idx:
                base_left += this_segment_object.predict(remainder_idx) * remainder

        ret = np.nansum(prod_ratio * prod_base) * interval + cum_data + ratio_left * base_left
        return ret

    def apply_forecast_start_date(self, forecast_segments: list[dict], start_date: Any) -> list[dict]:
        """Process forecast segments for forecast Aries export use
           This function should only be used for export to Aries due to the special handle for arps_modified.

        Args:
          forecast_segments: a list of dictionaries contain forecast segments
          start_date: input start date

        Returns:
          list[dict]: The processed forecast segments for Aries export
        """

        input_start_idx = (np.datetime64(start_date) - base_time).astype(int)
        segments_start_idx = forecast_segments[0]['start_idx']
        segments_end_idx = forecast_segments[-1]['end_idx']

        if input_start_idx < segments_start_idx:
            return forecast_segments

        if input_start_idx >= segments_end_idx:
            return []

        ret_segments = []
        for seg in forecast_segments:
            seg_start_idx = seg['start_idx']
            seg_end_indx = seg['end_idx']
            if input_start_idx > seg_end_indx:
                continue
            elif seg_start_idx < input_start_idx <= seg_end_indx:
                this_segment_object = self.get_segment_object(seg)
                cutted_seg = this_segment_object.cut(input_start_idx)[-1]

                # special handle to make exp_dec seg of arps_modified has same D as D-sw after cut
                if seg['name'] == 'arps_modified' and cutted_seg['name'] == 'exp_dec':
                    cutted_seg['D_eff'] = seg['realized_D_eff_sw']

                ret_segments.append(cutted_seg)
            else:
                ret_segments.append(seg)

        return ret_segments

    def apply_forecast_end_date(self, forecast_segments: list[dict], end_date: Any) -> list[dict]:
        """Process forecast segments for forecast Mosaic export use
            This function should only be used for export to Mosaic due to the special handle for arps_modified.

            Args:
            forecast_segments: a list of dictionaries contain forecast segments
            start_date: input start date

            Returns:
            list[dict]: The processed forecast segments for Moasic export
            """

        input_end_idx = (np.datetime64(end_date) - base_time).astype(int)
        segments_start_idx = forecast_segments[0]['start_idx']
        segments_end_idx = forecast_segments[-1]['end_idx']

        if input_end_idx > segments_end_idx:
            return forecast_segments

        if input_end_idx <= segments_start_idx:
            return []

        ret_segments = []
        for seg in forecast_segments:
            seg_start_idx = seg['start_idx']
            seg_end_indx = seg['end_idx']

            if seg_start_idx < input_end_idx <= seg_end_indx:
                this_segment_object = self.get_segment_object(seg)
                cutted_seg = this_segment_object.cut(input_end_idx + 1)[0]

                # special handle to make exp_dec seg of arps_modified has same D as D-sw after cut
                if seg['name'] == 'arps_modified' and cutted_seg['name'] == 'exp_dec':
                    cutted_seg['D_eff'] = seg['realized_D_eff_sw']

                ret_segments.append(cutted_seg)
                break
            else:
                ret_segments.append(seg)

        return ret_segments
