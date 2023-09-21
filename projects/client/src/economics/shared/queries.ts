import { UseQueryOptions, useQuery } from 'react-query';

import { queryClient } from '@/helpers/query-cache';
import { getApi } from '@/helpers/routing';

import { getUserRun } from '../Economics/shared/api';

interface LastRunSummary {
	run: Inpt.EconRun;
	econRunData: { _id: Inpt.ObjectId<'econ-run-data'>; comboName: string }[];
	groupingData: Inpt.EconRunGroupingData;
}

function getLastRunSum(scenarioId: string): Promise<LastRunSummary> {
	return getApi(`/economics/getLastRunSum/${scenarioId}`);
}

export const LastRunSummaryQuery = {
	key: (scenarioId: string) => ['last-run-summary', { scenarioId }],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	useQuery: <T = LastRunSummary>(scenarioId: string, options?: UseQueryOptions<LastRunSummary, any, T, any>) =>
		useQuery({
			...options,
			queryKey: LastRunSummaryQuery.key(scenarioId),
			queryFn: () => getLastRunSum(scenarioId),
		}),
	invalidate: (scenarioId: string) => queryClient.invalidateQueries(LastRunSummaryQuery.key(scenarioId)),
};

function getLastGhgRun(scenarioId: string): Promise<Inpt.GhgRun> {
	return getApi(`/economics/getLastGhgRun/${scenarioId}`);
}

export const UserRunQuery = {
	key: (scenarioId: string) => ['economics', 'run', 'user-run', scenarioId],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	useQuery: <T = Inpt.EconRun>(scenarioId: string, options?: UseQueryOptions<Inpt.EconRun, any, T, any>) =>
		useQuery({
			...options,
			queryKey: UserRunQuery.key(scenarioId),
			queryFn: () => getUserRun(scenarioId),
		}),
	invalidate: (scenarioId: string) => queryClient.invalidateQueries(UserRunQuery.key(scenarioId)),
};

export const LastGhgRunQuery = {
	key: (scenarioId: string) => ['last-ghg-run', { scenarioId }],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	useQuery: <T = Inpt.GhgRun>(scenarioId: string, options?: UseQueryOptions<Inpt.GhgRun, any, T, any>) =>
		useQuery({
			...options,
			queryKey: LastGhgRunQuery.key(scenarioId),
			queryFn: () => getLastGhgRun(scenarioId),
		}),
	invalidate: (scenarioId: string) => queryClient.invalidateQueries(LastGhgRunQuery.key(scenarioId)),
};
