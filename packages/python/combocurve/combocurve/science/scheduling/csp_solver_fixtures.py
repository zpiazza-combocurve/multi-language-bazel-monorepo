from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from combocurve.science.scheduling.scheduling_data_models import PadOperationOptions


class SchedulingFixture(ABC):
    def __init__(self, enable_hints=True):
        self.df_task = self.gen_df_task()
        self.df_resource = self.gen_df_resource()
        self.df_ranks = self.gen_df_ranks()
        self.settings = self.gen_settings()
        self.df_output = self.gen_df_output()
        self.df_unavailable_days = self.gen_df_unavailable_days()
        if enable_hints:
            self.df_hints = self.convert_output_to_hint(self.df_output, self.df_task, self.df_ranks, self.settings)

    @staticmethod
    def convert_output_to_hint(df_output, df_task, df_ranks, settings):
        """
        Reverses postprocessing
        """
        df_output = df_output.copy()
        df_output = df_output.merge(df_task[['job', 'task', 'pad_operation']].drop_duplicates(), how='left')
        df_output = df_output.merge(df_ranks[['job', 'pad']], how='left')
        if np.alltrue(df_task['pad_operation'] == PadOperationOptions.disabled.value):
            df_output['pad'] = df_output['job'].apply(lambda x: f'__{x}')
        df_seq = df_output.loc[df_output['pad_operation'] == PadOperationOptions.sequence.value]
        df_dis = df_output.loc[df_output['pad_operation'] == PadOperationOptions.disabled.value]
        df_oth = df_output.loc[~df_output['pad_operation'].
                               isin([PadOperationOptions.sequence.value, PadOperationOptions.disabled.value])]
        for i in [df_seq, df_dis]:
            i['start'] = i.groupby(['pad', 'task'])[['start']].transform('min')
            i['end'] = i.groupby(['pad', 'task'])[['end']].transform('max')
        df_hints = pd.concat([df_seq, df_dis, df_oth], axis=0)
        df_hints = df_hints.groupby(['job', 'task']).agg({
            'machine': 'first',
            'start': 'min',
            'end': 'max'
        }).reset_index()
        df_hints['start'] = (df_hints['start'] - settings['start_program']).astype(int)
        df_hints['end'] = (df_hints['end'] - settings['start_program']).astype(int) + 1
        df_hints['duration'] = df_hints['end'] - df_hints['start']
        df_hints.loc[df_hints['machine'].isnull(), 'machine'] = None
        return df_hints

    @staticmethod
    def harmonize_dtypes(df):
        int_cols_to_replace = dict.fromkeys(df.select_dtypes(np.int64).columns, np.int32)
        df = df.astype(int_cols_to_replace)
        df = df.sort_values(['job', 'task']).reset_index(drop=True)
        df = df.rename(columns={'machine': 'machine_old'})
        machine_newname = df.groupby('machine_old').first().reset_index()
        machine_newname['machine'] = machine_newname['job'].astype(str) + '-' + machine_newname['task'].astype(str)
        df = df.merge(machine_newname[['machine_old', 'machine']], how='left', on=['machine_old'])
        df = df.drop(['machine_old'], axis=1)
        df[['start', 'end', 'duration']] = df[['start', 'end', 'duration']].astype(np.float64)
        return df

    @abstractmethod
    def gen_df_task(self):
        pass

    @abstractmethod
    def gen_df_resource(self):
        pass

    @abstractmethod
    def gen_df_ranks(self):
        pass

    @abstractmethod
    def gen_df_unavailable_days(self):
        pass

    @abstractmethod
    def gen_settings(self):
        pass

    @abstractmethod
    def gen_df_output(self):
        pass


