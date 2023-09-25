import enum
from typing import Union


class CriteriaLabel(str, enum.Enum):
    flat = 'Flat'
    dates = 'Dates'
    fpd = 'FPD'
    as_of = 'As Of'

    @classmethod
    def has_value(cls, value: str) -> bool:
        return value in cls._value2member_map_


CRITERIA_LABEL_MAP = {
    CriteriaLabel.flat: 'entire_well_life',
    CriteriaLabel.dates: 'dates',
    CriteriaLabel.fpd: 'offset_to_fpd',
    CriteriaLabel.as_of: 'offset_to_as_of_date',
}


def criteria_label_converter(criteria: Union[CriteriaLabel, str]) -> str:
    """Convert a criteria label to the calculation header value.

    E.g.: 'Flat' -> 'entire_well_life'

    Args:
        criteria (str): The criteria label.

    Returns:
        str: The calculation header value.

    Raises:
        ValueError: If the criteria label is not recognized.
    """
    if not CriteriaLabel.has_value(criteria):
        raise ValueError(f'Criteria label {criteria} not recognized.')
    return CRITERIA_LABEL_MAP[criteria]
