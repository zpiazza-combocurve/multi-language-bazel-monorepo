from itertools import groupby
import numpy as np
from datetime import date, datetime
from pymongo import UpdateOne
from typing import Any, AnyStr, Dict, Iterable, List, Optional, Tuple, Union

from bson.objectid import ObjectId

from scipy.optimize import newton

from combocurve.services.forecast.mass_shift_segments_warnings import (
    CLEAR_WARNING, WARNING_PEAK_RATIO_TOO_LARGE, WARNING_RATIO_BASE_PHASE_CUTOFF, WARNING_SEGMENT_NAME_INVALID_MESSAGE,
    WARNING_RATE_TOO_LARGE, WARNING_RATE_TOO_SMALL, WARNING_D_EFF_TOO_LARGE, WARNING_D_EFF_TOO_SMALL,
    WARNING_PEAK_RATE_TOO_LARGE, WARNING_NO_RATIO_BASE_PHASE_SEGMENTS, WARNING_PEAK_RATIO_TOO_SMALL)

from combocurve.science.forecast.auto_forecast_warnings import convert_header_to_human_readable
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.core_function.helper import shift_idx, jsonify_segments
from combocurve.services.production.helpers import get_daily_monthly_wells, group_forecasts_by_well
from combocurve.services.production.production_service import ProductionService
from combocurve.shared.date import days_from_1900
from combocurve.shared.batch_runner_with_notification import batch_updates_with_progress
from combocurve.shared.constants import (BASE_TIME_IDX, BASE_TIME_STR, BASE_TIME_NPDATETIME64, D_EFF_MAX, D_EFF_MIN,
                                         MAX_TIME_IDX, MAX_TIME_STR, PHASES, Q_MAX, Q_MIN)

from combocurve.science.segment_models.shared.helper import (linear_get_t_end_from_q_end, exp_get_t_end_from_q_end,
                                                             arps_get_t_end_from_q_end, arps_modified_switch,
                                                             exp_D_eff_2_D, arps_get_idx_from_D_new, pred_linear,
                                                             arps_D_2_D_eff, arps_D_eff_2_D, linear_get_q,
                                                             arps_get_D_delta, pred_exp, pred_arps)

BY_SEGMENT_SHIFT_TYPES = [
    'first_prod_date_daily_oil', 'first_prod_date_daily_gas', 'first_prod_date_daily_water',
    'first_prod_date_monthly_oil', 'first_prod_date_monthly_gas', 'first_prod_date_monthly_water'
]

multi_seg = MultipleSegments()

# This can be improved via the implementation of dataclasses or some other more statically-typed structure.
Segment = Dict[AnyStr, Any]


def get_reference_idx(
    well_header: Dict,
    forecast_segments: List[Segment],
    shift_reference: AnyStr,
    fixed_value: Optional[int],
) -> int:
    """
    Determines the reference index to shift or backcast to.

    Args:
        well_header (Dict): contains the well headers that could provide a relevant shift date.
        forecast_segments (List[Segment]): List of segments.
        shift_reference (str): String specifying the desired reference value.
        fixed_value (Optional[int]): Index used when shifting on a fixed value.

    Returns:
        Int: date index to shift/backcast to
    """
    forecast_reference_dates: Dict = well_header
    forecast_reference_dates['first_segment_start'] = forecast_segments[0]['start_idx']
    forecast_reference_dates['first_segment_end'] = forecast_segments[0]['end_idx']
    forecast_reference_dates['last_segment_start'] = forecast_segments[-1]['start_idx']
    forecast_reference_dates['last_segment_end'] = forecast_segments[-1]['end_idx']
    forecast_reference_dates['fixed_date'] = fixed_value

    reference_value = forecast_reference_dates.get(shift_reference, None)
    # Convert Datetimes to Dates
    if type(reference_value) is datetime:
        reference_value: date = reference_value.date()

    # Convert Dates to int indexes
    if type(reference_value) is date:
        reference_value: int = days_from_1900(reference_value)

    return reference_value


def find_all(s: str, ch: str) -> List[int]:
    """
    Returns all the indices where `ch` is found in `s`.

    Args:
        s (str): String to search
        ch (str): Character to search for

    Returns:
        List[int]: List of all indices of matched character.
    """
    return [i for i, ltr in enumerate(s) if ltr == ch]


def find_first_non_zero_null(li: List) -> Optional[int]:
    """
    Returns the index of the first non-zero and non-null value.

    Args:
        li (List): The list to search through

    Returns:
        Optional[int]: The index of the first non-zero/non-null value
    """
    return next((i for i, x in enumerate(li) if x not in [0, 0.0, None]), None)


def find_first_prod_index(p: Dict[AnyStr, Iterable], desired_phase: str) -> Optional[int]:
    """
    Finds the first date index for non-zero/non-null production values.

    Args:
        p (Dict[AnyStr, Iterable]): Dictionary mapping phases to production indices

    Returns:
        Optional[int]: the date index for first non-zero/non-null prod data
    """
    potential_match = find_first_non_zero_null(p[desired_phase])
    return p['index'][potential_match] if potential_match is not None else None


