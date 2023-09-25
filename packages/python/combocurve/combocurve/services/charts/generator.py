from itertools import chain
from typing import Mapping, Any, Iterable, Optional, List
from datetime import date, datetime
from math import ceil, inf, sqrt
from textwrap import fill

import numpy as np
import pandas as pd
import seaborn as sns
from matplotlib.ticker import StrMethodFormatter
from matplotlib.dates import DateFormatter, AutoDateLocator

from combocurve.utils.units import get_multiplier
from combocurve.shared.collections import get_values, pick
from combocurve.shared.date import add_years, clamp
from combocurve.shared.str_format import basic_format_number
from combocurve.services.forecast.export_settings import ChartsExportSettings
from combocurve.services.charts.units import get_header_unit
from combocurve.services.charts.chart_tables import add_tables

sns.set_theme()
sns.set(rc={'axes.titleweight': 'bold', 'axes.titlesize': 14})

MIN_PANDAS_DATETIME = pd.Timestamp.min.ceil('U').to_pydatetime(warn=False)
MAX_PANDAS_DATETIME = pd.Timestamp.max.floor('U').to_pydatetime(warn=False)

CHART_REQUIRED_HEADERS = ['last_prod_date_monthly', 'last_prod_date_daily']
ARIES_REQUIRED_HEADERS = [
    'inptID',
    'api10',
    'api12',
    'api14',
    'chosenID',
    'aries_id',
    'phdwin_id',
    'well_name',
    'well_number',
]
COMMON_COLUMN_MAP = {
    'time': 'Time',
    'relative_idx': 'Relative Time',
}
MONTHLY_COLUMN_MAP = {
    **COMMON_COLUMN_MAP,
    'oil': 'M O (BBL/D)',
    'gas': 'M G (MCF/D)',
    'water': 'M W (BBL/D)',
    'cumsum_oil': 'M Cum O (MBBL)',
    'cumsum_gas': 'M Cum G (MMCF)',
    'cumsum_water': 'M Cum W (MBBL)',
    'oil/gas': 'M O/G (BBL/MMCF)',
    'oil/water': 'M O/W (BBL/BBL)',
    'gas/oil': 'M G/O (CF/BBL)',
    'gas/water': 'M G/W (MCF/BBL)',
    'water/oil': 'M W/O (BBL/BBL)',
    'water/gas': 'M W/G (BBL/MMCF)',
}
DAILY_COLUMN_MAP = {
    **COMMON_COLUMN_MAP,
    'oil': 'D O (BBL/D)',
    'gas': 'D G (MCF/D)',
    'water': 'D W (BBL/D)',
    'cumsum_oil': 'D Cum O (MBBL)',
    'cumsum_gas': 'D Cum G (MMCF)',
    'cumsum_water': 'D Cum W (MBBL)',
    'bottom_hole_pressure': 'D BHP (PSI)',
    'gas_lift_injection_pressure': 'D GLP (PSI)',
    'tubing_head_pressure': 'D THP (PSI)',
    'flowline_pressure': 'D FLP (PSI)',
    'casing_head_pressure': 'D CsgP (PSI)',
    'vessel_separator_pressure': 'D VSP (PSI)',
    'oil/gas': 'D O/G (BBL/MMCF)',
    'oil/water': 'D O/W (BBL/BBL)',
    'gas/oil': 'D G/O (CF/BBL)',
    'gas/water': 'D G/W (MCF/BBL)',
    'water/oil': 'D W/O (BBL/BBL)',
    'water/gas': 'D W/G (BBL/MMCF)',
}
FORECAST_COLUMN_MAP = {
    **COMMON_COLUMN_MAP,
    'oil': 'F O (BBL/D)',
    'gas': 'F G (MCF/D)',
    'water': 'F W (BBL/D)',
    'cumsum_oil': 'F Cum O (MBBL)',
    'cumsum_gas': 'F Cum G (MMCF)',
    'cumsum_water': 'F Cum W (MBBL)',
    'oil/gas': 'F O/G (BBL/MMCF)',
    'oil/water': 'F O/W (BBL/BBL)',
    'gas/oil': 'F G/O (CF/BBL)',
    'gas/water': 'F G/W (MCF/BBL)',
    'water/oil': 'F W/O (BBL/BBL)',
    'water/gas': 'F W/G (BBL/MMCF)',
}
COLORS = {
    'M O (BBL/D)': '#096d1c',
    'M G (MCF/D)': '#c00000',
    'M W (BBL/D)': '#1706fa',
    'M Cum O (MBBL)': '#326432',
    'M Cum G (MMCF)': '#96321e',
    'M Cum W (MBBL)': '#0032c8',
    'M O/G (BBL/MMCF)': '#4f6228',
    'M O/W (BBL/BBL)': '#50632a',
    'M G/O (CF/BBL)': '#c00000',
    'M G/W (MCF/BBL)': '#c00000',
    'M W/O (BBL/BBL)': '#00b0f0',
    'M W/G (BBL/MMCF)': '#35c0f3',
    'D O (BBL/D)': '#00b050',
    'D G (MCF/D)': '#ff0000',
    'D W (BBL/D)': '#007ac0',
    'D Cum O (MBBL)': '#326432',
    'D Cum G (MMCF)': '#96321e',
    'D Cum W (MBBL)': '#0032c8',
    'D O/G (BBL/MMCF)': '#4f6228',
    'D O/W (BBL/BBL)': '#4f6228',
    'D G/O (CF/BBL)': '#c00000',
    'D G/W (MCF/BBL)': '#c51313',
    'D W/O (BBL/BBL)': '#68d0f6',
    'D W/G (BBL/MMCF)': '#17b7f1',
    'D BHP (PSI)': '#9966ff',
    'D GLP (PSI)': '#ff9f40',
    'D THP (PSI)': '#ffce56',
    'D FLP (PSI)': '#607d8b',
    'D CsgP (PSI)': '#99ff00',
    'D VSP (PSI)': '#ff6384',
    'F O (BBL/D)': '#13e773',
    'F G (MCF/D)': '#fb6357',
    'F W (BBL/D)': '#6e95c4',
    'F Cum O (MBBL)': '#326432',
    'F Cum G (MMCF)': '#96321e',
    'F Cum W (MBBL)': '#0032c8',
    'F O/G (BBL/MMCF)': '#7f9947',
    'F O/W (BBL/BBL)': '#7f9947',
    'F G/O (CF/BBL)': '#fe0404',
    'F G/W (MCF/BBL)': '#fe0404',
    'F W/O (BBL/BBL)': '#21e8ed',
    'F W/G (BBL/MMCF)': '#21e8ed'
}
CUSTOM_STREAM_COLORS = {
    'customNumber0Monthly': '#99ff00',
    'customNumber1Monthly': '#607d8b',
    'customNumber2Monthly': '#4bc0c0',
    'customNumber3Monthly': '#ffce56',
    'customNumber4Monthly': '#b3b6b7',
    'customNumber0Daily': '#4d8000',
    'customNumber1Daily': '#303f00',
    'customNumber2Daily': '#266060',
    'customNumber3Daily': '#80672b',
    'customNumber4Daily': '#5a5b5c',
}
UNIT_CONVERSION = {
    'M O (BBL/D)': ('bbl/d', 'bbl/d'),
    'M G (MCF/D)': ('mcf/d', 'mcf/d'),
    'M W (BBL/D)': ('bbl/d', 'bbl/d'),
    'M Cum O (MBBL)': ('bbl', 'mbbl'),
    'M Cum G (MMCF)': ('mcf', 'mmcf'),
    'M Cum W (MBBL)': ('bbl', 'mbbl'),
    'M O/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
    'M O/W (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'M G/O (CF/BBL)': ('mcf/bbl', 'cf/bbl'),
    'M G/W (MCF/BBL)': ('mcf/bbl', 'mcf/bbl'),
    'M W/O (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'M W/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
    'D O (BBL/D)': ('bbl/d', 'bbl/d'),
    'D G (MCF/D)': ('mcf/d', 'mcf/d'),
    'D W (BBL/D)': ('bbl/d', 'bbl/d'),
    'D Cum O (MBBL)': ('bbl', 'mbbl'),
    'D Cum G (MMCF)': ('mcf', 'mmcf'),
    'D Cum W (MBBL)': ('bbl', 'mbbl'),
    'D O/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
    'D O/W (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'D G/O (CF/BBL)': ('mcf/bbl', 'cf/bbl'),
    'D G/W (MCF/BBL)': ('mcf/bbl', 'mcf/bbl'),
    'D W/O (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'D W/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
    'D BHP (PSI)': ('psi', 'psi'),
    'D GLP (PSI)': ('psi', 'psi'),
    'D THP (PSI)': ('psi', 'psi'),
    'D FLP (PSI)': ('psi', 'psi'),
    'D CsgP (PSI)': ('psi', 'psi'),
    'D VSP (PSI)': ('psi', 'psi'),
    'F O (BBL/D)': ('bbl/d', 'bbl/d'),
    'F G (MCF/D)': ('mcf/d', 'mcf/d'),
    'F W (BBL/D)': ('bbl/d', 'bbl/d'),
    'F Cum O (MBBL)': ('bbl', 'mbbl'),
    'F Cum G (MMCF)': ('mcf', 'mmcf'),
    'F Cum W (MBBL)': ('bbl', 'mbbl'),
    'F O/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
    'F O/W (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'F G/O (CF/BBL)': ('mcf/bbl', 'cf/bbl'),
    'F G/W (MCF/BBL)': ('mcf/bbl', 'mcf/bbl'),
    'F W/O (BBL/BBL)': ('bbl/bbl', 'bbl/bbl'),
    'F W/G (BBL/MMCF)': ('bbl/mcf', 'bbl/mmcf'),
}
MARKERS = {
    'M O (BBL/D)': '^',
    'M G (MCF/D)': '^',
    'M W (BBL/D)': '^',
    'D O (BBL/D)': '.',
    'D G (MCF/D)': '.',
    'D W (BBL/D)': '.'
}
TIME_COLUMNS = {'Time', 'Relative Time'}
DEFAULT_ASPECT = 2
SQRT_2 = sqrt(2)
ASPECTS = {1: SQRT_2, 2: SQRT_2 / 2, 4: SQRT_2, 6: SQRT_2 * 2 / 3, 8: SQRT_2 / 2}
DESIRED_WIDTH = 10
X_AXIS_CUM = {'cumsum_oil', 'cumsum_gas', 'cumsum_water'}
X_AXIS_TIME = {'time', 'relative_idx'}
X_AXIS_LOG_ALLOWED = {'relative_idx', *X_AXIS_CUM}
# This is empirically determined based on the title font and plot width we are using. If any of those change, this will
# need to be readjusted
DEFAULT_CHART_FONT = 12
TITLE_WRAP_WIDTH = 120
FONT_SCALING_WITH_TABLE = 2 / 3

