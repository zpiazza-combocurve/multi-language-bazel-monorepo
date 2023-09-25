import collections
import numpy as np
import pandas as pd

from combocurve.science.scheduling.scheduling_data_models import PadOperationOptions


class FastScheduler:
    def __init__(self,
                 df_task: pd.DataFrame,
                 df_resource: pd.DataFrame,
                 df_ranks: pd.DataFrame,
                 df_unavailable_days: pd.DataFrame = pd.DataFrame({})):
        self.df_assignment_pad_level = []
        df_ranks.loc[df_ranks['pad'].isnull(), 'pad'] = df_ranks.loc[df_ranks['pad'].isnull(),
                                                                     'job'].apply(lambda x: f'__{x}')
        self.init_lookups(df_task, df_resource, df_ranks, df_unavailable_days)

    def init_lookups(self, df_task, df_resource, df_ranks, df_unavailable_days):
        self.task_summary = df_task.groupby(
            ['task']).first()[['duration_base', 'previous_tasks', 'pad_operation',
                               'requires_resources']].to_dict('index')
        if np.alltrue(pd.DataFrame(self.task_summary).T['pad_operation'] == PadOperationOptions.disabled):
            df_ranks['pad'] = df_ranks['job'].apply(lambda x: f'__{x}')
        self.task_machine_pairs = df_task[['task', 'machine'
                                           ]].drop_duplicates().groupby(['task'])['machine'].apply(list).to_dict()
        df_resource = self.extend_resource_lifetimes(df_resource)
        self.machine_summary = df_resource.set_index('machine').to_dict('index') if len(df_resource) > 0 else {}
        if df_ranks['rank'].isnull().all():
            df_ranks['rank'] = df_ranks['job']
        df_ranks['rank'] = df_ranks['rank'].rank(method='dense', na_option='bottom')
        self.df_ranks = df_ranks
        self.pad_summary = df_ranks.groupby('pad').agg({'rank': 'min', 'job': list}).to_dict('index')
        self.resource_last_task = {m: max([self.machine_summary[m]['available_from'], 0]) for m in self.machine_summary}
        self.unavail_summary = self.get_unavail_summary(df_unavailable_days)

    def get_descendents(self, all_descendents, task_tree, ancestor, t):
        children = task_tree[t]['previous_tasks']
        all_descendents[ancestor].update(children)
        for c in children:
            self.get_descendents(all_descendents, task_tree, ancestor, c)

    def get_all_descendents(self):
        self.all_descendents = collections.defaultdict(set)
        task_tree = {t: {'previous_tasks': tuple(self.task_summary[t]['previous_tasks'])} for t in self.task_summary}
        for t in task_tree:
            self.get_descendents(self.all_descendents, task_tree, t, t)
            self.all_descendents[t].add(t)

    def extend_resource_lifetimes(self, df_resource):
        self.resources_with_extended_lifetimes = {}
        if not df_resource.empty:
            df_resource = df_resource.copy()
            df_resource['available_to_raw'] = df_resource['available_to']
            for t in self.task_machine_pairs:
                if pd.notnull(self.task_machine_pairs[t][0]):
                    self.resources_with_extended_lifetimes[t] = df_resource.iloc[df_resource[
                        df_resource['machine'].isin(self.task_machine_pairs[t])]['available_to'].idxmax()]['machine']
            df_resource.loc[df_resource['machine'].isin(self.resources_with_extended_lifetimes.values()),
                            'available_to'] = np.inf
        return df_resource

    def collect_status_adjustments(self):
        self.status_multiplier_offset = collections.defaultdict(int)
        self.do_not_schedule_summary = []
        self.instant_fpd_wells = []
        for i in self.df_ranks.to_dict('records'):
            if i['status'] in self.all_descendents:
                for t_complete in self.all_descendents[i['status']]:
                    self.status_multiplier_offset[i['pad'], t_complete] += 1
                    self.do_not_schedule_summary.append((i['job'], t_complete))
                if len(self.all_descendents[i['status']]) == len(self.task_summary):
                    self.instant_fpd_wells.append(i['job'])

    def get_unavail_summary(self, df_unavailable_days):
        if len(df_unavailable_days) > 0:
            df_unavailable_days = df_unavailable_days.sort_values(['machine', 'start'])
            unavail_summary = []
            last_row = df_unavailable_days.iloc[0].to_dict()
            for i in df_unavailable_days.to_dict('records'):
                if i['start'] <= last_row['end'] and i['machine'] == last_row['machine']:
                    last_row['end'] = i['end']
                else:
                    unavail_summary.append(last_row)
                    last_row = i
            unavail_summary.append(last_row)
            unavail_summary = pd.DataFrame(unavail_summary)
            unavail_summary['itvl'] = unavail_summary[['start', 'end']].values.tolist()
            unavail_summary = unavail_summary.groupby(['machine'])['itvl'].agg(list).to_dict()
            return unavail_summary
        else:
            unavail_summary = {}
            return unavail_summary

    def orchestrator(self):
        df_ranks_by_pad = pd.DataFrame(self.pad_summary).T.reset_index().rename(columns={
            'index': 'pad'
        }).sort_values('rank')
        self.precedence = {}
        self.get_all_descendents()
        self.collect_status_adjustments()
        for p in df_ranks_by_pad['pad'].values:
            self.precedence[p] = {}
            self.schedule_pad(p)
        self.explode_pads()
        self.prune_underresourced_wells()
        self.clean_hint()

    def schedule_pad(self, p):
        while len(self.precedence[p]) < len(self.task_summary):
            legal_tasks = self.get_legal_tasks(p)
            self.schedule_legal_tasks(p, legal_tasks)

    def get_legal_tasks(self, p):
        if len(self.precedence[p]) == 0:
            legal_tasks = [t for t in self.task_summary if len(self.task_summary[t]['previous_tasks']) == 0]
        else:
            legal_tasks = []
            for t in self.task_summary:
                if all(x in self.precedence[p]
                       for x in self.task_summary[t]['previous_tasks']) and t not in self.precedence[p]:
                    legal_tasks.append(t)
        return legal_tasks

    def schedule_legal_tasks(self, p, legal_tasks):
        for t in legal_tasks:
            well_multiplier = len(self.pad_summary[p]['job']) - self.status_multiplier_offset[(p, t)]
            if well_multiplier > 0:
                if len(self.task_summary[t]['previous_tasks']) == 0:
                    t_last = 0
                else:
                    t_last = max(self.precedence[p][prev] for prev in self.task_summary[t]['previous_tasks'])
                if self.task_summary[t]['requires_resources']:
                    select_machine = None
                    while select_machine is None:
                        select_machine = min({m: self.resource_last_task[m]
                                              for m in self.task_machine_pairs[t]},
                                             key=self.resource_last_task.get)
                        t_start = max([self.resource_last_task[select_machine], t_last])
                        if self.task_summary[t]['pad_operation'] == 'parallel':
                            duration = self.task_summary[t]['duration_base'] + self.machine_summary[select_machine][
                                'mobilization'] + self.machine_summary[select_machine]['demobilization']
                        elif self.task_summary[t]['pad_operation'] == 'batch' or self.task_summary[t][
                                'pad_operation'] == 'sequence':
                            duration = well_multiplier * self.task_summary[t]['duration_base'] + self.machine_summary[
                                select_machine]['mobilization'] + self.machine_summary[select_machine]['demobilization']
                        else:  # captures : pad_operation == 'disabled'
                            duration = well_multiplier * (self.task_summary[t]['duration_base']
                                                          + self.machine_summary[select_machine]['mobilization']
                                                          + self.machine_summary[select_machine]['demobilization'])
                        t_end = t_start + duration
                        if select_machine in self.unavail_summary:
                            itvl = self.unavail_summary[select_machine][0]
                            if (itvl[0] <= t_start < itvl[1]) or (itvl[0] < t_end <= itvl[1]) or (t_start <= itvl[0]
                                                                                                  and t_end >= itvl[1]):
                                self.resource_last_task[select_machine] = self.unavail_summary[select_machine].pop(0)[1]
                                if len(self.unavail_summary[select_machine]) == 0:
                                    del self.unavail_summary[select_machine]
                                select_machine = None
                        elif t_end > self.machine_summary[select_machine]['available_to']:
                            self.resource_last_task[select_machine] = np.inf
                            select_machine = None
                else:
                    select_machine = None
                    t_start = t_last
                    if self.task_summary[t]['pad_operation'] == 'parallel':
                        duration = self.task_summary[t]['duration_base']
                    else:  # captures : pad_operation in ['batch', 'sequence', 'disabled']
                        duration = len(self.pad_summary[p]['job']) * self.task_summary[t]['duration_base']
                t_end = t_start + duration
                row = {
                    'task': t,
                    'machine': select_machine,
                    'pad': p,
                    'start': t_start,
                    'end': t_end,
                    'duration': duration,
                }
                self.df_assignment_pad_level.append(row)
                self.precedence[p][t] = t_end
                self.resource_last_task[select_machine] = t_end
            else:
                self.precedence[p][t] = 0

    def explode_pads(self):
        df = []
        for p in self.pad_summary:
            for j in self.pad_summary[p]['job']:
                for t in self.task_summary:
                    if (j, t) not in self.do_not_schedule_summary:
                        df.append({'job': j, 'pad': p, 'task': t})
        df = pd.DataFrame(df)
        df_assignment_pad_level = pd.DataFrame(self.df_assignment_pad_level)
        df = df.merge(df_assignment_pad_level, on=['pad', 'task'], how='left')
        self.df_hints_unpruned = df.drop(['pad'], axis=1)

    def prune_underresourced_wells(self):
        df = self.df_hints_unpruned.copy()
        df['available_to'] = df['machine'].apply(lambda x: self.machine_summary[x]['available_to_raw']
                                                 if pd.notnull(x) else np.inf)
        self.wells_underresourced = df[df['end'] > df['available_to']]['job'].unique()
        self.tasks_underresourced = df[df['end'] > df['available_to']]['task'].unique()
        self.df_hints_unclean = self.df_hints_unpruned[~self.df_hints_unpruned['job'].isin(self.wells_underresourced
                                                                                           )].reset_index(drop=True)

    def clean_hint(self):
        tasks_unlimited = [t for t in self.task_summary if not (self.task_summary[t]['requires_resources'])]
        self.hint_tasks_removed = [
            t for t in tasks_unlimited
            if self.is_single_value(self.df_hints_unclean.loc[self.df_hints_unclean['task'] == t, ['start', 'end']])
        ]
        df_hints = self.df_hints_unclean.loc[~self.df_hints_unclean['task'].isin(self.hint_tasks_removed)]
        self.df_hints = df_hints

    def is_single_value(self, df):
        a = df.to_numpy()
        if len(a) > 0:
            return np.alltrue((a[0] == a).all(0))
        else:
            return True

    def gen_inputs_to_postprocess(self):
        well_order_within_pads = self.df_hints_unclean[['job', 'task']].merge(self.df_ranks[['job', 'pad', 'rank']],
                                                                              how='left',
                                                                              on=['job'])
        well_order_within_pads['order'] = well_order_within_pads.groupby(['pad',
                                                                          'task'])['rank'].rank('first').astype(int)
        well_order_within_pads = well_order_within_pads[['pad', 'task', 'job', 'order']]
        well_order_within_pads['first_job_on_pad'] = 1 * (well_order_within_pads['order'] == 1)
        well_order_within_pads['last_job_on_pad'] = well_order_within_pads.groupby(
            ['pad', 'task'])['order'].transform(lambda x: 1 * (x == x.max()))
        self._well_order_within_pads = well_order_within_pads
        df_processed = self.df_hints_unclean.copy()
        df_task_summary = pd.DataFrame(self.task_summary).T[['duration_base', 'pad_operation'
                                                             ]].reset_index().rename(columns={'index': 'task'})
        df_processed = df_processed.merge(df_task_summary, on='task', how='left')
        if len(self.machine_summary) > 0:
            df_machine_summary = pd.DataFrame(
                self.machine_summary).T[['mobilization',
                                         'demobilization']].reset_index().rename(columns={'index': 'machine'})
            df_processed = df_processed.merge(df_machine_summary, on='machine', how='left')
        else:
            df_processed[['mobilization', 'demobilization']] = 0
        df_processed = df_processed.merge(self.df_ranks[['job', 'pad']].drop_duplicates(), how='left')
        df_processed['pad_operation'] = df_processed['pad_operation'].apply(lambda x: x.value)
        self.df_processed = df_processed

    def postprocess_seq(self, df):
        # assumes constant duration by well and 1 resource per pad
        df = df.merge(self._well_order_within_pads[['job', 'task', 'order', 'first_job_on_pad', 'last_job_on_pad']],
                      how='left',
                      on=['job', 'task'])
        df[['mobilization', 'demobilization']] = df[['mobilization', 'demobilization']].fillna(0)
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
        df[['mobilization', 'demobilization']] = df[['mobilization', 'demobilization']].fillna(0)
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

    def postprocess(self, settings):
        self.gen_inputs_to_postprocess()
        df_processed = self.df_processed
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
        base_day = settings['start_program']
        df_output['start'] = base_day + df_output['start']
        df_output['end'] = base_day + df_output['end']
        df_output.loc[df_output['duration'] == 0, ['start', 'end', 'duration']] = None
        df_output[['start', 'end', 'duration']] = df_output[['start', 'end', 'duration']].fillna(np.nan)
        self.df_output = df_output
