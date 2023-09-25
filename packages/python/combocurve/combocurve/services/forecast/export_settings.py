from typing import Optional, Mapping, List, Union
from datetime import date, datetime
from abc import ABC, abstractmethod
from collections import namedtuple

from dateutil.parser import isoparse

from combocurve.shared.functions import identity

DEFAULT_SERIES = 'best'

X_AXIS_MAP = {
    'time': 'time',
    'relativeTime': 'relative_idx',
    'cumsum_oil': 'cumsum_oil',
    'cumsum_gas': 'cumsum_gas',
    'cumsum_water': 'cumsum_water'
}

WELL_NAME = 'well_name'

DEFAULT_CHART_HEADERS = [
    'api14',
    'first_prod_date_monthly_calc',
    'current_operator_alias',
    'county',
    'perf_lateral_length',
    'total_proppant_per_perforated_interval',
    'total_fluid_per_perforated_interval',
]
DEFAULT_PROJECT_HEADERS = []

Param = namedtuple('Param', ['name', 'convert'])


class ExportSettingsBase(ABC):
    _params: Mapping[str, Param] = {}

    @classmethod
    def from_dict(cls, settings_dict):
        '''Generalized constructor method for all export settings. To use, make sure to name the fields using the
        first entry of Param in each class' _params.
        '''
        constructor_params = {
            p: convert(settings_dict[name])
            for (p, (name, convert)) in cls._params.items() if name in settings_dict
        }
        return cls(**constructor_params)


class DataExportSettings(ExportSettingsBase):

    def __init__(self,
                 include: bool = False,
                 resolution: str = 'monthly',
                 start: Optional[date] = None,
                 end: Optional[date] = None):
        super().__init__()
        self.include = include
        self.resolution = resolution
        self.start = start
        self.end = end

    @property
    @abstractmethod
    def omit_series_in_headers(self):
        pass

    _params: Mapping[str, Param] = {
        **ExportSettingsBase._params,
        'include': Param('include', identity),
        'resolution': Param('resolution', identity),
        'start': Param('start', lambda s: isoparse(s).date()),
        'end': Param('end', lambda e: isoparse(e).date()),
    }


class ProductionExportSettings(DataExportSettings):

    def __init__(self,
                 include: bool = False,
                 resolution: str = 'monthly',
                 start: Optional[date] = None,
                 end: Optional[date] = None,
                 export_pressure: bool = False):
        super().__init__(include, resolution, start, end)
        self.export_pressure = export_pressure

    @property
    def omit_series_in_headers(self):
        return True

    _params = {**DataExportSettings._params, 'export_pressure': Param('exportPressure', identity)}


class ForecastExportSettings(DataExportSettings):

    def __init__(self,
                 include: bool = False,
                 resolution: str = 'monthly',
                 start: Optional[date] = None,
                 end: Optional[date] = None,
                 p_series: Optional[List[str]] = None,
                 merge_with_production: bool = False):
        super().__init__(include, resolution, start, end)
        self.p_series = p_series if p_series else [DEFAULT_SERIES]
        self.merge_with_production = merge_with_production

    @property
    def omit_series_in_headers(self):
        return len(self.p_series) == 1 and self.p_series[0] == DEFAULT_SERIES

    @property
    def p_series_to_include(self):
        return self.p_series if not self.merge_with_production else [DEFAULT_SERIES]

    _params = {
        **DataExportSettings._params,
        'p_series': Param('pSeries', identity),
        'merge_with_production': Param('mergeWithProduction', identity),
    }


