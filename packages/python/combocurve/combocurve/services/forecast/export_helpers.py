import re
from typing import Union, Iterable, List, Optional, Type, Mapping, Tuple, Sequence
from itertools import groupby
from datetime import date
from math import inf
from bson import ObjectId
from combocurve.science.segment_models.shared.helper import sum_forecast_by_month

from combocurve.shared.date import date_from_index, days_from_1900, last_day_of_month
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from .export_settings import (DEFAULT_SERIES, DataExportSettings, ProductionExportSettings, ForecastExportSettings,
                              ExportSettingsBase)

RESOLUTION_MAP = {'monthly': 'monthly_only', 'daily': 'daily_only'}
WELL_HEADERS = ['well_name', 'well_number', 'api14', 'inptID', 'chosenID', 'aries_id', 'phdwin_id']
RATIO_SERIES = 'ratio'
PHASES = ['oil', 'gas', 'water']
PRESSURE_PHASES = [
    'gas_lift_injection_pressure',
    'bottom_hole_pressure',
    'vessel_separator_pressure',
    'tubing_head_pressure',
    'flowline_pressure',
    'casing_head_pressure',
]
OTHER_PHASES = [
    'choke',
    'days_on'
    'hours_on',
    'gasInjection',
    'waterInjection',
    'co2Injection',
    'steamInjection',
    'ngl',
]
CUSTOM_PHASES = [
    'customNumber0',
    'customNumber1',
    'customNumber2',
    'customNumber3',
    'customNumber4',
]
ALL_PHASES = [*PHASES, *PRESSURE_PHASES, *OTHER_PHASES, *CUSTOM_PHASES, 'operational_tag']
HEADERS_MAP = {
    'well_name': 'Well Name',
    'well_number': 'Well Number',
    'api14': 'API 14',
    'inptID': 'INPT ID',
    'chosenID': 'Chosen ID',
    'aries_id': 'Aries ID',
    'phdwin_id': 'PhdWin ID',
    'oil': 'Oil',
    'gas': 'Gas',
    'water': 'Water',
    'date': 'Date',
    'P10': 'P10',
    'P50': 'P50',
    'P90': 'P90',
    'best': 'Best',
    'ratio': 'Ratio',
    'gas_lift_injection_pressure': 'Gas Lift Injection Pressure',
    'bottom_hole_pressure': 'Bottom Hole Pressure',
    'vessel_separator_pressure': 'Vessel Separator Pressure',
    'tubing_head_pressure': 'Tubing Head Pressure',
    'flowline_pressure': 'Flowline Pressure',
    'casing_head_pressure': 'Casing Head Pressure',
    'choke': 'Choke',
    'days_on': 'Days On',
    'hours_on': 'Hours On',
    'gasInjection': 'Gas Injection',
    'waterInjection': 'Water Injection',
    'co2Injection': 'CO2 Injection',
    'steamInjection': 'Steam Injection',
    'ngl': 'NGL',
    'production': 'Production',
    'forecast': 'Forecast',
    'operational_tag': 'Operational Tag',
}
DAILY_FORECAST_MAX_DAYS = 365 * 5
UNITS: Mapping[Tuple[Union[str, Iterable[str]], str], str] = {
    ('oil', 'monthly'): 'BBL/M',
    ('oil', 'daily'): 'BBL/D',
    ('gas', 'monthly'): 'MCF/M',
    ('gas', 'daily'): 'MCF/D',
    ('water', 'monthly'): 'BBL/M',
    ('water', 'daily'): 'BBL/D',
    # pressures
    ('gas_lift_injection_pressure', 'monthly'): 'PSI',
    ('gas_lift_injection_pressure', 'daily'): 'PSI',
    ('bottom_hole_pressure', 'monthly'): 'PSI',
    ('bottom_hole_pressure', 'daily'): 'PSI',
    ('tubing_head_pressure', 'monthly'): 'PSI',
    ('tubing_head_pressure', 'daily'): 'PSI',
    ('flowline_pressure', 'monthly'): 'PSI',
    ('flowline_pressure', 'daily'): 'PSI',
    ('casing_head_pressure', 'monthly'): 'PSI',
    ('casing_head_pressure', 'daily'): 'PSI',
    ('vessel_separator_pressure', 'monthly'): 'PSI',
    ('vessel_separator_pressure', 'daily'): 'PSI',
    # others
    ('choke', 'monthly'): 'in',
    ('choke', 'daily'): 'in',
    ('gasInjection', 'monthly'): 'MCF/M',
    ('gasInjection', 'daily'): 'MCF/D',
    ('waterInjection', 'monthly'): 'BBL/M',
    ('waterInjection', 'daily'): 'BBL/D',
    ('co2Injection', 'monthly'): 'MCF/M',
    ('co2Injection', 'daily'): 'MCF/D',
    ('steamInjection', 'monthly'): 'MCF/M',
    ('steamInjection', 'daily'): 'MCF/D',
    ('ngl', 'monthly'): 'BBL/M',
    ('ngl', 'daily'): 'BBL/D',
}
PRODUCTION_TO_FORECAST = {
    'productionMonthly': 'forecastMonthly',
    'productionDaily': 'forecastDaily',
}
DATA_KINDS = ['production', 'forecast']


