from enum import Enum
from typing import AnyStr


class LowDataErrorType(Enum):
    DEFAULT = 'Too little data to generate a valid forecast. If possible, relax filter options to include more data.'
    NO_MONTHLY = 'Not enough monthly data to forecast against.  Perhaps try using Daily data?'
    NO_DAILY = 'Not enough daily data to forecast against.  Perhaps try using Monthly data?'
    FILTERED = 'Too little data to generate a valid forecast after filtering.  If possible, relax filter options to include more data.'
    PEAKS = 'Not enough data points after peak.'


NO_WARNING = {'status': False, 'message': ''}

too_low_message = 'Forecast generated without match EUR. Make sure there is a forecast to match, '
too_low_message += 'or, if using a fixed value, that the value is different from the cumulative production.'
MATCH_EUR_TOO_LOW = {'status': True, 'message': too_low_message}

MATCH_EUR_UNAVAILABLE_WARNING = {'status': True, 'message': 'Match EUR not available for this well.'}

shutin_match_eur_message = 'Shut-in detected. Forecast generated without match EUR. If this is undesired, '
shutin_match_eur_message += 'use a larger value for the \"Zero Forecast\" option in the Advanced forecast settings.'
MATCH_EUR_SHUTIN_WARNING = {'status': True, 'message': shutin_match_eur_message}

RATE_TO_EUR_WARNING = {
    'status': True,
    'message': ('Generated forecast to match EUR on broad trend but failed to match within 5%.')
}


def eur_match_fail(target_eur: float, error_percentage: float, cur_phase: str) -> dict:
    DISPLAY_UNIT_TEMPLATE = {
        "gas_eur": "MMCF",
        "oil_eur": "MBBL",
        "water_eur": "MBBL",
    }
    warning_msg = 'Forecast failed to match within '
    warning_msg += '{}% range of target EUR {} {}. '.format(str(error_percentage * 100), round(target_eur / 1000, 2),
                                                            DISPLAY_UNIT_TEMPLATE[cur_phase + '_eur'])
    warning_msg += 'Attempted to match EUR as closely as possible by expanding tolerance window.'
    return {'status': True, 'message': warning_msg}


def convert_header_to_human_readable(header: AnyStr) -> AnyStr:
    """
    Converts header names to a more human readable form.

    Example:
        "first_prod_date" -> "First Prod Date"

    Args:
        header (AnyStr): The header to be converted

    Returns:
        AnyStr: the converted header string
    """
    words = header.split('_')
    return ' '.join([w.capitalize() for w in words])
