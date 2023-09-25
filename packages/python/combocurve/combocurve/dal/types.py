from google.protobuf.field_mask_pb2 import FieldMask
from google.protobuf.timestamp_pb2 import Timestamp
from typing import List
from datetime import date, datetime, timedelta
from combocurve.science.econ.general_functions import py_date_to_index

EPOCH_TIME = date(1970, 1, 1)
EPOCH_INDEX = py_date_to_index(EPOCH_TIME)
UNUSED_FIELDS = ['DESCRIPTOR', '__module__', '__slots__', '__doc__', 'field_mask']


def to_field_mask(fields: List[str]) -> FieldMask:
    return FieldMask(paths=fields)


def to_index_from_timestamp(timestamp: Timestamp) -> int:
    return int((timestamp.seconds / 86400)) + EPOCH_INDEX


def to_timestamp_from_index(index: int) -> Timestamp:
    return Timestamp(seconds=(index - EPOCH_INDEX) * 86400, nanos=0)


def to_timestamp(date: date) -> Timestamp:
    seconds = int((date - EPOCH_TIME) / timedelta(seconds=1))
    return Timestamp(seconds=seconds, nanos=0)


def to_timestamp_from_str(datetime_str: str) -> Timestamp:
    date = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%SZ').date()
    return to_timestamp(date)
