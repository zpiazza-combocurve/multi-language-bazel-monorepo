from datetime import date, datetime
from typing import TYPE_CHECKING, Union
from bson.objectid import ObjectId
from pymongo import UpdateOne, UpdateMany
from combocurve.dal.fields import (DAILY_MONGO_TO_PROTO_MAPPING, DAILY_NUMERIC_PHASE_FIELDS,
                                   MONTHLY_MONGO_TO_PROTO_MAPPING, MONTHLY_NUMERIC_PHASE_FIELDS)
from combocurve.dal.stubs import DailyProduction, MonthlyProduction
from combocurve.dal.v1.daily_production_pb2 import DailyProductionServiceFetchByWellResponse
from combocurve.dal.v1.monthly_production_pb2 import MonthlyProductionServiceFetchByWellResponse
from combocurve.shared.date import date_from_timestamp

from combocurve.shared.db_import import bulkwrite_operation
import numpy as np

if TYPE_CHECKING:
    from cloud_functions.remove_leading_zeros.context import RemoveLeadingZerosContext

DAILY_NUMERIC_FIELDS = [DAILY_MONGO_TO_PROTO_MAPPING[f] for f in DAILY_NUMERIC_PHASE_FIELDS]
MONTHLY_NUMERIC_FIELDS = [MONTHLY_MONGO_TO_PROTO_MAPPING[f] for f in MONTHLY_NUMERIC_PHASE_FIELDS]


class RemoveLeadingZeroService(object):
    def __init__(self, context: 'RemoveLeadingZerosContext'):
        self.context = context

    def remove_leading_zeros(self, well_ids: list[str], production_type: str):
        if production_type == 'monthly':
            service, numeric_fields = (self.context.dal.monthly_production, MONTHLY_NUMERIC_FIELDS)
        elif production_type == 'daily':
            service, numeric_fields = (self.context.dal.daily_production, DAILY_NUMERIC_FIELDS)
        else:
            raise ValueError(f'Invalid production type: {production_type}')

        zero_ranges, first_prods = self._get_zero_ranges_by_well(well_ids, service, numeric_fields)
        no_nonzero_wells = list(set(well_ids) - set(first_prods.keys()))
        self._update_well_headers(first_prods, no_nonzero_wells, production_type)
        self._update_zero_ranges(zero_ranges, service)

    @staticmethod
    def _get_zero_ranges_by_well(
        well_ids: list[str],
        service: Union[MonthlyProduction, DailyProduction],
        numeric_fields: list[str],
    ):
        zero_ranges = {}
        first_prods = {}

        well_response: Union[MonthlyProductionServiceFetchByWellResponse, DailyProductionServiceFetchByWellResponse]
        for well_response in service.fetch_by_well(wells=well_ids):
            well = well_response.well
            well_data = np.array([getattr(well_response, field) for field in numeric_fields], dtype=float)
            no_data_mask = (well_data == 0) | np.isnan(well_data)
            first_prod_index = np.all(no_data_mask, axis=1).argmin()
            last_zero_timestamp = well_response.date[first_prod_index - 1].seconds if first_prod_index > 0 else None
            if first_prod_index == 0 and np.all(no_data_mask):
                # There was _no_ production found
                first_prod_index = None
                last_zero_timestamp = well_response.date[-1].seconds
            if first_prod_index is not None:
                first_prods[well] = datetime.utcfromtimestamp(well_response.date[first_prod_index].seconds)
            if last_zero_timestamp is not None:
                zero_ranges[well] = [date(1900, 1, 1), date_from_timestamp(last_zero_timestamp)]

        return zero_ranges, first_prods

    @staticmethod
    def _update_zero_ranges(
        zero_ranges: dict[str, list[date]],
        service: Union[MonthlyProduction, DailyProduction],
    ):
        for well, range in zero_ranges.items():
            service.delete_by_well(
                well=well,
                start_date=range[0],
                end_date=range[1],
            )

    def _update_well_headers(
        self,
        first_prods: dict[str, datetime],
        no_nonzero_wells: list[str],
        production_type,
    ):
        has_production_field = f'has_{production_type}'
        first_prod_date_field = f'first_prod_date_{production_type}_calc'
        last_prod_date_field = f'last_prod_date_{production_type}'

        update_well_headers_operations = [
            UpdateOne({
                '_id': ObjectId(well_id),
            }, {'$set': {
                has_production_field: True,
                first_prod_date_field: date_
            }}) for well_id, date_ in first_prods.items()
        ]
        update_well_headers_operations.append(
            UpdateMany({'_id': {
                '$in': list(map(ObjectId, no_nonzero_wells))
            }}, {'$set': {
                has_production_field: False,
                first_prod_date_field: None,
                last_prod_date_field: None
            }}))
        return bulkwrite_operation(self.context.wells_collection,
                                   update_well_headers_operations) if update_well_headers_operations else None
