from typing import TYPE_CHECKING
from combocurve.science.scheduling.scheduling_data_models import TimeRangeModel, OutputModel, EventModel
import pandas as pd

if TYPE_CHECKING:
    from bson.objectid import ObjectId

DEFAULT_CHUNK_SIZE = 1000


def create_chunks(x: list, chunk_size: int = DEFAULT_CHUNK_SIZE):
    if chunk_size < 1:
        raise ValueError('Must have chunk_size at least 1.')
    for i in range(0, len(x), chunk_size):
        yield x[i:i + chunk_size]


def parse_schedule(df_assignments: 'pd.DataFrame', resource_names: dict[int, str], step_names: dict[int, str]):
    return ScheduleOutputParser(df_assignments, resource_names, step_names).parse_output()


def build_empty_events(wells: list['ObjectId'], activity_step_names: dict[int, str]):
    events = OutputModel(
        events=[EventModel(activityStepIdx=idx, activityStepName=name) for idx, name in activity_step_names.items()])
    for well in wells:
        yield well, events


class ScheduleOutputParser():
    """Parse the output of the OrToolsScheduler.orchestrator method into
        the format of the schedule-well-outputs database.

    Attributes:
        grouped_assignments: A dataframe grouped by job. The fields are sorted by 
        `task` according to the `array_idx` from construction in order to support
        sort operations in the schedule output table. Available fields include:
            job: The well ids as ObjectId.
            task: The step ids as int.
            machine: The resource ids as int.
            subtask: strings mob, main, or demob.
            start: The start of the subtask as int.
            end: The end of subtask as int.
        resource_names: A map from resource ids to names.
        step_names: A map from step ids to names.
        wells: All well ids as a list of ObjectIds.
        steps: All step ids as a list of ints.
    """
    def __init__(self, df_assignments: 'pd.DataFrame', resource_names: dict[int, str], step_names: dict[int, str]):
        step_keys = list(step_names.keys())
        self.grouped_assignments = df_assignments.sort_values(
            by=['task'],
            key=lambda col: col.map(step_keys.index),
        ).groupby('job')
        self.resource_names = resource_names
        self.step_names = step_names

    def parse_output(self):
        """Generator yielding parsed outputs.

        Returns:
            A generator yielding tuples, with the first entry the well ObjectId,
            and the second a pydantic model matching the output field ready to
            be stored in the schedule-well-outputs collection.
        """
        for well, well_work in self.grouped_assignments:
            events: list['EventModel'] = []
            first_prod = 0

            for step, step_info in well_work.groupby('task'):
                if len(step_info) > 0:
                    # There should be only one resource in all lines of the step.
                    if pd.notnull(resource_id := step_info.machine.iloc[0]):
                        resource_name = self.resource_names[resource_id]
                    else:
                        resource_id = resource_name = None
                    step_name = self.step_names[step]
                    event = EventModel(
                        activityStepIdx=step,
                        activityStepName=step_name,
                        resourceIdx=resource_id,
                        resourceName=resource_name,
                    )
                    for _, subtask in step_info.iterrows():
                        event, first_prod = self._update_event(event, first_prod, subtask)
                    events.append(event)

            yield well, OutputModel(events=events, FPD=first_prod + 1)

    @staticmethod
    def _update_event(event: 'EventModel', first_prod: int, subtask: 'pd.Series'):
        if subtask.subtask == 'main':
            subtask_field = 'work'
        else:
            subtask_field = subtask.subtask
        setattr(event, subtask_field, TimeRangeModel.parse_obj({'end': subtask.end, 'start': subtask.start}))
        if subtask.end > first_prod:
            first_prod = subtask.end

        return event, first_prod