DEFAULT_Y_MIN = 0
DEFAULT_Y_MAX = 1


def _get_last_production_date(well_headers, monthly_data, daily_data):
    prod_end_headers = (well_headers.get(h) for h in ['last_prod_date_monthly', 'last_prod_date_daily'])
    valid_prod_end_headers = [value for value in prod_end_headers if value is not None]
    if len(valid_prod_end_headers):
        return max(valid_prod_end_headers)

    prod_end_data = (np.nanmax(data.get('time')) for data in [monthly_data, daily_data] if data is not None)
    valid_prod_end_data = [value for value in prod_end_data if not pd.isna(value)]
    if len(valid_prod_end_data):
        res = max(valid_prod_end_data).astype(datetime)
        if not isinstance(res, datetime):
            # it's a date, not a datetime
            return datetime(res.year, res.month, res.day)

    return None


def _filter_data(data: pd.DataFrame, production_end: Optional[datetime], settings: ChartsExportSettings):
    x_axis = settings.data_settings.x_axis

    if x_axis not in data:
        return data[0:0]

    if x_axis in X_AXIS_CUM:
        cum_min = settings.graph_settings.cum_min
        cum_max = settings.graph_settings.cum_max
        if cum_min == 'all' and cum_max == 'all':
            return data

        x_min = cum_min if cum_min != 'all' else -inf
        x_max = cum_max if cum_max != 'all' else inf
        return data[data[x_axis].between(x_min, x_max)]

    if x_axis in X_AXIS_TIME:
        years_before = settings.graph_settings.years_before_prod_end
        years_past = settings.graph_settings.years_past_prod_end
        if years_before == 'all' and years_past == 'all':
            return data

        if production_end is None:
            return data

        x_min = add_years(production_end, -ceil(years_before)) if years_before != 'all' else datetime.min
        x_max = add_years(production_end, ceil(years_past)) if years_past != 'all' else datetime.max

        [x_min, x_max] = [clamp(value, MIN_PANDAS_DATETIME, MAX_PANDAS_DATETIME) for value in (x_min, x_max)]

        return data[data['time'].between(x_min, x_max)]

    return data


