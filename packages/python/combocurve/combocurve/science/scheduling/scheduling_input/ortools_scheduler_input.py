import pandas as pd
from typing import Tuple
from bson.objectid import ObjectId
from combocurve.science.scheduling.scheduling_data_models import ScheduleSettings, ScheduleWellInfo

SPECIAL_STATUS_MAP = {
    'not_started': 'not_started',
    'permitted': 'not_started',
    'pad_prepared': 'Pad Preparation',
    'spudded': 'Spud',
    'drilled': 'Drill',
    'completed': 'Completion',
    'producing': 'producing',
}

DO_NOT_SCHEDULE_STATUS = 'producing'


class InvalidParamsError(Exception):
    expected = True


class InvalidOperationError(Exception):
    expected = True


class OrtoolsSchedulerInputService(object):
    '''
    required collections/services:
    schedules_collection
    '''
    def __init__(self, context):
        self.context = context


def get_ortools_input(
    well_level_info: list[ScheduleWellInfo],
    schedule_settings: ScheduleSettings,
    frozen_wells: set,
    frozen_well_info: list,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, dict, dict, list[ObjectId], pd.DataFrame]:
    if len(well_level_info) == 0:
        raise InvalidOperationError('Scheduling task requires at least one well.')
    activity_steps = schedule_settings.activity_steps
    activity_step_names = {i.step_idx: i.name for i in activity_steps}
    activity_step_names_reverse = dict([(v, k) for k, v in activity_step_names.items()])
    resource_names = {idx: i.name for idx, i in enumerate(schedule_settings.resources)}
    resource_names_reverse = dict([(v, k) for k, v in resource_names.items()])
    df_task = []
    unscheduled_wells = []
    for job in well_level_info:
        if _do_not_schedule(job, frozen_wells):
            if job.status == DO_NOT_SCHEDULE_STATUS:
                unscheduled_wells.append(job.well)
            continue
        for resource in schedule_settings.resources:
            if resource.active:
                for task in resource.step_idx:
                    task_data = next(item for item in activity_steps if item.step_idx == task)
                    if task_data.requires_resources:
                        row = {}
                        row['job'] = job.well
                        row['task'] = task
                        row['previous_tasks'] = task_data.previous_step_idx
                        row['machine'] = resource_names_reverse[resource.name]
                        row['duration_base'] = task_data.step_duration.days
                        row['pad_operation'] = task_data.pad_operation
                        row['requires_resources'] = task_data.requires_resources
                        df_task.append(row)
        for task_data in activity_steps:
            if not task_data.requires_resources:
                row = {}
                row['job'] = job.well
                row['task'] = task_data.step_idx
                row['previous_tasks'] = task_data.previous_step_idx
                row['machine'] = None
                row['duration_base'] = task_data.step_duration.days
                row['pad_operation'] = task_data.pad_operation
                row['requires_resources'] = task_data.requires_resources
                df_task.append(row)
    df_task = pd.DataFrame(df_task)

    df_resource = []
    for resource in schedule_settings.resources:
        if resource.active:
            row = {}
            row['machine'] = resource_names_reverse[resource.name]
            row['mobilization'] = resource.mobilization_days
            row['demobilization'] = resource.demobilization_days
            row['available_from'] = resource.availability.start - schedule_settings.start_program
            row['available_to'] = resource.availability.end - schedule_settings.start_program
            row['work_on_weekends'] = resource.work_on_holidays
            df_resource.append(row)
    df_resource = pd.DataFrame(df_resource)

    df_ranks = []
    for job in well_level_info:
        if _do_not_schedule(job, frozen_wells):
            continue
        row = {}
        row['job'] = job.well
        row['rank'] = job.rank
        status_clean = SPECIAL_STATUS_MAP.get(job.status, job.status)
        row['status'] = activity_step_names_reverse.get(status_clean, 'not_started')
        row['pad'] = job.pad_name
        df_ranks.append(row)
    df_ranks = pd.DataFrame(df_ranks)

    if len(frozen_wells) > 0:
        df_output_frozen = []
        for w in frozen_well_info:
            for e in w['output']['events']:
                for subtask in ['mob', 'work', 'demob']:
                    row = {}
                    row['job'] = w['well']
                    row['task'] = e['activityStepIdx']
                    row['machine'] = e['resourceIdx']
                    row['subtask'] = subtask
                    row['start'] = e[subtask]['start']
                    row['end'] = e[subtask]['end']
                    row['duration'] = row['end'] - row['start'] + 1 if row['end'] is not None else None
                    df_output_frozen.append(row)
        df_output_frozen = pd.DataFrame(df_output_frozen)
        df_unavailable_days = df_output_frozen.groupby(['job', 'task']).agg({
            'machine': 'first',
            'start': 'min',
            'end': 'max',
        }).reset_index(drop=True)
        df_unavailable_days['start'] = df_unavailable_days['start'].astype(int) - schedule_settings.start_program
        df_unavailable_days['end'] = df_unavailable_days['end'].astype(int) - schedule_settings.start_program + 1
    else:
        df_output_frozen = pd.DataFrame({})
        df_unavailable_days = pd.DataFrame({})
    return (df_task, df_resource, df_ranks, df_unavailable_days, activity_step_names, resource_names, unscheduled_wells,
            df_output_frozen)


def _do_not_schedule(job: ScheduleWellInfo, frozen_wells: list[ObjectId]):
    return job.status == DO_NOT_SCHEDULE_STATUS or job.well in frozen_wells
