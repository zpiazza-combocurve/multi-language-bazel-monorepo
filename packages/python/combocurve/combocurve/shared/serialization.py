from datetime import date, datetime
from typing import TypeVar

from bson import ObjectId
import numpy as np

T = TypeVar('T')


# This is copied from combocurve.shared.date. Moving  it here massively
# reduces the dependencies of this utility function.
def py_date_to_str_with_time_zone(py_date: datetime):
    return py_date.strftime('%Y-%m-%dT%H:%M:%S.%fZ')


def make_serializable(x: T) -> T:
    '''
        Recursively ensure that an object is JSON serializable.

        Args:
            x: object to fix
        Returns:
            object of similar shape to x, but serializable.
        '''
    if type(x) == dict:
        return {k: make_serializable(v) for k, v in x.items()}
    elif type(x) in (np.ndarray, list, set, tuple):
        return [make_serializable(y) for y in list(x)]
    elif type(x) == ObjectId:
        return str(x)
    elif type(x) in (date, datetime):
        return py_date_to_str_with_time_zone(x)
    elif type(x) in (str, ):
        return x
    elif x is None or np.isnan(x):
        return None
    elif isinstance(x, np.signedinteger):
        return int(x)
    elif isinstance(x, np.floating):
        return float(x)
    else:
        return x
