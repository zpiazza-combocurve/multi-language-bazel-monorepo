import collections
from bson.objectid import ObjectId
from typing import TYPE_CHECKING, Optional, Union
import numpy as np
import pandas as pd
from ortools.sat.python import cp_model
from threading import Timer

from combocurve.science.scheduling.scheduling_data_models import PadOperationOptions

if TYPE_CHECKING:
    from jobs.scheduling.context import SchedulingContext

DEFAULT_CSP_TIMEOUT = 3300
SOLVER_SEED = 10


class NotificationCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self,
                 context: 'SchedulingContext',
                 notification_id: ObjectId,
                 user_id: ObjectId,
                 n_wells: int,
                 logger: bool = False):
        super().__init__()
        self.notification_id = notification_id
        self.user_id = user_id
        self.context = context
        self._timer = None
        if n_wells <= 2000:
            self._timer_limit = 120
        else:
            self._timer_limit = 240
        self.logger = logger
        if self.logger:
            self._solution_count = 0
            self.log = []

    def initiate_progress(self):
        self.context.notification_service.notify_progress(self.notification_id, self.user_id, 0)

    def finalize_progress(self):
        self.context.notification_service.notify_progress(self.notification_id, self.user_id, 100)

    def _reset_timer(self):
        if self._timer:
            self._timer.cancel()
        self._timer = Timer(self._timer_limit, self.StopSearch)
        self._timer.start()

    def StopSearch(self):
        super().StopSearch()

    def OnSolutionCallback(self):
        wall_time = self.WallTime()
        max_time = float(DEFAULT_CSP_TIMEOUT)
        progress: float = wall_time / max_time * 100
        self._reset_timer()
        if self.logger:
            self._solution_count += 1
            self.log.append({'sol_id': self._solution_count, 'obj': self.ObjectiveValue(), 'wall_time': wall_time})
        self.context.notification_service.notify_progress(self.notification_id, self.user_id, progress)