def convert_units(df: pd.DataFrame, column: str):
    if column in UNIT_CONVERSION:
        orig_unit, target_unit = UNIT_CONVERSION[column]
        mult = get_multiplier(orig_unit, target_unit)
        return df[column] * mult
    else:
        return df[column]


def _filter_df_columns(df: pd.DataFrame, columns: Iterable[str]):
    # remove duplicates while keeping the order
    wanted_columns = dict.fromkeys(columns)
    existing_columns = set(df.columns)
    actual_columns = [c for c in wanted_columns if c in existing_columns]
    return df[actual_columns]


def _get_dataframe(data, columns_map: Mapping[str, str], wanted_columns: List[str], production_end: Optional[datetime],
                   settings: ChartsExportSettings, removeZeroes: bool = True):
    all_data_df = pd.DataFrame(data)

    filtered_rows_df = _filter_data(all_data_df, production_end, settings)
    filtered_columns_df = _filter_df_columns(filtered_rows_df, [*wanted_columns, settings.data_settings.x_axis])
    mapped_columns_df = filtered_columns_df.rename(columns=pick(columns_map, filtered_columns_df.columns))
    index_column = columns_map[settings.data_settings.x_axis]
    if index_column in mapped_columns_df:
        indexed_df = mapped_columns_df.set_index(mapped_columns_df[index_column])
    else:
        indexed_df = mapped_columns_df
    final_df = _filter_df_columns(indexed_df, get_values(columns_map, wanted_columns))

    # remove zeroes in data, which cause vertical dropping lines
    for column in final_df:
        final_df[column] = final_df[column] / final_df[column] * final_df[column] if removeZeroes else final_df[column]
        final_df[column] = convert_units(final_df, column)

    return final_df