def get_export_settings(settings,
                        settings_name: str,
                        settingsClass: Type[ExportSettingsBase],
                        extra: Optional[dict] = None):
    if not extra:
        extra = {}
    return settingsClass.from_dict({**settings.get(settings_name, {}), **extra})


def get_phases_to_include(headers: Iterable[str]):
    return [h for h in headers if h in ALL_PHASES]


def get_header_display(header: Union[str, Sequence[str]],
                       settings: DataExportSettings,
                       include_kind=False,
                       extra_header_map=None):
    if isinstance(header, str):
        phase, series, kind = header, None, None
    elif len(header) == 2:
        phase, series = header
        kind = None
    elif len(header) == 3:
        phase, series, _ = header
        kind = None
    else:
        phase, series, _, kind = header

    all_headers_map = {**HEADERS_MAP, **(extra_header_map or {})}

    base_display = all_headers_map.get(phase, phase)
    if series and not settings.omit_series_in_headers:
        base_display = f'{base_display} - {all_headers_map.get(series, series)}'
    if kind and include_kind:
        base_display = f'{base_display} {all_headers_map.get(kind, kind)}'
    unit = UNITS.get((phase, settings.resolution))
    return f'{base_display} ({unit})' if unit else base_display


def _get_phases(prod_data, index, phases=PHASES):
    return {(phase, None, None, 'production'): prod_data[phase][index] for phase in phases}


def get_prod_dicts(well_data,
                   settings: ProductionExportSettings,
                   include_kind=False,
                   phases=PHASES,
                   extra_header_map=None):
    headers = well_data['headers']
    production = well_data['production']
    prod_indexes = production['index']

    start_idx = days_from_1900(settings.start) if settings.start else -inf
    end_idx = days_from_1900(settings.end) if settings.end else inf

    raw_headers_dicts = ({
        **headers,
        'date': date_from_index(prod_idx),
        **_get_phases(production, i, phases),
    } for (i, prod_idx) in enumerate(prod_indexes) if start_idx <= prod_idx <= end_idx)

    return ({
        get_header_display(k, settings, include_kind, extra_header_map=extra_header_map): v
        for k, v in row.items()
    } for row in raw_headers_dicts)


def _get_segment_indexes(segments: List, min_limit: int, max_limit: int, max_span=inf):
    if not segments:
        return []
    start = max(int(min((s['start_idx'] for s in segments))), min_limit)
    end = min(int(max((s['end_idx'] for s in segments))), max_limit)

    if end - start > max_span:
        if max_limit != inf and min_limit == -inf:
            start = end - max_span
        else:
            end = start + max_span

    return range(start, end + 1)


def _get_forecast_series_index_values(all_values, index):
    return {series_key: values[index] for (series_key, values) in all_values.items()}


def _get_series_key(phase, series, phase_data):
    if series == RATIO_SERIES:
        return phase, series, phase_data[series].get('basePhase'), 'forecast'
    if series == DEFAULT_SERIES and len(phase_data) == 1:
        return phase, None, None, 'forecast'
    return phase, series, None, 'forecast'


def _is_ratio(series_key):
    return len(series_key) >= 3 and series_key[1] == RATIO_SERIES


def _get_base_phase(series_key):
    return series_key[2] if len(series_key) >= 3 else None


def _is_phase(series_key, phase):
    return series_key == phase or (len(series_key) and series_key[0] == phase)


def _get_base_segments(series_segments, base_phase):
    return next((segments for key, segments in series_segments.items() if _is_phase(key, base_phase)), [])


def _get_series_values(series_key, segments, indexes, series_segments):
    if _is_ratio(series_key):
        base_phase = _get_base_phase(series_key)
        # the following line assumes two things:
        #  1. ratio phases only exists in deterministic forecasts
        #  2. for 2-level dependency (where the base phase is also a ratio) we should assume the base segments as an
        #     empty list, which should give us all zeroes for the original ratio
        base_segments = _get_base_segments(series_segments, base_phase)
        return MultipleSegments().predict_time_ratio(indexes, segments, base_segments)
    return MultipleSegments(segments).predict_self(indexes)


def _reapply_series_ratio(series_key, values, series_values):
    if _is_ratio(series_key):
        _, _, base_phase = series_key
        base_values = series_values.get(base_phase, 1)
        return values / base_values
    return values


def _reapply_ratio(series_values):
    return {
        series_key: _reapply_series_ratio(series_key, values, series_values)
        for series_key, values in series_values.items()
    }


