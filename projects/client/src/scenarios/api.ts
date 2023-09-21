import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useMatch } from 'react-router-dom';

import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { NetworkModel } from '@/networks/carbon/types';
import { projectRoutes } from '@/projects/routes';
import { updateAssignmentsProps } from '@/scenarios/shared';

export const deleteScenario = (scenarioId: Inpt.ObjectId<'scenario'>) => deleteApi(`/scenarios/${scenarioId}`);

export function updateAssignments({
	column,
	scenarioId,
	type,
	value,
	assignmentIds,
	isGroupCase,
}: updateAssignmentsProps) {
	if (isGroupCase) {
		const group = {
			_id: assignmentIds[0],
			[column]: {
				default: {
					[type]: value,
				},
			},
		};
		return updateEconGroup(scenarioId, group);
	}
	return putApi(`/scenario-well-assignments/${scenarioId}/update-assignments`, {
		column,
		type,
		value,
		assignmentIds,
	});
}

export function massAssignLastestNetworks(scenarioId: Inpt.ObjectId<'scenario'>, selectedAssignmentIds: string[]) {
	return postApi(`/scenarios/${scenarioId}/assign-latest-networks`, { selectedAssignmentIds });
}

// TODO move to ForecastAPI or something related
export function getForecastsFromWells(projectId: Inpt.ObjectId<'project'>, wellIds: Inpt.ObjectId<'well'>[]) {
	return postApi('/forecast/getForecastListFromWells', {
		projectId,
		wellIds,
	});
}

export function removeAssignments({ scenarioId, column, assignmentIds }) {
	return putApi(`/scenarios/${scenarioId}/remove-assignment`, {
		column,
		assignmentIds,
	});
}

export function getUnassignedOwnershipCount(scenarioId) {
	return getApi(`/scenarios/getUnassignedOwnershipCount/${scenarioId}`);
}

export function setGeneralOptions(
	scenarioId: Inpt.ObjectId<'scenario'>,
	generalOptionsId: Inpt.ObjectId<'assumption'>
) {
	return postApi(`/scenarios/${scenarioId}/setGeneralOptions`, {
		generalOptionsId,
	});
}

export function buildScenario({
	assumptions,
	headers,
	scenarioId,
	scenarioWellAssignmentIds,
}: {
	assumptions: string[];
	headers: string[];
	scenarioId: Inpt.ObjectId<'scenario'>;
	scenarioWellAssignmentIds: Inpt.ObjectId<'scenario-well-assignment'>[];
}) {
	return putApi(`/scenarios/${scenarioId}/build`, {
		assumptions,
		headers,
		scenarioId,
		scenarioWellAssignmentIds,
	});
}

export const createIncremental = (scenarioId: Inpt.ObjectId, scenarioWellAssignmentIds: Inpt.ObjectId[]) =>
	postApi(`/scenario-well-assignments/${scenarioId}`, {
		scenarioWellAssignmentIds,
	});

export const deleteIncremental = (scenarioId: Inpt.ObjectId, scenarioWellAssignmentIds: Inpt.ObjectId[]) =>
	deleteApi(`/scenario-well-assignments/${scenarioId}`, {
		scenarioWellAssignmentIds,
	});

export function buildScenarioTable(scenarioId: Inpt.ObjectId, params) {
	return postApi(`/scenarios/${scenarioId}/build-assignments`, params);
}

export function getAssignments(scenarioId: Inpt.ObjectId) {
	return getApi(`/scenario-well-assignments/${scenarioId}`);
}