class MassShiftSegmentsService(object):
    def __init__(self, context):
        self.context = context
        self.multi_seg = MultipleSegments()
        self.production_service: ProductionService = self.context.production_service

    def mass_shift_segments(self, params: Dict):  # noqa: C901
        """
        Primary endpoint for the MassShiftSegmentsService.  There are two primary purposes of this service, mass shift
        segments, and backcasting (aka Mass Recalculate q Start).

        Args:
            params (Dict):
                forecast_id (AnyStr): The forecast to pull the segments from.
                wells (List[AnyStr]): List of wells to backcast.
                shift_reference (AnyStr): "fixed_date" | "first_prod_date" | "first_prod_date_monthly" |
                    "first_prod_date_daily" | "last_prod_date_monthly" | "last_prod_date_daily" |
                    "first_segment_start" | "first_segment_end" | "last_segment_start" | "last_segment_end"
                fixed_date_idx (Optional[int]): Fixed date index to shift/backcast to.
                shift_offset (int): Add an offset to the selected shift index.
                shift_offset_unit (AnyStr): Unit of the offset specified above.
                phases (List[AnyStr]): List of phases to shift or backcast.
                adjustment_type (AnyStr): "shift" | "backcast"
        Returns:
            None
        """

        # params = {
        #     'forecast_id': '5ebc8b90fd48b1001274eef7',
        #     'wells': [\"5ebc8b71fd48b1001274eef3\"],
        #     'shift_reference': '',
        #     'fixed_date_idx': None or Date,
        #     'shift_offset': 0,  # int
        #     'shift_offset_unit': '',
        #     'notification_id'
        #     'user_id'
        # }

        ## Shift Parameters:
        ## - reference:
        ##   - used to specify where the segments should be shifted to
        ##     - Fixed Date:
        ##       - fixed_date: a date value
        ##     - First Prod Date:
        ##       - first_prod_date: a date value
        ##     - First Prod Date Monthly:
        ##       - first_prod_date_monthly: a date value
        ##     - First Prod Date Daily:
        ##       - first_prod_date_daily: a date value
        ##     - Last Prod Date Monthly:
        ##       - last_prod_date_monthly: a date value
        ##     - Last Prod Date Daily:
        ##       - last_prod_date_daily: a date value
        ##     - First Segment Start:
        ##       - first_segment_start: a date value
        ##     - First Segment End:
        ##       - first_segment_end: a date value
        ##     - Last Segment Start:
        ##       - last_segment_start: a date value
        ##     - Last Segment End:
        ##       - last_segment_end: a date value
        ## - reference_value
        ##   - Used to specify a reference value if required.  Currently only 'Fixed Date' passes a value of a Date.
        ## - offset
        ##   - Used to shift the segments by a set number of units.
        ## - offset_unit
        ##   - The unit of the offset
        forecast_id: AnyStr = params['forecast_id']
        wells: List[AnyStr] = params['wells']
        shift_reference: str = params['shift_reference']
        fixed_date_idx: Optional[int] = params.get('fixed_date_idx')
        shift_offset: int = params['shift_offset']
        shift_offset_unit: AnyStr = params['shift_offset_unit']
        phases: List[AnyStr] = params['phases']
        adjustment_type = params.get('adjustment_type', 'shift')

        well_object_ids: List[ObjectId] = [ObjectId(well) for well in wells]

        deterministic_forecast_pipeline = [{
            '$match': {
                'forecast': ObjectId(forecast_id),
                'well': {
                    '$in': well_object_ids
                },
                'phase': {
                    '$in': PHASES
                }
            }
        }, {
            '$sort': {
                'forecastType': 1
            }
        }, {
            '$project': {
                '_id': 1,
                'well': 1,
                'phase': 1,
                'forecastType': 1,
                'data_freq': 1,
                'ratio': 1,
                'P_dict': 1,
                'model_name': 1,
                'forecast': 1,
                'forecasted': 1,
                'forecastSubType': 1,
                'p_extra': 1,
                'lastAutomaticRun': 1
            }
        }]

        deterministic_forecast_datas = list(
            self.context.db['deterministic-forecast-datas'].aggregate(deterministic_forecast_pipeline))

        wells_pipeline = [{
            '$match': {
                '_id': {
                    '$in': well_object_ids
                }
            }
        }, {
            '$project': {
                '_id': 1,
                'first_prod_date': 1,
                'last_prod_date_monthly': 1,
                'last_prod_date_daily': 1,
                'first_prod_date_daily_calc': 1,
                'first_prod_date_monthly_calc': 1,
                'primary_product': 1,
            }
        }]

        well_headers = list(self.context.db['wells'].aggregate(wells_pipeline))

        well_dict: Dict[ObjectId, Dict] = {}

        for well in well_headers:
            well_dict[well['_id']] = {
                'first_prod_date': well.get('first_prod_date'),
                'last_prod_date_monthly': well.get('last_prod_date_monthly'),
                'last_prod_date_daily': well.get('last_prod_date_daily'),
                'first_prod_date_daily': well.get('first_prod_date_daily_calc'),
                'first_prod_date_monthly': well.get('first_prod_date_monthly_calc'),
            }

        ## Get data for first prod by phase (if necessary)
        if shift_reference in BY_SEGMENT_SHIFT_TYPES:
            separator_indices = find_all(shift_reference, '_')
            desired_phase: str = shift_reference[separator_indices[-1] + 1:]
            desired_resolution: str = shift_reference[separator_indices[-2] + 1:separator_indices[-1]]
            production_data = self.production_service.get_production_with_headers(wells, [],
                                                                                  desired_resolution + '_only',
                                                                                  [desired_phase])

            first_prod_indices = {
                p['well']:
                find_first_prod_index(p['production'], desired_phase) if p['data_freq'] == desired_resolution else None
                for p in production_data
            }

            for well in well_headers:
                well_dict[well['_id']].update({shift_reference: first_prod_indices[str(well['_id'])]})

        # Only fetch the peak prod rate if we are doing backcasting.
        well_peak_rates: Dict[ObjectId, Dict[AnyStr, int]] = {}
        if adjustment_type == "backcast":
            apply_peak_boundary = params['boundaries']['rate']['apply']
            use_fixed_boundary = params['boundaries']['rate']['boundaryType'] == "fixed_rate"
            fixed_peak_bound = None
            peak_multiplier = 1.0
            if apply_peak_boundary:
                if use_fixed_boundary:
                    fixed_peak_bound = float(params['boundaries']['rate']['boundary'])
                else:
                    peak_multiplier = float(params['boundaries']['rate']['boundary']) / 100
            else:
                fixed_peak_bound = np.nan

            well_peak_rates = self.get_well_cutoff_rates(
                deterministic_forecast_datas,
                phases,
                peak_multiplier=peak_multiplier,
                fixed_peak=fixed_peak_bound,
            )

        well_data_batches = group_forecasts_by_well(deterministic_forecast_datas)

        cums_and_last_prods = self._get_cums_and_last_prods(well_data_batches, phases)

        base_phase_start_indices, base_phase_segments = self.get_base_phase_start_indices_and_segments(
            well_data_batches)

        def update_generator(well_forecast_batch: List[Dict]) -> List[UpdateOne]:
            """
            Called on the well forecast batches to do the actual shifting/backcasting

            Args:
                well_forecast_batch (List[Dict]): List of forecast documents for a single well

            Returns:
                List[UpdateOne]: List of db updates with updated forecast documents
            """
            well_phase_dict = {f['phase']: f for f in well_forecast_batch}

            # Used to track the start indices and segments for ratio forecasts.
            phase_start_indices: Dict[AnyStr, int] = {}
            phase_segments: Dict[AnyStr, List[Segment]] = {}
            update_batch = []
            rate_phases = []
            ratio_phases = []
            for phase in phases:
                forecast = well_phase_dict.get(phase)
                if forecast is None or forecast['forecastType'] == 'not_forecasted':
                    continue
                elif forecast['forecastType'] == 'rate':
                    rate_phases.append(phase)
                elif forecast['forecastType'] == 'ratio':
                    ratio_phases.append(phase)
                else:
                    raise ValueError('forecastType must be one of "rate",  "ratio" or "not_forecasted".')
            for phase in rate_phases + ratio_phases:
                forecast = well_phase_dict[phase]
                update_identifier = {
                    'well_id': forecast['well'],
                    'forecast_id': forecast['forecast'],
                    'phase': forecast['phase'],
                    'user': params.get('user_id'),
                }
                forecast_type = forecast['forecastType']

                if forecast_type == 'rate':
                    forecast_segments = forecast.get('P_dict', {}).get('best', {}).get('segments', [])
                elif forecast_type == 'ratio':
                    forecast_segments = forecast.get('ratio', {}).get('segments', [])
                else:
                    continue

                if not forecast_segments:
                    continue

                reference_value = get_reference_idx(well_dict[forecast['well']], forecast_segments, shift_reference,
                                                    fixed_date_idx)

                if reference_value is None:
                    this_update = self.context.deterministic_forecast_service.get_update_body(
                        **update_identifier,
                        warning={
                            'status':
                            True,
                            'message':
                            f'Failed to shift as {convert_header_to_human_readable(shift_reference)} is not populated.'
                        })
                    update_batch.append(this_update)
                    continue

                start_idx_new = shift_idx(reference_value, shift_offset, shift_offset_unit)
                if start_idx_new == forecast_segments[0]['start_idx']:
                    phase_start_indices[phase] = start_idx_new
                    phase_segments[phase] = forecast_segments
                    continue

                if start_idx_new > MAX_TIME_IDX or start_idx_new < BASE_TIME_IDX:
                    this_update = self.context.deterministic_forecast_service.get_update_body(
                        **update_identifier,
                        warning={
                            'status':
                            True,
                            'message':
                            f'The new start date is {(start_idx_new + BASE_TIME_NPDATETIME64).astype(str)}'
                            + f' is not between {BASE_TIME_STR} and {MAX_TIME_STR}'
                        })
                    update_batch.append(this_update)
                    continue

                if adjustment_type == 'shift':
                    shifted_segments = jsonify_segments(
                        multi_seg.shift_segments_idx(forecast_segments,
                                                     start_idx_new - forecast_segments[0]['start_idx']))

                    # Need to update segments as we go so that ratio eurs get saved correctly.
                    if forecast_type == 'rate':
                        forecast['P_dict']['best']['segments'] = shifted_segments
                    else:
                        forecast['ratio']['segments'] = shifted_segments

                    this_update = self.context.deterministic_forecast_service.get_update_body(
                        **update_identifier,
                        **_get_segments_update_dict(forecast_type, shifted_segments),
                        **_get_eur_update_data(forecast_type, phase, well_phase_dict, cums_and_last_prods),
                        warning=CLEAR_WARNING,
                        diagnostics={})
                    update_batch.append(this_update)
                elif adjustment_type == 'backcast':
                    is_cutoff_by_basephase = False
                    base_phase_segs = None
                    if forecast_type == 'ratio':
                        base_phase = forecast['ratio']['basePhase']

                        # Obtain the proper base phase segments
                        base_phase_segs = phase_segments.get(base_phase)
                        ## Check if we didn't backcast the base phase earlier.  If we didn't, use the prior base phase
                        ##   segments.
                        if base_phase_segs is None:
                            base_phase_segs = base_phase_segments.get(forecast['well'], {}).get(base_phase)

                        # Obtain the proper start index for the base phase
                        base_phase_start_index: Optional[int] = phase_start_indices.get(base_phase)
                        # Check if we had first backcasted the rate phase
                        if base_phase_start_index is None:
                            base_phase_start_index = base_phase_start_indices.get(forecast['well'], {}).get(base_phase)
                        # Check if the base_phase did not have a prior forecast.
                        if base_phase_start_index is None:
                            this_update = self.context.deterministic_forecast_service.get_update_body(
                                **update_identifier,
                                warning=WARNING_NO_RATIO_BASE_PHASE_SEGMENTS,
                            )
                            update_batch.append(this_update)
                            continue
                        is_cutoff_by_basephase = base_phase_start_index > start_idx_new
                        start_idx_new = max(base_phase_start_index, start_idx_new)

                    peak_rate = well_peak_rates.get(forecast['well'], {}).get(forecast['phase'])

                    backcasted_segments, backcast_warning = backcast_segments(
                        forecast_segments,
                        base_phase_segs,
                        start_idx_new,
                        peak_rate=peak_rate,
                        default_warning=(WARNING_RATIO_BASE_PHASE_CUTOFF if is_cutoff_by_basephase else CLEAR_WARNING))

                    phase_start_indices[phase] = backcasted_segments[0]['start_idx']
                    phase_segments[phase] = backcasted_segments
                    # Need to update segments as we go so that ratio eurs get saved correctly.
                    if forecast_type == 'rate':
                        forecast['P_dict']['best']['segments'] = backcasted_segments
                    else:
                        forecast['ratio']['segments'] = backcasted_segments

                    this_update = self.context.deterministic_forecast_service.get_update_body(
                        **update_identifier,
                        **_get_segments_update_dict(forecast_type, jsonify_segments(backcasted_segments)),
                        **_get_eur_update_data(forecast_type, phase, well_phase_dict, cums_and_last_prods),
                        warning=backcast_warning,
                        diagnostics={})
                    update_batch.append(this_update)
            return update_batch

        batch_updates_with_progress(context=self.context,
                                    batch_count=params.get('batch_count'),
                                    data_iterator=well_data_batches,
                                    update_generator=update_generator,
                                    db_updater=self.context.deterministic_forecast_service.write_forecast_data_to_db,
                                    notification_id=params.get('notification_id'),
                                    user_id=params.get('user_id'))

    def get_base_phase_start_indices_and_segments(
        self,
        well_data_batches: List[List[Dict]],
    ) -> Tuple[Dict[ObjectId, Dict[AnyStr, int]], Dict[ObjectId, Dict[AnyStr, List[Segment]]]]:  # :face_vomiting:
        '''
        In situations with ratio phases, we might not be backcasting the base phase as well.  In these
        scenarios, we need to pull the start indices for the base phase forecasts separately.

        Args:
            well_data_batches: List of forecast datas, grouped by well

        Returns:
            Dict[ObjectId, Dict[AnyStr, int]]: Dict keys are WellID and phase, in order of ascending depth.  Int is the
                start index of the base phase.
            Dict[ObjectId, Dict[AnyStr, List[Segment]]]: Dict keys are WellID and phase, in order of ascending depth.
                Contains the base phase segments.

        '''
        base_phase_start_indices = {}
        base_phase_segments = {}
        for well_fcs in well_data_batches:
            for forecast in well_fcs:
                if forecast['forecastType'] == 'ratio':
                    base_phase = forecast['ratio']['basePhase']
                    start_idx, base_phase_segs = self.get_rate_phase_segments_and_start_idx(
                        forecast['well'], forecast['forecast'], base_phase)
                    base_phase_start_indices[forecast['well']] = {base_phase: start_idx}
                    base_phase_segments[forecast['well']] = {base_phase: base_phase_segs}
        return base_phase_start_indices, base_phase_segments

    def get_rate_phase_segments_and_start_idx(self, well: ObjectId, forecast: ObjectId,
                                              phase: AnyStr) -> Tuple[int, List[Segment]]:
        '''
        Helper function to get the start index of a rate phase.

        Args:
            well     (ObjectId): the well we are pulling
            forecast (ObjectId): the forecast to pull the well from
            phase         (str): the specific phase to pull

        Returns:
            int: the start index of the forecast segments.
            List[Segment]: List of forecast segments.
        '''
        filter = {'well': well, 'forecast': forecast, 'phase': phase}
        forecast_data_doc = self.context.db['deterministic-forecast-datas'].find_one(filter)
        rate_segments: List[Segment] = forecast_data_doc['P_dict'].get('best', {}).get('segments', [])
        if len(rate_segments):
            start_idx = rate_segments[0]['start_idx']
        else:
            start_idx = None
        return start_idx, rate_segments

    def get_well_cutoff_rates(
        self,
        forecast_datas: List[Dict],
        phases: List[AnyStr],
        peak_multiplier: float = 1,
        fixed_peak: float = None,
    ) -> Dict[ObjectId, Dict[AnyStr, int]]:
        '''
        Get the cutoff rates of well phases based on parameters and production data.

        If a `fixed_peak` value is specified, use that value for all peak cutoff rates. Otherwise, pull
        production peak rates and scale peaks by the specified multiplier value.

        Args:
            forecast_datas: List of forecast data objects
            phases: List of phases to get peaks for
            peak_multiplier: multiply all peaks by this value (default of 1)
            fixed_peak: If we are provided a fixed peak, then use that instead of the peak from prod data.

        Returns:
            Dictionary mapping well ids to a Dictionary containing peak rates per phase.
        '''
        forecast_data_dict = {f['_id']: f for f in forecast_datas}
        if fixed_peak is None:
            monthly_fcs = {f['_id'] for f in forecast_datas if f['data_freq'] == 'monthly'}
            monthly_rate_fcs = {f for f in monthly_fcs if forecast_data_dict[f]['forecastType'] == 'rate'}
            monthly_ratio_fcs = monthly_fcs - monthly_rate_fcs
            monthly_rate_peaks = self.production_service.get_well_peak_rates(
                [forecast_data_dict[f]['well'] for f in monthly_rate_fcs],
                False,
                phases,
            )
            monthly_ratio_peaks = {
                forecast_data_dict[f]['well']: self.production_service.get_single_well_peak_ratio(
                    forecast_data_dict[f]['well'],
                    forecast_data_dict[f]['phase'],
                    forecast_data_dict[f]['ratio']['basePhase'],
                    False,
                )
                for f in monthly_ratio_fcs
            }
            daily_fcs = {f['_id'] for f in forecast_datas if f['data_freq'] == 'daily'}
            daily_rate_fcs = {f for f in daily_fcs if forecast_data_dict[f]['forecastType'] == 'rate'}
            daily_ratio_fcs = daily_fcs - daily_rate_fcs
            daily_rate_peaks = self.production_service.get_well_peak_rates(
                [forecast_data_dict[f]['well'] for f in daily_rate_fcs],
                True,
                phases,
            )
            daily_ratio_peaks = {
                forecast_data_dict[f]['well']: self.production_service.get_single_well_peak_ratio(
                    forecast_data_dict[f]['well'],
                    forecast_data_dict[f]['phase'],
                    forecast_data_dict[f]['ratio']['basePhase'],
                    True,
                )
                for f in daily_ratio_fcs
            }
            # well_peak_rates = {**monthly_rate_peaks, **monthly_ratio_peaks, **daily_rate_peaks, **daily_ratio_peaks}
            well_peak_rates = {}
            for well in [f['well'] for f in forecast_datas]:
                well_peak_rates[well] = {
                    **monthly_rate_peaks.get(well, {}),
                    **monthly_ratio_peaks.get(well, {}),
                    **daily_rate_peaks.get(well, {}),
                    **daily_ratio_peaks.get(well, {})
                }
            well_peak_rates = {
                well: {phase: rate * peak_multiplier
                       for phase, rate in rates.items()}
                for well, rates in well_peak_rates.items()
            }
        else:
            well_peak_rates = {
                well: {phase: fixed_peak
                       for phase in phases}
                for well in [f['well'] for f in forecast_datas]
            }
        return well_peak_rates

    def _get_cums_and_last_prods(self, well_data_batches: List[List[Dict[str, Any]]],
                                 phases: Iterable[str]) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Return cum and last prod data for use when saving eur and rur to the database."""
        daily_wells, monthly_wells = get_daily_monthly_wells(well_data_batches, phases)
        return self.production_service.get_cums_and_last_prods(daily_wells, monthly_wells, phases)


def create_data_batches(deterministic_forecast_datas: List[Dict]) -> List[List[Dict]]:
    '''
    Specifically due to ratio phases, we need to do the backcasting in per-well batches.

    Params:
        deterministic_forecast_datas: List of forecast data objects

    Returns:
        Same forecast data objects, grouped by well.  Within each group, the forecast-datas should
        be sorted so that all rate phases come before ratio phases.
    '''
    sorted_by_well = sorted(deterministic_forecast_datas, key=lambda x: str(x['well']))
    well_data_batches = [list(g) for k, g in groupby(sorted_by_well, lambda x: str(x['well']))]
    return well_data_batches


def backcast_segments(segs: List[Segment],
                      base_segs: Optional[List[Segment]],
                      start_idx_new: int,
                      peak_rate: Optional[float] = None,
                      default_warning: Dict = CLEAR_WARNING) -> Tuple[List[Segment], Dict]:
    """
    First a segment is chosen to be backcasted by determining if the new start
    index the backcast segment (first segment's start index plus some offset)
    falls within the segment.  All segments proceeding the backcast segment are
    dropped.

    For backcasting single segment see also `backcast_segment`.

    Args:
        segs (List[Segment]): The target phase segments to be backcasted.
        base_segs (Optional[List[Segment]]): The base phase segments for backcasting ratios
        start_idx_new (int): The desired backcast start index as determined by user input.
        peak_rate (Optional[float]): The peak rate to cutoff the backcasted segment at.
        default_warning (Dict): Used to specify a default warning when backcasting.

    Returns:
        List[Segment]: The backcasted segments
        Dict: The warning message for the backcast process
    """
    if len(segs) == 0:
        return [], default_warning

    # Find the new start index of the backcast segment.
    backcast_index = _get_backcast_segment_idx(segs, start_idx_new)
    if backcast_index is None:
        return segs, {'status': True, 'message': 'Trying to backcast to a date that is after current forecast ends'}

    segment, backcast_warning = backcast_segment(segs[backcast_index],
                                                 base_segs,
                                                 start_idx_new,
                                                 peak_rate=peak_rate,
                                                 default_warning=default_warning)
    return [segment] + segs[(backcast_index + 1):], backcast_warning


def backcast_segment(seg: Segment,
                     base_segs: Optional[List[Segment]],
                     start_idx_new: int,
                     peak_rate: Optional[float] = None,
                     check_boundaries: bool = True,
                     default_warning: Dict = CLEAR_WARNING) -> Tuple[Segment, Dict]:
    """
    Backcasting updates the parameters of the segment such that a shift in the
    orginal function `f(x)` by some offset `t | f(x - t)` doesn't change it's evaluation
    for all `x` over the domain of both functions i.e. `g(x) = f(x) over D`

    A special case for `arps_modified` segments exists if the new start index
    falls in the exponential section (`start_idx` >= `sw_idx`) of this segment
    then the segment type is changed to `exp_dec`.

    Args:
        seg (Segment): The segment that we are backcasting.
        base_segs (Optional[List[Segment]]): A list of base phase segments for use with ratio phases.
        start_idx_new (int): The target start idx as determined from user input.
        peak_rate (Optional[float]): The maximum rate at which we should cutoff the backcasted segment.
        check_boundaries (bool): Determines if we should try and check the bounds of the backasted segment
        default_warning (Dict): A default warning to be used if the segment isn't cutoff prematurely.
    Returns:
        Segment: the backcasted Segment
        Dict: a warning dictionary describing the cutoff conditions used.
    """
    ############################
    #  Recalculate Parameters  #
    ############################
    # Recalculate `q_start` https://www.desmos.com/calculator/pr666ircju

    seg_name = seg['name']
    if check_boundaries:
        start_idx, boundary_warning = _get_bounded_start_idx_and_warning(seg, start_idx_new, peak_rate, base_segs,
                                                                         default_warning)
    else:
        start_idx, boundary_warning = (start_idx_new, default_warning)

    #########################################################################################

    if seg_name in {"exp_inc", "exp_dec"}:
        q_start_new = pred_exp(start_idx, seg["start_idx"], seg["q_start"], seg["D"])
        ret = {
            **seg,
            "start_idx": start_idx,
            "q_start": q_start_new,
        }
        return ret, boundary_warning
    if seg_name in {"arps_modified"}:
        # Get the actual index of the switch point.
        sw_idx_realized = arps_get_idx_from_D_new(seg["start_idx"], seg["D"], exp_D_eff_2_D(seg["target_D_eff_sw"]),
                                                  seg["b"])
        # Return a exponential decline segment if cast past switch index.
        if start_idx >= sw_idx_realized:
            seg_exp = {
                "name": "exp_dec",
                "start_idx": seg["sw_idx"],
                "end_idx": seg["end_idx"],
                "q_start": seg["q_sw"],
                "q_end": seg["q_end"],
                "slope": -1,
                "D": seg["D_exp"],
                "D_eff": seg["D_exp_eff"],
            }
            exp_backcast, _ = backcast_segment(seg_exp,
                                               base_segs,
                                               start_idx,
                                               check_boundaries=False,
                                               default_warning=default_warning)
            return exp_backcast, boundary_warning
        # Otherwise cast arps part and keep all `modified_arps` params.
        seg_arps = {
            **seg,
            "name": "arps",
        }

        seg_arps_backcast, _ = backcast_segment(seg_arps,
                                                base_segs,
                                                start_idx,
                                                check_boundaries=False,
                                                default_warning=default_warning)

        # Recalculate switch parameters.
        sw_params = arps_modified_switch(
            seg_arps_backcast["start_idx"],
            seg_arps_backcast["b"],
            seg_arps_backcast["D"],
            seg_arps_backcast["target_D_eff_sw"],
        )
        # Result.
        ret = {
            **seg_arps_backcast,
            **sw_params,
            "name": seg_name,
        }
        return ret, boundary_warning
    # Recalculate `D` and `q_start` https://www.desmos.com/calculator/4h5avptig0
    if seg_name in {"arps", "arps_inc"}:
        D_new = arps_get_D_delta(seg["D"], seg["b"], (start_idx - seg["start_idx"]))
        D_eff_new = arps_D_2_D_eff(D_new, seg["b"])
        q_start_new = pred_arps(start_idx, seg["start_idx"], seg["q_start"], seg["D"], seg["b"])
        ret = {
            **seg,
            "start_idx": start_idx,
            "D": D_new,
            "D_eff": D_eff_new,
            "q_start": q_start_new,
        }
        return ret, boundary_warning
    # Shift start index
    if seg_name in {"flat", "empty"}:
        ret = {
            **seg,
            "start_idx": start_idx,
        }
        return ret, boundary_warning
    # Recalculate `q_start` https://www.desmos.com/calculator/in972n69qc
    if seg_name == "linear":
        q_start_new = pred_linear(start_idx, seg["q_start"], seg["start_idx"], seg["k"])
        ret = {
            **seg,
            "start_idx": start_idx,
            "q_start": q_start_new,
        }
        return ret, boundary_warning

    return seg, {'status': True, 'message': WARNING_SEGMENT_NAME_INVALID_MESSAGE}


def _get_bounded_start_idx_and_warning(
    seg: Segment,
    start_idx_new: int,
    peak_rate: Optional[float],
    base_segs: Optional[List[Segment]],
    default_warning: Dict,
) -> Tuple[int, Dict]:
    """
    Determines what the minimum date idx is for the backcast segment start index.

    Args:
        seg (Segment): The segment that we are finding the start idx for.
        start_idx_new (int): The target start idx as determined from user input.
        peak_rate (Optional[float]): The maximum rate at which we should cutoff the backcasted segment.
        base_segs (Optional[List[Segment]]): A list of base phase segments for use with ratio phases.
        default_warning (Dict): A default warning to be used if the segment isn't cutoff prematurely.

    Returns:
        int: The new start idx for the segment.
        Dict: Warning describing the cutoff criteria used to determine index.
    """
    max_shift_cap = seg['end_idx']

    shift_idx_warnings: Dict[int, AnyStr] = {int(np.floor(start_idx_new)): default_warning}

    # First, check any boundaries for both rate/ratio
    D_bound, D_warning = _get_D_eff_backcast_boundary(seg)
    if D_bound and D_bound < max_shift_cap and not np.isnan(D_bound):
        shift_idx_warnings[int(np.floor(D_bound))] = D_warning

    # Ratio phase things first
    if base_segs and len(base_segs):
        # Check ratio phase rate is within numerical bounds
        ratio_rate_bound, ratio_rate_warning = _get_peak_ratio_rate_backcast_boundary(seg, base_segs, Q_MAX)
        if ratio_rate_bound and ratio_rate_bound < max_shift_cap and not np.isnan(ratio_rate_bound):
            shift_idx_warnings[int(np.floor(ratio_rate_bound))] = ratio_rate_warning

        # Check that ratio phase rate is within user-specified bounds
        if peak_rate is not None and not np.isnan(peak_rate):
            peak_ratio_rate_bound, peak_ratio_warning = _get_peak_ratio_rate_backcast_boundary(
                seg, base_segs, peak_rate)
            if peak_ratio_rate_bound and peak_ratio_rate_bound < max_shift_cap and not np.isnan(peak_ratio_rate_bound):
                shift_idx_warnings[int(np.floor(peak_ratio_rate_bound))] = peak_ratio_warning
    else:  # Rate phase stuff
        # Check rate is within numerical bounds
        rate_bound, rate_warning = _get_rate_backcast_boundary(seg)
        if rate_bound and rate_bound < max_shift_cap and not np.isnan(rate_bound):
            shift_idx_warnings[int(np.floor(rate_bound))] = rate_warning

        # Check rate is within user-specified bounds
        if peak_rate is not None and not np.isnan(peak_rate):
            peak_rate_bound, peak_rate_warning = _get_peak_rate_backcast_boundary(seg, peak_rate)
            if peak_rate_bound and peak_rate_bound < max_shift_cap and not np.isnan(peak_rate_bound):
                shift_idx_warnings[int(np.floor(peak_rate_bound))] = peak_rate_warning

    least_problematic_idx: int = max(shift_idx_warnings.keys())
    least_problematic_idx_warning: AnyStr = shift_idx_warnings.get(least_problematic_idx, CLEAR_WARNING)

    return least_problematic_idx, least_problematic_idx_warning


def _get_backcast_segment_idx(segs: List[Segment], start_idx_new: int) -> int:
    """
    Determines which segment (index) needs to be backcasted based on the provided start_idx.

    Args:
        segs (List[Segment]): Segment list to choose backcast segment from
        start_idx_new (int): The new start idx of the backcasted segments

    Returns:
        int: Index of the segment to be backcasted (generally 0)
    """
    if segs[0]['end_idx'] >= start_idx_new:
        return 0
    else:
        for i in range(1, len(segs)):
            seg = segs[i]
            if seg['start_idx'] <= start_idx_new <= seg["end_idx"]:
                return i
    return None


def _get_segments_update_dict(forecast_type: AnyStr, segments: List[Segment]) -> Dict:
    """
    Create an update dictionary with the new segments based on forecast type.

    Args:
        forecast_type (AnyStr): "rate" | "ratio"
        segments (List[Segment]): Segments to place in the update dictionary.

    Returns:
        Dict: Dictionary with structure to be placed in forecast document
    """
    if forecast_type == 'rate':
        return {'P_dict': {'best': {'segments': segments}}}

    if forecast_type == 'ratio':
        return {'ratio': {'segments': segments}}

    return {}


def _get_rate_backcast_boundary(seg: Segment) -> Tuple[int, Dict]:
    '''
    Gets the backcast boundary as determined by the maximum (or min) allowable rate.

    Args:
        seg (Segment): a Segment dictionary containing its defining parameters

    Returns:
        boundary_idx (int): The furthest back we can shift without exceeding max (or min) rate
        warning_obj (dict): An object containing a warning to be used if this boundary is selected

    Notes:
        This function could be vastly improved if the individual segment functions took keyword arguments.
        A dispatcher structure could be used, something like the following:

        ```
        boundary_functions: {
            'arps': arps_get_t_end_from_q_end,
            'arps_modified': arps_get_t_end_from_q_end,
            'exp_dec': exp_get_t_end_from_q_end,
            ...
        }
        idx, warning = boundary_functions[seg_name](**segment)
        ```
    '''
    seg_name = seg.get('name')
    start_idx = seg.get('start_idx')
    D = seg.get('D')
    b = seg.get('b')
    q_start = seg.get('q_start')
    k = seg.get('k')

    rate_boundary_idx = 0
    rate_boundary_warning = CLEAR_WARNING

    if seg_name in {'arps_modified', 'arps'}:
        rate_boundary_idx = np.ceil(arps_get_t_end_from_q_end(start_idx, q_start, D, b, Q_MAX))
        rate_boundary_warning = WARNING_RATE_TOO_LARGE

    elif seg_name == 'exp_dec':
        rate_boundary_idx = np.ceil(exp_get_t_end_from_q_end(start_idx, q_start, D, Q_MAX))
        rate_boundary_warning = WARNING_RATE_TOO_LARGE

    elif seg_name == 'linear' and k < 0:
        rate_boundary_idx = np.ceil(linear_get_t_end_from_q_end(start_idx, q_start, k, Q_MAX))
        rate_boundary_warning = WARNING_RATE_TOO_LARGE

    elif seg_name == 'arps_inc':
        rate_boundary_idx = np.ceil(arps_get_t_end_from_q_end(start_idx, q_start, D, b, Q_MIN))
        rate_boundary_warning = WARNING_RATE_TOO_SMALL

    elif seg_name == 'exp_inc':
        rate_boundary_idx = np.ceil(exp_get_t_end_from_q_end(start_idx, q_start, D, Q_MIN))
        rate_boundary_warning = WARNING_RATE_TOO_SMALL

    elif seg_name == 'linear' and k > 0:
        rate_boundary_idx = np.ceil(linear_get_t_end_from_q_end(start_idx, q_start, k, Q_MIN))
        rate_boundary_warning = WARNING_RATE_TOO_SMALL

    else:
        return None, rate_boundary_warning

    return rate_boundary_idx, rate_boundary_warning


def _get_D_eff_backcast_boundary(seg: Segment) -> Tuple[int, Dict]:
    '''
    Gets the backcast boundary as determined by the maximum (or min) allowable D.

    Args:
        seg (Segment): a Segment dictionary containing its defining parameters

    Returns:
        boundary_idx (int): The furthest back we can shift without exceeding max (or min) D
        warning_obj (dict): An object containing a warning to be used if this boundary is selected

    Notes:
        Exponential Incline/Decline models aren't considered here, as their D values remain constant over time.

        This function could be vastly improved if the individual segment functions took keyword arguments.
        A dispatcher structure could be used, something like the following:

        ```
        boundary_functions: {
            'arps': arps_get_t_end_from_q_end,
            'arps_modified': arps_get_t_end_from_q_end,
            'exp_dec': exp_get_t_end_from_q_end,
            ...
        }
        idx, warning = boundary_functions[seg_name](**segment)
        ```
    '''
    seg_name = seg.get('name')
    start_idx = seg.get('start_idx')
    D = seg.get('D')
    b = seg.get('b')
    q_start = seg.get('q_start')
    k = seg.get('k')

    D_eff_boundary_idx = 0
    D_eff_boundary_warning = CLEAR_WARNING

    if seg_name in {'arps_modified', 'arps'}:
        D_MAX = arps_D_eff_2_D(D_EFF_MAX, b)
        D_eff_boundary_idx = np.ceil(arps_get_idx_from_D_new(start_idx, D, D_MAX, b))
        D_eff_boundary_warning = WARNING_D_EFF_TOO_LARGE

    elif seg_name == 'linear' and k < 0:
        new_q0 = linear_get_q(k, D_EFF_MAX)
        D_eff_boundary_idx = np.ceil(linear_get_t_end_from_q_end(start_idx, q_start, k, new_q0))
        D_eff_boundary_warning = WARNING_D_EFF_TOO_LARGE

    elif seg_name == 'arps_inc':
        D_MIN = arps_D_eff_2_D(D_EFF_MIN, b)
        D_eff_boundary_idx = np.ceil(arps_get_idx_from_D_new(start_idx, D, D_MIN, b))
        D_eff_boundary_warning = WARNING_D_EFF_TOO_SMALL

    elif seg_name == 'linear' and k > 0:
        new_q0 = linear_get_q(k, D_EFF_MIN)
        D_eff_boundary_idx = np.ceil(linear_get_t_end_from_q_end(start_idx, q_start, k, new_q0))
        D_eff_boundary_warning = WARNING_D_EFF_TOO_SMALL

    else:
        return None, D_eff_boundary_warning

    return D_eff_boundary_idx, D_eff_boundary_warning


def _get_peak_rate_backcast_boundary(seg: Segment, peak_rate: float) -> Tuple[int, Dict]:
    '''
    Gets the backcast boundary as determined by a multiplier of the peak production rate.

    Args:
        seg (Segment): a Segment dictionary containing its defining parameters
        peak_rate (float): The peak rate to target.

    Returns:
        boundary_idx (int): The furthest back we can shift without exceeding max (or min) rate
        warning_obj (dict): An object containing a warning to be used if this boundary is selected

    Notes:
        This function could be vastly improved if the individual segment functions took keyword arguments.
        A dispatcher structure could be used, something like the following:

        ```
        boundary_functions: {
            'arps': arps_get_t_end_from_q_end,
            'arps_modified': arps_get_t_end_from_q_end,
            'exp_dec': exp_get_t_end_from_q_end,
            ...
        }
        idx, warning = boundary_functions[seg_name](**segment)
        ```
    '''
    seg_name = seg.get('name')
    start_idx = seg.get('start_idx')
    D = seg.get('D')
    b = seg.get('b')
    q_start = seg.get('q_start')
    k = seg.get('k')

    rate_boundary_idx = 0
    rate_boundary_warning = CLEAR_WARNING

    if seg_name in {'arps_modified', 'arps'}:
        rate_boundary_idx = np.ceil(arps_get_t_end_from_q_end(start_idx, q_start, D, b, peak_rate))
        rate_boundary_warning = WARNING_PEAK_RATE_TOO_LARGE(peak_rate)

    elif seg_name == 'exp_dec':
        rate_boundary_idx = np.ceil(exp_get_t_end_from_q_end(start_idx, q_start, D, peak_rate))
        rate_boundary_warning = WARNING_PEAK_RATE_TOO_LARGE(peak_rate)

    elif seg_name == 'linear' and k < 0:
        rate_boundary_idx = np.ceil(linear_get_t_end_from_q_end(start_idx, q_start, k, peak_rate))
        rate_boundary_warning = WARNING_PEAK_RATE_TOO_LARGE(peak_rate)

    # No need to check incline conditions, these are covered by the other rate checks.

    else:
        return None, rate_boundary_warning

    return rate_boundary_idx, rate_boundary_warning


def _get_peak_ratio_rate_backcast_boundary(seg: Segment, base_segs: List[Segment],
                                           peak_ratio: float) -> Tuple[int, Dict]:
    '''
    Gets the backcast boundary as determined by the peak production ratio.

    Args:
        seg (Segment): a Segment dictionary containing its defining parameters
        base_segs (List[Segment]): list of Segments for the base phase
        peak_ratio (float): the peak ratio to target

    Returns:
        boundary_idx (int): The furthest back we can shift without exceeding max (or min) rate
        warning_obj (dict): An object containing a warning to be used if this boundary is selected

    Notes:
        This function could be vastly improved if the individual segment functions took keyword arguments.
        A dispatcher structure could be used, something like the following:

        ```
        boundary_functions: {
            'arps': arps_get_t_end_from_q_end,
            'arps_modified': arps_get_t_end_from_q_end,
            'exp_dec': exp_get_t_end_from_q_end,
            ...
        }
        idx, warning = boundary_functions[seg_name](**segment)
        ```
    '''
    ratio_boundary_idx = ratio_get_T_from_rate(seg, base_segs, peak_ratio)
    ratio_boundary_warning = WARNING_PEAK_RATIO_TOO_LARGE(peak_ratio)

    ratio_min_boundary_idx = ratio_get_T_from_rate(seg, base_segs, Q_MIN)
    if ratio_min_boundary_idx is not None:
        if ratio_boundary_idx is None or ratio_min_boundary_idx < ratio_boundary_idx:
            ratio_boundary_idx = ratio_min_boundary_idx
            ratio_boundary_warning = WARNING_PEAK_RATIO_TOO_SMALL

    return ratio_boundary_idx, ratio_boundary_warning


def _get_eur_update_data(forecast_type: str, phase: str, well_phase_dict: Dict[str, Any],
                         cums_and_last_prods: Dict[str, Dict[str, Dict[str, float]]]):
    """Collate the update data required to properly save EURs and RURs"""
    forecast = well_phase_dict[phase]
    data_freq = forecast['data_freq']
    well_id = str(forecast['well'])
    cum = cums_and_last_prods[data_freq][well_id][phase]
    last_prod_idx = cums_and_last_prods[data_freq][well_id]['last_prod']
    if forecast_type == 'ratio':
        base_phase = forecast['ratio']['basePhase']
        base_segs = well_phase_dict[base_phase]['P_dict'].get('best', {}).get('segments', [])
    else:
        base_segs = None
    return {
        'data_freq': data_freq,
        'calc_eur': True,
        'forecastType': forecast_type,
        'cum': cum,
        'last_prod_idx': last_prod_idx,
        'base_segs': base_segs
    }


def ratio_get_T_from_rate(seg: Segment, base_segs: List[Segment], peak_rate: float):
    '''
    On a ratio forecast, solve for the time at which the forecasted rate equals the given peak rate.

    Args:
        seg (Segment): The ratio phase segments
        base_segs (List[Segment]): List of segments for the base phase
        peak_rate (float): the target peak rate

    Returns:
        Optional[float]: the time at which the forecasted rate equals the specified peak rate.
    '''
    def _opt_func(t):
        if np.isnan(t) or t is None:
            return np.inf
        e = multi_seg_predict_ratio_unbounded(np.array(t, dtype=np.float64), [seg], base_segs) - peak_rate
        return float(e)

    try:
        t_root, r = newton(_opt_func, seg['start_idx'], full_output=True, disp=False)
        if r.converged:
            return t_root
        else:
            t_root, r = newton(_opt_func, base_segs[0]['start_idx'], full_output=True, disp=False)
            if r.converged:
                return t_root
    except RuntimeError as _:  # noqa: F841
        pass
    return None


def multi_seg_predict_unbounded(t_raw: Union[Iterable, int, float],
                                segments: List[Segment],
                                to_fill: float = 0) -> np.ndarray:
    '''
    Predict a value(s) using multiple segments for multiple or single `t` values.

    Behavior differs from normal `MultipleSegments.predict`, in that it can predict on values outside
    of the range `[segments[0]['start_idx], segments[-1]['end_idx]]`.  It does this by essentially extending
    the valid bounds of the first and last segments.

    Args:
        t_raw (Iterable, int, or float): the value(s) to predict on.
        segments

    Returns:
        np.ndarray: Array of same shape as t_raw
    '''
    t = np.array(t_raw)
    ret = np.full(t.shape, to_fill, dtype=float)
    for i, seg in enumerate(segments):
        this_segment_object = multi_seg.get_segment_object(seg)
        range_start = (t >= seg['start_idx'])
        range_end = (t <= seg['end_idx'])
        if i == 0:
            range_start = (t >= 0)
        if i == len(segments) - 1:
            range_end = (t <= MAX_TIME_IDX)
        this_range = range_start & range_end
        ret[this_range] = this_segment_object.predict(t[this_range])

    return ret


def multi_seg_predict_ratio_unbounded(t: Union[Iterable, int, float], segments: List[Segment],
                                      base_segments: List[Segment]) -> np.ndarray:
    '''
    Predicts a value(s) using multiple segments for ratio phases.

    Args:
        t_raw (Iterable, int, or float): the value(s) to predict on.
        segments: Ratio segments
        base_segments: base phase segments

    Returns:
        np.ndarray: Array of same shape as t_raw
    '''
    base_prediction = multi_seg_predict_unbounded(t, base_segments)
    ratio_prediction = multi_seg_predict_unbounded(t, segments)
    return base_prediction * ratio_prediction
