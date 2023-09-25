from typing import Optional
from abc import ABC, abstractmethod
from collections.abc import Mapping, Iterable, Collection
from dataclasses import dataclass


@dataclass(frozen=True)
class DataSettings:
    data_source: Optional[str]
    project: Optional[str]
    id: str = 'chosenID'
    coordinate_reference_system: str = 'WGS84'


class WellDataRow(ABC):
    @abstractmethod
    def get_dict(self) -> Mapping:
        pass


class ImportDataRow(ABC):
    @abstractmethod
    def get_headers_dict(self) -> Mapping:
        pass

    @abstractmethod
    def get_monthly_rows(self) -> Collection[WellDataRow]:
        pass

    @abstractmethod
    def get_daily_rows(self) -> Collection[WellDataRow]:
        pass

    @abstractmethod
    def get_survey_rows(self) -> Collection[WellDataRow]:
        pass


class ImportData(ABC):
    @property
    @abstractmethod
    def rows(self) -> Iterable[ImportDataRow]:
        pass

    @property
    @abstractmethod
    def data_settings(self) -> DataSettings:
        pass

    @property
    @abstractmethod
    def extra_data(self) -> Mapping:
        pass
