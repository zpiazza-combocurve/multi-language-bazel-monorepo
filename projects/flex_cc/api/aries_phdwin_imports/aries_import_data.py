from collections.abc import Iterable, Mapping, Sequence
from functools import cached_property

import pandas as pd

from api.aries_phdwin_imports.helpers import get_rows
from combocurve.services.data_import.import_data import ImportData, ImportDataRow, WellDataRow, DataSettings


def _get_dict(headers: Sequence[str], row: Sequence):
    return {headers[i]: row[i] for i in range(min(len(headers), len(row)))}


class AriesImportWellDataRow(WellDataRow):
    def __init__(self, data: Mapping):
        super().__init__()
        self._data = data

    def get_dict(self):
        return self._data


class AriesImportDataRow(ImportDataRow):
    def __init__(self, well: Mapping, monthly_data: pd.DataFrame, daily_data: pd.DataFrame):
        super().__init__()
        self._well = well
        self._monthly_data = monthly_data
        self._daily_data = daily_data

    def get_headers_dict(self):
        return self._well

    @cached_property
    def monthly_rows(self):
        return [AriesImportWellDataRow(r) for r in get_rows(self._well, self._monthly_data)]

    @cached_property
    def daily_rows(self):
        return [AriesImportWellDataRow(r) for r in get_rows(self._well, self._daily_data)]

    def get_monthly_rows(self):
        return self.monthly_rows

    def get_daily_rows(self):
        return self.daily_rows

    def get_survey_rows(self):
        return []


class AriesImportData(ImportData):
    def __init__(self, wells: Iterable[Mapping], monthly_data: pd.DataFrame, daily_data: pd.DataFrame,
                 data_settings: DataSettings):
        super().__init__()
        self._rows = (AriesImportDataRow(w, monthly_data, daily_data) for w in wells)
        self._data_settings = data_settings

    @property
    def rows(self) -> Iterable[ImportDataRow]:
        return self._rows

    @property
    def data_settings(self):
        return self._data_settings

    @property
    def extra_data(self):
        return {}