class OrtoolsSchedulerSkeleton:

    durations: dict
    ends: dict
    header: dict
    intervals_per_resource: collections.defaultdict(list)
    job_ends: dict
    lkup: dict
    l_durations: dict
    l_ends: dict
    l_presences: collections.defaultdict(list)
    l_starts: dict
    presences: dict
    settings: dict
    starts: dict
    unlimited_previous_end: dict
    unlimited_next_start: dict
    _tpm_flags: dict
    _unlimited_behaviour: dict

    callback: NotificationCallback
    df_assignment: Optional[pd.DataFrame]
    df_hints: pd.DataFrame
    df_output: Optional[pd.DataFrame]
    df_ranks: pd.DataFrame
    df_resource: pd.DataFrame
    df_task: pd.DataFrame
    df_task_merge: pd.DataFrame
    df_unavailable_days: pd.DataFrame
    _jobtask_stats: pd.DataFrame
    _taskpad_stats: pd.DataFrame
    _well_order_within_pads: pd.DataFrame

    _horizon: int

    model: cp_model.CpModel

    obj: Union[cp_model.IntVar, cp_model.LinearExpr]

    def __init__(self,
                 settings: dict,
                 df_task: pd.DataFrame,
                 df_resource: pd.DataFrame,
                 df_ranks: pd.DataFrame,
                 df_unavailable_days: pd.DataFrame = pd.DataFrame({}),
                 df_hints: pd.DataFrame = pd.DataFrame({}),
                 horizon: int = None):
        """
        Parameters
        ----------
        settings
            Global settings

            =================  =========================================================================================
            start_program      commence date for all tasks (as `int`)
            objective_fn       one of ['rank', 'makespan']
            =================  =========================================================================================

        df_task
            job-task-machine attributes.

            =================  =========================================================================================
            job                job id (as `int` or `str`)
            task               task id (as `int` or `str`)
            previous_tasks     directly connected previous task ids (as list)
            machine            machine id (as `int` or `str`)
            duration_base      days for machine to complete job-task pair (as `int`)
            pad_operation      pad constraints (as `str`). One of ['batch', 'disabled', 'parallel', 'sequence']). Broadc
                               -ast across pad-task pairs.
                               If `disabled` - no additional constraints based on pad column
                               If `sequence` - resources may not transition to a new pad until the step is complete for
                               all wells on the current pad
                               If `batch` - same logic as `sequence` but in a postprocessing step, replace well start an
                               -d end dates with pad start and end dates
                               If `parallel` - for tasks that only need to occur once to support the entire pad
            requires_resource  False if unlimited resources and True otherwise (`bool`). Honours pad constraints
            -s
            =================  =========================================================================================

        df_resource
            machine attributes.

            =================  =========================================================================================
            machine            machine id (as `int` or `str`)
            mobilization       lead time before a resource can commence work (as `int`)
            demobilization     delay before a resource can be allocated to a new task
            available_from     first day resource can start work (as `int`. unit is days since base_day)
            available_to       last day resource can finish work (as `int`. unit is days since base_day)
            work_on_weekends   [NOT IMPLEMENTED] true if resources work weekends (as `bool`), false otherwise
            =================  =========================================================================================

        df_ranks
            job-level attributes including priority.

            =================  =========================================================================================
            job                job id (as `int` or `str`)
            rank               job priority. Lower ranks will be scheduled to finish first (as `int`)
            pad                pad id (as `int`)
            status             last job completed
            =================  =========================================================================================

        df_unavailable_days
            (Optional) Days when resource is offline (intended for cases when resources have heterogeneous unavailabilit
            -ies). Each row represents a unique interval. Can have multiple intervals for a single resource.

            =================  =========================================================================================
            machine            machine id (as `int` or `str`)
            start              start of unavailability interval (as `int`. If work_on_weekends=False unit is days since
                               base_day else use business days)
            end                end of unavailability interval (as `int`. If work_on_weekends=False unit is days since ba
                               -se_day else use business days)
            =================  =========================================================================================
        """
        settings['uniform_duration_by_jobtask'] = settings.get('uniform_duration_by_jobtask', True)
        self.settings = settings
        df_ranks.loc[df_ranks['pad'].isnull(), 'pad'] = df_ranks.loc[df_ranks['pad'].isnull(),
                                                                     'job'].apply(lambda x: f'__{x}')
        if np.alltrue(df_task['pad_operation'] == PadOperationOptions.disabled):
            df_ranks['pad'] = df_ranks['job'].apply(lambda x: f'__{x}')
        self.df_task, self.lkup = self._convert_ids(df_task, ['job', 'task', 'machine'], {})
        self.df_task['previous_tasks'] = self.df_task['previous_tasks'].apply(
            lambda x: [self.lkup['task'][i] for i in x])
        self.df_resource, _ = self._convert_ids(df_resource, ['machine'], self.lkup)
        self.lkup['status'] = self.lkup['task']
        self.df_ranks, self.lkup = self._convert_ids(df_ranks, ['job', 'pad', 'status'], self.lkup)
        if len(df_unavailable_days):
            df_unavailable_days, _ = self._convert_ids(df_unavailable_days, ['machine'], self.lkup)
        self.df_unavailable_days = df_unavailable_days
        if len(df_hints):
            df_hints, _ = self._convert_ids(df_hints, ['job', 'task', 'machine'], self.lkup)
        self.df_hints = df_hints
        self.df_task_merge, self.df_ranks, self._horizon = self.preprocess(self.df_task, self.df_resource,
                                                                           self.df_ranks, horizon)
        self.df_task_merge['machine'] = self.df_task_merge['machine'].astype(int)
        self.model = cp_model.CpModel()
        self.df_assignment = None
        self.df_output = None

    def preprocess(self, df_task, df_resource, df_ranks, horizon):
        df_ranks['rank'] = df_ranks['rank'].rank(method='dense', na_option='bottom')
        df_ranks['rank_raw'] = df_ranks['rank']
        df_ranks['rank'] = df_ranks.groupby(['pad'])[['rank']].transform('min')
        df_task = df_task.merge(df_ranks[['job', 'pad', 'status', 'rank', 'rank_raw']].drop_duplicates(),
                                on='job',
                                how='left')
        if not df_task['requires_resources'].all():
            self._unlimited_behaviour = self._gen_unlimited_behaviour(df_task)
        df_task = self.purge_completed_tasks(df_task)
        if PadOperationOptions.batch.value in df_task[
                'pad_operation'].values or PadOperationOptions.sequence.value in df_task[
                    'pad_operation'].values or PadOperationOptions.disabled.value in df_task['pad_operation'].values:
            mask = df_task['pad_operation'].isin([
                PadOperationOptions.disabled.value, PadOperationOptions.sequence.value, PadOperationOptions.batch.value
            ])
            df_task.loc[mask,
                        'duration_base'] = df_task.loc[mask].groupby(['pad', 'task',
                                                                      'machine'])[['duration_base']].transform('sum')
        if not df_resource.empty:
            df_task_merge = df_task.merge(df_resource, on=['machine'], how='left')
            max_availability = df_resource['available_to'].max()
        else:
            df_task_merge = df_task.copy()
            df_task_merge[['mobilization', 'demobilization', 'available_from', 'available_to']] = np.nan
            df_task_merge['work_on_weekends'] = ''
            max_availability = 0
        subtask_columns = ['duration_base', 'mobilization', 'demobilization']
        if horizon is None:
            horizon = df_task_merge.groupby(['job', 'task'])[subtask_columns].max().sum().sum()
        horizon = int(max(horizon, max_availability))
        df_task_merge.loc[df_task_merge['mobilization'].isnull(), 'mobilization'] = 0
        df_task_merge.loc[df_task_merge['demobilization'].isnull(), 'demobilization'] = 0
        df_task_merge.loc[df_task_merge['available_from'].isnull(), 'available_from'] = 0
        df_task_merge.loc[df_task_merge['available_to'].isnull(), 'available_to'] = horizon
        df_task_merge = self.extend_resource_lifetimes(df_task_merge, df_resource, horizon)
        if PadOperationOptions.disabled.value in df_task_merge['pad_operation'].values:
            mask = df_task_merge['pad_operation'].isin([PadOperationOptions.disabled.value])
            df_task_merge.loc[mask, 'mobilization'] = df_task_merge.loc[mask].groupby(['pad', 'task',
                                                                                       'machine'])[['mobilization'
                                                                                                    ]].transform('sum')
            df_task_merge.loc[mask,
                              'demobilization'] = df_task_merge.loc[mask].groupby(['pad', 'task',
                                                                                   'machine'])[['demobilization'
                                                                                                ]].transform('sum')
        df_task_merge[['mobilization', 'demobilization', 'available_from', 'available_to'
                       ]] = df_task_merge[['mobilization', 'demobilization', 'available_from',
                                           'available_to']].astype(int)
        df_task_merge['duration'] = df_task_merge[subtask_columns].sum(axis=1).astype(int)
        return df_task_merge, df_ranks, horizon

    def get_descendents(self, all_descendents, task_tree, ancestor, t):
        children = task_tree[t]['previous_tasks']
        all_descendents[ancestor].update(children)
        for c in children:
            self.get_descendents(all_descendents, task_tree, ancestor, c)

    def purge_completed_tasks(self, df_task):
        j1 = df_task.iloc[0]['job']
        task_tree = df_task[df_task['job'] == j1][['task', 'previous_tasks']]
        task_tree['previous_tasks'] = task_tree['previous_tasks'].apply(lambda x: tuple(x))
        task_tree = task_tree.drop_duplicates().set_index('task').to_dict('index')
        all_descendents = collections.defaultdict(set)
        for t in task_tree:
            self.get_descendents(all_descendents, task_tree, t, t)
            all_descendents[t].add(t)
        df_task['do_not_schedule'] = df_task[['task',
                                              'status']].apply(lambda x: x['task'] in all_descendents[x['status']],
                                                               axis=1)
        self.do_not_schedule_summary = df_task.loc[df_task['do_not_schedule'], ['job', 'task']].drop_duplicates().values
        df_task = df_task.loc[~df_task['do_not_schedule']].reset_index(drop=True)
        return df_task

    def extend_resource_lifetimes(self, df_task_merge, df_resource, horizon):
        self.resources_with_extended_lifetimes = {}
        df_task_merge_sml = df_task_merge[df_task_merge['requires_resources']]
        task_machine_pairs = df_task_merge_sml[['task', 'machine'
                                                ]].drop_duplicates().groupby(['task'])['machine'].apply(list).to_dict()
        if not df_resource.empty:
            df_resource = df_resource.copy()
            for t in task_machine_pairs:
                if pd.notnull(task_machine_pairs[t][0]):
                    self.resources_with_extended_lifetimes[t] = df_resource.iloc[df_resource[
                        df_resource['machine'].isin(task_machine_pairs[t])]['available_to'].idxmax()]['machine']
            df_task_merge.loc[df_task_merge['machine'].isin(self.resources_with_extended_lifetimes.values()),
                              'available_to'] = horizon
        return df_task_merge

    def _gen_unlimited_behaviour(self, df_task):
        job_for_template = df_task.iloc[0]['job']
        df_template = df_task[df_task['job'] == job_for_template][[
            'job', 'task', 'previous_tasks', 'requires_resources'
        ]]
        df_template['previous_tasks'] = df_template['previous_tasks'].apply(lambda x: tuple(x))
        df_template = df_template.drop_duplicates().reset_index(drop=True)
        future_tasks = {i: () for i in df_template['task'].values}
        for i in df_template.to_dict('records'):
            for prev in i['previous_tasks']:
                future_tasks[prev] = future_tasks[prev] + (i['task'], )
        future_tasks = pd.Series(future_tasks, name='future_tasks').reset_index().rename(columns={'index': 'task'})
        df_unlimited_neighbours = df_template[['task', 'previous_tasks']].merge(future_tasks, on=['task'], how='left')
        unlimited_lkup = ~df_template[['task', 'requires_resources']].set_index('task')
        unlimited_lkup = unlimited_lkup.to_dict()['requires_resources']
        df_unlimited_neighbours['previous_unlimited_only'] = df_unlimited_neighbours['previous_tasks'].apply(
            lambda x: np.all([unlimited_lkup[i] for i in x]))
        df_unlimited_neighbours.loc[df_unlimited_neighbours['previous_tasks'].apply(lambda x: len(x)) == 0,
                                    'previous_unlimited_only'] = False
        look_back = []
        for i in df_unlimited_neighbours.to_dict('records'):
            if len(i['previous_tasks']) >= 1 and not (i['previous_unlimited_only']):
                look_back.append(True)
            elif len(i['future_tasks']) >= 1:
                look_back.append(False)
            elif len(i['previous_tasks']) >= 1 and i['previous_unlimited_only']:
                look_back.append(True)
            else:
                look_back.append(None)
        df_unlimited_neighbours['look_back'] = look_back
        unlimited_behaviour = dict(
            zip(df_unlimited_neighbours['task'].values, df_unlimited_neighbours.to_dict('records')))
        return unlimited_behaviour

    def postprocess_seq(self, df):
        # assumes constant duration by well and 1 resource per pad
        df = df.merge(self._well_order_within_pads[['job', 'task', 'order', 'first_job_on_pad', 'last_job_on_pad']],
                      how='left',
                      on=['job', 'task'])
        for i in ['duration_base']:
            df[i] = df[i] // df.groupby(['pad', 'task'])[i].transform('count')
        df = df.sort_values(['task', 'pad', 'order'])
        df['start-mob'] = df['start']
        df['end-mob'] = df['start'] + df['mobilization'] - 1
        df.loc[df['first_job_on_pad'] == 0, ['start-mob', 'end-mob']] = None
        df['start-main'] = df['start'] + df['mobilization'] + (df['order'] - 1) * df['duration_base']
        df['end-main'] = df['start-main'] + df['duration_base'] - 1
        df['start-demob'] = df['end-main'] + 1
        df['end-demob'] = df['end'] - 1
        df.loc[df['last_job_on_pad'] == 0, ['start-demob', 'end-demob']] = None
        return df

    def postprocess_dis(self, df):
        # assumes constant duration by well and 1 resource per pad
        df = df.merge(self._well_order_within_pads[['job', 'task', 'order', 'first_job_on_pad', 'last_job_on_pad']],
                      how='left',
                      on=['job', 'task'])
        for i in ['duration_base', 'mobilization', 'demobilization']:
            df[i] = df[i] // df.groupby(['pad', 'task'])[i].transform('count')
        df = df.sort_values(['task', 'pad', 'order'])
        df['start-mob'] = df['start'] + (df['order'] - 1) * df[['duration_base', 'mobilization', 'demobilization'
                                                                ]].sum(axis=1)
        df['end-mob'] = df['start-mob'] + df['mobilization'] - 1
        df['start-main'] = df['end-mob'] + 1
        df['end-main'] = df['start-main'] + df['duration_base'] - 1
        df['start-demob'] = df['end-main'] + 1
        df['end-demob'] = df['start-demob'] + df['demobilization'] - 1
        return df

    def postprocess_oth(self, df):
        df['start-mob'] = df['start']
        df['start-main'] = df['start'] + df['mobilization']
        df['start-demob'] = df['end'] - df['demobilization']
        df['end-mob'] = df['start-main'] - 1
        df['end-main'] = df['start-demob'] - 1
        df['end-demob'] = df['end'] - 1
        return df

    def prune_underresourced_wells(self):
        if not self.df_resource.empty:
            df = self.df_assignment.merge(self.df_resource[['machine', 'available_to']], on=['machine'], how='left')
            wells_underresourced = df[df['end'] > df['available_to']]['job'].unique()
            tasks_underresourced = df[df['end'] > df['available_to']]['task'].unique()
            df = df[~df['job'].isin(wells_underresourced)].reset_index(drop=True)
            self.df_pruned = df.drop(['available_to'], axis=1)
            lkup_reverse = {}
            for i in ['job', 'task']:
                lkup_reverse[i] = {v: k for k, v in self.lkup[i].items()}
            self.wells_underresourced = [lkup_reverse['job'][j] for j in wells_underresourced]
            self.tasks_underresourced = [lkup_reverse['task'][t] for t in tasks_underresourced]
        else:
            self.df_pruned = self.df_assignment
            self.wells_underresourced, self.tasks_underresourced = [], []

    def postprocess(self):
        """
        Output
        ----------
        self.df_output
            Populates dataframe with assignments in long format.

            =================  =========================================================================================
            job                job id (as `int` or `str`)
            task               task id (as `int` or `str`)
            previous_tasks     directly connected previous task ids (as list)
            machine            assigned machine id (as `int` or `str`)
            subtask            mob, main or demob (as `str`)
            start              assigned start of subtask. (as `int`. If work_on_weekends=False unit is days since base_d
                               -ay else use business days)
            end                assigned end of subtask. (as `int`. If work_on_weekends=False unit is days since base_day
                               else use business days)
            duration           days to perform subtask (as `int`)
            =================  =========================================================================================
        """
        self.prune_underresourced_wells()
        if len(self.df_pruned) == 0:
            self.df_output = self.df_pruned.copy()
        else:
            df_processed = self.df_pruned.merge(self.df_task_merge.rename(columns={'duration': 'duration_input'}),
                                                on=['job', 'task', 'machine'],
                                                how='left')
            df_seq = df_processed.loc[df_processed['pad_operation'] == PadOperationOptions.sequence.value]
            df_dis = df_processed.loc[df_processed['pad_operation'] == PadOperationOptions.disabled.value]
            df_oth = df_processed.loc[~df_processed['pad_operation'].
                                      isin([PadOperationOptions.sequence.value, PadOperationOptions.disabled.value])]
            if len(df_seq) > 0:
                df_seq = self.postprocess_seq(df_seq)
            if len(df_dis) > 0:
                df_dis = self.postprocess_dis(df_dis)
            if len(df_oth) > 0:
                df_oth = self.postprocess_oth(df_oth)
            df_processed_wells = pd.concat([df_seq, df_dis, df_oth], axis=0).reset_index(drop=True)
            df_starts = pd.melt(
                df_processed_wells.rename(columns={
                    'start-mob': 'mob',
                    'start-main': 'main',
                    'start-demob': 'demob'
                }), ['job', 'task', 'machine'], ['mob', 'main', 'demob']).rename(columns={
                    'value': 'start',
                    'variable': 'subtask'
                })
            df_ends = pd.melt(
                df_processed_wells.rename(columns={
                    'end-mob': 'mob',
                    'end-main': 'main',
                    'end-demob': 'demob'
                }), ['job', 'task', 'machine'], ['mob', 'main', 'demob']).rename(columns={
                    'value': 'end',
                    'variable': 'subtask'
                })
            df_output = df_starts.merge(df_ends, on=['job', 'task', 'machine', 'subtask'])
            df_output['duration'] = df_output['end'] - df_output['start'] + 1
            base_day = self.settings['start_program']
            df_output['start'] = base_day + df_output['start']
            df_output['end'] = base_day + df_output['end']
            df_output.loc[df_output['duration'] == 0, ['start', 'end', 'duration']] = None
            df_output = self._reverse_convert_ids(df_output, ['job', 'task', 'machine'], self.lkup)
            self.df_output = df_output

    def _build_accessory_dataframes(self):
        jobtask_stats = self.df_task_merge.groupby(['job', 'task']).agg({
            'duration': ['min', 'max', 'count'],
            'available_from': ['min'],
            'available_to': ['max'],
            'machine': ['unique']
        })
        jobtask_stats.columns = list(map(''.join, jobtask_stats.columns.values))
        self._jobtask_stats = jobtask_stats.rename(columns={'durationcount': 'n_alternatives'})
        taskpad_stats = self.df_task_merge[['task', 'pad', 'job', 'pad_operation']].drop_duplicates()
        self._taskpad_stats = taskpad_stats.groupby(['task', 'pad']).agg({
            'job': lambda x: list(x),
            'pad_operation': 'first'
        })
        if PadOperationOptions.sequence.value in self._taskpad_stats[
                'pad_operation'].values or PadOperationOptions.disabled.value in self._taskpad_stats[
                    'pad_operation'].values:
            well_order_within_pads = self.df_task_merge[['pad', 'job', 'task', 'rank', 'rank_raw']].drop_duplicates()
            well_order_within_pads['order'] = well_order_within_pads.groupby(['pad', 'task'
                                                                              ])['rank_raw'].rank('first').astype(int)
            well_order_within_pads = well_order_within_pads[['pad', 'task', 'job', 'order']]
            well_order_within_pads['first_job_on_pad'] = 1 * (well_order_within_pads['order'] == 1)
            well_order_within_pads['last_job_on_pad'] = well_order_within_pads.groupby(
                ['pad', 'task'])['order'].transform(lambda x: 1 * (x == x.max()))
            self._well_order_within_pads = well_order_within_pads

    def _convert_ids(self, df, cols: list, lkup: dict):
        df = df.copy()
        for i in cols:
            if i not in lkup:
                vals = df[i].unique()
                lkup[i] = {val: idx for idx, val in enumerate(vals)}
        df = df.replace({col: lkup[col] for col in cols})
        none_map = {col: lkup[col][None] for col in lkup.keys() if None in lkup[col].keys()}
        df = df.fillna(none_map)
        return df, lkup

    def _reverse_convert_ids(self, df, cols: list, lkup: dict):
        df = df.copy()
        lkup_reverse = {}
        for i in cols:
            lkup_reverse[i] = {v: k for k, v in lkup[i].items()}
        df = df.replace({col: lkup_reverse[col] for col in cols})
        return df

    def _gen_name(self, prefix, job_id=None, task_id=None, machine_id=None, pad_id=None):
        suffix = ''
        if job_id is not None:
            suffix = suffix + f'_j{job_id}'
        if task_id is not None:
            suffix = suffix + f'_t{task_id}'
        if machine_id is not None:
            suffix = suffix + f'_m{machine_id}'
        if pad_id is not None:
            suffix = suffix + f'_p{pad_id}'
        return prefix + suffix


