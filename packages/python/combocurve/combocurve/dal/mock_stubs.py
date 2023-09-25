from typing import List
from datetime import date
from collections.abc import Iterable
from combocurve.services.production.helpers import get_production_pipeline
from combocurve.services.cc_to_aries.query_helper import index_to_date
from combocurve.dal.stubs import capture
from combocurve.dal.v1.monthly_production_pb2 import (MonthlyProductionServiceFetchResponse,
                                                      MonthlyProductionServiceFetchByWellResponse)
from combocurve.dal.v1.daily_production_pb2 import (DailyProductionServiceFetchResponse,
                                                    DailyProductionServiceFetchByWellResponse)
from typing import Union
from combocurve.dal.types import to_timestamp_from_index, to_timestamp
import numpy as np
from itertools import groupby


def fetch_by_well_from_production_collection(
    production_collection,
    response_class: Union[DailyProductionServiceFetchByWellResponse, MonthlyProductionServiceFetchByWellResponse],
    field_mask: List[str] = None,
    wells: List[str] = None,
    start_date: date = None,
    end_date: date = None,
    only_physical_wells: bool = None,
):
    pipeline = get_production_pipeline(wells)[:2]
    pipeline.append({'$sort': {'well': 1, 'index': 1}})
    production = list(production_collection.aggregate(pipeline))

    production_response_by_well = []
    for well, well_group in groupby(production, key=lambda x: x['well']):
        well_response_args = {'well': str(well), 'date': [], 'oil': [], 'gas': [], 'water': []}
        for well_data in well_group:
            # select only the non-null values
            mask = ~(np.array(well_data['index']) == None)  # noqa
            date = [to_timestamp_from_index(index) for index in np.array(well_data['index'])[mask]]
            oil = list(np.array(well_data['oil'])[mask])
            gas = list(np.array(well_data['gas'])[mask])
            water = list(np.array(well_data['water'])[mask])

            well_response_args['date'] += date
            well_response_args['oil'] += oil
            well_response_args['gas'] += gas
            well_response_args['water'] += water

        production_response_by_well.append(response_class(**well_response_args))
    return production_response_by_well


def fetch_from_production_collection(
    production_collection,
    response_class: Union[DailyProductionServiceFetchResponse, MonthlyProductionServiceFetchResponse],
    field_mask: List[str] = None,
    wells: List[str] = None,
    start_date: date = None,
    end_date: date = None,
    only_physical_wells: bool = None,
):

    pipeline = get_production_pipeline(wells)[:2]
    pipeline.append({'$sort': {'well': 1, 'index': 1}})
    production = list(production_collection.aggregate(pipeline))

    def construct_response(data):
        well_id = str(data['well'])
        responses = []
        for index, oil, gas, water in zip(data['index'], data['oil'], data['gas'], data['water']):
            production = {
                'well': well_id,
                'date': to_timestamp(index_to_date(index)) if index else None,
                'oil': oil,
                'gas': gas,
                'water': water
            }
            responses.append(response_class(**production))
        return responses

    production = list(map(lambda data: construct_response(data), production))

    return [item for sublist in production for item in sublist]  # flatten the lists of fetch responses


class DailyProduction:
    def __init__(self, production_collection):
        self.production_collection = production_collection

    @capture
    def fetch(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> Iterable:
        kwargs: dict = capture.vars
        return fetch_from_production_collection(self.production_collection, DailyProductionServiceFetchResponse,
                                                **kwargs)

    @capture
    def fetch_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> Iterable:
        kwargs: dict = capture.vars
        return fetch_by_well_from_production_collection(self.production_collection,
                                                        DailyProductionServiceFetchByWellResponse, **kwargs)


class MonthlyProduction:
    def __init__(self, production_collection):
        self.production_collection = production_collection

    @capture
    def fetch(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> Iterable:
        kwargs: dict = capture.vars
        return fetch_from_production_collection(self.production_collection, MonthlyProductionServiceFetchResponse,
                                                **kwargs)

    @capture
    def fetch_by_well(
        self,
        *,
        field_mask: List[str] = None,
        wells: List[str] = None,
        start_date: date = None,
        end_date: date = None,
        only_physical_wells: bool = None,
    ) -> Iterable:
        kwargs: dict = capture.vars
        return fetch_by_well_from_production_collection(self.production_collection,
                                                        MonthlyProductionServiceFetchByWellResponse, **kwargs)
