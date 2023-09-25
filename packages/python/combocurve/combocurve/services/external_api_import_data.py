from collections.abc import Iterable, Mapping
from functools import cached_property

from combocurve.shared.date import date_from_index
from combocurve.services.data_import.import_data import ImportData, ImportDataRow, WellDataRow, DataSettings


class ApiWellsImportDataRow(ImportDataRow):
    def __init__(self, well: Mapping):
        super().__init__()
        self._well = well

    def get_headers_dict(self):
        return self._well

    def get_monthly_rows(self):
        return []

    def get_daily_rows(self):
        return []

    def get_survey_rows(self):
        return []


class ApiWellsImportData(ImportData):
    def __init__(self, wells: Iterable[Mapping], data_settings: DataSettings, extra_data: Mapping):
        super().__init__()
        self._wells = wells
        self._data_settings = data_settings
        self._extra_data = extra_data

    @cached_property
    def rows(self) -> Iterable[ImportDataRow]:
        return [ApiWellsImportDataRow(w) for w in self._wells]

    @property
    def data_settings(self):
        return self._data_settings

    @property
    def extra_data(self):
        return self._extra_data


class ApiProdImportWellDataRow(WellDataRow):
    def __init__(self, row: Mapping):
        super().__init__()
        self._row = row

    def get_dict(self):
        return {**self._row, 'date': date_from_index(self._row['index']).isoformat()}


class ApiProdImportDataRow(ImportDataRow):
    def __init__(self, well_id: str, data: Iterable[Mapping], data_kind: str):
        super().__init__()
        self._well_id = well_id
        self._data = data
        self._data_kind = data_kind

    def get_headers_dict(self):
        return {'_id': self._well_id}

    def _get_well_data_rows(self, data_kind: str):
        return [ApiProdImportWellDataRow(row) for row in self._data] if data_kind == self._data_kind else []

    @cached_property
    def monthly_rows(self):
        return self._get_well_data_rows('monthly')

    @cached_property
    def daily_rows(self):
        return self._get_well_data_rows('daily')

    def get_monthly_rows(self):
        return self.monthly_rows

    def get_daily_rows(self):
        return self.daily_rows

    def get_survey_rows(self):
        return []


class ApiProdImportData(ImportData):
    def __init__(self, data: Mapping[str, Iterable[Mapping]], data_kind: str, data_settings: DataSettings):
        super().__init__()
        self._data = data
        self._data_kind = data_kind
        self._data_settings = data_settings

    @cached_property
    def rows(self) -> Iterable[ImportDataRow]:
        return [ApiProdImportDataRow(w, data, self._data_kind) for w, data in self._data.items()]

    @property
    def data_settings(self):
        return self._data_settings

    @property
    def extra_data(self):
        return {}
    
class ApiSurveyDataRow(WellDataRow):
    def __init__(self, row):
        super().__init__()
        self._row = row

    def get_dict(self):
        return self._row

class ApiDSImportDataRow(ImportDataRow):
    def __init__(self, survey: Mapping, well_id: str):
        super().__init__()
        self._survey = survey
        self.well_id = well_id

    def get_headers_dict(self):
        return {'_id': self.well_id}

    def get_monthly_rows(self):
        return []

    def get_daily_rows(self):
        return []

    def get_survey_rows(self):
        measuredDepth = self._survey['measuredDepth']
        if not measuredDepth:
            return []
        
        # The external API ensures all arrays are the same length

        output = []
        for index, _ in enumerate(measuredDepth):
            output.append(ApiSurveyDataRow({
                'well': self._survey['well'],
                'measuredDepth': self._survey['measuredDepth'][index],
                'trueVerticalDepth': self._survey['trueVerticalDepth'][index],
                'azimuth': self._survey['azimuth'][index],
                'inclination': self._survey['inclination'][index],
                'deviationEW': self._survey['deviationEW'][index],
                'deviationNS': self._survey['deviationNS'][index],
                'latitude': self._survey['latitude'][index],
                'longitude': self._survey['longitude'][index],
            }))

        return output

class ApiDSImportData(ImportData):
    def __init__(self, well_id: str, survey: Mapping, data_settings: DataSettings):
        super().__init__()
        self._well_id = well_id
        self._survey = survey
        self._data_settings = data_settings

    @cached_property
    def rows(self) -> Iterable[ImportDataRow]:
        return [ApiDSImportDataRow(self._survey, self._well_id)]

    @property
    def data_settings(self):
        return self._data_settings

    @property
    def extra_data(self):
        return {}
