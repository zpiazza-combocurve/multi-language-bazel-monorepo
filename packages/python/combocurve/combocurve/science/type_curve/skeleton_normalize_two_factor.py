import numpy as np
from typing import TYPE_CHECKING, Any
from combocurve.shared.constants import DAYS_IN_MONTH
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.type_curve.normalization_two_factors import NormalizationTwoFactors
from combocurve.shared.date import date_from_index, days_from_1900, last_day_of_month
from combocurve.science.core_function.helper import get_days_in_month_from_monthly_index

if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext


# 2-factor normalization: q peak and EUR
class twoFactor:
    def __init__(self, context: 'APIContext'):
        """Get general normalization functions for 2-factor normalization
        """
        self.context = context

    def _get_target_values(self, actual_values: list, multipliers: np.ndarray):
        """Calculate target values for two factor normalization
        Args:
            actual_values: a list of the actual values of q_peak or eur
            multipliers: the calculated multipliers for them

        Returns:
            np.ndarray: the target values of q_peak or eur
        """
        target_values = np.array(actual_values) * np.array(multipliers)
        return target_values

    def _calculate_volume_data(self, well_ids, phase, forecasts, productions, resolved_resolution):
        volumes = []
        indexes = []
        peak_info = []

        for i, well in enumerate(well_ids):
            well_data = forecasts[well]
            phase_data = forecasts[well][phase]
            data_freq = resolved_resolution[i]
            production_volumes = productions[data_freq].get(well, {}).get(phase, [])
            production_indexes = productions[data_freq].get(well, {}).get('index', [])

            if data_freq == 'monthly' and len(production_indexes):
                production_indexes = get_days_in_month_from_monthly_index(production_indexes)
            if is_ratio := phase_data['forecast_type'] == 'ratio':
                ratio_data = phase_data['ratio']
                segments = ratio_data.get('segments')
                base_segments = well_data[ratio_data['basePhase']]['P_dict'].get('best', {}).get('segments', [])
            else:
                segments = phase_data['P_dict'].get('best', {}).get('segments')

            forecast_indexes = []
            if segments is None or len(segments) == 0:
                forecast_volumes = []
            else:
                end_prod_idx = productions[data_freq].get(well, {}).get('index', [0])[-1]
                if data_freq == 'daily':
                    start_forecast_idx = end_prod_idx + 1
                else:
                    start_forecast_idx = days_from_1900(last_day_of_month(date_from_index(end_prod_idx))) + 1
                time = [*range(start_forecast_idx, int(segments[-1]['end_idx']))]
                volume_predictor = _get_volume_predictor(data_freq, is_ratio)
                if len(time) == 0:
                    # In this case the forecast exists entirely within the production history.
                    forecast_volumes = []
                elif is_ratio:
                    forecast_volumes = volume_predictor(time, segments, base_segments)
                else:
                    forecast_volumes = volume_predictor(time, segments)

                if len(forecast_volumes) > 0 and data_freq == 'monthly':
                    forecast_indexes = [DAYS_IN_MONTH] * len(forecast_volumes)

            production_volumes = np.array(production_volumes, dtype=float)
            forecast_volumes = np.array(forecast_volumes, dtype=float)
            volumes.append(np.concatenate((production_volumes, forecast_volumes), dtype=float))

            production_indexes = np.array(production_indexes, dtype=int)
            forecast_indexes = np.array(forecast_indexes, dtype=int)
            indexes.append(np.concatenate((production_indexes, forecast_indexes), dtype=float))

            peak_rate = peak_days_in_month = None

            if data_freq == 'monthly':
                if len(production_volumes) and len(production_indexes):
                    peak_rate = np.nanmax(production_volumes)
                    peak_days_in_month = production_indexes[np.nanargmax(production_volumes)]
                elif len(forecast_volumes) and len(forecast_indexes):
                    peak_rate = np.nanmax(production_volumes)
                    peak_days_in_month = production_indexes[np.nanargmax(production_volumes)]

            peak_info.append({'peak_rate': peak_rate, 'peak_days_in_month': peak_days_in_month})

        return volumes, indexes, peak_info

    def apply_2_factor_normalization(
        self,
        q_peak_values: list[float],
        eur_values: list[float],
        q_peak_multipliers: list[float],
        eur_multipliers: list[float],
        well_ids: list[str],
        resolved_resolution: list[str],
        phase: str,
        forecasts: dict[str, dict[str, dict[str, Any]]],
        productions: dict[str, dict[str, float]],
    ):
        """Run the 2-factor normalization and get the 2-factor multipliers result
        Args:
            q_peak_values: The peak rates for each well.
            eur_values: The eurs for each well.
            q_peak_multipliers: The effective peak rate multiplier for each well.
            eur_multipliers: The eur multiplier for each well.
            well_ids: The wells in in this set
            phase: The current phase that's being normalized.
            forecasts: The forecast documents generated by
                type_curve_service.get_tc_background_forecasts_and_productions.
            productions: The production documents generated by
                type_curve_service.get_tc_background_forecasts_and_productions.

        Returns:
            dict: the calculated 2-factor multipliers for both eur and q_peak normalizations
        """

        q_peak_targets = self._get_target_values(q_peak_multipliers, q_peak_values)
        eur_targets = self._get_target_values(eur_multipliers, eur_values)
        volume_data, index_data, peak_info = self._calculate_volume_data(well_ids, phase, forecasts, productions,
                                                                         resolved_resolution)
        valid_wells = _convert_to_daily(resolved_resolution, q_peak_targets, eur_targets, q_peak_values, eur_values,
                                        volume_data, index_data, peak_info)

        normalization = NormalizationTwoFactors(q_peak_targets, eur_targets, q_peak_values, eur_values)
        ret = normalization.normalization_pipeline(wells_data=volume_data, valid_wells=valid_wells)

        return ret


def _convert_to_daily(resolved_resolution, q_peak_targets, eur_targets, q_peak_values, eur_values, volume_data,
                      index_data, peak_info):
    valid_wells = []
    for i, data_freq in enumerate(resolved_resolution):
        try:
            if data_freq == 'monthly':
                volume_data[i] = volume_data[i] / index_data[i]

                new_eur_value = np.nansum(volume_data[i])
                new_eur_target = new_eur_value / eur_values[i] * eur_targets[i]
                eur_values[i] = new_eur_value
                eur_targets[i] = new_eur_target

                days_in_month_q_peak = peak_info[i]['peak_days_in_month']
                new_q_peak_value = peak_info[i]['peak_rate'] / days_in_month_q_peak
                new_q_peak_target = new_q_peak_value / q_peak_values[i] * q_peak_targets[i]
                q_peak_values[i] = new_q_peak_value
                q_peak_targets[i] = new_q_peak_target
            valid_wells.append(True)
        except Exception:
            valid_wells.append(False)
    return valid_wells


def _get_volume_predictor(data_freq, is_ratio):
    return {
        ('monthly', False): MultipleSegments().predict_monthly_volumes,
        ('monthly', True): MultipleSegments().predict_monthly_time_ratio,
        ('daily', False): MultipleSegments().predict,
        ('daily', True): MultipleSegments().predict_time_ratio
    }[(data_freq, is_ratio)]
