from datetime import datetime, timedelta, date
from io import BytesIO
from itertools import chain
import logging
from math import ceil, floor
from textwrap import fill
from bson import ObjectId
from collections.abc import Iterable
from typing import Any
import matplotlib
import matplotlib.pyplot as plt
from matplotlib.ticker import StrMethodFormatter, LogLocator
from matplotlib.dates import DateFormatter, AutoDateLocator
from matplotlib import font_manager
import pandas as pd
from combocurve.science.type_curve.tc_fit_init import tc_init
from combocurve.services.files.file_helpers import make_file_os_safe
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.utils.exceptions import get_exception_info
import numpy as np
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.type_curve.TC_helper import (cum_from_discrete_data, generate_background_average_data,
                                                     get_prod_data_mask, get_shift_base_segments, percentile_ranks,
                                                     update_min_and_max, get_rep_wells_from_rep_init,
                                                     DEFAULT_DAILY_RANGE)
from combocurve.services.charts.document_generator import generate_document
from combocurve.services.charts.generator import ASPECTS, DEFAULT_CHART_FONT, DESIRED_WIDTH
from combocurve.services.forecast.export_settings import ChartsExportSettings
from combocurve.shared.constants import DAYS_IN_MONTH, DAYS_IN_YEAR
from combocurve.shared.date import date_from_index, get_current_time, index_today
from combocurve.utils.units import get_multiplier

COMMON_KEYS = {
    'aveNoFst': '#AA51D9',
    'average': '#FD9559',
    'count': '#59351F',
    'cum': '#FD9559',
    'p10': '#B3693F',
    'p50': '#FDD5BE',
    'median': '#FDD5BE',
    'p50NoFst': '#DEA4FC',
    'p90': '#8C5331',
    'sum': '#FD9559',
}

CHART_COLORS = {
    'oil': {
        **COMMON_KEYS,
        'bestFit': '#98D9C8',
        'crossplot': '#12C498',
        'eur': '#12C498',
        'eurDistribution': '#12C498',
        'P10Fit': '#0C8063',
        'P50Fit': '#12C498',
        'P90Fit': '#074D3B',
        'peakRate': '#12C498',
    },
    'gas': {
        **COMMON_KEYS,
        'bestFit': '#F99A95',
        'crossplot': '#F9534B',
        'eur': '#F9534B',
        'eurDistribution': '#F9534B',
        'P10Fit': '#802B27',
        'P50Fit': '#F9534B',
        'P90Fit': '#4D1A17',
        'peakRate': '#F9534B',
    },
    'water': {
        **COMMON_KEYS,
        'bestFit': '#99BEDA',
        'crossplot': '#228ADA',
        'eur': '#228ADA',
        'eurDistribution': '#228ADA',
        'P10Fit': '#186199',
        'P50Fit': '#228ADA',
        'P90Fit': '#104166',
        'peakRate': '#228ADA',
    },
}

BACKGROUND_WELL_COLORS = {
    'dark': '#404040',
    'light': '#DEDEDE',
}

P_SERIES_LINE_STYLES = {
    'P10Fit': 'solid',
    'P50Fit': 'solid',
    'P90Fit': 'solid',
    'bestFit': 'dashed',
    'average': 'solid',
    'p50': 'solid'
}

TC_SERIES = ('P10', 'P50', 'P90', 'best')

IMAGE_MAP = {'pdf': 'svg', 'pptx': 'png'}

TITLE_MAP = {
    'c4': 'Type Curve Fit',
    'sum': 'Analog Well Set Production Roll-Up',
    'cum': 'Analog Well Set Cum Production Roll-Up',
    'eur': 'EUR Distribution',
    'rateVsCum': 'Rate vs Cumulative',
    'fitCum': 'Cumulative Profile'
}

FORMATTED_PHASES = {'oil': 'Oil', 'gas': 'Gas', 'water': 'Water'}

FORMATTED_SERIES = {'P10': 'P10', 'P50': 'P50', 'P90': 'P90', 'best': 'Best'}

FORMATTED_PHASE_TYPE = {'rate': 'Rate', 'ratio': 'Ratio'}

SERIES_NAMES = {
    'P10Fit': 'P10 Fit',
    'P50Fit': 'P50 Fit',
    'P90Fit': 'P90 Fit',
    'bestFit': 'Best Fit',
    'count': 'Well Count',
    'average': 'Wells Average',
    'p50': 'Wells P50',
    'p10': 'Wells P10',
    'p90': 'Wells P90',
    'p50NoFst': 'Wells P50 No Forecast',
    'aveNoFst': 'Wells Average No Forecast',
    'wellsEur': 'EUR Distribution',
    'sum': 'Wells Sum',
    'cum': 'Wells Cum',
    'median': 'Wells P50'
}

PHASE_VOLUME_UNIT = {'oil': 'MBBL', 'gas': 'MMCF', 'water': 'MBBL'}
PHASE_RATE_UNIT = {'oil': 'BBL/D', 'gas': 'MCF/D', 'water': 'BBL/D'}
PHASE_RATE_UNIT_C4 = {'daily': PHASE_RATE_UNIT, 'monthly': {'oil': 'BBL/M', 'gas': 'MCF/M', 'water': 'BBL/M'}}

PHASE_RATIO_UNIT = {
    'oil/gas': 'BBL/MMCF',  # Unit conversion
    'oil/water': 'BBL/BBL',
    'gas/oil': 'CF/BBL',  # Unit conversion
    'gas/water': 'MCF/BBL',
    'water/oil': 'BBL/BBL',
    'water/gas': 'BBL/MMCF'  # unit conversion
}

BASE_PHASE_UNITS = {'oil': 'bbl', 'gas': 'mcf', 'water': 'bbl'}

# Chart aspect ratio is set up to agree with that for forecast charts in generator.py
ASPECT = ASPECTS[1]
HEIGHT = DESIRED_WIDTH / ASPECT
plt.rcParams["figure.figsize"] = (ASPECT * HEIGHT, HEIGHT)
font_path = 'C:/Users/ZacharyPiazza/code/python-combocurve/fonts/Roboto-Regular.ttf'
font_manager.fontManager.addfont(font_path)
prop = font_manager.FontProperties(fname=font_path)
matplotlib.rcParams['font.family'] = prop.get_name()

CUM_PLOT_TICKS = np.array(
    [*range(100), *range(100, 300, 2), *range(300, floor(DAYS_IN_YEAR * 60), 30),
     floor(DAYS_IN_YEAR * 60)], dtype=int)

REP_HEADERS = {
    'first_prod_date': 'FPD',
    'perf_lateral_length': 'PLL',
    'total_proppant_per_perforated_interval': 'Prop/PLL',
    'total_fluid_per_perforated_interval': 'Fluid/PLL'
}


