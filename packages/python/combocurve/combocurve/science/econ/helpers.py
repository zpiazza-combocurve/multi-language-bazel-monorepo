import numpy as np
from dateutil import parser

BASE_DATE_NP = np.datetime64('1900-01-01')


def date_to_t(input_date, fpd):
    return (input_date.year - fpd.year) * 12 + input_date.month - fpd.month


def date_to_t_daily(input_date, fpd):
    return (input_date - fpd).days


def days_in_month(ts):
    ts_month = ts.astype('datetime64[M]')
    return (((ts_month + 1).astype('datetime64[D]') - ts_month) // np.timedelta64(1, 'D'))


def convert_list_of_int_to_as_of_dates(periods: list[int]) -> list[dict[str, int]]:
    """Helper function to format list of integer periods into as of dates.

    Args:
        periods (list[int]): List of integer periods.

    Returns:
        list[dict[str, int]]: List of as of dates.

    Raises:
        TypeError: If periods is not a list.

    Examples:
        >>> convert_list_of_int_to_as_of_dates([])
        []
        >>> convert_list_of_int_to_as_of_dates([42])
        [{'start': 42, 'end': 'Econ Limit'}]
        >>> convert_list_of_int_to_as_of_dates([10, 20])
        [{'start': 10, 'end': 20}, {'start': 20, 'end': 'Econ Limit'}]
    """
    as_of_dates = []
    econ_limit_str = 'Econ Limit'
    if not isinstance(periods, list):
        raise TypeError(f'periods must be a list, not {type(periods)}')
    if len(periods) == 0:
        return as_of_dates
    if len(periods) == 1:
        as_of_dates.append({'start': int(periods[0]), 'end': econ_limit_str})
        return as_of_dates
    for i in range(len(periods) - 1):
        as_of_dates.append({'start': int(periods[i]), 'end': int(periods[i + 1])})
    as_of_dates.append({'start': int(periods[-1]), 'end': econ_limit_str})
    return as_of_dates


def check_dates_sequence_validity(date_str1: str, date_str2: str) -> bool:
    """Helper function to check if date_str1 is before date_str2.

    Args:
        date_str1 (str): First date string.
        date_str2 (str): Second date string.

    Returns:
        bool: True if date_str1 is before date_str2, False otherwise.

    """
    parsed_date1 = parser.parse(date_str1)
    parsed_date2 = parser.parse(date_str2)
    return parsed_date1 < parsed_date2


def convert_list_of_date_strings_to_dates(periods: list[str]) -> list[dict]:
    """Helper function to format list of date strings into as of dates.

    Args:
        periods: List of date strings (YYYY-MM-DD).

    Returns:
        list[dict]: List of as of dates. Format: [{'start_date': 'YYYY-MM-DD', 'end_date': 'YYYY-MM-DD'}, ...]

    Raises:
        TypeError: If periods is not a list.
        ValueError: If dates sequence is invalid.

    Examples:
        >>> convert_list_of_date_strings_to_dates([])
        []
        >>> convert_list_of_date_strings_to_dates(['2020-01-01'])
        [{'start_date': '2020-01-01', 'end_date': 'Econ Limit'}]
        >>> convert_list_of_date_strings_to_dates(['2020-01-01', '2020-02-01'])
        [{'start_date': '2020-01-01', 'end_date': '2020-02-01'}, {'start_date': '2020-02-01', 'end_date': 'Econ Limit'}]
    """
    dates = []
    econ_limit_str = 'Econ Limit'
    if not isinstance(periods, list):
        raise TypeError(f'periods must be a list, not {type(periods)}')
    if len(periods) == 0:
        return dates
    if len(periods) == 1:
        dates.append({'start_date': periods[0], 'end_date': econ_limit_str})
        return dates
    for i in range(len(periods) - 1):
        if not check_dates_sequence_validity(periods[i], periods[i + 1]):
            raise ValueError(f'Invalid dates sequence: {periods[i]} is not before {periods[i + 1]}')
        dates.append({'start_date': periods[i], 'end_date': periods[i + 1]})
    dates.append({'start_date': periods[-1], 'end_date': econ_limit_str})
    return dates
