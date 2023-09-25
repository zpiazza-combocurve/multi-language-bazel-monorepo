from typing import AnyStr, Dict
import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.shared.constants import DETERMINISTIC_STR
from combocurve.science.type_curve.TC_helper import get_ratio_without_warning, moving_average

multi_seg = MultipleSegments()

PEAK_RATE_AVERAGE_WINDOW = 30


class ForecastFunctionStore:
    def __init__(self, all_phases_forecast_doc, forecast_parent_type):
        self.all_phases_forecast_doc = all_phases_forecast_doc
        self.forecast_parent_type = forecast_parent_type

    def get_phase_type(self, phase):
        default_ret = 'not_forecasted'
        if not phase:
            return default_ret

        phase_forecast_doc = self.all_phases_forecast_doc.get(phase)
        if not phase_forecast_doc:
            return default_ret

        forecast_type = phase_forecast_doc.get('forecastType', default_ret)

        if self.forecast_parent_type == DETERMINISTIC_STR:
            return forecast_type

        return default_ret if forecast_type == default_ret else 'rate'

    def get_phase_segments(self, phase, P_series='best'):
        if not phase:
            return []
        phase_forecast_doc = self.all_phases_forecast_doc.get(phase)
        if not phase_forecast_doc:
            return []
        phase_forecast_type = phase_forecast_doc.get('forecastType')
        if phase_forecast_type == 'not_forecasted':
            return []

        if self.forecast_parent_type == DETERMINISTIC_STR:
            if phase_forecast_type == 'rate':
                phase_segments = phase_forecast_doc.get('P_dict', {}).get('best', {}).get('segments', [])
                return phase_segments

            ## now it's ratio
            ratio_dict = phase_forecast_doc.get('ratio', {})
            ratio_segments = ratio_dict.get('segments', [])
            return ratio_segments
        else:  ## probabilistic
            phase_segments = phase_forecast_doc.get('P_dict', {}).get(P_series, {}).get('segments', [])
            return phase_segments

    def predict(self, t, phase, P_series='best', to_fill=0):
        default_ret = np.ones(len(t), dtype=float) * to_fill
        if not phase:
            return default_ret
        phase_forecast_doc = self.all_phases_forecast_doc.get(phase)
        if not phase_forecast_doc:
            return default_ret

        phase_forecast_type = phase_forecast_doc.get('forecastType')
        if phase_forecast_type == 'not_forecasted':
            return default_ret

        if self.forecast_parent_type == DETERMINISTIC_STR:
            if phase_forecast_type == 'rate':
                phase_segments = phase_forecast_doc.get('P_dict', {}).get('best', {}).get('segments', [])
                return multi_seg.predict(t, phase_segments, to_fill)

            ## now it's ratio
            ratio_dict = phase_forecast_doc.get('ratio', {})
            ratio_segments = ratio_dict.get('segments', [])
            base_phase = ratio_dict.get('basePhase')
            if not base_phase:
                return default_ret

            base_forecast_doc = self.all_phases_forecast_doc.get(base_phase)
            base_segments = base_forecast_doc.get('P_dict', {}).get('best', {}).get('segments', [])
            return multi_seg.predict_time_ratio(t, ratio_segments, base_segments)
        else:  ## probabilistic
            phase_segments = phase_forecast_doc.get('P_dict', {}).get(P_series, {}).get('segments', [])
            return multi_seg.predict(t, phase_segments, to_fill)

    def predict_ratio(self, t, phase, input_base_phase, P_series, to_fill=0):
        default_ret = np.ones(len(t), dtype=float) * to_fill
        if not phase:
            return default_ret
        phase_forecast_doc = self.all_phases_forecast_doc.get(phase)
        if not phase_forecast_doc:
            return default_ret

        phase_forecast_type = phase_forecast_doc.get('forecastType')
        if phase_forecast_type == 'not_forecasted':
            return default_ret

        if self.forecast_parent_type == DETERMINISTIC_STR:
            if phase_forecast_type == 'ratio':
                ratio_dict = phase_forecast_doc.get('ratio', {})
                ratio_segments = ratio_dict.get('segments', [])
                base_phase = ratio_dict.get('basePhase')
                if not base_phase or base_phase != input_base_phase:  ## not support dependency of more than 1 layer
                    return default_ret
                return multi_seg.predict(t, ratio_segments, to_fill)

            ## rate here
            phase_segments = phase_forecast_doc.get('P_dict', {}).get('best', {}).get('segments', [])
            base_phase_forecast_doc = self.all_phases_forecast_doc.get(input_base_phase)
            if not base_phase_forecast_doc:
                return default_ret

            base_phase_forecast_type = base_phase_forecast_doc.get('forecastType')
            if base_phase_forecast_type != 'rate':  ## does not allow more than 1 layer of dependency
                return default_ret

            base_phase_segments = base_phase_forecast_doc.get('P_dict', {}).get('best', {}).get('segments', [])
            return get_ratio_without_warning(multi_seg.predict(t, phase_segments, to_fill),
                                             multi_seg.predict(t, base_phase_segments, to_fill))
        else:
            phase_segments = phase_forecast_doc.get('P_dict', {}).get(P_series, {}).get('segments', [])
            base_phase_forecast_doc = self.all_phases_forecast_doc.get(phase)
            if not base_phase_forecast_doc:
                return default_ret

            base_phase_forecast_type = base_phase_forecast_doc.get('forecastType')
            if base_phase_forecast_type == 'not_forecasted':  ## does not allow more than 1 layer of dependency
                return default_ret

            base_phase_segments = base_phase_forecast_doc.get('P_dict', {}).get(P_series, {}).get('segments', [])
            return get_ratio_without_warning(multi_seg.predict(t, phase_segments, to_fill),
                                             multi_seg.predict(t, base_phase_segments, to_fill))

    def phase_eur(self, phase, data, data_freq, P_series='best'):
        ## data: {'index', 'oil', 'gas', 'water'}
        phase_type = self.get_phase_type(phase)
        phase_segments = self.get_phase_segments(phase, P_series)

        cum_data = np.nansum(data.get(phase, []))
        data_index_arr = data.get('index', [])
        if len(data_index_arr) > 0:
            end_data_idx = data_index_arr[-1]
            if len(phase_segments) > 0:
                left_idx = phase_segments[0]['start_idx']
                right_idx = phase_segments[-1]['end_idx']
            else:
                left_idx = 0
                right_idx = 0
        else:
            if len(phase_segments) > 0:
                left_idx = phase_segments[0]['start_idx']
                right_idx = phase_segments[-1]['end_idx']
                end_data_idx = phase_segments[0]['start_idx'] - 100
            else:
                end_data_idx = 0
                left_idx = 0
                right_idx = 0

        if phase_type == 'not_forecasted':
            return cum_data

        if phase_type == 'rate':
            return multi_seg.eur(cum_data, end_data_idx, left_idx, right_idx, phase_segments, data_freq)

        ## ratio
        base_phase = self.all_phases_forecast_doc.get(phase, {}).get('ratio', {}).get('basePhase')
        base_phase_type = self.get_phase_type(base_phase)
        if base_phase_type != 'rate':
            return cum_data
        base_phase_segments = self.get_phase_segments(base_phase, P_series)
        return multi_seg.ratio_eur_interval(cum_data, end_data_idx, left_idx, right_idx, phase_segments,
                                            base_phase_segments, data_freq)

    def phase_peak_rate(
        self,
        phase: AnyStr,
        data: Dict,
        data_freq: AnyStr,
        phase_type: AnyStr,
        P_series: AnyStr = 'best',
    ) -> np.float64:
        '''
        Determine the peak rate for a phase.  On monthly data, just take the max.  For daily, pull a moving average.

        Args:
            phase (AnyStr): Phase of the data, used for pulling the data and phase type.
            data (Dict): Contains indices and per-phase prod data.
            data_freq (AnyStr): The data frequency, to determine method of peak rate determination.
            phase_type (AnyStr): 'rate' or 'ratio' depending on the specific phase type
            P_series (AnyStr): The series to pull forecast segments from if needed.

        Returns:
            float: the peak rate for that phase.
        '''
        peak_rate = np.float64(0)
        if phase_type == 'rate':
            phase_data = data.get(phase)
            if phase_data is not None and phase_data.size > 0:
                if data_freq == 'daily':
                    peak_rate = np.nanmax(
                        moving_average(np.array(phase_data, dtype=np.float64), PEAK_RATE_AVERAGE_WINDOW))
                else:
                    peak_rate = np.nanmax(np.array(phase_data, dtype=np.float64))
            else:  # No production, forecasts only.
                segments = self.get_phase_segments(phase, P_series)
                if len(segments) > 0:
                    # Segments are monotonic, so check the two endpoints of each segment to find the peak.
                    peak_rate = np.nanmax(
                        np.array([s[r] for s in segments for r in ('q_start', 'q_end') if r in s], dtype=np.float64))

        if np.isnan(peak_rate):
            peak_rate = np.float64(0)

        return peak_rate