class TypeCurveChartExportService():
    def __init__(self, context) -> None:
        self.context = context
        self.calculated_background_data = None
        self.individual_chart_settings = None
        self.tc_id = None
        self.proj_name = None
        self.tc_name = None
        self.resolution = None
        self.wells_average_data = None
        self.tc_c4_data = None
        self.tc_cum_sum_data = None
        self.sum_data = None
        self.cum_data = None
        self.tc_eurs = None
        self.required_phases = None
        self.file_type = None
        self.daily_range = None
        self.tc_data = None
        self.x_min = None
        self.x_max = None
        self.y_min = None
        self.y_max = None
        self.rep_data = None
        self.valid_phase_wells = None
        self.time_zone = None
        self.type_curve_service: TypeCurveService = self.context.type_curve_service
        self.current_settings = None

    def export_charts(
        self,
        tc_id: str,
        tc_name: str,
        proj_name: str,
        resolution: str,
        individual_chart_settings: dict[str, Any],
        file_type: str,
        time_zone: str,
        project_id: str,
        **_,
    ):
        '''
        Entrypoint for exporting type curve charts.

        Args:
        -------
        - `tc_id: str` The ID of the type curve.
        - `tc_name: str` The name of the type curve.
        - `proj_name: str` The name of the project.
        - `resolution: str` 'daily' | 'monthly'
        - `individual_chart_settings: dict[str, Any]` Settings for how individual charts are plotted. Keys are
            'chart0' | 'chart1' | 'chart2' | 'chart3'
        - `daily_range: Dictionary telling for what indices to plot daily data. Used in c4 chart.
        - `file_type: str` The output format. One of `'pdf' | 'pptx'`
        - `time_zone: str` The user's time zone based on their client.

        Output:
        -------
        - `str` The id for the file download to be used by frontend.
        '''
        self.resolution: str = resolution
        self.individual_chart_settings: dict[str, Any] = individual_chart_settings
        self.tc_id: str = tc_id
        self.proj_name: str = proj_name
        self.project_id: str = project_id
        self.tc_name: str = tc_name
        self.file_type: str = file_type
        self.time_zone: str = time_zone
        self.daily_range: dict = DEFAULT_DAILY_RANGE
        self.required_phases: Iterable[str] = set(doc['phase'] for doc in self.individual_chart_settings.values())
        self.rep_data = self.context.type_curve_service.tc_rep_init({
            'tc_id':
            self.tc_id,
            'items': ['header', 'forecast_info', 'data_info', 'eur'],
            'header_items':
            list(REP_HEADERS.keys())
        })
        get_rep_wells_from_rep_init(self.context, self.tc_id, self.rep_data)

        doc = self._generate_and_save_document(tc_name, project_id)
        return (str(doc))

    def _calculate_background_data(self, raw_background_data: dict[str, Any], daily_range, phase_type: str, phase: str):
        return self.type_curve_service.calculate_background_data(raw_background_data, daily_range, phase_type, phase,
                                                                 self.resolution, self.tc_id, self.valid_phase_wells,
                                                                 self.tc_data.get('normalize', False))

    def _plot_c4_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        c4_settings: dict[str, Any] = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = c4_settings['activeChartSeries']
        plot_background = 'background' in active_chart_series
        plot_forecast = 'overlayForecast' in active_chart_series
        show_daily_rate = c4_settings['showDailyRate']
        phase_type = self.tc_data['phase_type']
        c4_ratio_show_rate = c4_settings['c4RatioShowRate']
        display_monthly_data = not show_daily_rate if phase_type != 'ratio' or c4_ratio_show_rate else False

        # Unit conversions can get a little messy for ratio plots.
        if self.tc_data['phase_type'] == 'ratio' and not c4_ratio_show_rate:
            base_units = BASE_PHASE_UNITS[phase] + '/' + BASE_PHASE_UNITS[self.tc_data['base_phase']]
            ratio_phase_units = PHASE_RATIO_UNIT[phase + '/' + self.tc_data['base_phase']]
            mult = get_multiplier(base_units, ratio_phase_units.lower())
        else:
            mult = 1.0

        if plot_background:
            self._plot_background(ax, plot_forecast, mult, display_monthly_data)
        wells_average_series = []
        for series in ('average', 'aveNoFst', 'p50', 'p50NoFst', 'count'):
            if series in active_chart_series:
                wells_average_series.append(series)
        if len(wells_average_series) > 0:
            self._plot_wells_average_series(ax, wells_average_series, phase, mult, display_monthly_data)
        tc_series = []
        for series in ('P10', 'P50', 'P90', 'best'):
            if series in active_chart_series:
                tc_series.append(series)
        if len(tc_series) > 0:
            self._plot_tc_series(ax, tc_series, phase, mult, display_monthly_data)
        if self.tc_data.get('align', 'noalign') == 'align':
            plt.axvline(x=0, figure=fig, color=CHART_COLORS[phase]['peakRate'], linestyle='dashed')

        return fig, ax

    def _plot_sum_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        sum_settings: dict[str, Any] = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = sum_settings['activeChartSeries']
        if len(active_chart_series) > 0:
            self._update_axis(self.sum_data.dates.min(), 'x', 'min')
            self._update_axis(self.sum_data.dates.max(), 'x', 'max')
        for series in active_chart_series:
            if series not in self.sum_data.columns:
                continue
            if series in TC_SERIES:
                color_key = series + 'Fit'
                line_style = P_SERIES_LINE_STYLES[color_key]
            else:
                color_key = series
                line_style = 'solid'
            self._update_axis(self.sum_data[series].min(), 'y', 'min')
            self._update_axis(self.sum_data[series].max(), 'y', 'max')
            self.sum_data.plot(x='dates',
                               y=series,
                               color=CHART_COLORS[phase][color_key],
                               ax=ax,
                               label=SERIES_NAMES[color_key],
                               linestyle=line_style)

        return fig, ax

    def _plot_cum_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        cum_settings: dict[str, Any] = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = cum_settings['activeChartSeries']
        if len(active_chart_series) > 0:
            self._update_axis(self.cum_data.dates.min(), 'x', 'min')
            self._update_axis(self.cum_data.dates.max(), 'x', 'max')
        for series in active_chart_series:
            if series not in self.cum_data.columns:
                continue
            if series in TC_SERIES:
                color_key = series + 'Fit'
                line_style = P_SERIES_LINE_STYLES[color_key]
            else:
                color_key = series
                line_style = 'solid'
            self._update_axis(self.cum_data[series].min(), 'y', 'min')
            self._update_axis(self.cum_data[series].max(), 'y', 'max')
            self.cum_data.plot(x='dates',
                               y=series,
                               color=CHART_COLORS[phase][color_key],
                               ax=ax,
                               label=SERIES_NAMES[color_key],
                               linestyle=line_style)

        return fig, ax

    def _plot_eur_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        eur_settings: dict[str, Any] = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = eur_settings['activeChartSeries']
        eurs = np.array(self.calculated_background_data['eur'], dtype=float)
        if len(eurs) > 0:
            series_to_eur_map = {
                'wellsP10': np.quantile(eurs, 0.9),
                'wellsP50': np.quantile(eurs, 0.5),
                'wellsP90': np.quantile(eurs, 0.1),
                'wellsAverage': np.average(eurs),
                **self.tc_eurs
            }
        else:
            series_to_eur_map = {
                'wellsP10': None,
                'wellsP50': None,
                'wellsP90': None,
                'wellsAverage': None,
                **self.tc_eurs
            }
        self._update_axis(0, 'x', 'min')
        self._update_axis(100, 'x', 'max')
        for series in active_chart_series:
            if series == 'wellsEur':
                if len(eurs) == 0:
                    # No wells to plot.
                    continue
                percentiles = percentile_ranks(eurs) * 100
                # Factor of 0.001 on eurs is for unit conversion.
                self._update_axis(min(eurs * 0.001), 'y', 'min')
                self._update_axis(max(eurs * 0.001), 'y', 'max')
                plt.scatter(x=percentiles,
                            y=eurs * 0.001,
                            c=CHART_COLORS[phase]['eurDistribution'],
                            label=SERIES_NAMES[series])
            else:
                if series not in series_to_eur_map.keys():
                    continue
                if series_to_eur_map[series] is None:
                    continue
                # Names differ from the CHART_COLORS and SERIES NAMES. Reconcile here.
                if 'wells' in series:
                    line_style = 'dashed'
                    if 'Average' in series:
                        color_name = 'average'
                    else:
                        # Pick off the number part.
                        color_name = 'p' + series[-2:]
                else:
                    color_name = series + 'Fit'
                    line_style = 'solid'
                self._update_axis(series_to_eur_map[series] * 0.001, 'y', 'min')
                self._update_axis(series_to_eur_map[series] * 0.001, 'y', 'max')
                # Factor of 0.001 is for unit conversion.
                plt.axhline(series_to_eur_map[series] * 0.001,
                            color=CHART_COLORS[phase][color_name],
                            label=SERIES_NAMES[color_name],
                            linestyle=line_style)
        return fig, ax

    def _plot_rate_v_cum_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        chart_settings = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = chart_settings['activeChartSeries']
        plot_background = 'background' in active_chart_series
        plot_forecast = 'overlayForecast' in active_chart_series
        bg_honor_fit = chart_settings['bgWellsHonorFit']
        ave_honor_fit = chart_settings['aggregationHonorFit']
        if plot_background:
            self._plot_background_rate_cum(phase, plot_forecast, bg_honor_fit, 'rateVsCum')
        ave_series = [s for s in ('average', 'median') if s in active_chart_series]
        if len(ave_series) > 0:
            self._plot_ave_rate_cum(phase, ave_series, ave_honor_fit, 'rateVsCum')
        tc_series = [s for s in ('P10', 'P50', 'P90', 'best') if s in active_chart_series]
        if len(tc_series) > 0:
            self._plot_tc_rate_cum(tc_series, phase, 'rateVsCum')
        return fig, ax

    def _plot_fit_cum_chart(self, phase: str):
        fig = plt.figure()
        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
        chart_settings = self.individual_chart_settings[self.current_settings]
        active_chart_series: list[str] = chart_settings['activeChartSeries']
        plot_background = 'background' in active_chart_series
        plot_forecast = 'overlayForecast' in active_chart_series
        bg_honor_fit = chart_settings['bgWellsHonorFit']
        ave_honor_fit = chart_settings['aggregationHonorFit']
        if plot_background:
            self._plot_background_rate_cum(phase, plot_forecast, bg_honor_fit, 'fitCum')
        ave_series = [s for s in ('average', 'median') if s in active_chart_series]
        if len(ave_series) > 0:
            self._plot_ave_rate_cum(phase, ave_series, ave_honor_fit, 'fitCum')
        tc_series = [s for s in ('P10', 'P50', 'P90', 'best') if s in active_chart_series]
        if len(tc_series) > 0:
            self._plot_tc_rate_cum(tc_series, phase, 'fitCum')
        return fig, ax

    def _plot_background(self, ax, plot_forecast: bool, mult: float, display_monthly_data: bool):
        '''Plot the background wells into the c4 chart.'''

        ratio_use_rate = self.individual_chart_settings[self.current_settings].get('c4RatioShowRate', True)
        data = self._get_background_to_plot(plot_forecast, mult, ratio_use_rate, display_monthly_data)
        if len(data) == 0:
            # No background to plot.
            return

        # Get axis mins and maxes
        self._update_axis(data.index.min(), 'x', 'min')
        self._update_axis(data.index.max(), 'x', 'max')
        self._update_axis(data.min().min(), 'y', 'min')
        self._update_axis(data.max().max(), 'y', 'max')

        # This makes it so that we only get one label in the legend for all the background wells.
        columns = ['_' for _ in data.columns]
        columns[0] = 'Background Data'
        data.columns = columns

        data.plot(color=BACKGROUND_WELL_COLORS['light'], ax=ax, label='_Hidden', alpha=0.7)

    def _plot_wells_average_series(self, ax, wells_average_series: list[str], phase: str, mult: float,
                                   display_monthly_data: bool):
        '''Plot wells averages into c4 chart.'''
        if display_monthly_data:
            wells_average_data = {'index': self.wells_average_data['index'], **self.wells_average_data['monthly']}
        else:
            wells_average_data = {'index': self.wells_average_data['index'], **self.wells_average_data['daily']}

        wells_average_data = pd.DataFrame(wells_average_data)
        if len(wells_average_data) == 0:
            # No background to plot.
            return
        if len(wells_average_series) > 0:
            self._update_axis(wells_average_data['index'].min(), 'x', 'min')
            self._update_axis(wells_average_data['index'].max(), 'x', 'max')

        for series in wells_average_series:
            if series != 'count':
                wells_average_data[series] = wells_average_data[series] * mult
            self._update_axis(wells_average_data[series].min(), 'y', 'min')
            self._update_axis(wells_average_data[series].max(), 'y', 'max')
            wells_average_data.plot(x='index',
                                    y=series,
                                    color=CHART_COLORS[phase][series],
                                    ax=ax,
                                    label=SERIES_NAMES[series],
                                    linestyle='solid')

    def _plot_tc_series(self, ax, tc_series: list[str], phase: str, mult: float, display_monthly_data: bool):
        if len(tc_series) > 0:
            self._update_axis(self.tc_c4_data['index'].min(), 'x', 'min')
            self._update_axis(self.tc_c4_data['index'].max(), 'x', 'max')
        index = self.tc_c4_data['index']
        for series in tc_series:
            if series not in self.tc_c4_data.columns:
                continue
            if display_monthly_data:
                scaled_series_data: pd.DataFrame = self.tc_c4_data[series] * mult * DAYS_IN_MONTH
            else:
                scaled_series_data: pd.DataFrame = self.tc_c4_data[series] * mult
            self._update_axis(scaled_series_data.min(), 'y', 'min')
            self._update_axis(scaled_series_data.max(), 'y', 'max')
            plt.plot(index,
                     scaled_series_data,
                     color=CHART_COLORS[phase][series + 'Fit'],
                     label=SERIES_NAMES[series + 'Fit'],
                     linestyle=P_SERIES_LINE_STYLES[series + 'Fit'])

    def _plot_tc_rate_cum(self, tc_series: list[str], phase: str, chart: str):
        phase_type = self.tc_data['phase_type']
        ms = MultipleSegments()
        # Cum functions insist on seeing some production.
        empty_prod = np.array([]).reshape(0, 2)
        for series in tc_series:
            if series not in self.tc_c4_data.columns:
                continue
            target_segs = self.tc_data['target_dict'][series]['segments']
            if phase_type == 'ratio':
                series_start_idx = target_segs[0]['start_idx']
                base_segs = get_shift_base_segments(self.tc_data['base_dict'].get('best', {}).get('segments', []),
                                                    series_start_idx)
                index = CUM_PLOT_TICKS + series_start_idx
                series_rates: list[float] = ms.predict_time_ratio(index, target_segs, base_segs)
                series_cums: list[float] = ms.cum_from_t_ratio(index, empty_prod, target_segs, base_segs, 'monthly')
            else:
                series_start_idx = target_segs[0]['start_idx']
                index = CUM_PLOT_TICKS + series_start_idx
                series_rates: list[float] = ms.predict(index, target_segs, to_fill=None)
                series_cums: list[float] = ms.cum_from_t(index, empty_prod, target_segs, 'monthly')
            if chart == 'rateVsCum':
                self._plot_rate_v_cum_data(series_rates, series_cums, phase, series + 'Fit')
            else:  # 'fitCum'
                index = index - index[0]
                self._plot_fit_cum_data(index, series_cums, phase, series + 'Fit')

    ## equivalent of \main-combocurve\client\src\type-curves\charts\FitCumChart-v2.js:36, getDiscreteCumulative
    def _plot_background_rate_cum(self, phase: str, plot_forecast: bool, honor_fit: bool, chart: str):
        if len(self.calculated_background_data['monthly_prod'].get('data', [])) == 0:
            # No wells to plot.
            return
        if self.tc_data['phase_type'] == 'rate':
            align = self.tc_data.get('align', 'noalign')
            bg_prod_indices = self.calculated_background_data[align]['idx']
            bg_prod_data = self.calculated_background_data[align]['data']
            individual_well_indices = self.calculated_background_data[align]['data_part_idx']
        else:
            bg_prod_indices = self.calculated_background_data['target_phase']['c4use']['idx']
            bg_prod_data = self.calculated_background_data['target_phase']['c4use']['data']
            individual_well_indices = self.calculated_background_data['target_phase']['c4use']['data_part_idx']
        for i, prod_indices in enumerate(individual_well_indices):
            [prod_start, prod_end, has_prod] = prod_indices
            if not has_prod and not plot_forecast:
                continue

            start_idx = bg_prod_indices[prod_indices[0]]
            cum_start_time, cum_indices = self._get_cum_indices(honor_fit, start_idx)
            if not plot_forecast:
                cum_end_time = bg_prod_indices[prod_indices[1]]
                cum_indices = cum_indices[cum_indices <= cum_end_time]

            well_data = cum_from_discrete_data(bg_prod_indices, list(bg_prod_data[i]), cum_start_time, cum_indices)
            series_rates = well_data['rate']
            series_cums = well_data['cum']
            if i == 0:
                series_style = 'bg_first'
            else:
                series_style = 'bg_later'
            if chart == 'rateVsCum':
                self._plot_rate_v_cum_data(series_rates, series_cums, phase, series_style)
            else:  # 'fitCum'
                index = cum_indices - cum_indices[0]
                self._plot_fit_cum_data(index, series_cums, phase, series_style)

    def _plot_ave_rate_cum(self, phase: str, ave_series: list[str], honor_fit: bool, chart: str):
        # Need to calc on the fly, might be different than c4 for ratio phase since we're always looking at rates in
        # this chart.
        # TODO: Cums aren't plotting right. Need to dig into this
        ave_data = self._get_wells_average_data(True)
        ave_data = {'index': ave_data['index'], **ave_data['daily']}
        ave_data = pd.DataFrame(ave_data)
        for series in ave_series:
            # For some ungodly reason the wells p50 is called median for this series
            series = 'p50' if series == 'median' else series
            if series not in ave_data.columns or len(ave_data[series]) == 0:
                continue
            start_idx = ave_data['index'][0]
            cum_start_time, cum_indices = self._get_cum_indices(honor_fit, start_idx)
            series_data = cum_from_discrete_data(list(ave_data['index']), list(ave_data[series]), cum_start_time,
                                                 cum_indices)
            if chart == 'rateVsCum':
                self._plot_rate_v_cum_data(series_data['rate'], series_data['cum'], phase, series)
            else:  # 'fitCum'
                index = cum_indices - cum_indices[0]
                self._plot_fit_cum_data(index, series_data['cum'], phase, series)

    def _plot_rate_v_cum_data(self, series_rates: Iterable, series_cums: Iterable, phase: str, series_style: str):
        if series_style == 'bg_first':
            styling = {'color': BACKGROUND_WELL_COLORS['light'], 'label': 'Background Data', 'alpha': 0.7}
        elif series_style == 'bg_later':
            styling = {'color': BACKGROUND_WELL_COLORS['light'], 'label': '_Hidden', 'alpha': 0.7}
        else:
            styling = {
                'color': CHART_COLORS[phase][series_style],
                'label': SERIES_NAMES[series_style],
                'linestyle': P_SERIES_LINE_STYLES[series_style]
            }
        # Mercifully, all cums have the same units multipliers.
        series_cums = np.array(series_cums) * 0.001
        # series_rates might have nans, so need to manually find mins and maxes.
        min_rate = series_rates[0]
        max_rate = series_rates[0]
        for rate in series_rates[1:]:
            if rate is not None:
                if rate < min_rate:
                    min_rate = rate
                if rate > max_rate:
                    max_rate = rate
        self._update_axis(min_rate, 'y', 'min')
        self._update_axis(max_rate, 'y', 'max')
        self._update_axis(series_cums[0], 'x', 'min')
        self._update_axis(series_cums[-1], 'x', 'max')
        plt.plot(series_cums, series_rates, **styling)

    def _plot_fit_cum_data(self, index: Iterable, series_cums: Iterable, phase: str, series_style: str):
        if series_style == 'bg_first':
            styling = {'color': BACKGROUND_WELL_COLORS['light'], 'label': 'Background Data', 'alpha': 0.7}
        elif series_style == 'bg_later':
            styling = {'color': BACKGROUND_WELL_COLORS['light'], 'label': '_Hidden', 'alpha': 0.7}
        else:
            styling = {
                'color': CHART_COLORS[phase][series_style],
                'label': SERIES_NAMES[series_style],
                'linestyle': P_SERIES_LINE_STYLES[series_style]
            }
        # Mercifully, all cums have the same units multipliers.
        series_cums = np.array(series_cums) * 0.001
        self._update_axis(index[0], 'x', 'min')
        self._update_axis(index[-1], 'x', 'max')
        self._update_axis(series_cums[0], 'y', 'min')
        self._update_axis(series_cums[-1], 'y', 'max')
        plt.plot(index, series_cums, **styling)

    def _get_cum_indices(self, honor_fit: bool, start_idx: int):
        # In this case the only columns is 'index', so there's no tc series to honor the fit of.
        no_tc_data = len(self.tc_c4_data.columns) == 1
        tc_start = self.tc_c4_data['index'][0]
        if honor_fit and not no_tc_data:
            if tc_start >= start_idx:
                cum_start_time = tc_start
                cum_indices = CUM_PLOT_TICKS + tc_start
            elif self.tc_data.get('align', 'noalign') == 'align' and self.tc_data['phase_type'] == 'rate':
                cum_start_time = start_idx
                cum_indices = np.concatenate(([tc_start, start_idx - 1], CUM_PLOT_TICKS + start_idx))
            else:
                cum_start_time = start_idx
                cum_indices = CUM_PLOT_TICKS
        else:
            cum_start_time = start_idx
            cum_indices = CUM_PLOT_TICKS + start_idx
        return cum_start_time, cum_indices

    def _get_background_to_plot(self, plot_forecast: bool, mult: float, ratio_use_rate: bool,
                                display_monthly_data: bool) -> pd.DataFrame:
        phase_type = self.tc_data['phase_type']
        if phase_type == 'rate':
            if self.tc_data.get('align', 'noalign') == 'align':
                background_data = self.calculated_background_data['align']
            else:
                background_data = self.calculated_background_data['noalign']
        else:
            if ratio_use_rate:
                background_data = self.calculated_background_data['target_phase']['c4use']
            else:
                background_data = self.calculated_background_data['noalign']
        if len(background_data['idx']) == 0:
            # No background data.
            return pd.DataFrame({'index': []}).set_index('index', drop=True)

        if plot_forecast:
            wells_data = np.array(background_data['data'], dtype=float) * mult

        else:
            prod_indices = background_data['data_part_idx']
            n_wells = len(background_data['data'])
            n_volumes = len(background_data['data'][0])
            prod_mask = get_prod_data_mask(prod_indices, n_volumes, n_wells)
            wells_data = np.ma.masked_array(background_data['data'], ~prod_mask, dtype=float) * mult

        if display_monthly_data:
            wells_data = wells_data * np.array(background_data.get('days_in_month_arr'), dtype=float)

        data = pd.DataFrame(wells_data).transpose()
        data['index'] = background_data['idx']
        return data.set_index('index', drop=True)

    def _format_fig(self, fig: matplotlib.figure.Figure, ax, chart: str, phase: str):
        chart_settings = self.individual_chart_settings[self.current_settings]['chartSettings']
        title = self._generate_title(chart, phase)
        ax.set_title(title, loc='left', fontweight='normal', fontsize=DEFAULT_CHART_FONT)
        self._set_axis_units(ax, chart, phase)
        # general plot style
        ax.set_facecolor('white')
        ax.grid(True, which='major', color='lightGray')
        ax.grid(True, which='minor', color='whiteSmoke')
        ax.minorticks_on()
        ax.spines['bottom'].set_color('darkGray')
        ax.spines['left'].set_color('darkGray')
        ax.tick_params(which='both', bottom=True, left=True, color='darkGray')

        self._set_axis_bounds(ax, chart)
        ax.yaxis.grid(True, which='minor')
        ax.xaxis.grid(True, which='minor')

        if chart_settings.get('yLogScale', True):
            ax.set_yscale('log')
            ax.yaxis.set_major_locator(LogLocator(base=10, numticks=10))
            ax.yaxis.set_major_formatter(StrMethodFormatter('{x:,g}'))
            if ax.get_yticks().size < 6:
                # For few major ticks, start labelling the minor ones
                ax.yaxis.set_minor_formatter(StrMethodFormatter('{x:,g}'))
        if chart_settings.get('xLogScale', False):
            ax.set_xscale('log')
            ax.xaxis.set_major_formatter(StrMethodFormatter('{x:,g}'))
            ax.locator_params(axis='x', subs=(1, 2, 5))
        # Set formatter for numerical x-axes
        if chart in ['c4', 'fitCum', 'rateVsCum']:
            ax.xaxis.set_major_formatter(StrMethodFormatter('{x:,g}'))
        # Ticks need to be converted to months when showDaily is enabled.
        if not self.individual_chart_settings[self.current_settings].get('showDaily', True):
            locs, _ = plt.xticks()
            monthly_labels = map(str, np.round(locs / DAYS_IN_MONTH).astype(int))
            plt.xticks(locs, monthly_labels)
        if chart_settings.get('enableLegend', False):
            legend = ax.legend(loc='best', fancybox=True)
            frame = legend.get_frame()
            frame.set_facecolor('white')
            frame.set_alpha(0.5)
        elif ax.get_legend() is not None:
            # Some charts enable pieces of the legend. Make sure they're removed here.
            ax.get_legend().remove()

        for label in ax.get_xticklabels() + ax.get_yticklabels():
            label.set_fontsize(DEFAULT_CHART_FONT)

        ax.set_rasterized(True)

    def _set_axis_bounds(self, ax, chart: str):
        chart_settings = self.individual_chart_settings[self.current_settings]['chartSettings']

        # x axis.
        x_min, x_max = self._get_x_bounds(chart)

        # c4 and fitCum charts have option for x-axis to be daily or monthly res. Only need to adjust if daily.
        if chart in ('c4',
                     'fitCum') and not self.individual_chart_settings[self.current_settings].get('showDaily', True):
            total_month_range = (x_max - x_min) / DAYS_IN_MONTH
            if total_month_range > 500:
                ticks_distance = 100 * DAYS_IN_MONTH
            elif total_month_range > 250:
                ticks_distance = 50 * DAYS_IN_MONTH
            elif total_month_range > 50:
                ticks_distance = 10 * DAYS_IN_MONTH
            elif total_month_range > 25:
                ticks_distance = 5 * DAYS_IN_MONTH
            else:
                ticks_distance = DAYS_IN_MONTH
            x_ticks = np.arange(x_min, x_max, ticks_distance)
            x_labels = np.round(x_ticks / DAYS_IN_MONTH).astype(int)
            plt.xticks(list(x_ticks), list(x_labels))

        # y axis
        y_min = self.y_min if chart_settings['yMin'] == 'all' else chart_settings['yMin']
        y_max = self.y_max if chart_settings['yMax'] == 'all' else chart_settings['yMax']
        if y_min is None or np.isnan(y_min):
            y_min = 0.1 if y_max is None or np.isnan(y_max) else min(0.1, y_max)
        if y_max is None or np.isnan(y_max):
            y_max = 1 if y_min is None or np.isnan(y_min) else max(1, y_min)
        # Pad by 10% so that the lines actually appear
        if chart_settings.get('yLogScale', True):
            y_min = max(y_min, 0.001)
            y_max = y_max**1.1 / y_min**0.1
        else:
            y_max += (y_max - y_min) * 0.01

        ax.set_xlim(xmin=x_min, xmax=x_max)
        ax.set_ylim(ymin=y_min, ymax=y_max)
        # Clear global storage for next chart.
        self.x_min = self.x_max = self.y_min = self.y_max = None

    def _get_x_bounds(self, chart: str):
        x_min = self.x_min
        x_max = self.x_max

        sum_cum_bounds = (index_today() if x_max is None else min(x_min, x_max),
                          index_today() if x_min is None else max(x_min, x_max))
        c4_fitcum_ratecum_bounds = (0 if x_max is None else min(x_min, x_max),
                                    0 if x_min is None else max(x_min, x_max))

        raw_x_bounds = {
            'eur': (0, 103),
            'sum': sum_cum_bounds,
            'cum': sum_cum_bounds,
            'c4': c4_fitcum_ratecum_bounds,
            'fitCum': c4_fitcum_ratecum_bounds,
            'rateVsCum': c4_fitcum_ratecum_bounds
        }

        raw_x_min, raw_x_max = raw_x_bounds[chart]

        chart_settings = self.individual_chart_settings[self.current_settings]['chartSettings']
        years_before = chart_settings.get('yearsBefore', 'all')
        years_past = chart_settings.get('yearsPast', 'all')
        cum_min = chart_settings.get('cumMin', 'all')
        cum_max = chart_settings.get('cumMax', 'all')
        lower_bound = years_before if chart != 'rateVsCum' else cum_min
        upper_bound = years_past if chart != 'rateVsCum' else cum_max

        if lower_bound != 'all':
            # Date x-axes:
            if chart in ('sum', 'cum'):
                x_min = {
                    'sum': raw_x_min - timedelta(days=lower_bound * DAYS_IN_YEAR),
                    'cum': raw_x_min - timedelta(days=lower_bound * DAYS_IN_YEAR)
                }[chart]
            # Numeric x-axes
            else:
                x_min = {
                    'eur': raw_x_min,
                    'c4': -lower_bound * DAYS_IN_YEAR,
                    'fitCum': raw_x_min - lower_bound * DAYS_IN_YEAR,
                    'rateVsCum': lower_bound
                }[chart]
        else:
            x_min = raw_x_min

        if upper_bound != 'all':
            if chart in ('sum', 'cum'):
                x_max = {
                    'sum': raw_x_min + timedelta(days=upper_bound * DAYS_IN_YEAR),
                    'cum': raw_x_min + timedelta(days=upper_bound * DAYS_IN_YEAR),
                }[chart]
            else:
                x_max = {
                    'eur': raw_x_max,
                    'c4': upper_bound * DAYS_IN_YEAR,
                    'fitCum': raw_x_min + upper_bound * DAYS_IN_YEAR,
                    'rateVsCum': upper_bound
                }[chart]
        else:
            x_max = raw_x_max

        # One last check to make sure x_min <= x_max
        x_min = min(x_min, x_max)
        x_max = max(x_min, x_max)
        if x_min is None or (isinstance(x_min, float) and np.isnan(x_min)):
            x_min = 0.1 if x_max is None or (isinstance(x_max, float) and np.isnan(x_max)) else min(0.1, x_max)
        if x_max is None or (isinstance(x_max, float) and np.isnan(x_max)):
            x_max = 1 if x_min is None or (isinstance(x_min, float) and np.isnan(x_min)) else max(1, x_min)

        return x_min, x_max

    def _set_axis_units(self, ax, chart: str, phase: str):
        if chart == 'eur':
            ax.set_xlabel('Percentile')
            ax.set_ylabel(PHASE_VOLUME_UNIT[phase])
        elif chart == 'sum':
            ax.set_xlabel('Date')
            ax.xaxis.set_major_formatter(DateFormatter('%m/%d/%Y'))
            ax.xaxis.set_major_locator(AutoDateLocator(maxticks=9))
            ax.set_ylabel(PHASE_RATE_UNIT[phase])
        elif chart == 'cum':
            ax.set_xlabel('Date')
            ax.xaxis.set_major_formatter(DateFormatter('%m/%d/%Y'))
            ax.xaxis.set_major_locator(AutoDateLocator(maxticks=9))
            ax.set_ylabel(PHASE_VOLUME_UNIT[phase])
        elif chart == 'c4':
            if self.individual_chart_settings[self.current_settings]['showDaily']:
                ax.set_xlabel('Days')
            else:
                ax.set_xlabel('Months')
            if not self.individual_chart_settings[self.current_settings].get(
                    'c4RatioShowRate', True) and self.tc_data['phase_type'] == 'ratio':
                ax.set_ylabel(PHASE_RATIO_UNIT[phase + '/' + self.tc_data['base_phase']])
            else:
                is_daily_rate = self.individual_chart_settings[self.current_settings]['showDailyRate']
                resolution = 'daily' if is_daily_rate else 'monthly'
                ax.set_ylabel(PHASE_RATE_UNIT_C4[resolution][phase])
        elif chart == 'rateVsCum':
            ax.set_xlabel(PHASE_VOLUME_UNIT[phase])
            ax.set_ylabel(PHASE_RATE_UNIT[phase])
        elif chart == 'fitCum':
            if self.individual_chart_settings[self.current_settings]['showDaily']:
                ax.set_xlabel('Days')
            else:
                ax.set_xlabel('Months')
            ax.set_ylabel(PHASE_VOLUME_UNIT[phase])

    def _generate_title(self, chart, phase):
        title_fields = [
            TITLE_MAP[chart], self.tc_name, self.proj_name, FORMATTED_PHASE_TYPE[self.tc_data['phase_type']],
            FORMATTED_PHASES[phase], f'EUR ({PHASE_VOLUME_UNIT[phase]})'
        ]
        eur_fields = []
        for k, v in FORMATTED_SERIES.items():
            eur = self.tc_eurs.get(k)
            if eur is not None:
                eur_fields.append(f'{v}: {(self.tc_eurs[k]*0.001):.1f}')
            else:
                eur_fields.append(f'{v}: -')

        header_fields = {k: [None, None] for k in REP_HEADERS.keys()}
        for well in self.rep_data:
            for k in header_fields.keys():
                headers = well['header']
                update_min_and_max(headers[k], header_fields[k])

        for k, v in header_fields.items():
            for i in range(2):
                if v[i] is None:
                    v[i] = 'N/A'
                elif isinstance(v[i], datetime):
                    v[i] = v[i].strftime('%m/%d/%Y')
                else:
                    v[i] = round(v[i])
            header_fields[k] = v
        header_fields = [f'{v}: {header_fields[k][0]} - {header_fields[k][1]}' for k, v in REP_HEADERS.items()]

        current_time = get_current_time(self.time_zone).date().strftime('%m/%d/%Y')
        time_stamp_fields = [
            'Last Updated on ' + self.tc_data['updated_at'].strftime('%m/%d/%Y'), 'Downloaded on ' + current_time
        ]

        return fill(' | '.join(chain(title_fields, eur_fields, header_fields, time_stamp_fields)), 100)

    def _get_wells_average_data(self, not_c4_chart: bool = False):
        '''Wells averages for rate_cum and cum_fit charts are re-calculated on the fly in their plot
        methods.'''

        phase_type = self.tc_data['phase_type']
        if phase_type == 'rate':
            if self.tc_data.get('align', 'noalign') == 'align':
                background_data = self.calculated_background_data['align']
            else:
                background_data = self.calculated_background_data['noalign']
        else:
            if not_c4_chart or self.individual_chart_settings.get(self.current_settings, {}).get(
                    'c4RatioShowRate', True):
                background_data = self.calculated_background_data['target_phase']['c4use']
            else:
                background_data = self.calculated_background_data['noalign']

        volumes = np.array(background_data['data'], dtype=float)
        days_in_month_arr = np.array(background_data.get('days_in_month_arr'), dtype=float)
        monthly_volumes = volumes * days_in_month_arr

        if len(background_data['idx']) > 0:
            average_data_daily = generate_background_average_data(volumes, background_data['data_part_idx'])
            average_data_monthly = generate_background_average_data(monthly_volumes, background_data['data_part_idx'])

            index = background_data['idx']

        else:
            average_data_daily = {
                'count': np.array([]),
                'average': np.array([]),
                'p50': np.array([]),
                'aveNoFst': np.array([]),
                'p50NoFst': np.array([]),
            }

            average_data_monthly = {
                'count': np.array([]),
                'average': np.array([]),
                'p50': np.array([]),
                'aveNoFst': np.array([]),
                'p50NoFst': np.array([]),
            }
            index = []

        data = {'index': index, 'monthly': {**average_data_monthly}, 'daily': {**average_data_daily}}
        return data

    def _get_sum_cum_data(self):
        '''Used for the sum and cum charts.'''
        wells_data = self.calculated_background_data['monthly_prod'].get('data', [])
        cum_idx = self.calculated_background_data['cum_dict']['idx']
        cum_wells_ranges = self.calculated_background_data['cum_dict']['cum_subind']
        phase_type = self.tc_data['phase_type']
        n_wells = len(cum_wells_ranges)
        n_cum = len(cum_idx)
        wells_sum = np.zeros((n_wells, n_cum), dtype=float)
        if self.tc_data['target_dict'] is not None:
            if phase_type == 'ratio':
                tc_sums = {
                    k: np.zeros_like(wells_sum)
                    for k in self.tc_data['target_dict'] if k in self.tc_data['base_dict']
                }
            else:
                tc_sums = {k: np.zeros_like(wells_sum) for k in self.tc_data['target_dict']}
        else:
            tc_sums = {}

        tc_cums = {}

        # Indexes for cum-sum charts. Copied from getFitArr in main client/src/type-curves/charts/sharted.tsx
        cum_sum_idx: np.ndarray = np.arange(len(self.calculated_background_data['cum_dict']['idx']), dtype=int)

        ms = MultipleSegments()
        tc_rates = dict.fromkeys(tc_sums.keys())
        lacks_rate_data = []
        for this_series in tc_rates.keys():
            target_segs = self.tc_data['target_dict'][this_series]['segments']
            if len(target_segs) == 0:
                this_series_rates = []
                lacks_rate_data.append(this_series)
            elif phase_type == 'ratio':
                series_start_idx = target_segs[0]['start_idx']
                base_segs = get_shift_base_segments(self.tc_data['base_dict'].get('best', {}).get('segments', []),
                                                    series_start_idx)
                this_cum_sum_idx = cum_sum_idx * DAYS_IN_MONTH + series_start_idx + 15
                this_series_rates: list[float] = ms.predict_time_ratio(this_cum_sum_idx, target_segs, base_segs)
            else:
                series_start_idx = target_segs[0]['start_idx']
                this_cum_sum_idx = cum_sum_idx * DAYS_IN_MONTH + series_start_idx + 15
                this_series_rates: list[float] = ms.predict(this_cum_sum_idx, target_segs)
            tc_rates[this_series] = this_series_rates

        # First get rid of any tc series that hasn't been forecast yet.
        for k in lacks_rate_data:
            tc_sums.pop(k)
        for i in range(n_wells):
            wells_sum[i, cum_wells_ranges[i][0]:cum_wells_ranges[i][1]] = wells_data[i]
            for series in tc_sums.keys():
                if len(tc_rates[series]) == 0:
                    tc_sums.pop(series)
                    continue
                upper_bound = cum_wells_ranges[i][1] - cum_wells_ranges[i][0]
                tc_sums[series][i, cum_wells_ranges[i][0]:cum_wells_ranges[i][1]] = tc_rates[series][0:upper_bound]
        wells_sum = np.nansum(wells_sum, axis=0)
        # The cum is fragile. The sums output daily volumes. We're plotting at the 15th of every month,
        # so the volume of that month is approximately the daily volume * DAYS_IN_MONTH. Include a 0.001 factor for
        # unit conversion.
        wells_cum = (np.nancumsum(wells_sum) * DAYS_IN_MONTH) * 0.001
        for series in tc_sums.keys():
            tc_sums[series] = np.nansum(tc_sums[series], axis=0)
            tc_cums[series] = np.nancumsum(tc_sums[series]) * DAYS_IN_MONTH * 0.001
        dates = [date_from_index(x) for x in cum_idx]
        sum_data = {'dates': dates, 'sum': wells_sum, **tc_sums}
        cum_data = {'dates': dates, 'cum': wells_cum, **tc_cums}
        return pd.DataFrame(sum_data), pd.DataFrame(cum_data)

    def _get_tc_data(self, phase: str):

        # Big hairy pipeline. Result of query is:
        # phase_type: whether current tc phase is rate or ratio
        # base_phase: the base phase for the current phase
        # target_dict: P_dict for the current tc phase
        # base_dict: P_dict for the base tc phase
        pipeline = [{
            '$match': {
                '_id': ObjectId(self.tc_id)
            }
        }, {
            '$project': {
                '_id': 0,
                'tc_id': '$_id',
                'phase_type': '$phaseType.' + phase,
                'base_phase': '$basePhase',
                'updated_at': '$updatedAt'
            }
        }, {
            '$lookup': {
                'from': 'type-curve-fits',
                'localField': 'tc_id',
                'foreignField': 'typeCurve',
                'as': 'p_fields'
            }
        }, {
            '$unwind': {
                'path': '$p_fields',
                'preserveNullAndEmptyArrays': True
            }
        }, {
            '$project': {
                'normalize': '$p_fields.normalize',
                'align': '$p_fields.align',
                'phase_type': 1,
                'base_phase': 1,
                'updated_at': 1,
                'target_dict': {
                    '$cond': {
                        'if': {
                            '$eq': ['$p_fields.phase', phase]
                        },
                        'then': {
                            '$cond': {
                                'if': {
                                    '$eq': ['$p_fields.fitType', 'rate']
                                },
                                'then': '$p_fields.P_dict',
                                'else': '$p_fields.ratio_P_dict'
                            }
                        },
                        'else': '$$REMOVE'
                    }
                },
                'base_dict': {
                    '$cond': {
                        'if': {
                            '$eq': ['$p_fields.phase', '$base_phase']
                        },
                        'then': {
                            '$cond': {
                                'if': {
                                    '$eq': ['$p_fields.fitType', 'rate']
                                },
                                'then': '$p_fields.P_dict',
                                'else': '$p_fields.ratio_P_dict'
                            }
                        },
                        'else': '$$REMOVE'
                    }
                }
            }
        }, {
            '$group': {
                '_id': None,
                'phase_type': {
                    '$push': '$phase_type'
                },
                'base_phase': {
                    '$push': '$base_phase'
                },
                'target_dict': {
                    '$push': '$target_dict'
                },
                'base_dict': {
                    '$push': '$base_dict'
                },
                'updated_at': {
                    '$push': '$updated_at'
                },
                'normalize': {
                    '$push': '$normalize'
                },
                'align': {
                    '$push': '$align'
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'phase_type': {
                    '$arrayElemAt': ['$phase_type', 0]
                },
                'base_phase': {
                    '$arrayElemAt': ['$base_phase', 0]
                },
                'target_dict': {
                    '$arrayElemAt': ['$target_dict', 0]
                },
                'base_dict': {
                    '$arrayElemAt': ['$base_dict', 0]
                },
                'updated_at': {
                    '$arrayElemAt': ['$updated_at', 0]
                },
                'normalize': {
                    '$arrayElemAt': ['$normalize', 0]
                },
                'align': {
                    '$arrayElemAt': ['$align', 0]
                }
            }
        }]

        tc_data = list(self.context.type_curves_collection.aggregate(pipeline))[0]
        if tc_data.get('target_dict') is not None:
            target_p_dicts = tc_data['target_dict']
        else:
            target_p_dicts = {}
            tc_data['target_dict'] = None
        if tc_data.get('base_dict') is not None:
            base_p_dicts = tc_data['base_dict']
        else:
            base_p_dicts = {}
            tc_data['base_dict'] = None

        # Indexes for C4 chart
        # Find earliest start date.
        min_idx = 0
        for series in target_p_dicts.values():
            segments = series['segments']
            if len(segments) > 0:
                this_start = int(segments[0]['start_idx'])
                min_idx = min((this_start, min_idx))
        # Plot 2 years daily res, 2 years every other day, then remaining 60 years at monthly res.
        daily_res_end = min_idx + 365 + 366  # second year is at 365.25 + 365.25, so rounds up to 366
        bi_daily_res_end = daily_res_end + 365 + 366
        index = [*range(min_idx, daily_res_end)]
        index += [*range(daily_res_end, bi_daily_res_end, 2)]
        # Find number of data points required for monthly res portion.
        end_idx = ceil((60 * DAYS_IN_YEAR - bi_daily_res_end) / DAYS_IN_MONTH)
        monthly_res = [bi_daily_res_end + i * DAYS_IN_MONTH for i in range(end_idx)]
        monthly_res = [round(x) for x in monthly_res]
        index += monthly_res

        all_series_values = {'index': index}

        ms = MultipleSegments()

        tc_eurs = {}

        for this_series in target_p_dicts.keys():
            this_series_segments = target_p_dicts[this_series]['segments']
            if len(this_series_segments) > 0:
                if tc_data['phase_type'] == 'rate':
                    this_series_values: list[float] = ms.predict(index, this_series_segments, to_fill=None)
                    tc_eurs[this_series] = ms.eur(0, -10000, this_series_segments[0]['start_idx'],
                                                  this_series_segments[-1]['end_idx'], this_series_segments, 'monthly')
                else:
                    # Base segment values are always 'best'. See TypeCurveFitDataContext on main.
                    base_segments = get_shift_base_segments(
                        base_p_dicts.get('best', {}).get('segments', []), this_series_segments[0]['start_idx'])
                    # Switch on predicting rate or ratio values
                    if self.individual_chart_settings.get(self.current_settings, {}).get('c4RatioShowRate', True):
                        this_series_values: list[float] = ms.predict_time_ratio(index, this_series_segments,
                                                                                base_segments)
                    else:
                        this_series_values: list[float] = ms.predict(index, this_series_segments)
                    tc_eurs[this_series] = ms.ratio_eur_interval(0, -10000, this_series_segments[0]['start_idx'],
                                                                 this_series_segments[-1]['end_idx'],
                                                                 this_series_segments, base_segments, 'monthly')
                all_series_values[this_series] = this_series_values

        return pd.DataFrame(all_series_values), tc_eurs, tc_data

    def _update_axis(self, val: float, x_or_y: str, min_or_max: str):
        if min_or_max == 'min':
            if x_or_y == 'x':
                if self.x_min is not None:
                    self.x_min = min(self.x_min, val)
                elif isinstance(val, date):
                    self.x_min = val
                elif np.isfinite(val):
                    self.x_min = val
            elif x_or_y == 'y':
                if self.y_min is not None:
                    self.y_min = min(self.y_min, val)
                elif np.isfinite(val):
                    self.y_min = val
            else:
                raise ValueError('Options for x_or_y are "x" or "y".')
        elif min_or_max == 'max':
            if x_or_y == 'x':
                if self.x_max is not None:
                    self.x_max = max(self.x_max, val)
                elif isinstance(val, date):
                    self.x_max = val
                elif np.isfinite(val):
                    self.x_max = val
            elif x_or_y == 'y':
                if self.y_max is not None:
                    self.y_max = max(self.y_max, val)
                elif np.isfinite(val):
                    self.y_max = val
            else:
                raise ValueError('Options for x_or_y are "x" or "y".')
        else:
            raise ValueError('Options for min_or max are "min" or "max".')

    def _update_phase_dependent_data(self, phase: str):

        # Find what wells work for this phase.
        self.valid_phase_wells = []
        wells_info_for_background_data = {
            'wellsResolvedResolution': {},
            'wellsDataInfo': {},
            'wellsForecastInfo': {},
            'wellsEurInfo': {},
        }

        for well in self.rep_data:
            if well['rep'][phase]:
                well_id = well['well_id']
                self.valid_phase_wells.append(well_id)
                wells_info_for_background_data['wellsResolvedResolution'][well_id] = well['resolved_resolution']
                wells_info_for_background_data['wellsDataInfo'][well_id] = well['data_info']
                wells_info_for_background_data['wellsForecastInfo'][well_id] = well['forecast_info']
                wells_info_for_background_data['wellsEurInfo'][well_id] = well['eur']

        if len(self.valid_phase_wells) > 0:
            tc_input = self.type_curve_service._get_tc_fit_init_data(self.tc_id, phase, self.valid_phase_wells,
                                                                     wells_info_for_background_data)
            tc_input.update({
                'init_para_dict': {
                    'TC_life': 60,
                    'forecast_series': 'best',
                    'TC_target_data_freq': self.resolution,
                }
            })
            obj = tc_init()
            raw_background_data = obj.body(tc_input)
        else:
            raw_background_data = None
        self.tc_c4_data, self.tc_eurs, self.tc_data = self._get_tc_data(phase)
        phase_type = self.tc_data['phase_type']
        self.calculated_background_data: dict[str, Any] = self._calculate_background_data(
            raw_background_data, self.daily_range, phase_type, phase)

        #self.wells_average_data is only used when plotting the wells average lines in TC fit chart
        self.wells_average_data = self._get_wells_average_data()
        self.sum_data, self.cum_data = self._get_sum_cum_data()

    def _generate_and_save_document(self, tc_name: str, project_id: str):
        export_settings = {'documentFormat': self.file_type, 'graphSettings': {'numOfCharts': 1}}
        settings = ChartsExportSettings.from_dict(export_settings)
        file_name = make_file_os_safe(
            f'{tc_name}-chart-export-{datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S-%f")}') + f'.{self.file_type}'
        with BytesIO() as document_file:
            generate_document(self._generate_chart_memory_files(), document_file, settings)
            document_file_info = {'type': self.file_type, 'name': file_name}
            file_object = self.context.file_service.upload_file_from_string(string_data=document_file.getvalue(),
                                                                            file_data=document_file_info, project_id=project_id)

        return str(file_object)

    def _generate_chart_memory_files(self):
        CHARTS_MAP = {
            'c4': self._plot_c4_chart,
            'sum': self._plot_sum_chart,
            'cum': self._plot_cum_chart,
            'eur': self._plot_eur_chart,
            'rateVsCum': self._plot_rate_v_cum_chart,
            'fitCum': self._plot_fit_cum_chart
        }

        for phase in self.required_phases:

            for settings_key, settings in self.individual_chart_settings.items():
                chart_type = settings['chartType']
                if settings['phase'] != phase or chart_type not in CHARTS_MAP.keys():
                    # This chart is not supported yet.
                    continue
                with BytesIO() as memory_file:
                    try:
                        self.current_settings: str = settings_key
                        self._update_phase_dependent_data(phase)
                        fig, ax = CHARTS_MAP[chart_type](phase)
                        self._format_fig(fig, ax, chart_type, phase)
                    except Exception as e:

                        # Log error.
                        error_info = get_exception_info(e)
                        extra = {
                            'metadata': {
                                'error': error_info,
                                'chart': chart_type,
                                'phase': phase,
                                'tc_id': self.tc_id,
                                'tc_data': self.tc_data,
                                'rep_data': self.rep_data
                            }
                        }
                        logging.error(error_info['message'], extra=extra)

                        # Generate user-facing warning.
                        fig = plt.figure()
                        ax = fig.add_axes((0.1, 0.1, 0.85, 0.75))
                        phase_data = ' | '.join([
                            TITLE_MAP[chart_type], self.tc_name, self.proj_name,
                            FORMATTED_PHASE_TYPE[self.tc_data['phase_type']], FORMATTED_PHASES[phase]
                        ])
                        title = f"Failed to generate {phase_data}. "
                        title += "A log of this error has been generated, and we'll work on it soon."
                        title = fill(title, 100)
                        ax.set_title(title, loc='left', fontweight='normal', fontsize=DEFAULT_CHART_FONT)

                    fig.savefig(memory_file, format=IMAGE_MAP[self.file_type], dpi=300)
                    memory_file.seek(0)
                    yield memory_file
