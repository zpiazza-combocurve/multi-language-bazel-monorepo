import os
from grpc import Channel

from combocurve.common.v1.date_range_pb2 import DateRange
from combocurve.dal.v1.daily_production_pb2_grpc import DailyProductionServiceStub
from combocurve.dal.v1.monthly_production_pb2_grpc import MonthlyProductionServiceStub

from combocurve.dal.v1.daily_production_pb2 import (
    DailyProductionServiceUpsertRequest,
    DailyProductionServiceFetchRequest,
    DailyProductionServiceSumByWellRequest,
    DailyProductionServiceDeleteByProjectRequest,
    DailyProductionServiceDeleteByWellRequest,
    DailyProductionServiceDeleteByManyWellsRequest,
    DailyProductionServiceUpsertResponse,
    DailyProductionServiceFetchResponse,
    DailyProductionServiceSumByWellResponse,
    DailyProductionServiceDeleteByProjectResponse,
    DailyProductionServiceDeleteByWellResponse,
    DailyProductionServiceDeleteByManyWellsResponse,
    DailyProductionServiceCountByWellRequest,
    DailyProductionServiceCountByWellResponse,
    DailyProductionServiceFetchByWellRequest,
    DailyProductionServiceFetchByWellResponse,
)
from combocurve.dal.v1.monthly_production_pb2 import (
    MonthlyProductionServiceUpsertRequest,
    MonthlyProductionServiceFetchRequest,
    MonthlyProductionServiceSumByWellRequest,
    MonthlyProductionServiceDeleteByProjectRequest,
    MonthlyProductionServiceDeleteByWellRequest,
    MonthlyProductionServiceDeleteByManyWellsRequest,
    MonthlyProductionServiceUpsertResponse,
    MonthlyProductionServiceFetchResponse,
    MonthlyProductionServiceSumByWellResponse,
    MonthlyProductionServiceDeleteByProjectResponse,
    MonthlyProductionServiceDeleteByWellResponse,
    MonthlyProductionServiceDeleteByManyWellsResponse,
    MonthlyProductionServiceCountByWellRequest,
    MonthlyProductionServiceCountByWellResponse,
    MonthlyProductionServiceFetchByWellRequest,
    MonthlyProductionServiceFetchByWellResponse,
)

from combocurve.dal.types import to_field_mask, to_timestamp, to_index_from_timestamp, UNUSED_FIELDS
from typing import Callable, List, Union
from datetime import date
from collections.abc import Iterable
from bson import ObjectId
from combocurve.shared.constants import PHASES

import pickle

__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
with open(os.path.join(__location__, 'field_masks.pickle'), 'rb') as f:
    DEFAULT_FILED_MASKS = pickle.load(f)


def production_from_response(well_response: Union[DailyProductionServiceFetchByWellResponse,
                                                  MonthlyProductionServiceFetchByWellResponse],
                             field_list: List[str] = PHASES):
    well_data = {}
    well_id = ObjectId(getattr(well_response, 'well'))
    well_data['_id'] = well_id
    well_data['index'] = list(map(lambda x: to_index_from_timestamp(x), getattr(well_response, 'date')))
    for field in field_list:
        well_data[field] = getattr(well_response, field)
    return well_data


def fields_from_class(cls) -> List[str]:
    return list(set(cls.__dict__.keys()) - set(UNUSED_FIELDS))


def create_field_masks(class_list: List[object]) -> None:
    class_fields = {}
    for cls in class_list:
        class_fields[cls.__name__] = fields_from_class(cls)

    # output the field masks as pickle file
    with open('combocurve/dal/field_masks.pickle', 'wb') as f:
        pickle.dump(class_fields, f)


def capture(f: Callable) -> Callable:
    '''
    decorator to save the keyword inputs as a dictionary for later access
    from https://stackoverflow.com/questions/69396985/
    '''
    capture.vars = {}

    def inner(*args, **kwargs):
        capture.vars = kwargs
        return f(*args, **kwargs)

    return inner


