from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from combocurve.shared.feature_toggles.forecast_toggles import use_normalization_v2

NORMALIZATION_FACTORS = ('eur', 'qPeak')


class Operation(BaseModel):
    op: str
    opFeature: str


class OpChainDocument(BaseModel):
    startFeature: str
    opChain: list[Operation]


class BaseDocument(BaseModel):
    key: str = 'eur_pll'
    x: OpChainDocument = OpChainDocument.parse_obj({'startFeature': 'perf_lateral_length', 'opChain': []})
    y: OpChainDocument = OpChainDocument.parse_obj({'startFeature': '$PHASE_EUR', 'opChain': []})


class StepsItem(BaseModel):
    key: str = 'normalize'
    base: BaseDocument = BaseDocument()
    name: str = 'Normalize'
    type: str = 'no_normalization'
    rangeStart: float = 0.02
    rangeEnd: float = 0.98
    diverged: bool = False
    multiplier: float = 1.0
    target: Optional[dict] = {}
    normalizationMin: Optional[float] = None
    normalizationMax: Optional[float] = None
    aValue: Optional[float] = None
    bValue: Optional[float] = None

    def get_all_headers(self) -> set[str]:
        header_names = {self.base.x.startFeature}
        for operation in self.base.x.opChain:
            header_names.add(operation.opFeature)
        for operation in self.base.y.opChain:
            header_names.add(operation.opFeature)

        return header_names


class StepsDocument(BaseModel):
    eur: Optional[StepsItem] = StepsItem()
    qPeak: Optional[StepsItem] = StepsItem()
    normalizationType: str = 'eur'  # ['eur', 'qPeak', 'eur_and_qPeak']

    def get_all_headers(self) -> set[str]:
        '''Utility function for accessing all headers in a StepsDocument.

        Returns:
            set[str]:  The unique headers in the steps document.
        '''
        header_names = set()
        if self.eur is not None:
            header_names |= self.eur.get_all_headers()
        if self.qPeak is not None:
            header_names |= self.qPeak.get_all_headers()
        return header_names


class MultipliersDocument(BaseModel):
    eur: float = 1.0
    qPeak: float = 1.0


class TypeCurveNormalizationWellDocument(BaseModel):
    typeCurve: ObjectId
    phase: str
    well: ObjectId
    if use_normalization_v2():
        multipliers: MultipliersDocument
        nominalMultipliers: MultipliersDocument
    else:
        multipliers: list[float]

    class Config:
        arbitrary_types_allowed = True


class TypeCurveNormalizationDocument(BaseModel):
    typeCurve: ObjectId
    phase: str
    if use_normalization_v2():
        steps: StepsDocument
    else:
        steps: list[StepsItem]

    class Config:
        arbitrary_types_allowed = True
