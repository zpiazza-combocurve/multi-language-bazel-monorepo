import pandas as pd
import pytest
from combocurve.science.scheduling.csp_solver import NotificationCallback, OrtoolsScheduler
from combocurve.science.scheduling.csp_solver_fixtures import (ScheduleTest1, ScheduleTest2, ScheduleTest3,
                                                               ScheduleTest4, ScheduleTest5, ScheduleTest6,
                                                               ScheduleTest7, ScheduleTest8, ScheduleTest9)


class NoopNotificationCallback(NotificationCallback):
    '''Perform a noop when called within the `csp_solver`.

    The notification updates within the csp_solver currently just push
    to a channel that updates the ui. If we change that, then we should
    implement a test here.
    '''
    def __init__(self, context=None, notification_id=None, user_id=None):
        super().__init__(context, notification_id, user_id, n_wells=1)

    def initiate_progress(self):
        return

    def finalize_progress(self):
        return

    def OnSolutionCallback(self):
        return


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
    scheduler = OrtoolsScheduler(
        input.settings,
        input.df_task,
        input.df_resource,
        input.df_ranks,
        input.df_unavailable_days,
        df_hints=input.df_hints,
    )
    scheduler.orchestrator(noop_callback)
    # check outputs match
    output_benchmark = input.df_output
    output_scheduler = scheduler.df_output
    output_benchmark = input.harmonize_dtypes(output_benchmark)
    output_scheduler = input.harmonize_dtypes(output_scheduler)
    pd.testing.assert_frame_equal(output_benchmark, output_scheduler)

    # confirm hint is correct
    hints_benchmark, _ = scheduler._convert_ids(input.df_hints, ['job', 'task', 'machine'], scheduler.lkup)
    output_scheduler_unprocessed = scheduler.df_pruned
    hints_benchmark = input.harmonize_dtypes(hints_benchmark)
    output_scheduler_unprocessed = input.harmonize_dtypes(output_scheduler_unprocessed)
    pd.testing.assert_frame_equal(hints_benchmark, output_scheduler_unprocessed)