def _update_column_maps(column_map, update_map, resolution):
    column_map.update(update_map[resolution])
    return column_map


def _get_full_dataframe(headers,
                        monthly_data,
                        daily_data,
                        forecast_data,
                        settings: ChartsExportSettings,
                        custom_streams={}):
    production_end = _get_last_production_date(headers, monthly_data, daily_data)
    monthly_df = _get_dataframe(monthly_data, _update_column_maps(MONTHLY_COLUMN_MAP, custom_streams, 'monthly'),
                                settings.data_settings.monthly, production_end, settings)
    daily_df = _get_dataframe(daily_data, _update_column_maps(DAILY_COLUMN_MAP, custom_streams, 'daily'),
                              settings.data_settings.daily, production_end, settings)
    forecast_df = _get_dataframe(forecast_data, FORECAST_COLUMN_MAP,
                                 settings.data_settings.forecast, production_end, settings, False)

    return daily_df.join(monthly_df, how='outer').join(forecast_df, how='outer')


def _get_color_custom_streams(colors, custom_streams):
    for resolution in custom_streams:
        resolution_str = 'daily'.capitalize()
        for stream in custom_streams[resolution]:
            colors[custom_streams[resolution][stream]] = CUSTOM_STREAM_COLORS[f'{stream}{resolution_str}']


def _set_cc_style(plot, title, data, settings: ChartsExportSettings, custom_streams={}):
    ax = plot.facet_axis(0, 0)

    actual_max = data.max().max()
    max_with_padding = actual_max * (2 if settings.graph_settings.y_log_scale else 1.1)
    y_max = settings.graph_settings.y_max if settings.graph_settings.y_max != 'all' else max_with_padding
    y_max = y_max if not pd.isna(y_max) else DEFAULT_Y_MAX

    actual_min = data.min().min()
    y_min = settings.graph_settings.y_min if settings.graph_settings.y_min != 'all' else actual_min
    y_min = y_min if not pd.isna(y_min) else DEFAULT_Y_MIN

    x_min = data.index.min()
    if pd.isna(x_min):
        x_min = 0
    x_max = data.index.max()
    if pd.isna(x_max):
        x_max = 0

    font_scaling = FONT_SCALING_WITH_TABLE if settings.include_parameters else 1

    # set title
    wrapped_title = fill(title, int(TITLE_WRAP_WIDTH / font_scaling))
    ax.set_title(wrapped_title, loc='left', fontweight='normal', fontsize=DEFAULT_CHART_FONT * font_scaling)

    # general plot style
    ax.set_facecolor('white')
    ax.grid(True, which='major', color='lightGray')
    ax.grid(True, which='minor', color='whiteSmoke')
    ax.spines['bottom'].set_color('darkGray')
    ax.spines['left'].set_color('darkGray')
    ax.tick_params(which='both', bottom=True, left=True, color='darkGray')

    # y-axis style
    ax.yaxis.label.set_visible(False)
    ax.yaxis.grid(True, which='minor')
    ax.set_ylim(ymin=y_min, ymax=y_max)
    if settings.graph_settings.y_log_scale:
        ax.set_yscale('log')
        ax.yaxis.set_major_formatter(StrMethodFormatter('{x:,g}'))
        ax.locator_params(axis='y', subs=(1, 2, 5))

    # x-axis style
    ax.xaxis.label.set_visible(False)
    ax.xaxis.grid(True, which='minor')
    ax.set_xlim(xmin=x_min, xmax=x_max)
    if settings.graph_settings.x_log_scale and settings.data_settings.x_axis in X_AXIS_LOG_ALLOWED:
        ax.set_xlim(xmin=max(x_min, 1))
        ax.set_xscale('log')
        ax.xaxis.set_major_formatter(StrMethodFormatter('{x:,g}'))
        ax.locator_params(axis='x', subs=(1, 2, 5))
    elif settings.data_settings.x_axis == 'time':
        ax.xaxis.set_major_formatter(DateFormatter('%m/%d/%Y'))
        ax.xaxis.set_major_locator(AutoDateLocator(maxticks=9))

    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_fontsize(DEFAULT_CHART_FONT * font_scaling)

    # lines style
    _get_color_custom_streams(COLORS, custom_streams)
    for line in ax.lines:
        label = line.get_label()
        if label in COLORS:
            line.set_color(COLORS[label])
        if label in MARKERS:
            line.set_marker(MARKERS[label])
            line.set_markeredgecolor(None)

    # set legend
    if settings.graph_settings.enable_legend:
        legend = ax.legend(loc='upper right', fontsize=DEFAULT_CHART_FONT * font_scaling)
        legend.get_frame().set_alpha(None)
        legend.get_frame().set_facecolor('#0000')