function getSortedAssignments(scenarioId, sorting) {
	return postApi('/filters/sort-scenario-well-assignment-ids', {
		scenarioId,
		sorting,
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getAssignmentIdsByPSeriesRange(scenarioId: Inpt.ObjectId, pSeries: any) {
	return putApi(`/scenarios/${scenarioId}/getAssignmentIdsByPSeriesRange`, pSeries);
}

export function getAssignmentIdsByOwnershipRange(scenarioId: Inpt.ObjectId, body) {
	return putApi(`/scenarios/${scenarioId}/getAssignmentIdsByOwnershipRange`, body);
}

export function getAssumptionNamesByAssumptionKey(scenarioId: Inpt.ObjectId, assumptionKey: string) {
	if (assumptionKey === AssumptionKey.forecast) return getApi(`/scenarios/${scenarioId}/forecast-names`);
	if (assumptionKey === AssumptionKey.schedule) return getApi(`/scenarios/${scenarioId}/schedule-names`);
	if (assumptionKey === AssumptionKey.carbonNetwork) return getApi(`/scenarios/${scenarioId}/network-names`);
	return getApi(`/scenarios/${scenarioId}/assumption-names/${assumptionKey}`);
}

export function getForecastNames(scenarioId: Inpt.ObjectId) {
	return getAssumptionNamesByAssumptionKey(scenarioId, AssumptionKey.forecast);
}

export function getScheduleNames(scenarioId: Inpt.ObjectId) {
	return getAssumptionNamesByAssumptionKey(scenarioId, AssumptionKey.schedule);
}

export function getScenario(scenarioId: Inpt.ObjectId) {
	// TODO this one should return Inpt.Scenario
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return getApi<any>(`/scenarios/getScenario/${scenarioId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function mergeScenarios(model: any) {
	return postApi('/scenarios/merge', model);
}

export function getScenarioQueryKey(id) {
	return ['scenario', id];
}

export function useScenario(id) {
	const queryKey = useMemo(() => getScenarioQueryKey(id), [id]);
	const scenarioQuery = useQuery(queryKey, () => getScenario(id), { enabled: id !== undefined });
	const queryClient = useQueryClient();
	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);
	const update = useCallback(
		(newScenario) => {
			queryClient.setQueryData(queryKey, newScenario);
		},
		[queryClient, queryKey]
	);
	const partialUpdate = useCallback(
		(newScenario) => {
			queryClient.setQueryData(queryKey, { ...scenarioQuery.data, ...newScenario });
		},
		[queryClient, queryKey, scenarioQuery.data]
	);
	return { ...scenarioQuery, scenario: scenarioQuery.data, reload, update, partialUpdate };
}

export function useCurrentScenarioId() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRoutes.project(':projectId').scenario(':scenarioId').root}/*`);
	const { scenarioId } = match?.params || {};
	return scenarioId;
}

export function useCurrentScenario() {
	const scenarioId = useCurrentScenarioId();
	return useScenario(scenarioId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const EMPTY_ARRAY = [] as any[];

export function getEconGroups(scenarioId: string) {
	return getApi(`/scenarios/${scenarioId}/groups`);
}

function deleteEconGroup(scenarioId, groupIds) {
	return postApi(`/scenarios/${scenarioId}/groups/mass-delete`, { groupIds });
}

function createEconGroup(scenarioId, group) {
	return postApi(`/scenarios/${scenarioId}/groups`, group);
}

function massCreateEconGroups(scenarioId, group, headers, headerAsName) {
	return postApi(`/scenarios/${scenarioId}/groups/mass-create`, { headers, headerAsName, group });
}

export function updateEconGroup(scenarioId, group) {
	return putApi(`/scenarios/${scenarioId}/groups`, group);
}

// function updateEconGroupAssignments(scenarioId, ids, group) {
// 	return putApi(`/scenarios/${scenarioId}/groups/${group._id}/assignments`, { assignmentIds: ids });
// }

function updateAssignmentEconGroup(scenarioId, assignmentId, group) {
	return postApi(`/scenarios/${scenarioId}/groups/update-assignment-econ-group`, {
		assignmentId,
		groupId: group,
	});
}

function getEconGroupQueryKey(scenarioId) {
	return ['scenario', scenarioId, 'group-economics'];
}

export function useEconGroups(scenarioId) {
	const queryKey = useMemo(() => getEconGroupQueryKey(scenarioId), [scenarioId]);
	const { data: econGroups, isFetching: isFetchingEconGroups } = useQuery(queryKey, () => getEconGroups(scenarioId), {
		placeholderData: EMPTY_ARRAY,
		keepPreviousData: true,
	});

	assert(econGroups);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const econGroupIds = useMemo(() => econGroups!.map(({ _id }) => _id), [econGroups]);

	const queryClient = useQueryClient();

	const handleDeleteEconGroup = useCallback(
		async (ids) => {
			await deleteEconGroup(scenarioId, ids);
			queryClient.invalidateQueries(queryKey);
		},
		[scenarioId, queryClient, queryKey]
	);

	const handleCreateEconGroup = useCallback(
		async (group) => {
			await createEconGroup(scenarioId, group);
			queryClient.invalidateQueries(queryKey);
		},
		[scenarioId, queryClient, queryKey]
	);

	const handleMassCreateEconGroup = useCallback(
		async (group, headers, headerAsName) => {
			await massCreateEconGroups(scenarioId, group, headers, headerAsName);
			queryClient.invalidateQueries(queryKey);
		},
		[scenarioId, queryClient, queryKey]
	);

	const handleUpdateEconGroup = useCallback(
		async (group) => {
			await updateEconGroup(scenarioId, group);
			queryClient.invalidateQueries(queryKey);
		},
		[scenarioId, queryClient, queryKey]
	);

	const handleUpdateAssignmentEconGroup = useCallback(
		async (assignmentId, group) => {
			await updateAssignmentEconGroup(scenarioId, assignmentId, group);
			queryClient.invalidateQueries(queryKey);
		},
		[scenarioId, queryClient, queryKey]
	);

	return {
		createEconGroup: handleCreateEconGroup,
		deleteEconGroup,
		deleteEconGroups: handleDeleteEconGroup,
		econGroupIds,
		econGroups,
		isFetchingEconGroups,
		massCreateEconGroups: handleMassCreateEconGroup,
		updateAssignmentEconGroup: handleUpdateAssignmentEconGroup,
		updateEconGroup: handleUpdateEconGroup,
	};
}

export function useScenarioWellAssignements(id) {
	const queryKey = useMemo(() => ['scenario', id, 'assignments'], [id]);
	const { data: assignments } = useQuery(
		queryKey,
		async () => {
			const [assignments, econGroups] = await Promise.all([getAssignments(id), getEconGroups(id)]);
			// econ group has no well id on `well` field
			return [...econGroups.map((econGroup) => ({ ...econGroup, well: null })), ...assignments];
		},
		{
			placeholderData: EMPTY_ARRAY,
			keepPreviousData: true,
		}
	);
	const queryClient = useQueryClient();
	const updateLocalAssignments = useCallback(
		(newAssignments) => {
			queryClient.setQueryData(queryKey, newAssignments);
		},
		[queryKey, queryClient]
	);

	const invalidateAssignments = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	return { assignments: assignments as Inpt.ScenarioWellAssignment[], updateLocalAssignments, invalidateAssignments };
}

export function useLookupTables(projectId) {
	const { data: { items: lookupTables } = {} } = useQuery([projectId, 'lookup-tables'], () =>
		getApi('/lookup-tables', {
			projectId,
			page: 0,
			limit: 100,
		})
	);
	return { lookupTables };
}

export function useTCLookupTables(projectId) {
	const { data: { items: lookupTables } = {} } = useQuery([projectId, 'forecast-lookup-tables'], () =>
		getApi('/forecast-lookup-tables', {
			projectId,
			page: 0,
			limit: 100,
		})
	);
	return { lookupTables };
}

export function useRollup(scenarioId) {
	const queryKey = useMemo(() => [scenarioId, 'rollUp'], [scenarioId]);
	const { data: rollUp } = useQuery(queryKey, async () => {
		const { run } = await getApi(`/scenarios/checkRunningRollups/${scenarioId}`);
		if (run) {
			const curTask = (await getApi(`/task/get-by-kind-id/${run._id}`))._id;
			return { curTask };
		}
		return getApi(`/scenarios/getRollUpData/${scenarioId}`);
	});
	const queryClient = useQueryClient();
	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryKey, queryClient]);
	return { rollUp, reload };
}

export function useRequiredFields(scenarioId) {
	// TODO prepend all related queries with 'scenario' or some identifier
	const queryKey = useMemo(() => [scenarioId, 'required-fields'], [scenarioId]);
	const { data: requiredFields } = useQuery(queryKey, () => getApi(`/scenarios/checkRequiredFields/${scenarioId}`));
	const queryClient = useQueryClient();
	const reload = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryKey, queryClient]);

	return { requiredFields, reload };
}

export function useSortedAssignments(scenarioId, sorting) {
	const queryKey = useMemo(() => [scenarioId, 'sort', sorting], [scenarioId, sorting]);
	const queryClient = useQueryClient();
	const updateLocalAssignments = useCallback(
		(newAssignments) => {
			queryClient.setQueryData(queryKey, newAssignments);
		},
		[queryKey, queryClient]
	);

	const invalidateAssignments = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient, queryKey]);

	const query = useQuery(
		queryKey,
		async () => {
			const [assignments, econGroups] = await Promise.all([
				getSortedAssignments(scenarioId, sorting),
				getEconGroups(scenarioId),
			]);
			// econ group has no well id on `well` field
			return [...econGroups.map((econGroup) => ({ ...econGroup, well: null })), ...assignments];
		},
		{ placeholderData: EMPTY_ARRAY }
	);

	return {
		updateLocalAssignments,
		invalidateAssignments,
		...query,
		data: query.data as Inpt.ScenarioWellAssignment[],
	};
}

/** If passed a wellId it will search for networks that has that wellId */
export function getNetworkModelsForScenarioPage(params: { projectId: string; wellId?: string }) {
	return getApi('/network-models/network-models-for-scenario-page', params) as Promise<NetworkModel[]>;
}
