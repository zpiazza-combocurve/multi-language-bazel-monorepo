from typing import List, Optional
from pydantic import BaseModel


class hybridOptions(BaseModel):
    yearType: Optional[str]  # calendar | fiscal
    months: Optional[int]


class CashFlowReport(BaseModel):
    type: str  # monthly | yearly | hybrid
    timePeriods: Optional[int]
    hybridOptions: Optional[hybridOptions]
    useTimePeriods: Optional[bool]


class SortingOptions(BaseModel):
    priority: int
    direction: str


class Column(BaseModel):
    key: str
    label: str
    selected: bool
    keyType: str  # 'header' | 'column'
    sortingOptions: Optional[SortingOptions]


class CSVExportRequestModel(BaseModel):
    econRun: str
    timeZone: str
    userId: str
    notificationId: str
    fileName: str
    reportType: str
    cashFlowReport: Optional[CashFlowReport] = None
    columns: List[Column]
    project: str