def _format_for_title(value):
    if value is None:
        return 'N/A'
    if isinstance(value, (date, datetime)):
        return value.strftime('%m/%d/%Y')
    if isinstance(value, (int, float)):
        return basic_format_number(value, decimal_digits=0)
    return str(value)


def _add_units(header: str, value: str):
    unit = get_header_unit(header)
    return f'{value} {unit}' if unit else value


def _get_title_values(headers: Mapping[str, Any], to_include: Iterable[str]):
    return (_add_units(h, _format_for_title(headers[h])) for h in to_include if h in headers)


def _get_title(well_headers: Mapping[str, Any], project_custom_headers: Mapping[str, Any],
               settings: ChartsExportSettings):
    well_headers_title = _get_title_values(well_headers, settings.headers)
    project_custom_headers_title = _get_title_values(project_custom_headers, settings.project_headers)
    return ' | '.join(chain(well_headers_title, project_custom_headers_title))


def _get_label(data: pd.DataFrame, column: Optional[str]):
    # the _ at the beginning makes it not show in the legend
    if column is None:
        return None
    return column if not data[column].isnull().all() else f'_{column}'


def _get_aspect(settings: ChartsExportSettings):
    aspect = ASPECTS.get(settings.effective_charts_per_page, DEFAULT_ASPECT)
    return aspect if settings.landscape_orientation else 1 / aspect


def _plot_data(data: pd.DataFrame, settings: ChartsExportSettings):
    aspect = _get_aspect(settings)
    height = DESIRED_WIDTH / aspect

    columns = iter(data)
    first_column = next(columns, None)
    plot = sns.relplot(data=data[first_column] if first_column else data,
                       kind='line',
                       dashes=False,
                       height=height,
                       aspect=aspect,
                       legend=False,
                       label=_get_label(data, first_column))
    for c in columns:
        sns.lineplot(data=data[c], dashes=False, legend=False, label=_get_label(data, c), ax=plot.ax)

    return plot


def generate_chart(well_data,
                   monthly_data,
                   daily_data,
                   forecast_data,
                   file,
                   settings: ChartsExportSettings,
                   custom_streams={}):
    well_headers = well_data['header']
    project_custom_headers = well_data.get('project_custom_header', {})
    df = _get_full_dataframe(well_headers,
                             monthly_data,
                             daily_data,
                             forecast_data,
                             settings,
                             custom_streams=custom_streams)

    plot = _plot_data(df, settings)

    add_tables(well_data, plot, settings)

    title = _get_title(well_headers, project_custom_headers, settings)
    _set_cc_style(plot, title, df, settings, custom_streams=custom_streams)

    if settings.document_format == 'pdf':
        plot.savefig(file, format='svg')
    else:
        dpi = 300 if settings.include_parameters else 200 if settings.effective_charts_per_page == 1 else 100
        plot.savefig(file, format='png', dpi=dpi)
