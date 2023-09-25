from typing import Optional
from collections.abc import Mapping

from babel.numbers import parse_decimal, NumberFormatError


def parse_float(value, default=None):
    try:
        if isinstance(value, str):
            value = parse_decimal(value, locale='en_US')
        return float(value)
    except (NumberFormatError, ValueError, TypeError):
        return default


def _gallons_to_barrels(value):
    parsed_value = parse_float(value)
    return parsed_value / 42 if parsed_value is not None else None


def _no_conversion(value):
    return value


_conversions = {
    'ihs': {
        'first_fluid_volume': _gallons_to_barrels,
        'refrac_fluid_volume': _gallons_to_barrels,
    }
}


def convert_single_header(key, value, data_source):
    conversion_function = _conversions.get(data_source, {}).get(key, _no_conversion)
    return conversion_function(value)


def convert_headers(headers: Mapping, data_source: Optional[str]):
    return {k: convert_single_header(k, v, data_source) for k, v in headers.items()}
