from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId

from pydantic import BaseModel


class CustomModel(BaseModel):
    @classmethod
    def get_field_names(cls):
        return cls.__fields__.keys()

    class Config:
        arbitrary_types_allowed = True


Segment = Dict[str, Any]
FitSegments = List[Segment]


class AbsoluteRange(CustomModel):
    start: Optional[float]
    end: Optional[float]


class MultiplierPair(CustomModel):
    qPeak: Optional[float]
    eur: Optional[float]


NormalizationMultipliers = List[MultiplierPair]


class ProximityCriteria(CustomModel):
    criteria_type: Optional[str]
    mandatory: Optional[bool]
    absolute_range: Optional[AbsoluteRange]
    relative_value: Optional[float]
    relative_percentage: Optional[float]


class ProximityCriteriaSettings(CustomModel):
    search_radius: Optional[float]
    criteria: Optional[List[ProximityCriteria]]


class WellForecastPair(CustomModel):
    well: ObjectId
    forecast: ObjectId


class NormalizationBaseAxis(CustomModel):
    label: Optional[str]
    start_feature: Optional[str]
    op_chain: Optional[List[Any]]
    operator: Optional[Any]
    default_min: Optional[float]
    default_max: Optional[float]
    unit: Optional[str]


class NormalizationBase(CustomModel):
    x: Optional[NormalizationBaseAxis]
    y: Optional[NormalizationBaseAxis]


class NormalizationHeaders(CustomModel):
    eur: Optional[float]
    first_fluid_volume: Optional[float]
    first_prop_weight: Optional[float]
    horizontal_spacing: Optional[float]
    perf_lateral_length: Optional[float]
    vertical_spacing: Optional[float]
    well_name: Optional[str]


class ProximityNormalizationSettings(CustomModel):

    range_start: Optional[float]
    range_end: Optional[float]
    diverged: Optional[bool] = False
    key: Optional[str] = 'normalize'
    name: Optional[str] = 'Normalize'
    base: Optional[NormalizationBase]
    type: Optional[str]
    headers: Optional[NormalizationHeaders]


class BestFitQPeakDict(CustomModel):
    method: Optional[str]
    range: Optional[List[float]]


class BuildupDict(CustomModel):
    apply_ratio: Optional[bool]
    apply: Optional[bool]
    buildup_ratio: Optional[float]
    days: Optional[float]


class ProximityFitSettings(CustomModel):
    add_series: Optional[str]
    add_series_fit_range: Optional[List[datetime]]
    apply_series: Optional[str]
    b0: Optional[List[float]]
    b: Optional[List[float]]
    b2: Optional[List[float]]
    best_fit_q_peak: Optional[BestFitQPeakDict]
    buildup: Optional[BuildupDict]
    D_lim_eff: Optional[float]
    D1_eff: Optional[List[float]]
    fit_complexity: Optional[str]
    minus_t_decline_t_0: Optional[List[float]]
    minus_t_elf_t_peak: Optional[List[float]]
    minus_t_peak_t0: Optional[List[float]]
    p1_range: Optional[List[float]]
    q_final: Optional[float]
    q_peak: Optional[List[float]]
    TC_model: Optional[str]
    well_life: Optional[float]


class ProximitySettings(CustomModel):
    neighbor_criteria_settings: Optional[ProximityCriteriaSettings]
    normalization_settings: Optional[ProximityNormalizationSettings]
    fit_settings: Optional[ProximityFitSettings]


class ProximityFitsContainer(CustomModel):
    fitted: Optional[Dict[str, FitSegments]]
    unfitted: Optional[Dict[str, FitSegments]]


class ProximityDocument(CustomModel):
    _id: Optional[ObjectId]
    project: Optional[ObjectId]
    forecast: ObjectId
    well: ObjectId
    phase: str
    resolution: Optional[str]
    phase_type: Optional[str]
    base_phase: Optional[str]
    fits: Optional[ProximityFitsContainer]
    normalization_multipliers: Optional[NormalizationMultipliers]
    settings: Optional[ProximitySettings]
    wells: Optional[List[WellForecastPair]]
