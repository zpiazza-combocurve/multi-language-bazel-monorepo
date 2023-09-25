import pandas as pd
import pytest
from combocurve.science.scheduling.fast_solver import FastScheduler
from combocurve.science.scheduling.csp_solver import OrtoolsScheduler
from combocurve.science.scheduling.csp_solver_fixtures import (ScheduleTest1, ScheduleTest2, ScheduleTest3,
                                                               ScheduleTest4, ScheduleTest5, ScheduleTest6,
                                                               ScheduleTest7, ScheduleTest8, ScheduleTest9)
from combocurve.science.scheduling.csp_solver_test import NoopNotificationCallback

noop_callback = NoopNotificationCallback()


@pytest.mark.unittest
@pytest.mark.parametrize("schedule_inputs", [
    ScheduleTest1,
    ScheduleTest2,
    ScheduleTest3,
    ScheduleTest4,
    ScheduleTest5,
    ScheduleTest6,
    ScheduleTest7,
    ScheduleTest8,
    ScheduleTest9,
])
def test_scheduling_orchestrator(schedule_inputs):
    input = schedule_inputs()
    fs = FastScheduler(input.df_task, input.df_resource, input.df_ranks, input.df_unavailable_days)
    fs.orchestrator()
    scheduler = OrtoolsScheduler(
        input.settings,
        input.df_task,
        input.df_resource,
        input.df_ranks,
        input.df_unavailable_days,
        df_hints=fs.df_hints,
        horizon=fs.df_hints_unpruned['end'].max() + 1,
    )
    scheduler.orchestrator(noop_callback)
    df_hints = input.convert_output_to_hint(scheduler.df_output, input.df_task, input.df_ranks, input.settings)
    pd.testing.assert_frame_equal(
        input.harmonize_dtypes(fs.df_hints),
        input.harmonize_dtypes(df_hints.loc[~df_hints['task'].isin(fs.hint_tasks_removed)]),
    )
