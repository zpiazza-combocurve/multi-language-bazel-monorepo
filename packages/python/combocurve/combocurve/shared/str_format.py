from typing import Union
from datetime import date, datetime


def basic_format_date(date_: Union[date, datetime, None]):
    if date_ is None:
        return 'Invalid Date'
    return date_.strftime('%m/%d/%Y')


def basic_format_number(number: float, decimal_digits=2):
    return f'{round(number, decimal_digits):,.15g}'


def format_percent(number: float, decimal_digits=2):
    return f'{number:,.{decimal_digits}%}'
