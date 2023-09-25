from typing import AnyStr, Dict
from combocurve.shared.constants import D_EFF_MAX, D_EFF_MIN, Q_MAX, Q_MIN


def format_large_number_as_str(num):
    return f"{int(num):,}"


RATE_UPPER_BOUND_STR = format_large_number_as_str(Q_MAX)
RATE_LOWER_BOUND_STR = str(Q_MIN)

D_EFF_UPPER_BOUND_STR = str(D_EFF_MAX)
D_EFF_LOWER_BOUND_STR = str(D_EFF_MIN)

CLEAR_WARNING = {
    'status': False,
    'message': '',
}
WARNING_RATE_TOO_LARGE_MESSAGE = ("Cannot recalculate q Start further. Extending the calculation"
                                  + f" of q Start will exceed the rate limit of {RATE_UPPER_BOUND_STR}. "
                                  + "Please reduce the offset in the start date.")

WARNING_RATE_TOO_LARGE = {
    'status': True,
    'message': WARNING_RATE_TOO_LARGE_MESSAGE,
}

WARNING_RATE_TOO_SMALL_MESSAGE = ("Cannot recalculate q Start further. Extending the calculation"
                                  + f" of q Start will exceed the lower rate limit of {RATE_LOWER_BOUND_STR}. "
                                  + "Please reduce the offset in the start date.")

WARNING_RATE_TOO_SMALL = {
    'status': True,
    'message': WARNING_RATE_TOO_SMALL_MESSAGE,
}

WARNING_D_EFF_TOO_LARGE_MESSAGE = ("Newly calculated D_eff at the start of first backcasted "
                                   + f"segment is greater than {D_EFF_UPPER_BOUND_STR}. "
                                   + "Please reduce the offset in the start date.")
WARNING_D_EFF_TOO_LARGE = {
    'status': True,
    'message': WARNING_D_EFF_TOO_LARGE_MESSAGE,
}

WARNING_D_EFF_TOO_SMALL_MESSAGE = ("Newly calculated D_eff at the start of first backcasted "
                                   + f"segment is smaller than {D_EFF_LOWER_BOUND_STR}. "
                                   + "Please reduce the offset in the start date.")
WARNING_D_EFF_TOO_SMALL = {
    'status': True,
    'message': WARNING_D_EFF_TOO_SMALL_MESSAGE,
}


def WARNING_PEAK_RATE_TOO_LARGE_MESSAGE(peak_rate: float) -> AnyStr:
    return ("Cannot recalculate q Start further. Extending the calculation"
            + f" of q Start will exceed the rate limit of {format_large_number_as_str(peak_rate)}. "
            + "Please reduce the offset in the start date.")


def WARNING_PEAK_RATE_TOO_LARGE(peak_rate: float) -> Dict:
    return {
        'status': True,
        'message': WARNING_PEAK_RATE_TOO_LARGE_MESSAGE(peak_rate),
    }


def WARNING_PEAK_RATIO_TOO_LARGE_MESSAGE(peak_rate: float) -> AnyStr:
    return ("Cannot recalculate q Start further. Extending the calculation"
            + f" of q Start will exceed the rate limit of {format_large_number_as_str(peak_rate)}. "
            + "Please reduce the offset in the start date.")


def WARNING_PEAK_RATIO_TOO_LARGE(peak_rate: float) -> Dict:
    return {
        'status': True,
        'message': WARNING_PEAK_RATIO_TOO_LARGE_MESSAGE(peak_rate),
    }


WARNING_PEAK_RATIO_TOO_SMALL_MESSAGE = ("Newly calculated Q at the start of first backcasted"
                                        + f" segment is smaller than {Q_MIN}. "
                                        + "Please reduce the offset in the start date.")

WARNING_PEAK_RATIO_TOO_SMALL = {
    'status': True,
    'message': WARNING_PEAK_RATIO_TOO_SMALL_MESSAGE,
}

WARNING_RATIO_BASE_PHASE_CUTOFF_MESSAGE = ("On Ratio phases, cannot backcast further than the Base phase. "
                                           + "Try backcasting your Base Phase further back.")

WARNING_RATIO_BASE_PHASE_CUTOFF = {
    'status': True,
    'message': WARNING_RATIO_BASE_PHASE_CUTOFF_MESSAGE,
}

WARNING_NO_RATIO_BASE_PHASE_SEGMENTS_MESSAGE = ("The base phase for this ratio forecast has no forecast segments.  "
                                                + "Please ensure these exist and try again.")

WARNING_NO_RATIO_BASE_PHASE_SEGMENTS = {
    'status': True,
    'message': WARNING_NO_RATIO_BASE_PHASE_SEGMENTS_MESSAGE,
}

WARNING_SEGMENT_NAME_INVALID_MESSAGE = ("Can not recognize the segment type, "
                                        + "try to rerun the forecast of this well and retry")
