from enum import Enum
from typing import Optional

import numpy as np
from pydantic import BaseModel

from combocurve.science.econ.schemas.compositional_economics import Compositional


class ShrinkageOptions(str, Enum):
    shrunk = 'shrunk'
    unshrunk = 'unshrunk'


class YieldOutput(BaseModel):
    shrinkage: ShrinkageOptions  # Compositionals should always be have shrinkage
    value: np.ndarray

    class Config:
        arbitrary_types_allowed = True  # To allow np.ndarray


class Yields(BaseModel):
    ngl: YieldOutput
    drip_condensate: YieldOutput
    compositionals: Optional[dict[Compositional, YieldOutput]]
