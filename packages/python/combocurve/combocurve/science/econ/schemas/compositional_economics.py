from pydantic import BaseModel
from enum import Enum
from typing import List, Optional


class Compositional(str, Enum):
    n2 = 'N2'
    co2 = 'CO2'
    c1 = 'C1'
    c2 = 'C2'
    c3 = 'C3'
    ic4 = 'iC4'
    nc4 = 'nC4'
    ic5 = 'iC5'
    nc5 = 'nC5'
    ic6 = 'iC6'
    nc6 = 'nC6'
    c7 = 'C7'
    c8 = 'C8'
    c9 = 'C9'
    c10 = 'C10+'
    h2s = 'H2S'
    h2 = 'H2'
    h2o = 'H2O'
    he = 'He'
    o2 = 'O2'
    remaining = 'Remaining'

    @classmethod
    def has_value(cls, value: str) -> bool:
        return value in cls._value2member_map_


class CompositionalSource(str, Enum):
    manual = 'Manual'
    calculated = 'Calculated'


class CompositionalEconomicsRow(BaseModel):
    btu: float
    category: Compositional
    key: str
    mol_factor: Optional[float]  # Remaining
    mol_percentage: float
    plant_efficiency: Optional[float]  # Remaining
    post_extraction: float
    shrink: float
    source: CompositionalSource
    value: float


class CompositionalEconomicsRows(BaseModel):
    rows: List[CompositionalEconomicsRow]
