import numpy as np
from typing import List, Union
from datetime import date, datetime, timedelta
from calendar import monthrange
from dateutil.parser import parse
import re
from pytz import timezone
import xlrd
from combocurve.shared.constants import BASE_TIME_NPDATETIME64

ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

# Always some room for improvement on these regexes.  For example, `2023-99-99` will be matched
#  as an acceptable date, but will error when trying to parse.
datetime_parsing_formats = {
    r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d*\w*': ISO_FORMAT,
    r'\d{4}-\d{1,2}-\d{1,2}': '%Y-%m-%d',
    r'\d{1,2}/\d{1,2}/\d{4}': '%m/%d/%Y',
    r'\d{1,2}/\d{4}': '%m/%Y',
    r'\d{4}/\d{2}/\d{2}': '%Y/%m/%d',
}


def parse_date_str(date_str: str) -> date:
    '''
    Take in a date string, and convert it to a `date` object.

    Args:
        date_str (str): the date to be parsed.
    Returns:
        date: the parsed date from the string.
    '''
    if date_str is None:
        return None

    for regex, format_string in datetime_parsing_formats.items():
        if _ := re.match(regex, date_str):
            try:
                parsed = datetime.strptime(date_str, format_string).date()
                return parsed
            except ValueError:
                continue
    return None


def index_from_date_str(date_str: str):
    return (np.datetime64(parse_date_str(date_str[:10])) - BASE_TIME_NPDATETIME64).astype(int)


def index_today():
    return days_from_1900(datetime.utcnow())


def datetime_from_index(index: int):
    date = date_from_index(index)
    dt = date_to_datetime(date)
    return dt


def date_from_index(index: int):
    try:
        return date(1900, 1, 1) + timedelta(days=index)
    except OverflowError:
        return None


def date_obj_from_npdatetime64(dt64):
    date_str = np.datetime_as_string(dt64, unit='D')
    year = int(date_str[:4])
    month = int(date_str[5:7])
    day = int(date_str[8:10])
    return date(year, month, day)


def days_from_1900(date_param: Union[date, datetime]):
    if type(date_param) is datetime:
        return (date_param - datetime(1900, 1, 1)).days
    else:
        return (date_param - date(1900, 1, 1)).days


def index_from_timestamp(timestamp: int) -> int:
    '''
    Take a timestamp (seconds) and convert it into a date index.

    Args:
        timestamp (int): timestamp in seconds

    Returns:
        int: a date index
    '''
    return days_from_1900(datetime.utcfromtimestamp(timestamp))


def date_from_timestamp(timestamp: int) -> date:
    '''
    Take a timestamp (seconds) and convert it into a date.

    Args:
        timestamp (int): timestamp in seconds
    '''
    return datetime.utcfromtimestamp(timestamp).date()


def last_day_of_month(date_param: date):
    _, day = monthrange(date_param.year, date_param.month)
    return date(date_param.year, date_param.month, day)


def add_years(date_: Union[date, datetime], years: int):
    res_year = min(max(date_.year + years, date.min.year), date.max.year)
    if isinstance(date_, datetime):
        try:
            return datetime(res_year, date_.month, date_.day, date_.hour, date_.minute, date_.second, date_.microsecond,
                            date_.tzinfo)
        except ValueError:  # Feb 29 on a non-leap year, change to Feb 28
            return datetime(res_year, date_.month, date_.day - 1, date_.hour, date_.minute, date_.second,
                            date_.microsecond, date_.tzinfo)
    try:
        return date(res_year, date_.month, date_.day)
    except ValueError:  # Feb 29 on a non-leap year, change to Feb 28
        return date(res_year, date_.month, date_.day - 1)


def clamp(date_: Union[date, datetime], min_date: Union[date, datetime], max_date: Union[date, datetime]):
    return min(max(date_, min_date), max_date)


def days_from_today(days: int):
    return date.today() + timedelta(days)


def date_to_datetime(d):
    return datetime(d.year, d.month, d.day)


def get_month(month):
    try:
        return int(month)
    except ValueError:
        return parse(month).month


XLDATE_1900_MODE = 0


def parse_datetime(value):
    if value is None:
        return value
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return date_to_datetime(value)

    try:
        n = float(value)
    except ValueError:
        return parse(value)
    else:
        # Excel for Mac in the past used 1904 mode,
        # but currently 1900 mode is the default for both Excel for Windows and Mac
        return xlrd.xldate.xldate_as_datetime(n, XLDATE_1900_MODE)


def parse_date(value):
    return parse_datetime(value).date()


def py_date_change_time_zone(py_date, time_zone):
    return py_date.replace(tzinfo=timezone('UTC')).astimezone(timezone(time_zone))


def idx_array_to_date_array(idx: List[int]) -> List[date]:
    return [date_from_index(int(x)) + timedelta(days=int(x - idx[0])) for x in idx]


def date_array_to_idx_array(dates: np.ndarray, data_freq: str):
    if data_freq == 'monthly':
        # Returns indexes at the 15th of each month.
        return (dates - BASE_TIME_NPDATETIME64).astype(int) + 14
    else:
        return (dates - BASE_TIME_NPDATETIME64).astype(int)


def idx_to_days_in_month(idx: np.ndarray):
    '''
    Input
    -----
    `idx: np.ndarray` An array of integers.

    Output
    ------
    `np.ndarray` An array of integers of the same length as `idx` representing the number of days in the month
    of the date represented by the entries of `idx`.
    '''
    return np.array(list(map(lambda x: last_day_of_month(date_from_index(x)).day, idx)), dtype=int)


def day_of_month_array(idx: List[int], day: int = -1) -> List[int]:
    '''Takes an ordered index list, and produces another list whose indices are the given day in each month, and lie
    between the first and last indices of idx.

    Use `day == -1` to get the last day of the month.
    '''
    out = []
    for i in idx:
        idx_date: date = date_from_index(int(i))
        _, month_days = monthrange(idx_date.year, idx_date.month)
        if day >= month_days or day < 0:
            month_idx = days_from_1900(date(idx_date.year, idx_date.month, month_days))
        else:
            month_idx = days_from_1900(date(idx_date.year, idx_date.month, day))
        if month_idx >= idx[0]:
            if month_idx <= idx[-1]:
                out.append(month_idx)
            else:
                break
    return out


def get_current_time(tz='US/Central'):
    current_time = datetime.now(timezone(tz))
    return current_time


def py_date_to_str_with_time_zone(py_date: datetime):
    return py_date.strftime("%m/%d/%Y %H:%M:%S %Z")