class ScheduleTest1(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = {0: 2, 1: 2}
    pad operations = None
    unlimited resource tasks = None
    task dependencies = linear
    resources = all available
    objective = makespan
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [0, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [1, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [2, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [3, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [4, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [5, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 1, 1, 0, 10000],
                ['t0m1', 1, 1, 0, 10000],
                ['t1m0', 1, 1, 0, 10000],
                ['t1m1', 1, 1, 0, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, np.nan, 'not_started', 0],
                [1, np.nan, 'not_started', 0],
                [2, np.nan, 'not_started', 1],
                [3, np.nan, 'not_started', 1],
                [4, np.nan, 'not_started', 2],
                [5, np.nan, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, 't0m1', 'mob', 45017, 45017, 1],
                [1, 0, 't0m0', 'mob', 45017, 45017, 1],
                [2, 0, 't0m0', 'mob', 45021, 45021, 1],
                [3, 0, 't0m1', 'mob', 45021, 45021, 1],
                [4, 0, 't0m1', 'mob', 45025, 45025, 1],
                [5, 0, 't0m0', 'mob', 45025, 45025, 1],
                [0, 1, 't1m0', 'mob', 45021, 45021, 1],
                [1, 1, 't1m1', 'mob', 45021, 45021, 1],
                [2, 1, 't1m0', 'mob', 45025, 45025, 1],
                [3, 1, 't1m1', 'mob', 45025, 45025, 1],
                [4, 1, 't1m1', 'mob', 45029, 45029, 1],
                [5, 1, 't1m0', 'mob', 45029, 45029, 1],
                [0, 0, 't0m1', 'main', 45018, 45019, 2],
                [1, 0, 't0m0', 'main', 45018, 45019, 2],
                [2, 0, 't0m0', 'main', 45022, 45023, 2],
                [3, 0, 't0m1', 'main', 45022, 45023, 2],
                [4, 0, 't0m1', 'main', 45026, 45027, 2],
                [5, 0, 't0m0', 'main', 45026, 45027, 2],
                [0, 1, 't1m0', 'main', 45022, 45023, 2],
                [1, 1, 't1m1', 'main', 45022, 45023, 2],
                [2, 1, 't1m0', 'main', 45026, 45027, 2],
                [3, 1, 't1m1', 'main', 45026, 45027, 2],
                [4, 1, 't1m1', 'main', 45030, 45031, 2],
                [5, 1, 't1m0', 'main', 45030, 45031, 2],
                [0, 0, 't0m1', 'demob', 45020, 45020, 1],
                [1, 0, 't0m0', 'demob', 45020, 45020, 1],
                [2, 0, 't0m0', 'demob', 45024, 45024, 1],
                [3, 0, 't0m1', 'demob', 45024, 45024, 1],
                [4, 0, 't0m1', 'demob', 45028, 45028, 1],
                [5, 0, 't0m0', 'demob', 45028, 45028, 1],
                [0, 1, 't1m0', 'demob', 45024, 45024, 1],
                [1, 1, 't1m1', 'demob', 45024, 45024, 1],
                [2, 1, 't1m0', 'demob', 45028, 45028, 1],
                [3, 1, 't1m1', 'demob', 45028, 45028, 1],
                [4, 1, 't1m1', 'demob', 45032, 45032, 1],
                [5, 1, 't1m0', 'demob', 45032, 45032, 1],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest2(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = {0: 2}
    pad operations = None
    unlimited resource tasks = task 1 does not require resources
    task dependencies = linear
    resources = resource 1 is unavailable for the first two days of work
    objective = rank
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, None, 2, [0], PadOperationOptions.disabled, False],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 1, 1, 0, 10000],
                ['t0m1', 1, 1, 2, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, 2, 'not_started', 0],
                [1, 3, 'not_started', 0],
                [2, 5, 'not_started', 1],
                [3, 1, 'not_started', 1],
                [4, 6, 'not_started', 2],
                [5, 4, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, 't0m1', 'mob', 45019, 45019, 1],
                [0, 1, None, 'mob', np.nan, np.nan, np.nan],
                [1, 0, 't0m0', 'mob', 45021, 45021, 1],
                [1, 1, None, 'mob', np.nan, np.nan, np.nan],
                [2, 0, 't0m0', 'mob', 45025, 45025, 1],
                [2, 1, None, 'mob', np.nan, np.nan, np.nan],
                [3, 0, 't0m0', 'mob', 45017, 45017, 1],
                [3, 1, None, 'mob', np.nan, np.nan, np.nan],
                [4, 0, 't0m1', 'mob', 45027, 45027, 1],
                [4, 1, None, 'mob', np.nan, np.nan, np.nan],
                [5, 0, 't0m1', 'mob', 45023, 45023, 1],
                [5, 1, None, 'mob', np.nan, np.nan, np.nan],
                [0, 0, 't0m1', 'main', 45020, 45021, 2],
                [0, 1, None, 'main', 45023, 45024, 2],
                [1, 0, 't0m0', 'main', 45022, 45023, 2],
                [1, 1, None, 'main', 45025, 45026, 2],
                [2, 0, 't0m0', 'main', 45026, 45027, 2],
                [2, 1, None, 'main', 45029, 45030, 2],
                [3, 0, 't0m0', 'main', 45018, 45019, 2],
                [3, 1, None, 'main', 45021, 45022, 2],
                [4, 0, 't0m1', 'main', 45028, 45029, 2],
                [4, 1, None, 'main', 45031, 45032, 2],
                [5, 0, 't0m1', 'main', 45024, 45025, 2],
                [5, 1, None, 'main', 45027, 45028, 2],
                [0, 0, 't0m1', 'demob', 45022, 45022, 1],
                [0, 1, None, 'demob', np.nan, np.nan, np.nan],
                [1, 0, 't0m0', 'demob', 45024, 45024, 1],
                [1, 1, None, 'demob', np.nan, np.nan, np.nan],
                [2, 0, 't0m0', 'demob', 45028, 45028, 1],
                [2, 1, None, 'demob', np.nan, np.nan, np.nan],
                [3, 0, 't0m0', 'demob', 45020, 45020, 1],
                [3, 1, None, 'demob', np.nan, np.nan, np.nan],
                [4, 0, 't0m1', 'demob', 45030, 45030, 1],
                [4, 1, None, 'demob', np.nan, np.nan, np.nan],
                [5, 0, 't0m1', 'demob', 45026, 45026, 1],
                [5, 1, None, 'demob', np.nan, np.nan, np.nan],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest3(SchedulingFixture):
    """
    n_jobs = 9
    n_tasks = 3
    n_machines = {0: 2, 1: 2, 2: 2}
    pad operations = {0: disabled, 1: batch, 2: sequence, 3: parallel}
    unlimited resource tasks = None
    task dependencies = linear
    resources = all available
    objective = rank
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [0, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [0, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [0, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [0, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [0, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [1, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [1, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [1, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [1, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [1, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [2, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [2, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [2, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [2, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [2, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [3, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [3, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [3, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [3, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [3, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [4, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [4, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [4, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [4, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [4, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [5, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [5, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [5, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [5, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [5, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [6, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [6, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [6, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [6, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [6, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [6, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [6, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [6, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [7, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [7, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [7, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [7, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [7, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [7, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [7, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [7, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
                [8, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [8, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [8, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [8, 1, 't1m1', 2, [0], PadOperationOptions.batch, True],
                [8, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [8, 2, 't2m1', 2, [1], PadOperationOptions.sequence, True],
                [8, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [8, 3, 't3m1', 2, [2], PadOperationOptions.parallel, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 2, 1, 0, 10000],
                ['t0m1', 2, 1, 0, 10000],
                ['t1m0', 1, 0, 0, 10000],
                ['t1m1', 1, 0, 0, 10000],
                ['t2m0', 0, 1, 0, 10000],
                ['t2m1', 0, 1, 0, 10000],
                ['t3m0', 1, 1, 0, 10000],
                ['t3m1', 1, 1, 0, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, 5, 'not_started', 0],
                [1, 1, 'not_started', 0],
                [2, 9, 'not_started', 0],
                [3, 4, 'not_started', 1],
                [4, 2, 'not_started', 1],
                [5, 6, 'not_started', 1],
                [6, 3, 'not_started', 2],
                [7, 8, 'not_started', 2],
                [8, 7, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [1, 2, 't2m0', 'mob', np.nan, np.nan, np.nan],
                [0, 2, 't2m0', 'mob', np.nan, np.nan, np.nan],
                [2, 2, 't2m0', 'mob', np.nan, np.nan, np.nan],
                [4, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [3, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [5, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [6, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [8, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [7, 2, 't2m1', 'mob', np.nan, np.nan, np.nan],
                [1, 0, 't0m1', 'mob', 45017, 45018, 2],
                [0, 0, 't0m1', 'mob', 45022, 45023, 2],
                [2, 0, 't0m1', 'mob', 45027, 45028, 2],
                [4, 0, 't0m0', 'mob', 45017, 45018, 2],
                [3, 0, 't0m0', 'mob', 45022, 45023, 2],
                [5, 0, 't0m0', 'mob', 45027, 45028, 2],
                [6, 0, 't0m0', 'mob', 45032, 45033, 2],
                [8, 0, 't0m0', 'mob', 45037, 45038, 2],
                [7, 0, 't0m0', 'mob', 45042, 45043, 2],
                [0, 1, 't1m0', 'mob', 45032, 45032, 1],
                [0, 3, 't3m1', 'mob', 45046, 45046, 1],
                [1, 1, 't1m0', 'mob', 45032, 45032, 1],
                [1, 3, 't3m1', 'mob', 45046, 45046, 1],
                [2, 1, 't1m0', 'mob', 45032, 45032, 1],
                [2, 3, 't3m1', 'mob', 45046, 45046, 1],
                [3, 1, 't1m1', 'mob', 45032, 45032, 1],
                [3, 3, 't3m0', 'mob', 45046, 45046, 1],
                [4, 1, 't1m1', 'mob', 45032, 45032, 1],
                [4, 3, 't3m0', 'mob', 45046, 45046, 1],
                [5, 1, 't1m1', 'mob', 45032, 45032, 1],
                [5, 3, 't3m0', 'mob', 45046, 45046, 1],
                [6, 1, 't1m1', 'mob', 45047, 45047, 1],
                [6, 3, 't3m1', 'mob', 45061, 45061, 1],
                [7, 1, 't1m1', 'mob', 45047, 45047, 1],
                [7, 3, 't3m1', 'mob', 45061, 45061, 1],
                [8, 1, 't1m1', 'mob', 45047, 45047, 1],
                [8, 3, 't3m1', 'mob', 45061, 45061, 1],
                [1, 2, 't2m0', 'main', 45039, 45040, 2],
                [0, 2, 't2m0', 'main', 45041, 45042, 2],
                [2, 2, 't2m0', 'main', 45043, 45044, 2],
                [4, 2, 't2m1', 'main', 45039, 45040, 2],
                [3, 2, 't2m1', 'main', 45041, 45042, 2],
                [5, 2, 't2m1', 'main', 45043, 45044, 2],
                [6, 2, 't2m1', 'main', 45054, 45055, 2],
                [8, 2, 't2m1', 'main', 45056, 45057, 2],
                [7, 2, 't2m1', 'main', 45058, 45059, 2],
                [1, 0, 't0m1', 'main', 45019, 45020, 2],
                [0, 0, 't0m1', 'main', 45024, 45025, 2],
                [2, 0, 't0m1', 'main', 45029, 45030, 2],
                [4, 0, 't0m0', 'main', 45019, 45020, 2],
                [3, 0, 't0m0', 'main', 45024, 45025, 2],
                [5, 0, 't0m0', 'main', 45029, 45030, 2],
                [6, 0, 't0m0', 'main', 45034, 45035, 2],
                [8, 0, 't0m0', 'main', 45039, 45040, 2],
                [7, 0, 't0m0', 'main', 45044, 45045, 2],
                [0, 1, 't1m0', 'main', 45033, 45038, 6],
                [0, 3, 't3m1', 'main', 45047, 45048, 2],
                [1, 1, 't1m0', 'main', 45033, 45038, 6],
                [1, 3, 't3m1', 'main', 45047, 45048, 2],
                [2, 1, 't1m0', 'main', 45033, 45038, 6],
                [2, 3, 't3m1', 'main', 45047, 45048, 2],
                [3, 1, 't1m1', 'main', 45033, 45038, 6],
                [3, 3, 't3m0', 'main', 45047, 45048, 2],
                [4, 1, 't1m1', 'main', 45033, 45038, 6],
                [4, 3, 't3m0', 'main', 45047, 45048, 2],
                [5, 1, 't1m1', 'main', 45033, 45038, 6],
                [5, 3, 't3m0', 'main', 45047, 45048, 2],
                [6, 1, 't1m1', 'main', 45048, 45053, 6],
                [6, 3, 't3m1', 'main', 45062, 45063, 2],
                [7, 1, 't1m1', 'main', 45048, 45053, 6],
                [7, 3, 't3m1', 'main', 45062, 45063, 2],
                [8, 1, 't1m1', 'main', 45048, 45053, 6],
                [8, 3, 't3m1', 'main', 45062, 45063, 2],
                [1, 2, 't2m0', 'demob', np.nan, np.nan, np.nan],
                [0, 2, 't2m0', 'demob', np.nan, np.nan, np.nan],
                [2, 2, 't2m0', 'demob', 45045, 45045, 1],
                [4, 2, 't2m1', 'demob', np.nan, np.nan, np.nan],
                [3, 2, 't2m1', 'demob', np.nan, np.nan, np.nan],
                [5, 2, 't2m1', 'demob', 45045, 45045, 1],
                [6, 2, 't2m1', 'demob', np.nan, np.nan, np.nan],
                [8, 2, 't2m1', 'demob', np.nan, np.nan, np.nan],
                [7, 2, 't2m1', 'demob', 45060, 45060, 1],
                [1, 0, 't0m1', 'demob', 45021, 45021, 1],
                [0, 0, 't0m1', 'demob', 45026, 45026, 1],
                [2, 0, 't0m1', 'demob', 45031, 45031, 1],
                [4, 0, 't0m0', 'demob', 45021, 45021, 1],
                [3, 0, 't0m0', 'demob', 45026, 45026, 1],
                [5, 0, 't0m0', 'demob', 45031, 45031, 1],
                [6, 0, 't0m0', 'demob', 45036, 45036, 1],
                [8, 0, 't0m0', 'demob', 45041, 45041, 1],
                [7, 0, 't0m0', 'demob', 45046, 45046, 1],
                [0, 1, 't1m0', 'demob', np.nan, np.nan, np.nan],
                [0, 3, 't3m1', 'demob', 45049, 45049, 1],
                [1, 1, 't1m0', 'demob', np.nan, np.nan, np.nan],
                [1, 3, 't3m1', 'demob', 45049, 45049, 1],
                [2, 1, 't1m0', 'demob', np.nan, np.nan, np.nan],
                [2, 3, 't3m1', 'demob', 45049, 45049, 1],
                [3, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [3, 3, 't3m0', 'demob', 45049, 45049, 1],
                [4, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [4, 3, 't3m0', 'demob', 45049, 45049, 1],
                [5, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [5, 3, 't3m0', 'demob', 45049, 45049, 1],
                [6, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [6, 3, 't3m1', 'demob', 45064, 45064, 1],
                [7, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [7, 3, 't3m1', 'demob', 45064, 45064, 1],
                [8, 1, 't1m1', 'demob', np.nan, np.nan, np.nan],
                [8, 3, 't3m1', 'demob', 45064, 45064, 1],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest4(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 3
    n_machines = {0: 2}
    pad operations = None
    unlimited resource tasks = two consecutive unlimited resources
    task dependencies = linear
    resources = resource 1 is unavailable for the first two days of work
    objective = rank
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [0, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [0, 0, None, 2, [], PadOperationOptions.disabled, False],
                [0, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [1, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [1, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [1, 0, None, 2, [], PadOperationOptions.disabled, False],
                [1, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [2, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [2, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [2, 0, None, 2, [], PadOperationOptions.disabled, False],
                [2, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [3, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [3, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [3, 0, None, 2, [], PadOperationOptions.disabled, False],
                [3, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [4, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [4, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [4, 0, None, 2, [], PadOperationOptions.disabled, False],
                [4, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [5, 2, 't2m0', 2, [1], PadOperationOptions.disabled, True],
                [5, 2, 't2m1', 2, [1], PadOperationOptions.disabled, True],
                [5, 0, None, 2, [], PadOperationOptions.disabled, False],
                [5, 1, None, 2, [0], PadOperationOptions.disabled, False],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t2m0', 1, 1, 0, 10000],
                ['t2m1', 1, 1, 2, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, 2, 'not_started', 0],
                [1, 3, 'not_started', 0],
                [2, 5, 'not_started', 1],
                [3, 1, 'not_started', 1],
                [4, 6, 'not_started', 2],
                [5, 4, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 2, 't2m1', 'mob', 45021, 45021, 1],
                [0, 0, None, 'mob', np.nan, np.nan, np.nan],
                [0, 1, None, 'mob', np.nan, np.nan, np.nan],
                [1, 2, 't2m0', 'mob', 45025, 45025, 1],
                [1, 0, None, 'mob', np.nan, np.nan, np.nan],
                [1, 1, None, 'mob', np.nan, np.nan, np.nan],
                [2, 2, 't2m0', 'mob', 45029, 45029, 1],
                [2, 0, None, 'mob', np.nan, np.nan, np.nan],
                [2, 1, None, 'mob', np.nan, np.nan, np.nan],
                [3, 2, 't2m0', 'mob', 45021, 45021, 1],
                [3, 0, None, 'mob', np.nan, np.nan, np.nan],
                [3, 1, None, 'mob', np.nan, np.nan, np.nan],
                [4, 2, 't2m1', 'mob', 45029, 45029, 1],
                [4, 0, None, 'mob', np.nan, np.nan, np.nan],
                [4, 1, None, 'mob', np.nan, np.nan, np.nan],
                [5, 2, 't2m1', 'mob', 45025, 45025, 1],
                [5, 0, None, 'mob', np.nan, np.nan, np.nan],
                [5, 1, None, 'mob', np.nan, np.nan, np.nan],
                [0, 2, 't2m1', 'main', 45022, 45023, 2],
                [0, 0, None, 'main', 45017, 45018, 2],
                [0, 1, None, 'main', 45019, 45020, 2],
                [1, 2, 't2m0', 'main', 45026, 45027, 2],
                [1, 0, None, 'main', 45021, 45022, 2],
                [1, 1, None, 'main', 45023, 45024, 2],
                [2, 2, 't2m0', 'main', 45030, 45031, 2],
                [2, 0, None, 'main', 45025, 45026, 2],
                [2, 1, None, 'main', 45027, 45028, 2],
                [3, 2, 't2m0', 'main', 45022, 45023, 2],
                [3, 0, None, 'main', 45017, 45018, 2],
                [3, 1, None, 'main', 45019, 45020, 2],
                [4, 2, 't2m1', 'main', 45030, 45031, 2],
                [4, 0, None, 'main', 45025, 45026, 2],
                [4, 1, None, 'main', 45027, 45028, 2],
                [5, 2, 't2m1', 'main', 45026, 45027, 2],
                [5, 0, None, 'main', 45021, 45022, 2],
                [5, 1, None, 'main', 45023, 45024, 2],
                [0, 2, 't2m1', 'demob', 45024, 45024, 1],
                [0, 0, None, 'demob', np.nan, np.nan, np.nan],
                [0, 1, None, 'demob', np.nan, np.nan, np.nan],
                [1, 2, 't2m0', 'demob', 45028, 45028, 1],
                [1, 0, None, 'demob', np.nan, np.nan, np.nan],
                [1, 1, None, 'demob', np.nan, np.nan, np.nan],
                [2, 2, 't2m0', 'demob', 45032, 45032, 1],
                [2, 0, None, 'demob', np.nan, np.nan, np.nan],
                [2, 1, None, 'demob', np.nan, np.nan, np.nan],
                [3, 2, 't2m0', 'demob', 45024, 45024, 1],
                [3, 0, None, 'demob', np.nan, np.nan, np.nan],
                [3, 1, None, 'demob', np.nan, np.nan, np.nan],
                [4, 2, 't2m1', 'demob', 45032, 45032, 1],
                [4, 0, None, 'demob', np.nan, np.nan, np.nan],
                [4, 1, None, 'demob', np.nan, np.nan, np.nan],
                [5, 2, 't2m1', 'demob', 45028, 45028, 1],
                [5, 0, None, 'demob', np.nan, np.nan, np.nan],
                [5, 1, None, 'demob', np.nan, np.nan, np.nan],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest5(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = 0
    pad operations = None
    unlimited resource tasks = all unlimited resources
    task dependencies = linear
    objective = rank
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, None, 2, [], PadOperationOptions.disabled, False],
                [0, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [1, 0, None, 2, [], PadOperationOptions.disabled, False],
                [1, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [2, 0, None, 2, [], PadOperationOptions.disabled, False],
                [2, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [3, 0, None, 2, [], PadOperationOptions.disabled, False],
                [3, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [4, 0, None, 2, [], PadOperationOptions.disabled, False],
                [4, 1, None, 2, [0], PadOperationOptions.disabled, False],
                [5, 0, None, 2, [], PadOperationOptions.disabled, False],
                [5, 1, None, 2, [0], PadOperationOptions.disabled, False],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame()
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, 2, 'not_started', 0],
                [1, 3, 'not_started', 0],
                [2, 5, 'not_started', 1],
                [3, 1, 'not_started', 1],
                [4, 6, 'not_started', 2],
                [5, 4, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, None, 'mob', np.nan, np.nan, np.nan],
                [1, 0, None, 'mob', np.nan, np.nan, np.nan],
                [2, 0, None, 'mob', np.nan, np.nan, np.nan],
                [3, 0, None, 'mob', np.nan, np.nan, np.nan],
                [4, 0, None, 'mob', np.nan, np.nan, np.nan],
                [5, 0, None, 'mob', np.nan, np.nan, np.nan],
                [0, 1, None, 'mob', np.nan, np.nan, np.nan],
                [1, 1, None, 'mob', np.nan, np.nan, np.nan],
                [2, 1, None, 'mob', np.nan, np.nan, np.nan],
                [3, 1, None, 'mob', np.nan, np.nan, np.nan],
                [4, 1, None, 'mob', np.nan, np.nan, np.nan],
                [5, 1, None, 'mob', np.nan, np.nan, np.nan],
                [0, 0, None, 'main', 45017, 45018, 2],
                [1, 0, None, 'main', 45017, 45018, 2],
                [2, 0, None, 'main', 45017, 45018, 2],
                [3, 0, None, 'main', 45017, 45018, 2],
                [4, 0, None, 'main', 45017, 45018, 2],
                [5, 0, None, 'main', 45017, 45018, 2],
                [0, 1, None, 'main', 45019, 45020, 2],
                [1, 1, None, 'main', 45019, 45020, 2],
                [2, 1, None, 'main', 45019, 45020, 2],
                [3, 1, None, 'main', 45019, 45020, 2],
                [4, 1, None, 'main', 45019, 45020, 2],
                [5, 1, None, 'main', 45019, 45020, 2],
                [0, 0, None, 'demob', np.nan, np.nan, np.nan],
                [1, 0, None, 'demob', np.nan, np.nan, np.nan],
                [2, 0, None, 'demob', np.nan, np.nan, np.nan],
                [3, 0, None, 'demob', np.nan, np.nan, np.nan],
                [4, 0, None, 'demob', np.nan, np.nan, np.nan],
                [5, 0, None, 'demob', np.nan, np.nan, np.nan],
                [0, 1, None, 'demob', np.nan, np.nan, np.nan],
                [1, 1, None, 'demob', np.nan, np.nan, np.nan],
                [2, 1, None, 'demob', np.nan, np.nan, np.nan],
                [3, 1, None, 'demob', np.nan, np.nan, np.nan],
                [4, 1, None, 'demob', np.nan, np.nan, np.nan],
                [5, 1, None, 'demob', np.nan, np.nan, np.nan],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest6(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = {0: 2, 1: 2}
    pad operations = None
    unlimited resource tasks = None
    task dependencies = linear
    resources = all available
    objective = makespan
    statuses = variations
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [0, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [1, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [2, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [3, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [4, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [5, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 1, 1, 0, 10000],
                ['t0m1', 1, 1, 0, 10000],
                ['t1m0', 1, 1, 0, 10000],
                ['t1m1', 1, 1, 0, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, np.nan, 'not_started', 0],
                [1, np.nan, 0, 0],
                [2, np.nan, 1, 1],
                [3, np.nan, 'not_started', 1],
                [4, np.nan, 1, 2],
                [5, np.nan, 1, 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 'mob', 45017.0, 45017.0, 1.0],
                [3, 0, 't0m1', 'mob', 45017.0, 45017.0, 1.0],
                [0, 1, 't1m0', 'mob', 45021.0, 45021.0, 1.0],
                [1, 1, 't1m1', 'mob', 45017.0, 45017.0, 1.0],
                [3, 1, 't1m1', 'mob', 45021.0, 45021.0, 1.0],
                [0, 0, 't0m0', 'main', 45018.0, 45019.0, 2.0],
                [3, 0, 't0m1', 'main', 45018.0, 45019.0, 2.0],
                [0, 1, 't1m0', 'main', 45022.0, 45023.0, 2.0],
                [1, 1, 't1m1', 'main', 45018.0, 45019.0, 2.0],
                [3, 1, 't1m1', 'main', 45022.0, 45023.0, 2.0],
                [0, 0, 't0m0', 'demob', 45020.0, 45020.0, 1.0],
                [3, 0, 't0m1', 'demob', 45020.0, 45020.0, 1.0],
                [0, 1, 't1m0', 'demob', 45024.0, 45024.0, 1.0],
                [1, 1, 't1m1', 'demob', 45020.0, 45020.0, 1.0],
                [3, 1, 't1m1', 'demob', 45024.0, 45024.0, 1.0],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest7(SchedulingFixture):
    """
    n_jobs = 9
    n_tasks = 3
    n_machines = {0: 1, 1: 1, 2: 1}
    pad operations = {0: disabled, 1: batch, 2: sequence, 3: parallel}
    unlimited resource tasks = None
    task dependencies = linear
    resources = all available
    objective = ranks but partially populated
    status = variations
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [0, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [0, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [1, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [1, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [2, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [2, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [3, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [3, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [4, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [4, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [5, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [5, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [6, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [6, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [6, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [6, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [7, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [7, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [7, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [7, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
                [8, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [8, 1, 't1m0', 2, [0], PadOperationOptions.batch, True],
                [8, 2, 't2m0', 2, [1], PadOperationOptions.sequence, True],
                [8, 3, 't3m0', 2, [2], PadOperationOptions.parallel, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 2, 1, 0, 10000],
                ['t1m0', 1, 0, 0, 10000],
                ['t2m0', 0, 1, 0, 10000],
                ['t3m0', 1, 1, 0, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, 5, 2, 0],
                [1, 1, 3, 0],
                [2, np.nan, 'not_started', 0],
                [3, np.nan, 'not_started', 1],
                [4, np.nan, 'not_started', 1],
                [5, np.nan, 'not_started', 1],
                [6, 3, 'not_started', 2],
                [7, np.nan, 1, 2],
                [8, 7, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        nan = np.nan
        df_output = pd.DataFrame(
            data=[
                [2, 2, 't2m0', 'mob', nan, nan, nan],
                [3, 2, 't2m0', 'mob', nan, nan, nan],
                [4, 2, 't2m0', 'mob', nan, nan, nan],
                [5, 2, 't2m0', 'mob', nan, nan, nan],
                [6, 2, 't2m0', 'mob', nan, nan, nan],
                [8, 2, 't2m0', 'mob', nan, nan, nan],
                [7, 2, 't2m0', 'mob', nan, nan, nan],
                [2, 0, 't0m0', 'mob', 45017.0, 45018.0, 2.0],
                [3, 0, 't0m0', 'mob', 45032.0, 45033.0, 2.0],
                [4, 0, 't0m0', 'mob', 45037.0, 45038.0, 2.0],
                [5, 0, 't0m0', 'mob', 45042.0, 45043.0, 2.0],
                [6, 0, 't0m0', 'mob', 45022.0, 45023.0, 2.0],
                [8, 0, 't0m0', 'mob', 45027.0, 45028.0, 2.0],
                [0, 3, 't3m0', 'mob', 45028.0, 45028.0, 1.0],
                [2, 1, 't1m0', 'mob', 45022.0, 45022.0, 1.0],
                [2, 3, 't3m0', 'mob', 45028.0, 45028.0, 1.0],
                [3, 1, 't1m0', 'mob', 45047.0, 45047.0, 1.0],
                [3, 3, 't3m0', 'mob', 45061.0, 45061.0, 1.0],
                [4, 1, 't1m0', 'mob', 45047.0, 45047.0, 1.0],
                [4, 3, 't3m0', 'mob', 45061.0, 45061.0, 1.0],
                [5, 1, 't1m0', 'mob', 45047.0, 45047.0, 1.0],
                [5, 3, 't3m0', 'mob', 45061.0, 45061.0, 1.0],
                [6, 1, 't1m0', 'mob', 45032.0, 45032.0, 1.0],
                [6, 3, 't3m0', 'mob', 45044.0, 45044.0, 1.0],
                [7, 3, 't3m0', 'mob', 45044.0, 45044.0, 1.0],
                [8, 1, 't1m0', 'mob', 45032.0, 45032.0, 1.0],
                [8, 3, 't3m0', 'mob', 45044.0, 45044.0, 1.0],
                [2, 2, 't2m0', 'main', 45025.0, 45026.0, 2.0],
                [3, 2, 't2m0', 'main', 45054.0, 45055.0, 2.0],
                [4, 2, 't2m0', 'main', 45056.0, 45057.0, 2.0],
                [5, 2, 't2m0', 'main', 45058.0, 45059.0, 2.0],
                [6, 2, 't2m0', 'main', 45037.0, 45038.0, 2.0],
                [8, 2, 't2m0', 'main', 45039.0, 45040.0, 2.0],
                [7, 2, 't2m0', 'main', 45041.0, 45042.0, 2.0],
                [2, 0, 't0m0', 'main', 45019.0, 45020.0, 2.0],
                [3, 0, 't0m0', 'main', 45034.0, 45035.0, 2.0],
                [4, 0, 't0m0', 'main', 45039.0, 45040.0, 2.0],
                [5, 0, 't0m0', 'main', 45044.0, 45045.0, 2.0],
                [6, 0, 't0m0', 'main', 45024.0, 45025.0, 2.0],
                [8, 0, 't0m0', 'main', 45029.0, 45030.0, 2.0],
                [0, 3, 't3m0', 'main', 45029.0, 45030.0, 2.0],
                [2, 1, 't1m0', 'main', 45023.0, 45024.0, 2.0],
                [2, 3, 't3m0', 'main', 45029.0, 45030.0, 2.0],
                [3, 1, 't1m0', 'main', 45048.0, 45053.0, 6.0],
                [3, 3, 't3m0', 'main', 45062.0, 45063.0, 2.0],
                [4, 1, 't1m0', 'main', 45048.0, 45053.0, 6.0],
                [4, 3, 't3m0', 'main', 45062.0, 45063.0, 2.0],
                [5, 1, 't1m0', 'main', 45048.0, 45053.0, 6.0],
                [5, 3, 't3m0', 'main', 45062.0, 45063.0, 2.0],
                [6, 1, 't1m0', 'main', 45033.0, 45036.0, 4.0],
                [6, 3, 't3m0', 'main', 45045.0, 45046.0, 2.0],
                [7, 3, 't3m0', 'main', 45045.0, 45046.0, 2.0],
                [8, 1, 't1m0', 'main', 45033.0, 45036.0, 4.0],
                [8, 3, 't3m0', 'main', 45045.0, 45046.0, 2.0],
                [2, 2, 't2m0', 'demob', 45027.0, 45027.0, 1.0],
                [3, 2, 't2m0', 'demob', nan, nan, nan],
                [4, 2, 't2m0', 'demob', nan, nan, nan],
                [5, 2, 't2m0', 'demob', 45060.0, 45060.0, 1.0],
                [6, 2, 't2m0', 'demob', nan, nan, nan],
                [8, 2, 't2m0', 'demob', nan, nan, nan],
                [7, 2, 't2m0', 'demob', 45043.0, 45043.0, 1.0],
                [2, 0, 't0m0', 'demob', 45021.0, 45021.0, 1.0],
                [3, 0, 't0m0', 'demob', 45036.0, 45036.0, 1.0],
                [4, 0, 't0m0', 'demob', 45041.0, 45041.0, 1.0],
                [5, 0, 't0m0', 'demob', 45046.0, 45046.0, 1.0],
                [6, 0, 't0m0', 'demob', 45026.0, 45026.0, 1.0],
                [8, 0, 't0m0', 'demob', 45031.0, 45031.0, 1.0],
                [0, 3, 't3m0', 'demob', 45031.0, 45031.0, 1.0],
                [2, 1, 't1m0', 'demob', nan, nan, nan],
                [2, 3, 't3m0', 'demob', 45031.0, 45031.0, 1.0],
                [3, 1, 't1m0', 'demob', nan, nan, nan],
                [3, 3, 't3m0', 'demob', 45064.0, 45064.0, 1.0],
                [4, 1, 't1m0', 'demob', nan, nan, nan],
                [4, 3, 't3m0', 'demob', 45064.0, 45064.0, 1.0],
                [5, 1, 't1m0', 'demob', nan, nan, nan],
                [5, 3, 't3m0', 'demob', 45064.0, 45064.0, 1.0],
                [6, 1, 't1m0', 'demob', nan, nan, nan],
                [6, 3, 't3m0', 'demob', 45047.0, 45047.0, 1.0],
                [7, 3, 't3m0', 'demob', 45047.0, 45047.0, 1.0],
                [8, 1, 't1m0', 'demob', nan, nan, nan],
                [8, 3, 't3m0', 'demob', 45047.0, 45047.0, 1.0],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest8(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = {0: 2, 1: 2}
    pad operations = None
    unlimited resource tasks = None
    task dependencies = linear
    resources = available_to for task1 renders schedule infeasible
    objective = rank
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [0, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [1, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [2, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [3, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [4, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [5, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 1, 1, 0, 10000],
                ['t0m1', 1, 1, 0, 10],
                ['t1m0', 1, 1, 0, 10],
                ['t1m1', 1, 1, 0, 10],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, np.nan, 'not_started', 0],
                [1, np.nan, 'not_started', 0],
                [2, np.nan, 'not_started', 1],
                [3, np.nan, 'not_started', 1],
                [4, np.nan, 'not_started', 2],
                [5, np.nan, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        return pd.DataFrame({})

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 'mob', 45017, 45017, 1],
                [1, 0, 't0m1', 'mob', 45017, 45017, 1],
                [0, 1, 't1m0', 'mob', 45021, 45021, 1],
                [1, 1, 't1m1', 'mob', 45021, 45021, 1],
                [0, 0, 't0m0', 'main', 45018, 45019, 2],
                [1, 0, 't0m1', 'main', 45018, 45019, 2],
                [0, 1, 't1m0', 'main', 45022, 45023, 2],
                [1, 1, 't1m1', 'main', 45022, 45023, 2],
                [0, 0, 't0m0', 'demob', 45020, 45020, 1],
                [1, 0, 't0m1', 'demob', 45020, 45020, 1],
                [0, 1, 't1m0', 'demob', 45024, 45024, 1],
                [1, 1, 't1m1', 'demob', 45024, 45024, 1],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output


class ScheduleTest9(SchedulingFixture):
    """
    n_jobs = 6
    n_tasks = 2
    n_machines = {0: 2, 1: 2}
    pad operations = None
    unlimited resource tasks = None
    task dependencies = linear
    resources = all available
    objective = makespan
    unavailable_days = present
    """
    def gen_df_task(self):
        df_task = pd.DataFrame(
            data=[
                [0, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [0, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [0, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [0, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [1, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [1, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [1, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [1, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [2, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [2, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [2, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [2, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [3, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [3, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [3, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [3, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [4, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [4, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [4, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [4, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
                [5, 0, 't0m0', 2, [], PadOperationOptions.disabled, True],
                [5, 0, 't0m1', 2, [], PadOperationOptions.disabled, True],
                [5, 1, 't1m0', 2, [0], PadOperationOptions.disabled, True],
                [5, 1, 't1m1', 2, [0], PadOperationOptions.disabled, True],
            ],
            columns=[
                'job', 'task', 'machine', 'duration_base', 'previous_tasks', 'pad_operation', 'requires_resources'
            ],
        )
        return df_task

    def gen_df_resource(self):
        df_resource = pd.DataFrame(
            data=[
                ['t0m0', 1, 1, 0, 10000],
                ['t0m1', 1, 1, 0, 10000],
                ['t1m0', 1, 1, 0, 10000],
                ['t1m1', 1, 1, 0, 10000],
            ],
            columns=['machine', 'mobilization', 'demobilization', 'available_from', 'available_to'],
        )
        return df_resource

    def gen_df_ranks(self):
        df_ranks = pd.DataFrame(
            data=[
                [0, np.nan, 'not_started', 0],
                [1, np.nan, 'not_started', 0],
                [2, np.nan, 'not_started', 1],
                [3, np.nan, 'not_started', 1],
                [4, np.nan, 'not_started', 2],
                [5, np.nan, 'not_started', 2],
            ],
            columns=['job', 'rank', 'status', 'pad'],
        )
        return df_ranks

    def gen_df_unavailable_days(self):
        df_unavailable_days = pd.DataFrame(
            data=[
                ['t0m0', 2, 3],
                ['t0m0', 7, 10],
                ['t1m0', 14, 16],
                ['t1m1', 14, 16],
            ],
            columns=['machine', 'start', 'end'],
        )
        return df_unavailable_days

    def gen_settings(self):
        settings = {'start_program': 45017, 'objective_fn': 'rank', 'uniform_duration_by_jobtask': True}
        return settings

    def gen_df_output(self):
        df_output = pd.DataFrame(
            data=[
                [0, 0, 't0m1', 'mob', 45017, 45017, 1],
                [1, 0, 't0m0', 'mob', 45020, 45020, 1],
                [2, 0, 't0m1', 'mob', 45021, 45021, 1],
                [3, 0, 't0m1', 'mob', 45025, 45025, 1],
                [4, 0, 't0m0', 'mob', 45027, 45027, 1],
                [5, 0, 't0m1', 'mob', 45029, 45029, 1],
                [0, 1, 't1m0', 'mob', 45021, 45021, 1],
                [1, 1, 't1m1', 'mob', 45024, 45024, 1],
                [2, 1, 't1m0', 'mob', 45025, 45025, 1],
                [3, 1, 't1m0', 'mob', 45033, 45033, 1],
                [4, 1, 't1m1', 'mob', 45033, 45033, 1],
                [5, 1, 't1m0', 'mob', 45037, 45037, 1],
                [0, 0, 't0m1', 'main', 45018, 45019, 2],
                [1, 0, 't0m0', 'main', 45021, 45022, 2],
                [2, 0, 't0m1', 'main', 45022, 45023, 2],
                [3, 0, 't0m1', 'main', 45026, 45027, 2],
                [4, 0, 't0m0', 'main', 45028, 45029, 2],
                [5, 0, 't0m1', 'main', 45030, 45031, 2],
                [0, 1, 't1m0', 'main', 45022, 45023, 2],
                [1, 1, 't1m1', 'main', 45025, 45026, 2],
                [2, 1, 't1m0', 'main', 45026, 45027, 2],
                [3, 1, 't1m0', 'main', 45034, 45035, 2],
                [4, 1, 't1m1', 'main', 45034, 45035, 2],
                [5, 1, 't1m0', 'main', 45038, 45039, 2],
                [0, 0, 't0m1', 'demob', 45020, 45020, 1],
                [1, 0, 't0m0', 'demob', 45023, 45023, 1],
                [2, 0, 't0m1', 'demob', 45024, 45024, 1],
                [3, 0, 't0m1', 'demob', 45028, 45028, 1],
                [4, 0, 't0m0', 'demob', 45030, 45030, 1],
                [5, 0, 't0m1', 'demob', 45032, 45032, 1],
                [0, 1, 't1m0', 'demob', 45024, 45024, 1],
                [1, 1, 't1m1', 'demob', 45027, 45027, 1],
                [2, 1, 't1m0', 'demob', 45028, 45028, 1],
                [3, 1, 't1m0', 'demob', 45036, 45036, 1],
                [4, 1, 't1m1', 'demob', 45036, 45036, 1],
                [5, 1, 't1m0', 'demob', 45040, 45040, 1],
            ],
            columns=['job', 'task', 'machine', 'subtask', 'start', 'end', 'duration'],
        )
        return df_output
