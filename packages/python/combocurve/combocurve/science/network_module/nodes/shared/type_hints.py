from bson import ObjectId
from typing import TypedDict, List, Union, Dict
import numpy as np
import numpy.typing as npt


class WellGroupInputStream(TypedDict):
    well_id: str


MonthlyFrequencyDatetime64dNDArray = npt.NDArray[np.datetime64]
MonthlyFrequencyDatetime64mNDArray = npt.NDArray[np.datetime64]

Float64NDArray = npt.NDArray[np.float64]
Int32NDArray = npt.NDArray[np.int32]


class Stream(TypedDict):
    well_id: str
    by: str
    fluid_model: dict  ## can be improved later
    date: MonthlyFrequencyDatetime64dNDArray
    value: Float64NDArray


class StreamDateAndValue(TypedDict):
    date: MonthlyFrequencyDatetime64dNDArray
    value: Float64NDArray


Float_Or_StreamDateAndValue = Union[float, StreamDateAndValue]

OptionalStreamDateAndValue = Union[StreamDateAndValue, None]

## key is the fluid_model ObjectId, or 'default'
StreamDataPerFluidModel = Dict[Union[str, ObjectId], StreamDateAndValue]

## key is the edge['id']
EdgeDataMap = Dict[str, StreamDataPerFluidModel]


## TODO: change this in future
class AllocationColumn(TypedDict):
    key: str
    value: Union[Union[str, List[str]], Union[float, List[float]]]


class EdgeParams(TypedDict):
    criteria: str
    time_series: List[AllocationColumn]


Edge = TypedDict(
    'Edge', {
        'from': str,
        'fromHandle': str,
        'fromFacilityObjectId': str,
        'to': str,
        'toHandle': str,
        'toFacilityObjectId': str,
        'by': str,
        'allocation_ratio': float,
        'params': EdgeParams
    })


class BaseNode(TypedDict):
    id: str
    type: str
    params: dict
    name: str
    referenceId: str
