from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, root_validator, validator
import numpy as np
from bson.objectid import ObjectId


class PadOperationOptions(str, Enum):
    batch = 'batch'
    disabled = 'disabled'
    parallel = 'parallel'
    sequence = 'sequence'


class TimeRangeModel(BaseModel):
    end: Optional[int] = None
    start: Optional[int] = None

    @validator('end', 'start', pre=True)
    def allow_none(cls, v):
        if v is None or np.isnan(v):
            return None
        elif isinstance(v, int):
            return v
        elif isinstance(v, float) and v.is_integer():
            return int(v)
        else:
            raise TypeError


class EventModel(BaseModel):
    activityStepIdx: int
    activityStepName: str
    demob: TimeRangeModel = TimeRangeModel()
    mob: TimeRangeModel = TimeRangeModel()
    resourceIdx: Optional[int]
    resourceName: Optional[str]
    work: TimeRangeModel = TimeRangeModel()

    @root_validator
    def check_resource_xor(cls, values):
        assert (values.get('resourceIdx') is None and values.get('resourceName') is None
                or values['resourceIdx'] is not None
                and values['resourceName'] is not None), 'an index and name are required if a resource is present.'
        return values


class OutputModel(BaseModel):
    events: list[EventModel]
    FPD: Optional[int]


class ScheduleWellInfo(BaseModel):
    pad_name: Optional[str]
    rank: Optional[int]
    status: str
    well: ObjectId

    class Config:
        arbitrary_types_allowed = True


class StepDuration(BaseModel):
    days: int
    use_lookup: bool = False

    def to_db_record(self):
        return {'days': self.days, 'useLookup': self.use_lookup}


class ActivitySteps(BaseModel):
    color: Optional[str]
    step_idx: int
    previous_step_idx: list[int]
    name: str
    pad_operation: PadOperationOptions
    requires_resources: bool
    step_duration: StepDuration

    @classmethod
    def from_db_record(cls, db_record: dict[str, Any]):
        parsed_input = {
            'color':
            db_record.get('color'),
            'step_idx':
            db_record['stepIdx'],
            'previous_step_idx':
            db_record['previousStepIdx'],
            'name':
            db_record['name'],
            'pad_operation':
            db_record['padOperation'],
            'requires_resources':
            db_record['requiresResources'],
            'step_duration':
            StepDuration(
                days=db_record['stepDuration']['days'],
                use_lookup=db_record['stepDuration']['useLookup'],
            ),
        }
        return ActivitySteps.parse_obj(parsed_input)

    def to_db_record(self):
        return {
            'color': self.color,
            'stepIdx': self.step_idx,
            'previousStepIdx': self.previous_step_idx,
            'name': self.name,
            'padOperation': self.pad_operation,
            'requiresResources': self.requires_resources,
            'stepDuration': self.step_duration.to_db_record()
        }


class Availability(BaseModel):
    start: int
    end: int


class Resources(BaseModel):
    active: bool
    availability: Availability
    demobilization_days: int
    mobilization_days: int
    name: str
    step_idx: list[int]
    work_on_holidays: bool = True

    @classmethod
    def from_db_record(cls, db_record: dict[str, Any]):
        parsed_input = {
            'active': db_record['active'],
            'availability': db_record['availability'],
            'demobilization_days': db_record['demobilizationDays'],
            'mobilization_days': db_record['mobilizationDays'],
            'name': db_record['name'],
            'step_idx': db_record['stepIdx'],
            'work_on_holidays': db_record['workOnHolidays'],
        }
        return Resources.parse_obj(parsed_input)

    def to_db_record(self) -> dict[str, Any]:
        return {
            'active': self.active,
            'availability': self.availability.dict(),
            'demobilizationDays': self.demobilization_days,
            'mobilizationDays': self.mobilization_days,
            'name': self.name,
            'stepIdx': self.step_idx,
            'workOnHolidays': self.work_on_holidays,
        }


class ScheduleSettings(BaseModel):
    activity_steps: list[ActivitySteps]
    name: str
    start_program: int
    overwrite_manual: bool
    resources: list[Resources]

    @classmethod
    def from_db_record(cls, db_record: dict[str, Any]):
        try:
            parsed_input = {
                'activity_steps': [ActivitySteps.from_db_record(step) for step in db_record['activitySteps']],
                'resources': [Resources.from_db_record(resource) for resource in db_record['resources']],
                'start_program': db_record['startProgram'],
                'overwrite_manual': db_record.get('overwriteManual', True),
                'name': db_record['name'],
            }
            return ScheduleSettings.parse_obj(parsed_input)
        except KeyError:
            raise Exception('Could not parse data into a ScheduleSettings object')

    def to_db_record(self) -> dict[str, Any]:
        return {
            'activitySteps': [step.to_db_record() for step in self.activity_steps],
            'name': self.name,
            'startProgram': self.start_program,
            'overwriteManual': self.overwrite_manual,
            'resources': [resource.to_db_record() for resource in self.resources]
        }
