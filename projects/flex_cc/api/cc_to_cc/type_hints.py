# flake8: noqa N815
from datetime import datetime
from typing import TypedDict, Optional
from bson import ObjectId


class ErrorRecord(TypedDict):
    error_message: str
    row_index: int


class Component(TypedDict):
    percentage: float
    price: float


Composition = TypedDict(
    'Composition', {
        'N2': Component,
        'CO2': Component,
        'C1': Component,
        'C2': Component,
        'C3': Component,
        'iC4': Component,
        'nC4': Component,
        'iC5': Component,
        'nC5': Component,
        'iC6': Component,
        'nC6': Component,
        'C7': Component,
        'C8': Component,
        'C9': Component,
        'C10+': Component,
        'H2S': Component,
        'H2': Component,
        'H2O': Component,
        'He': Component,
        'O2': Component,
    })


class FluidModelPhase(TypedDict):
    composition: Composition
    criteria: str
    unit: str


class FluidModelEconFunction(TypedDict):
    oil: FluidModelPhase
    gas: FluidModelPhase
    water: FluidModelPhase
    ngl: FluidModelPhase
    drip_condensate: FluidModelPhase


class FluidModel(TypedDict):
    _id: ObjectId
    copiedFrom: Optional[ObjectId]
    unique: bool
    tags: list
    project: ObjectId
    assumptionKey: str
    assumptionName: str
    econ_function: FluidModelEconFunction
    name: str
    createdBy: ObjectId
    lastUpdatedBy: ObjectId
    createdAt: datetime
    updatedAt: datetime
    __v: int


FluidModelExportRow = TypedDict(
    'FluidModelExportRow', {
        'Model Type': str,
        'Model Name': str,
        'Phase': str,
        'Criteria': str,
        'N2': float,
        'CO2': float,
        'C1': float,
        'C2': float,
        'C3': float,
        'iC4': float,
        'nC4': float,
        'iC5': float,
        'nC5': float,
        'iC6': float,
        'nC6': float,
        'C7': float,
        'C8': float,
        'C9': float,
        'C10+': float,
        'H2S': float,
        'H2': float,
        'H2O': float,
        'He': float,
        'O2': float,
        'Last Update': str,
    })


class EmissionModelRow(TypedDict):
    selected: bool
    category: str
    co2e: float
    co2: float
    ch4: float
    n2o: float
    unit: str
    escalation_model: Optional[ObjectId]


class EmissionModelEconFunction(TypedDict):
    table: list[EmissionModelRow]


class EmissionModel(TypedDict):
    _id: ObjectId
    copiedFrom: Optional[ObjectId]
    unique: bool
    tags: list
    project: ObjectId
    assumptionKey: str
    assumptionName: str
    econ_function: EmissionModelEconFunction
    name: str
    createdBy: ObjectId
    lastUpdatedBy: ObjectId
    createdAt: datetime
    updatedAt: datetime
    __v: int


EmissionModelExportRow = TypedDict(
    'EmissionModelExportRow', {
        'Model Type': str,
        'Model Name': str,
        'Selected': bool,
        'Category': str,
        'CO2e': float,
        'CO2': float,
        'CH4': float,
        'N2O': float,
        'Unit': str,
        'Escalation': Optional[ObjectId],
        'Last Update': str,
    })