class OrtoolsScheduler(OrtoolsSchedulerSkeleton):
    def orchestrator(self, callback: NotificationCallback):
        """
            The orchestrator runs the following steps:
            - add_variables() transforms scheduling inputs to usable parameters for solve()
            - add_constraints() determines and sets constraints
            - add_objective() sets the selected objective function based on class attr. objective_fn
            - solve() runs the CPSolver, stores runtime statistics and populates class attr. df_assignment if solve()
                produces a successful result
            - postprocess() prepares solver results for db persistence & sets class attr. df_output if solve() produces
            a successful result

        Args:
        -----
            callback: A callback function which is called on each solution found by the solver.
        """
        self.add_variables()
        if len(self.df_hints) > 0:
            self.add_hints()
        self.add_constraints()
        self.add_objective(objective_fn=self.settings['objective_fn'])
        self.solve(callback)
        if self.header['Status'] == 'FEASIBLE' or self.header['Status'] == 'OPTIMAL':
            self.postprocess()

    def solve(self, callback: NotificationCallback, timeout=DEFAULT_CSP_TIMEOUT, seed=SOLVER_SEED):
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = timeout
        solver.parameters.random_seed = seed
        self.callback = callback
        self.callback.initiate_progress()
        status = solver.Solve(self.model, self.callback)
        self.callback.finalize_progress()
        header = {}
        header['Conflicts'] = solver.NumConflicts()
        header['Branches'] = solver.NumBranches()
        header['Wall time'] = solver.WallTime()
        header['Status'] = solver.StatusName(status)
        self.header = header
        if self.header['Status'] == 'FEASIBLE' or self.header['Status'] == 'OPTIMAL':
            df_assignment = []
            for jtm in self.presences:
                if solver.Value(self.presences[jtm]):
                    row = {}
                    j, t, m = jtm
                    row['job'] = j
                    row['task'] = t
                    row['machine'] = m
                    row['start'] = solver.Value(self.starts[j, t])
                    row['end'] = solver.Value(self.ends[j, t])
                    row['duration'] = row['end'] - row['start']
                    df_assignment.append(row)
            self.df_assignment = pd.DataFrame(df_assignment)

    def add_variables(self):
        self.starts, self.ends, self.durations = {}, {}, {}
        self.l_starts, self.l_ends, self.l_durations = {}, {}, {},
        self.presences, self.l_presences = {}, collections.defaultdict(list)
        self.intervals_per_resources = collections.defaultdict(list)
        self.job_ends = {}
        self._jobtask_stats, self._taskpad_stats, self._tpm_flags = None, None, {}
        self.unlimited_prev_end, self.unlimited_next_start, self.unlimited_durations = {}, {}, {}
        self._build_accessory_dataframes()
        for i in self.do_not_schedule_summary:
            self.ends[tuple(i)] = self.model.NewConstant(0)
        for i in self.df_task_merge.to_dict('records'):
            job_id, task_id, machine_id = i['job'], i['task'], i['machine']
            if (job_id, task_id) not in self.starts:
                self._variable_jobtask_interval(job_id, task_id, i)
            n_alts = self._jobtask_stats['n_alternatives'][(job_id, task_id)]
            self._variable_presence(job_id, task_id, machine_id, n_alts)
            self._variable_jobtaskalt_interval(job_id, task_id, machine_id, n_alts, i)
            self._variable_resource(job_id, task_id, machine_id, n_alts, i)
        self._variable_unavailable_days()
        self._variable_job_ends()
        if hasattr(self, '_unlimited_behaviour'):
            self._variable_unlimited_resources()

    def add_constraints(self):
        self._constraint_precedence(self.model, self.df_task_merge, self.starts, self.ends)
        self._constraint_multitasking(self.model, self.intervals_per_resources)
        self._constraint_flexibility(self.model, self.df_task_merge, self.starts, self.ends, self.durations,
                                     self.presences, self.l_starts, self.l_ends, self.l_durations, self.l_presences,
                                     self.settings['uniform_duration_by_jobtask'])
        if len(self._tpm_flags) > 0:
            self._constraint_distributed(self.model, self._taskpad_stats, self.starts, self.ends, self.l_presences,
                                         self.presences)
        # if self.settings['objective_fn'] == 'rank' and not self.df_ranks['rank'].isnull().all():
        #     # the rank constraint speeds up the solver but is suboptimal. Sometimes we can finish a fast low priority
        #     # task before a slow high priority task is complete. We can renenable it here in future, if we wish to giv
        #     # -e the user the option to toggle the rank constraint on or off
        #     self._constraint_rank(self.model, self.df_ranks, self.job_ends)
        if hasattr(self, '_unlimited_behaviour'):
            self._constraint_unlimited_resources(self.model, self.starts, self.ends, self.unlimited_prev_end,
                                                 self.unlimited_next_start, self.unlimited_durations)

    def add_objective(self, objective_fn='rank'):
        if objective_fn == 'makespan' or (self.df_ranks['rank'][0] == self.df_ranks['rank']).all():
            self._objective_makespan(self.model, self.job_ends, self._horizon)
        elif objective_fn == 'rank':
            self._objective_rank(self.model, self.job_ends, self.df_ranks)

    def add_hints(self):
        for i in self.df_hints.to_dict('records'):
            j, t, m = i['job'], i['task'], i['machine']
            self.model.AddHint(self.starts[(j, t)], i['start'])
            self.model.AddHint(self.ends[(j, t)], i['end'])
            if len(self.presences[(j, t, m)].Name()) > 0:
                self.model.AddHint(self.presences[(j, t, m)], True)

    def _variable_job_ends(self):
        for job_id in self.df_task_merge['job'].unique():
            task_ids = list(self._jobtask_stats.loc[pd.IndexSlice[job_id, :]].index)
            job_end = self.model.NewIntVar(0, self._horizon, self._gen_name('jobend', job_id))
            self.model.AddMaxEquality(job_end, [self.ends[(job_id, task_id)] for task_id in task_ids])
            self.job_ends[job_id] = job_end

    def _variable_jobtaskalt_interval(self, job_id, task_id, machine_id, n_alts, i):
        if n_alts > 1:
            suffix = self._gen_name('', job_id, task_id, machine_id)
            self.l_starts[(job_id, task_id, machine_id)] = self.model.NewIntVar(max([i['available_from'], 0]),
                                                                                min([i['available_to'], self._horizon]),
                                                                                'start' + suffix)
            self.l_durations[(job_id, task_id, machine_id)] = i['duration']
            self.l_ends[(job_id, task_id, machine_id)] = self.model.NewIntVar(max([i['available_from'], 0]),
                                                                              min([i['available_to'], self._horizon]),
                                                                              'end' + suffix)

    def _variable_presence(self, job_id, task_id, machine_id, n_alts):
        if n_alts > 1:
            l_presence = self.model.NewBoolVar(self._gen_name('presence', job_id, task_id, machine_id))
            self.l_presences[(job_id, task_id)].append(l_presence)
            self.presences[(job_id, task_id, machine_id)] = l_presence
        else:
            self.presences[(job_id, task_id, machine_id)] = self.model.NewConstant(1)

    def _variable_jobtask_interval(self, job_id, task_id, i):
        suffix = self._gen_name('', job_id, task_id)
        min_available_from = self._jobtask_stats['available_frommin'][(job_id, task_id)]
        max_available_to = self._jobtask_stats['available_tomax'][(job_id, task_id)]
        self.starts[(job_id, task_id)] = self.model.NewIntVar(max([min_available_from, 0]),
                                                              min([max_available_to, self._horizon]), 'start' + suffix)
        self.ends[(job_id, task_id)] = self.model.NewIntVar(max([min_available_from, 0]),
                                                            min([max_available_to, self._horizon]), 'end' + suffix)
        if not (self.settings['uniform_duration_by_jobtask']):
            self.durations[(job_id, task_id)] = self.model.NewIntVar(0, self._horizon, 'duration' + suffix)
        else:
            self.durations[(job_id, task_id)] = i['duration']

    def _variable_resource(self, job_id, task_id, machine_id, n_alts, i):
        machine_id = i['machine']
        if (task_id, i['pad'], machine_id) in self._tpm_flags:
            pass
        elif i['requires_resources'] is False:
            pass
        else:
            self._tpm_flags[(task_id, i['pad'], machine_id)] = job_id
            if n_alts == 1:
                interval = self.model.NewIntervalVar(self.starts[(job_id, task_id)], self.durations[(job_id, task_id)],
                                                     self.ends[(job_id, task_id)],
                                                     self._gen_name('interval', job_id, task_id))
                self.intervals_per_resources[machine_id].append(interval)
            else:
                l_interval = self.model.NewOptionalIntervalVar(self.l_starts[(job_id, task_id, machine_id)],
                                                               self.l_durations[(job_id, task_id, machine_id)],
                                                               self.l_ends[(job_id, task_id, machine_id)],
                                                               self.presences[(job_id, task_id, machine_id)],
                                                               self._gen_name('interval', job_id, task_id, machine_id))
                self.intervals_per_resources[machine_id].append(l_interval)

    def _variable_unavailable_days(self):
        if len(self.df_unavailable_days):
            for i in self.df_unavailable_days.to_dict('records'):
                self.intervals_per_resources[i['machine']].append(
                    self.model.NewIntervalVar(
                        i['start'],
                        i['end'] - i['start'],
                        i['end'],
                        f"unavail_m{i['machine']}_st{i['start']}",
                    ))

    def _variable_unlimited_resources(self):
        df_requires_resources = self.df_task_merge[~self.df_task_merge['requires_resources']]
        for i in df_requires_resources[['job', 'task', 'duration', 'previous_tasks', 'pad',
                                        'pad_operation']].to_dict('records'):
            j, t = i['job'], i['task']
            self.unlimited_durations[(j, t)] = i['duration']
            if self._unlimited_behaviour[t]['look_back']:
                self.unlimited_prev_end[(j, t)] = self.model.NewIntVar(0, self._horizon,
                                                                       self._gen_name('unlimited', job_id=j, task_id=t))
                jobs = self._taskpad_stats['job'][(t, i['pad'])]
                self.model.AddMaxEquality(self.unlimited_prev_end[(j, t)], [
                    self.ends[j_pad, t_prev] for j_pad in jobs
                    for t_prev in self._unlimited_behaviour[t]['previous_tasks'] if (j_pad, t_prev) in self.ends
                ])
            elif self._unlimited_behaviour[t]['look_back'] is not None:
                self.unlimited_next_start[(j,
                                           t)] = self.model.NewIntVar(0, self._horizon,
                                                                      self._gen_name('unlimited', job_id=j, task_id=t))
                jobs = self._taskpad_stats['job'][(t, i['pad'])]
                self.model.AddMinEquality(self.unlimited_next_start[(j, t)], [
                    self.starts[j_pad, t_next] for j_pad in jobs
                    for t_next in self._unlimited_behaviour[t]['future_tasks'] if (j_pad, t_next) in self.starts
                ])

    def _constraint_precedence(self, model, df_task_merge, starts, ends):
        for i in df_task_merge[['job', 'task', 'previous_tasks']].to_dict('records'):
            job_id = i['job']
            task_id = i['task']
            if len(i['previous_tasks']) == 0:
                continue
            else:
                for previous_task_id in i['previous_tasks']:
                    # if (job_id, previous_task_id) in ends:
                    model.Add(starts[(job_id, task_id)] >= ends[(job_id, previous_task_id)])

    def _constraint_multitasking(self, model, intervals_per_resources):
        for machine_id in intervals_per_resources:
            intervals = intervals_per_resources[machine_id]
            if len(intervals) > 1:
                model.AddNoOverlap(intervals)

    def _constraint_flexibility(self, model, df_task_merge, starts, ends, durations, presences, l_starts, l_ends,
                                l_durations, l_presences, uniform_duration_by_jobtask):
        for job_id in df_task_merge['job'].unique():
            task_ids = list(self._jobtask_stats.loc[pd.IndexSlice[job_id, :]].index)
            for task_id in task_ids:
                machine_ids = self._jobtask_stats['machineunique'][(job_id, task_id)]
                if len(machine_ids) > 1:
                    for machine_id in machine_ids:
                        model.Add(starts[(job_id, task_id)] == l_starts[(job_id, task_id, machine_id)]).OnlyEnforceIf(
                            presences[(job_id, task_id, machine_id)])
                        if not (uniform_duration_by_jobtask):
                            model.Add(durations[(job_id,
                                                 task_id)] == l_durations[(job_id, task_id, machine_id)]).OnlyEnforceIf(
                                                     presences[(job_id, task_id, machine_id)])
                        model.Add(ends[(job_id, task_id)] == l_ends[(job_id, task_id, machine_id)]).OnlyEnforceIf(
                            presences[(job_id, task_id, machine_id)])
                    model.AddExactlyOne(l_presences[(job_id, task_id)])

    def _constraint_distributed(self, model, _taskpad_stats, starts, ends, l_presences, presences):
        for (t, _), row in _taskpad_stats.iterrows():
            jobs = row['job']
            for j in jobs[1:]:
                model.Add(starts[(jobs[0], t)] == starts[(j, t)])
                model.Add(ends[(jobs[0], t)] == ends[(j, t)])
                for alt_idx in range(len(l_presences[jobs[0], t])):
                    m = int(l_presences[(j, t)][alt_idx].Name().split('_')[-1][1:])
                    model.Add(presences[(jobs[0], t, m)] == presences[(j, t, m)])

    def _constraint_unlimited_resources(self, model, starts, ends, unlimited_prev_end, unlimited_next_start,
                                        unlimited_durations):
        for j, t in unlimited_prev_end:
            model.Add(ends[(j, t)] - starts[(j, t)] == self.unlimited_durations[(j, t)])
            model.Add(starts[(j, t)] == unlimited_prev_end[(j, t)])
        for j, t in unlimited_next_start:
            model.Add(ends[(j, t)] - starts[(j, t)] == self.unlimited_durations[(j, t)])
            model.Add(ends[(j, t)] == unlimited_next_start[(j, t)])

    def _constraint_rank(self, model, df_ranks, job_ends):
        df_ranks = df_ranks.sort_values('rank').reset_index(drop=True)
        df_ranks['job_lag1'] = df_ranks['job'].shift(1)
        for i in df_ranks.loc[1:, ['job', 'job_lag1']].to_dict('records'):
            model.Add(job_ends[i['job']] >= job_ends[i['job_lag1']])

    def _objective_makespan(self, model, job_ends, horizon):
        obj_var = model.NewIntVar(0, horizon, 'makespan')
        model.AddMaxEquality(obj_var, list(job_ends.values()))
        self.obj = obj_var
        model.Minimize(obj_var)

    def _objective_rank(self, model, job_ends, df_ranks):
        n_jobs = df_ranks['rank'].max() + 1
        obj_var = cp_model.LinearExpr.WeightedSum(
            [job_ends[i['job']] for i in df_ranks.to_dict('records') if i['job'] in job_ends],
            [(n_jobs - i['rank']) for i in df_ranks.to_dict('records') if i['job'] in job_ends])
        self.obj = obj_var
        model.Minimize(obj_var)
