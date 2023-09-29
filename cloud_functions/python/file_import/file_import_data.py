from collections.abc import Iterable, Mapping, Sequence
from functools import cached_property

from cloud_functions.file_import.common import HEADERS_KEY, MONTHLY_KEY, DAILY_KEY, SURVEY_KEY
from combocurve.services.data_import.import_data import ImportData, ImportDataRow, WellDataRow, DataSettings


def _get_dict(headers: Sequence[str], row: Sequence):
    return {headers[i]: row[i] for i in range(min(len(headers), len(row)))}


class FileImportWellDataRow(WellDataRow):
    def __init__(self, headers: Sequence[str], row: Sequence):
        super().__init__()
        self._headers = headers
        self._row = row

    def get_dict(self):
        return _get_dict(self._headers, self._row)


class FileImportDataRow(ImportDataRow):
    def __init__(self, headers: Mapping[str, Sequence], row: Mapping[str, Sequence]):
        super().__init__()
        self._headers = headers
        self._row = row

    def get_headers_dict(self):
        return _get_dict(self._headers[HEADERS_KEY], self._row[HEADERS_KEY])

    def _get_well_data_rows(self, key: str):
        return [FileImportWellDataRow(self._headers[key], r) for r in self._row.get(key, [])]

    @cached_property
    def monthly_rows(self):
        return self._get_well_data_rows(MONTHLY_KEY)

    @cached_property
    def daily_rows(self):
        return self._get_well_data_rows(DAILY_KEY)

    @cached_property
    def survey_rows(self):
        return self._get_well_data_rows(SURVEY_KEY)

    def get_monthly_rows(self):
        return self.monthly_rows

    def get_daily_rows(self):
        return self.daily_rows

    def get_survey_rows(self):
        return self.survey_rows


class FileImportData(ImportData):
    def __init__(self, headers: Mapping, rows: Iterable[Mapping], data_settings: DataSettings, extra_data: Mapping):
        super().__init__()
        self._headers = headers
        self._rows = rows
        self._data_settings = data_settings
        self._extra_data = extra_data

    @cached_property
    def rows(self) -> Iterable[ImportDataRow]:
        return [FileImportDataRow(self._headers, r) for r in self._rows]

    @property
    def data_settings(self):
        return self._data_settings

    @property
    def extra_data(self):
        return self._extra_data
