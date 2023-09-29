import json
from typing import TYPE_CHECKING
from collections.abc import Iterable, Mapping
from functools import cached_property

from api.aries_phdwin_imports.helpers import format_well_header_col
from combocurve.shared.phdwin_import_constants import PhdHeaderCols, daily_prod_col_headers
from combocurve.services.data_import.import_data import ImportData, ImportDataRow, WellDataRow, DataSettings

if TYPE_CHECKING:
    from api.aries_phdwin_imports.phd_extract import PHDWinDataExtraction


class PhdwinImportWellDataRow(WellDataRow):
    def __init__(self, data: Mapping):
        super().__init__()
        self._data = data

    def get_dict(self):
        return self._data


class PhdwinImportDataRow(ImportDataRow):
    def __init__(self, well: Mapping, data_extraction: 'PHDWinDataExtraction'):
        super().__init__()
        self._well = well
        self._data_extraction = data_extraction

    def get_headers_dict(self):
        return self._well

    @cached_property
    def monthly_rows(self):
        if self._data_extraction.well_monthly_data.empty:
            return []
        lse_id = int(self._well['lease_number'])
        monthly_prod_data = self._data_extraction.well_monthly_data[
            self._data_extraction.well_monthly_data['lease_number'] == lse_id]
        if monthly_prod_data.empty:
            return []

        # convert pd DataFrame to list of dictionaries
        json_str = monthly_prod_data.to_json(orient='records')
        monthly_prod_list = json.loads(json_str)
        for doc in monthly_prod_list:
            doc['chosenID'] = doc.get('phdwin_id')
        return [PhdwinImportWellDataRow(doc) for doc in monthly_prod_list]

    @cached_property
    def daily_rows(self):
        if self._data_extraction.well_daily_data.empty:
            return []
        lse_id = int(self._well['lease_number'])
        daily_prod_data = self._data_extraction.well_daily_data[self._data_extraction.well_daily_data[
            PhdHeaderCols.lse_id.value] == lse_id]
        if daily_prod_data.empty:
            return []

        # format daily prod_data
        daily_prod_data = daily_prod_data.sort_values(PhdHeaderCols.index.value)
        daily_prod_data = daily_prod_data.filter(items=daily_prod_col_headers)
        daily_prod_data.columns = format_well_header_col(daily_prod_data.columns)
        daily_prod_data = self._data_extraction.remove_date_after_eop_before_sop(lse_id, daily_prod_data)

        # convert pd DataFrame to list of dictionaries
        json_str = daily_prod_data.to_json(orient='records')
        daily_prod_list = json.loads(json_str)
        for doc in daily_prod_list:
            doc['chosenID'] = doc.get('phdwin_id')
        return [PhdwinImportWellDataRow(doc) for doc in daily_prod_list]

    def get_monthly_rows(self):
        return self.monthly_rows

    def get_daily_rows(self):
        return self.daily_rows

    def get_survey_rows(self):
        return []


class PhdwinImportData(ImportData):
    def __init__(self, wells: Iterable[Mapping], data_extraction: 'PHDWinDataExtraction', data_settings: DataSettings):
        super().__init__()
        self._rows = (PhdwinImportDataRow(w, data_extraction) for w in wells)
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