class ChartsExportSettings(ExportSettingsBase):

    class DataSettings(ExportSettingsBase):

        def __init__(self,
                     x_axis: str = 'time',
                     daily: Optional[List[str]] = None,
                     forecast: Optional[List[str]] = None,
                     monthly: Optional[List[str]] = None):
            super().__init__()
            self.x_axis = x_axis
            self.monthly = monthly if monthly is not None else ['oil', 'gas', 'water']
            self.daily = daily if daily is not None else []
            self.forecast = forecast if forecast is not None else ['oil', 'gas', 'water']

        _params = {
            **ExportSettingsBase._params,
            'x_axis': Param('xAxis', lambda value: X_AXIS_MAP[value]),
            'monthly': Param('monthly', identity),
            'daily': Param('daily', identity),
            'forecast': Param('forecast', identity),
        }

    class GraphSettings(ExportSettingsBase):

        def __init__(self,
                     enable_legend: bool = True,
                     charts_per_page: int = 4,
                     x_log_scale: bool = False,
                     x_padding: float = 10,
                     y_log_scale: bool = True,
                     y_max: Union[float, str] = 'all',
                     y_max_padding: float = 10,
                     y_min: Union[float, str] = 'all',
                     y_padding: float = 10,
                     chart_resolution: float = 10,
                     years_before_prod_end: Union[int, str] = 'all',
                     years_past_prod_end: Union[int, str] = 'all',
                     cum_min: Union[float, str] = 'all',
                     cum_max: Union[float, str] = 'all'):
            super().__init__()
            self.enable_legend = enable_legend
            self.charts_per_page = charts_per_page
            self.x_log_scale = x_log_scale
            self.x_padding = x_padding
            self.y_log_scale = y_log_scale
            self.y_max = y_max
            self.y_max_padding = y_max_padding
            self.y_min = y_min
            self.y_padding = y_padding
            self.chart_resolution = chart_resolution
            self.years_before_prod_end = years_before_prod_end
            self.years_past_prod_end = years_past_prod_end
            self.cum_min = cum_min
            self.cum_max = cum_max

        _params = {
            **ExportSettingsBase._params,
            'enable_legend': Param('enableLegend', identity),
            'charts_per_page': Param('numOfCharts', identity),
            'x_log_scale': Param('xLogScale', identity),
            'x_padding': Param('xPadding', identity),  # will be ignored for now
            'y_log_scale': Param('yLogScale', identity),
            'y_max': Param('yMax', identity),
            'y_max_padding': Param('yMaxPadding', identity),
            'y_min': Param('yMin', identity),
            'y_padding': Param('yPadding', identity),  # will be ignored for now
            'chart_resolution': Param('chartResolution', identity),  # will be ignored for now
            'years_before_prod_end': Param('yearsBefore', identity),
            'years_past_prod_end': Param('yearsPast', identity),
            'cum_min': Param('cumMin', identity),
            'cum_max': Param('cumMax', identity),
        }

    class AriesSettings(ExportSettingsBase):

        def __init__(
            self,
            include: bool = False,
            start_date: Optional[date] = None,
            selected_id_key: str = 'chosenID',
            seg_end: str = 'years',
            forecast_unit: str = 'per_day',
            forecast_to_life: str = 'no',
            data_resolution: str = 'same_as_forecast',
            include_original_forecast: bool = False,
        ):
            super().__init__()
            self.include = include
            self.start_date = start_date
            self.selected_id_key = selected_id_key
            self.seg_end = seg_end
            self.forecast_unit = forecast_unit
            self.forecast_to_life = forecast_to_life
            self.data_resolution = data_resolution
            self.include_original_forecast = include_original_forecast

        _params: Mapping[str, Param] = {
            **ExportSettingsBase._params,
            'include': Param('include', identity),
            'start_date': Param('startDate', lambda s: s.date() if type(s) is datetime else isoparse(s).date()),
            'selected_id_key': Param('selectedIdKey', identity),
            'seg_end': Param('endingCondition', identity),
            'forecast_unit': Param('forecastUnit', identity),
            'forecast_to_life': Param('toLife', identity),
            'data_resolution': Param('dataResolution', identity),
            'include_original_forecast': Param('includeOriginalForecast', identity),
        }

    def __init__(
        self,
        include: bool = False,
        document_format: str = 'pdf',
        include_parameters: bool = False,
        include_comments: bool = False,
        aries: Optional[AriesSettings] = None,
        headers: Optional[List[str]] = None,
        project_headers: Optional[List[str]] = None,
        data_settings: Optional[DataSettings] = None,
        graph_settings: Optional[GraphSettings] = None,
    ):
        super().__init__()
        self.include = include
        self.document_format = document_format
        self.include_parameters = include_parameters
        self.include_comments = include_comments
        self.aries = aries if aries else self.AriesSettings()
        self.headers = headers if headers is not None else DEFAULT_CHART_HEADERS
        self.project_headers = project_headers if project_headers is not None else DEFAULT_PROJECT_HEADERS
        self.data_settings = data_settings if data_settings else self.DataSettings()
        self.graph_settings = graph_settings if graph_settings else self.GraphSettings()

    @property
    def landscape_orientation(self):
        return not (self.include_parameters or self.aries.include or self.include_comments)

    @property
    def effective_charts_per_page(self):
        return 1 if not self.landscape_orientation else self.graph_settings.charts_per_page

    _params = {
        **ExportSettingsBase._params,
        'include': Param('include', identity),
        'document_format': Param('documentFormat', identity),
        'include_parameters': Param('includeParameters', identity),
        'include_comments': Param('includeComments', identity),
        'headers': Param('headers', identity),
        'project_headers': Param('projectHeaders', identity),
        'data_settings': Param('dataSettings', DataSettings.from_dict),
        'graph_settings': Param('graphSettings', GraphSettings.from_dict),
        'aries': Param('aries', AriesSettings.from_dict),
    }

    def to_production_settings(self, resolution):
        return ProductionExportSettings(include=True, resolution=resolution)

    def to_forecast_settings(self, resolution):
        return ForecastExportSettings(include=True, resolution=resolution)