def get_forecast_dicts(well_forecast_data, settings: ForecastExportSettings):
    headers = well_forecast_data['headers']
    forecast_data = well_forecast_data['forecasts']

    phases = {phase: forecast_data[phase] for phase in PHASES}
    wanted_series = [*settings.p_series_to_include, RATIO_SERIES]
    series_segments = {
        _get_series_key(phase, series, phase_data): phase_data[series].get('segments', [])
        for phase, phase_data in phases.items() for series in wanted_series if series in phase_data
    }

    start_idx = days_from_1900(settings.start) if settings.start else -inf
    end_idx = days_from_1900(settings.end) if settings.end else inf
    all_segments = [segment for one_series_segments in series_segments.values() for segment in one_series_segments]

    max_span = DAILY_FORECAST_MAX_DAYS if settings.resolution == 'daily' else inf
    indexes = _get_segment_indexes(all_segments, start_idx, end_idx, max_span)

    if not len(indexes):
        return []

    is_monthly = settings.resolution == 'monthly'

    series_values = {
        series_key: _get_series_values(series_key, segments, indexes, series_segments)
        for (series_key, segments) in series_segments.items()
    }

    if is_monthly:
        sum_by_month = [(series_key, sum_forecast_by_month(values, indexes))
                        for (series_key, values) in series_values.items()]
        (_, (_, np_dates)) = sum_by_month[0]
        dates = (np_dates.astype('datetime64[D]') + 14).astype(date)
        series_values = {series_key: grouped_values for (series_key, (grouped_values, _)) in sum_by_month}
    else:
        dates = (date_from_index(idx) for idx in indexes)

    raw_headers_dicts = ({
        **headers,
        'date': d,
        **_get_forecast_series_index_values(series_values, i),
    } for (i, d) in enumerate(dates))

    return ({get_header_display(k, settings, settings.merge_with_production): v
             for k, v in row.items()} for row in raw_headers_dicts)


def get_forecast_file_headers(settings: ForecastExportSettings):
    if settings.omit_series_in_headers:
        if settings.merge_with_production:
            return ((phase, None, None, kind) for kind in DATA_KINDS for phase in PHASES)
        return PHASES
    if settings.merge_with_production:
        ((phase, series, None, kind) for kind in DATA_KINDS for phase in PHASES
         for series in settings.p_series_to_include)
    return ((phase, series) for phase in PHASES for series in settings.p_series_to_include)


def get_production_data_filter(resolution: str, start_date: Optional[date] = None, end_date: Optional[date] = None):
    if resolution == 'monthly':
        filter_start_date = date(start_date.year, 1, 1) if start_date else None
        filter_end_date = date(end_date.year, 12, 31) if end_date else None
    elif resolution == 'daily':
        filter_start_date = date(start_date.year, start_date.month, 1) if start_date else None
        filter_end_date = last_day_of_month(end_date) if end_date else None
    else:
        raise ValueError('resolution must be either "monthly" or "daily"')

    filter_start_index = days_from_1900(filter_start_date) if filter_start_date else None
    filter_end_index = days_from_1900(filter_end_date) if filter_end_date else None

    if filter_start_index is None and filter_end_index is None:
        return {}
    base_filter = {'$gte': filter_start_index, '$lte': filter_end_index}
    return {'startIndex': {op: value for op, value in base_filter.items() if value is not None}}


def forecast_export_includes(forecast_export, fileKind: str):
    if fileKind in PRODUCTION_TO_FORECAST:
        forecast_file_kind = PRODUCTION_TO_FORECAST[fileKind]
        if forecast_export.get(forecast_file_kind, {}).get('settings', {}).get('mergeWithProduction', False):
            return False

    return forecast_export.get(fileKind, {}).get('settings', {}).get('include', False)


def _merge_well_production_and_forecast(production_rows: Iterable[dict], forecast_rows: Iterable[dict]):
    production_rows_iter = iter(production_rows)
    forecast_rows_iter = iter(forecast_rows)

    current_production = next(production_rows_iter, None)
    current_forecast = next(forecast_rows_iter, None)

    while current_production or current_forecast:
        production_date = current_production and current_production['Date']
        forecast_date = current_forecast and current_forecast['Date']
        if current_production and current_forecast and production_date == forecast_date:
            yield {**current_production, **current_forecast}
            current_production = next(production_rows_iter, None)
            current_forecast = next(forecast_rows_iter, None)
        elif current_production and (not current_forecast or production_date < forecast_date):
            yield current_production
            current_production = next(production_rows_iter, None)
        else:
            yield current_forecast
            current_forecast = next(forecast_rows_iter, None)


def _get_rows_dict(rows: Iterable[dict]):
    grouped = groupby(rows, lambda row: str(row['_id']))
    return {k: list(v) for k, v in grouped}


def merge_production_and_forecast(wells: Iterable[str], production_rows: Iterable[dict], forecast_rows: Iterable[dict]):
    grouped_production = _get_rows_dict(production_rows)
    grouped_forecast = _get_rows_dict(forecast_rows)

    for w_id in wells:
        yield from _merge_well_production_and_forecast(grouped_production.get(w_id, []), grouped_forecast.get(w_id, []))


def get_rows_json_data(rows):
    return [{k: _json_value(v) for k, v in r.items() if _include_kvp_in_json(k, v)} for r in rows]


def _include_kvp_in_json(k, v):
    return k != '_id' and not isinstance(v, ObjectId)


def _json_value(value):
    if isinstance(value, date):
        return value.strftime('%m/%d/%Y')
    return value


def clean_filename(filename):
    return re.sub(r'\W', '_', filename)