class DailyProduction:
    daily_production_stub: DailyProductionServiceStub

    def __init__(self, channel: Channel):
        self.daily_production_stub = DailyProductionServiceStub(channel)

    @staticmethod
    @capture
    def to_upsert_request(
        *,
        field_mask: List[str] = None,
        well: str,
        date: date,
        project: str = None,
        bottom_hole_pressure: float = None,
        casing_head_pressure: float = None,
        choke: float = None,
        co2_injection: float = None,
        flowline_pressure: float = None,
        gas: float = None,
        gas_injection: float = None,
        gas_lift_injection_pressure: float = None,
        hours_on: float = None,
        ngl: float = None,
        oil: float = None,
        steam_injection: float = None,
        tubing_head_pressure: float = None,
        vessel_separator_pressure: float = None,
        water: float = None,
        water_injection: float = None,
        custom_number_0: float = None,
        custom_number_1: float = None,
        custom_number_2: float = None,
        custom_number_3: float = None,
        custom_number_4: float = None,
        operational_tag: str = None,
    ) -> DailyProductionServiceUpsertRequest:
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[DailyProductionServiceUpsertRequest.__name__]
        kwargs['field_mask'] = to_field_mask(field_mask)
        if date:
            kwargs['date'] = to_timestamp(date)
        request = DailyProductionServiceUpsertRequest(**kwargs)
        return request

    def upsert(self, requests: Iterable[DailyProductionServiceUpsertRequest]) -> DailyProductionServiceUpsertResponse:
        return self.daily_production_stub.Upsert(requests)

    @capture
    def fetch(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> DailyProductionServiceFetchResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[DailyProductionServiceFetchResponse.__name__]
        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.daily_production_stub.Fetch(DailyProductionServiceFetchRequest(**kwargs))

    @capture
    def fetch_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> DailyProductionServiceFetchByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[DailyProductionServiceFetchByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.daily_production_stub.FetchByWell(DailyProductionServiceFetchByWellRequest(**kwargs))

    @capture
    def sum_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> DailyProductionServiceSumByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[DailyProductionServiceSumByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.daily_production_stub.SumByWell(DailyProductionServiceSumByWellRequest(**kwargs))

    @capture
    def count_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> DailyProductionServiceCountByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[DailyProductionServiceCountByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.daily_production_stub.CountByWell(DailyProductionServiceCountByWellRequest(**kwargs))

    @capture
    def delete_by_project(self, *, project: str) -> DailyProductionServiceDeleteByProjectResponse:
        kwargs: dict = capture.vars
        return self.daily_production_stub.DeleteByProject(DailyProductionServiceDeleteByProjectRequest(**kwargs))

    @capture
    def delete_by_well(
        self,
        *,
        well: str,
        start_date: date = None,
        end_date: date = None,
    ) -> DailyProductionServiceDeleteByWellResponse:
        kwargs: dict = capture.vars
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.daily_production_stub.DeleteByWell(DailyProductionServiceDeleteByWellRequest(**kwargs))

    @capture
    def delete_by_many_wells(self, *, wells: List[str] = None) -> DailyProductionServiceDeleteByManyWellsResponse:
        if not wells:
            return
        kwargs: dict = capture.vars
        return self.daily_production_stub.DeleteByManyWells(DailyProductionServiceDeleteByManyWellsRequest(**kwargs))


class MonthlyProduction:
    monthly_production_stub: MonthlyProductionServiceStub

    def __init__(self, channel: Channel):
        self.monthly_production_stub = MonthlyProductionServiceStub(channel)

    @staticmethod
    @capture
    def to_upsert_request(
        *,
        field_mask: List[str] = None,
        well: str,
        date: date,
        project: str = None,
        choke: float = None,
        co2_injection: float = None,
        days_on: float = None,
        gas: float = None,
        gas_injection: float = None,
        ngl: float = None,
        oil: float = None,
        steam_injection: float = None,
        water: float = None,
        water_injection: float = None,
        custom_number_0: float = None,
        custom_number_1: float = None,
        custom_number_2: float = None,
        custom_number_3: float = None,
        custom_number_4: float = None,
        operational_tag: str = None,
    ) -> MonthlyProductionServiceUpsertRequest:
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[MonthlyProductionServiceUpsertRequest.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if date:
            kwargs['date'] = to_timestamp(date)
        request = MonthlyProductionServiceUpsertRequest(**kwargs)
        return request

    def upsert(
        self,
        requests: Iterable[MonthlyProductionServiceUpsertRequest],
    ) -> MonthlyProductionServiceUpsertResponse:
        return self.monthly_production_stub.Upsert(requests)

    @capture
    def fetch(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> MonthlyProductionServiceFetchResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[MonthlyProductionServiceFetchResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))

        return self.monthly_production_stub.Fetch(MonthlyProductionServiceFetchRequest(**kwargs))

    @capture
    def fetch_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> MonthlyProductionServiceFetchByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[MonthlyProductionServiceFetchByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.monthly_production_stub.FetchByWell(MonthlyProductionServiceFetchByWellRequest(**kwargs))

    @capture
    def sum_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> MonthlyProductionServiceSumByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[MonthlyProductionServiceSumByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.monthly_production_stub.SumByWell(MonthlyProductionServiceSumByWellRequest(**kwargs))

    @capture
    def count_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> MonthlyProductionServiceCountByWellResponse:
        if not wells:
            return []
        kwargs: dict = capture.vars
        if not field_mask:
            field_mask = DEFAULT_FILED_MASKS[MonthlyProductionServiceCountByWellResponse.__name__]

        kwargs['field_mask'] = to_field_mask(field_mask)
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.monthly_production_stub.CountByWell(MonthlyProductionServiceCountByWellRequest(**kwargs))

    @capture
    def delete_by_project(self, *, project: str) -> MonthlyProductionServiceDeleteByProjectResponse:
        kwargs: dict = capture.vars
        return self.monthly_production_stub.DeleteByProject(MonthlyProductionServiceDeleteByProjectRequest(**kwargs))

    @capture
    def delete_by_well(
        self,
        *,
        well: str,
        start_date: date = None,
        end_date: date = None,
    ) -> MonthlyProductionServiceDeleteByWellResponse:
        kwargs: dict = capture.vars
        if start_date and end_date:
            kwargs['date_range'] = DateRange(start_date=to_timestamp(kwargs.pop('start_date')),
                                             end_date=to_timestamp(kwargs.pop('end_date')))
        return self.monthly_production_stub.DeleteByWell(MonthlyProductionServiceDeleteByWellRequest(**kwargs))

    @capture
    def delete_by_many_wells(self, *, wells: List[str] = None) -> MonthlyProductionServiceDeleteByManyWellsResponse:
        if not wells:
            return
        kwargs: dict = capture.vars
        return self.monthly_production_stub.DeleteByManyWells(
            MonthlyProductionServiceDeleteByManyWellsRequest(**kwargs))
