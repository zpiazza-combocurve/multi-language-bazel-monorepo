import { faLayerPlus, faRabbitFast, faUndo, faWrench } from '@fortawesome/pro-regular-svg-icons';
import { flatten, groupBy, intersection, isEmpty, mapValues, omit, uniq } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Placeholder } from '@/components';
import { SEPARATOR, getItem } from '@/components/ContextMenu';
import {
	useCallbackRef,
	useDebouncedMemo,
	useDerivedState,
	useGetLocalStorage,
	useLocalStorageState,
	useSelection,
	useSetLocalStorage,
} from '@/components/hooks';
import SelectedCount from '@/components/misc/SelectedCount';
import { Separator } from '@/components/shared';
import { Box, Button, ButtonItem, IconButton, MenuButton, Paper } from '@/components/v2';
import EconomicsRunCard from '@/cost-model/detail-components/EconModel/EconomicsRunCard';
import EconomicsOutput from '@/economics/Economics';
import { useQuickEconRunMutation } from '@/economics/shared/shared';
import PreviewForecast from '@/forecasts/preview-forecast/PreviewForecast';
import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { FeatureIcons } from '@/helpers/features';
import { getApi, postApi } from '@/helpers/routing';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { AssumptionKey } from '@/inpt-shared/constants';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { SingleWellViewDialog } from '@/manage-wells/shared/SingleWellViewDialog';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import WithNotFound from '@/not-found/WithNotFound';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectId } from '@/projects/routes';
import { useQualifiers } from '@/qualifiers';
import { useCurrentScenarioId, useEconGroups, useScenario } from '@/scenarios/api';
import { INITIAL_SORT, SCENARIO_FILTERS_STORAGE_KEY, WarningIcon, allAssumptionKeys } from '@/scenarios/shared';
import { EMPTY } from '@/tables/Table/useAsyncRows';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { showWellFilter } from '@/well-filter/well-filter';
import { ScenarioHeadersSort } from '@/well-sort/WellSort';

import { IScenarioTableRef } from './ScenarioPage/ScenarioTable';
import { useAssumptionFilter } from './ScenarioPage/filters';
import { EconGroupData, GroupConfiguration } from './ScenarioPage/groups/group-configurations/types';
import { useImportOptions } from './ScenarioPage/imports';
import {
	CreateGroupDialog,
	ScenarioTable,
	allHeaderKeys,
	api,
	getAssumptionLabel,
	useColumnExports,
	useEconomics,
	useExportOptions,
	useGridItemDialog,
	useIncrementals,
	useRollupData,
} from './ScenarioPage/index';
import { useHeaderSelection } from './useHeaderSelection';

const WELLS_COLLECTION_HEADERS = ['wells_collection_items'];

// const SORT_STORAGE_KEY = `INPT_CURRENT_SCENARIO_SORT_V1`;
const MISSING_GENERAL_OPTIONS = 'No General Options Assigned';

const ONELINER_HEADERS = ['well_name', 'well_number', 'chosenID'];

const SORT_STORAGE_KEY = `INPT_CURRENT_SCENARIO_SORT_V1`;

const EMPTY_ARRAY = [];

const ccToCcAsses = [
	AssumptionKey.ownershipReversion,
	AssumptionKey.reservesCategory,
	AssumptionKey.expenses,
	AssumptionKey.capex,
	AssumptionKey.streamProperties,
	AssumptionKey.dates,
	AssumptionKey.pricing,
	AssumptionKey.differentials,
	AssumptionKey.productionTaxes,
	AssumptionKey.risking,
	AssumptionKey.emission,
];

const getWellIdsFromAssignments = (assignments: Inpt.ScenarioWellAssignment[]) => {
	return uniq(assignments.map(({ well }) => well));
};

const getAssignmentsFromWellIds = (assignments: Inpt.ScenarioWellAssignment[], wellIds: string[]) => {
	const wellIdToAssignments = groupBy(assignments, 'well');
	const filteredAssignments = new Set(
		flatten(wellIds.map((wellId) => wellIdToAssignments[wellId] ?? [])).map(({ _id }) => _id)
	);
	return assignments.filter(({ _id }) => filteredAssignments.has(_id)); // filter from `assignments` to ensure order
};

const useWellFilterButton = (wellIds: string[]) => {
	const [filteredWellIds, setFilteredWellIds] = useDerivedState(wellIds);
	const isFiltered = filteredWellIds.length !== wellIds.length;
	const onFilterWells = async () => {
		const ids = await showWellFilter({
			type: 'filter',
			wells: filteredWellIds,
			isFiltered,
			totalWells: isFiltered ? `${filteredWellIds.length} filtered wells` : `${wellIds.length} wells in scenario`,
		});
		if (ids !== null) {
			setFilteredWellIds(ids);
		}
	};

	const onQuickFilter = setFilteredWellIds;

	const wellFilterButton = (
		<WellFilterButton onFilterWells={onFilterWells} onQuickFilter={onQuickFilter} wellIds={filteredWellIds} />
	);

	const clearFilter = useCallback(() => setFilteredWellIds(wellIds), [wellIds, setFilteredWellIds]);

	return { clearFilter, onFilterWells, onQuickFilter, filteredWellIds, wellFilterButton };
};

const NOT_IMPORTABLE_QUALIFIERS = [
	AssumptionKey.forecast,
	AssumptionKey.schedule,
	AssumptionKey.forecastPSeries,
	AssumptionKey.carbonNetwork,
];

const ECON_PIPELINE_LIMIT = 75_000;
const ECON_GROUP_PIPELINE_LIMIT = 5_000;

// TODO move to shared
function useArray<T>(array: T[] = []) {
	const previous = useRef<T[]>([]);
	if (JSON.stringify(previous.current) !== JSON.stringify(array)) {
		previous.current = array;
	}
	return previous.current;
}

export function ScenarioPage({
	scenario,
	project,
	showToolbar: _showToolbar,
	wellIds: _wellIds,
	headers: _allHeaders,
	headerSelection,
	...props
}: {
	scenario: Inpt.Scenario & { project: { _id: Inpt.ObjectId<'project'> } };
	project: Pick<Inpt.Project, 'name'>;
	showToolbar?: boolean;
	wellIds?: string[];
	headers?: string[];
	headerSelection?;
}) {
	const allHeaders = useMemo(() => _allHeaders ?? [...allHeaderKeys, ...allAssumptionKeys], [_allHeaders]);
	const showToolbar = _showToolbar ?? true;
	const { _id: scenarioId, columns, general_options } = scenario;

	const { canUpdate: canUpdateScenario } = usePermissions(SUBJECTS.Scenarios, scenario.project._id);
	const { canCreate: canCreateEconGroups, canDelete: canDeleteEconGroups } = usePermissions(
		SUBJECTS.EconGroups,
		scenario.project._id
	);

	const { assignments, invalidateAssignments } = api.useScenarioWellAssignements(scenarioId);
	const wellIds = useMemo(() => _wellIds ?? getWellIdsFromAssignments(assignments), [assignments, _wellIds]);

	const wellIdsForSearch = wellIds.filter((id) => typeof id === 'string');

	const [sorting, setSorting] = useState<{ field: string; direction: number }[]>(
		useGetLocalStorage(SORT_STORAGE_KEY, INITIAL_SORT)
	);
	useSetLocalStorage(SORT_STORAGE_KEY, sorting);
	const {
		data: sortedAssignments,
		isFetching: isSorting,
		invalidateAssignments: invalidateSortedData,
	} = api.useSortedAssignments(scenarioId, sorting);

	const {
		createEconGroup,
		deleteEconGroups,
		econGroupIds,
		econGroups,
		massCreateEconGroups,
		updateAssignmentEconGroup,
		updateEconGroup,
	} = useEconGroups(scenarioId);

	const [headers, assumptions] = useMemo(() => {
		const headersSet = new Set(allHeaders);
		return [
			allHeaderKeys.filter((key) => headersSet.has(key)),
			allAssumptionKeys.filter((key) => headersSet.has(key)),
		];
	}, [allHeaders]);

	const { selectedHeaders, setHeaders, selectedAssumptions, setAssumptions } = useHeaderSelection(
		undefined,
		headerSelection
	);

	const onVisibleHeadersChange = useCallback(
		(newVisibleHeaders) => {
			const newVisibleHeadersSet = new Set(newVisibleHeaders);
			setHeaders(headers.filter((key) => newVisibleHeadersSet.has(key)));
			setAssumptions(assumptions.filter((key) => newVisibleHeadersSet.has(key)));
		},
		[setHeaders, setAssumptions, headers, assumptions]
	);

	const econGroupEnabled = !!econGroupIds?.length;

	const visibleHeaders = useMemo(
		() => [...(econGroupEnabled ? ['econGroup'] : []), ...selectedHeaders, ...selectedAssumptions],
		[selectedHeaders, selectedAssumptions, econGroupEnabled]
	);

	const { wellFilterButton, clearFilter: clearWellFilter, filteredWellIds } = useWellFilterButton(wellIds);

	const [filters, setHeaderFilters] = useLocalStorageState<Record<string, string>>(
		`${SCENARIO_FILTERS_STORAGE_KEY}-${scenarioId}`,
		{}
	);

	const headerFilters = useDebouncedMemo(() => omit(filters, 'index'), [filters], 500);

	const incrementalFilter = filters.index;

	const showInc = useMemo(() => assignments?.some(({ index }) => !!index), [assignments]);

	useEffect(() => {
		if (!showInc && filters.index != null && assignments.length) setHeaderFilters(headerFilters);
	}, [showInc, headerFilters, filters, setHeaderFilters, assignments]);

	const { data: headerFilteredWellIds } = useQuery(
		['wells-ids-by-search', wellIds, headerFilters],
		() =>
			headerFilters && Object.values(headerFilters)?.some((filterValue) => !!filterValue)
				? postApi('/well/getWellsBySearch', {
						wells: wellIdsForSearch,
						search: headerFilters,
				  })
				: (Promise.resolve(wellIds) as Promise<string[]>),
		{
			keepPreviousData: false,
			placeholderData: EMPTY_ARRAY,
		}
	);

	const {
		allAssignmentIdsFilteredByAssumptions,
		filterDialogs,
		filterBy,
		// clearFilter,
		removeAssumptionFilters,
		// assumptionFilters,
	} = useAssumptionFilter({
		scenarioId,
		allAssignments: assignments,
	});

	const filterEconGroups = useCallback((econGroups: EconGroupData[], filterState: Record<string, string>) => {
		let filteredEconGroups = econGroups;

		for (const key in filterState) {
			filteredEconGroups = filteredEconGroups.filter(({ well }) =>
				well?.[key]?.toLowerCase().includes(filterState[key]?.toLowerCase())
			);
		}

		return filteredEconGroups;
	}, []);

	const [_filteredAssignmentsAndGroups, _filteredAssignments, _filteredGroups] = useMemo(() => {
		const allAssignmentIdsFilteredByAssumptionsSet = new Set(allAssignmentIdsFilteredByAssumptions);

		const filteredGroups = filterEconGroups(econGroups, filters);

		const filteredAssignmentsAndGroups = [
			...getAssignmentsFromWellIds(
				assignments.filter(
					({ _id, index }) =>
						allAssignmentIdsFilteredByAssumptionsSet.has(_id) &&
						(!incrementalFilter ||
							(incrementalFilter === '-' ? !index : index?.toString() === incrementalFilter?.toString()))
				),
				intersection(filteredWellIds, headerFilteredWellIds as string[])
			),
			// If filters are empty we don't need to explicitly include filteredGroups array,
			// cause it is a part of assignments in this case
			...(isEmpty(filters) ? [] : filteredGroups),
		];

		const checkForWellCase = (item) =>
			Object.prototype.hasOwnProperty.call(item, 'well') && typeof item.well === 'string';

		// Well Cases has property well with a string id, so we're filtering by this property
		// to distinguish well and group cases
		const filteredAssignments = filteredAssignmentsAndGroups.filter((item) => checkForWellCase(item));

		return [filteredAssignmentsAndGroups, filteredAssignments, filteredGroups];
	}, [
		allAssignmentIdsFilteredByAssumptions,
		assignments,
		filteredWellIds,
		headerFilteredWellIds,
		filterEconGroups,
		econGroups,
		filters,
		incrementalFilter,
	]);
	const filteredAssignmentsAndGroups = useArray(_filteredAssignmentsAndGroups);
	const filteredAssignments = useArray(_filteredAssignments);
	const filteredGroups = useArray(_filteredGroups);

	const filteredAssignmentAndGroupIds = useMemo(
		() => filteredAssignmentsAndGroups.map(({ _id }) => _id),
		[filteredAssignmentsAndGroups]
	);

	const filteredAssignmentIds = useMemo(() => filteredAssignments.map(({ _id }) => _id), [filteredAssignments]);

	const filteredGroupIds = useMemo(() => filteredGroups.map(({ _id }) => _id), [filteredGroups]);

	const isFiltered =
		filteredAssignmentAndGroupIds != null &&
		assignments != null &&
		filteredAssignmentAndGroupIds?.length !== assignments?.length;

	const sortedFilteredAssignments = useMemo(() => {
		const idsSet = new Set(filteredAssignmentAndGroupIds);
		return sortedAssignments.filter(({ _id }) => idsSet.has(_id));
	}, [sortedAssignments, filteredAssignmentAndGroupIds]);

	const sortedFilteredAssignmentIds = useMemo(
		() => sortedFilteredAssignments.map(({ _id }) => _id),
		[sortedFilteredAssignments]
	);

	const { requiredFields, reload: reloadRequiredFields } = api.useRequiredFields(scenarioId);
	const requiredGeneralOptions = requiredFields?.general_options;

	// const assumptionsQueries = useQueries(
	// 	allAssumptionKeys.map((assumptionKey) => ({
	// 		queryKey: ['scenarioId', 'assumption-names', assumptionKey],
	// 		queryFn: async () => [assumptionKey, await getAssumptionNamesByAssumptionKey(scenario._id, assumptionKey)],
	// 		placeholderData: [assumptionKey, null],
	// 	}))
	// );

	// const { isFetching, data } = assumptionsQueries.find(
	// 	({ data }) => (data as [key: string])?.[0] === key
	// )!;
	// if (!isFetching) {
	// 	// console.log(key, (data as any)?.[1]);
	// }

	const selection = useSelection(filteredAssignmentAndGroupIds);

	const { selectAll, selectedSet } = selection;

	useEffect(() => {
		selectAll();
	}, [selectAll, filteredAssignmentAndGroupIds]);

	const scenarioTableRef = useRef<IScenarioTableRef>(null);

	const projectId = useCurrentProjectId();
	const { lookupTables } = api.useLookupTables(projectId);
	const { lookupTables: tcLookupTables } = api.useTCLookupTables(projectId);

	const selectedAssignmentAndEconGroupIds = useMemo(
		() => filteredAssignmentAndGroupIds.filter((_id) => selection.selectedSet.has(_id)),
		[filteredAssignmentAndGroupIds, selection.selectedSet]
	);

	const selectedAssignmentIds = useMemo(() => {
		const econGroupIdsSet = new Set(econGroupIds);
		return selectedAssignmentAndEconGroupIds.filter((id) => !econGroupIdsSet.has(id));
	}, [selectedAssignmentAndEconGroupIds, econGroupIds]);

	const selectedEconGroupIds = useMemo(() => {
		const econGroupIdsSet = new Set(econGroupIds);
		return selectedAssignmentAndEconGroupIds.filter((id) => econGroupIdsSet.has(id));
	}, [selectedAssignmentAndEconGroupIds, econGroupIds]);

	const selectedWellIds = useMemo(
		() =>
			uniq(
				sortedFilteredAssignments
					.filter((assignment) => assignment.well && selection.selectedSet.has(assignment._id))
					.map((assignment) => assignment.well)
			),
		[sortedFilteredAssignments, selection.selectedSet]
	);

	const reload = useCallbackRef((...args) => {
		const [ids, headersToFetch = [...selectedHeaders, ...selectedAssumptions], value] = args;
		reloadRequiredFields();
		const orderChanged = sorting?.reduce((acc, { field }) => acc || headersToFetch.includes(field), false);
		if (orderChanged) {
			invalidateAssignments();
		}
		scenarioTableRef.current?.invalidateAssignments(...args);
		if (ids?.length && headersToFetch.length === 1 && value) {
			scenarioTableRef.current?.updateAssignments(ids, headersToFetch[0], value);
		}
	});

	const {
		importCSV,
		exportCSV,
		dialogs: exportDialogs,
	} = useColumnExports({
		selectedAssignmentIds,
		scenarioId,
		scenarioName: scenario.name,
		selectedHeaders,
		refetch: reload,
	});

	const { createIncrementalDialog, createIncrementalButton, deleteIncrementalButton } = useIncrementals({
		allAssignments: assignments,
		canUpdateScenario,
		scenarioId,
		selectedAssignmentIds,
		updateAssignments: useCallback(() => {
			invalidateAssignments();
			invalidateSortedData();
		}, [invalidateAssignments, invalidateSortedData]),
	});

	const { exportMenu, exportToCsvDialog, exportToAriesDialog, exportToPhdwinDialog, exportProbabilisticDialog } =
		useExportOptions({
			scenarioId,
			scenarioName: scenario.name,
			selectedHeaders,
			selectedAssignmentIds,
			sortedFilteredAssignmentIds,
		});

	const { importMenu, massImportDialog } = useImportOptions({
		scenarioId,
		scenarioName: scenario.name,
		refetch: reload,
	});

	const {
		chooseLookupTable,
		chooseModel,
		choosePSeriesDialog,
		chooseTCLookupTable,
		gridItemDialog,
		removeAssignment,
		simpleSelectDialog,
		updateModel,
		massAssignLastestNetworks,
	} = useGridItemDialog({
		lookupTables,
		projectId,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		updateAssignments: (...args) => scenarioTableRef.current?.updateAssignments?.(...(args as [any, any, any])),
		reloadAssignments: (...args) => scenarioTableRef.current?.invalidateAssignments?.(...args),
		scenarioId,
		selectedAssignmentIds: sortedFilteredAssignmentIds.filter((id) => selectedAssignmentIds.includes(id)),
		selectedWellIds,
		tcLookupTables,
		reloadRequiredFields,
		econGroupIds,
	});

	const buildScenario = useCallback(
		async (idsToFetch, headers) => {
			return api.buildScenario({
				headers: [...selectedHeaders.filter((key) => headers.includes(key)), ...WELLS_COLLECTION_HEADERS],
				assumptions: selectedAssumptions.filter((key) => headers.includes(key)),
				scenarioId,
				scenarioWellAssignmentIds: sortedFilteredAssignments?.length
					? (idsToFetch as Inpt.ObjectId<'scenario-well-assignment'>[])
					: [],
			});
		},
		[scenarioId, selectedHeaders, selectedAssumptions, sortedFilteredAssignments?.length]
	);

	const {
		rollUpData,
		viewRollUp,
		viewRollUpChart,
		rollupDialog,
		rollupChart,
		reload: reloadRollUpData,
	} = useRollupData(scenario._id, [...selectedSet], {
		scenarioName: scenario.name,
		projectName: project?.name ?? '',
	});

	const rollUpDataExists = !!rollUpData;

	const rollupNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.scenarioId === scenarioId) {
				reloadRollUpData();
			}
		},
		[reloadRollUpData, scenarioId]
	);
	useUserNotificationCallback(NotificationType.ROLL_UP, rollupNotificationCallback);

	const { wellPipelineCount, econGroupsIncludedInPipeline } = useMemo(() => {
		const groupIdToGroup = mapValues(
			groupBy(econGroups, ({ _id }) => _id.toString()),
			([g]) => g
		);
		const assignmentIdToGroup =
			econGroups?.reduce(
				(acc, econGroup) =>
					econGroup?.assignments.reduce((acc, assignmentId) => {
						acc[assignmentId] = econGroup._id;
						return acc;
					}, acc) ?? {},
				{}
			) ?? {};
		const groupIdsSet = new Set(selectedEconGroupIds);
		const pipelineAssignmentIdsSet = new Set(selectedAssignmentIds);
		selectedAssignmentIds.forEach((id) => groupIdsSet.add(assignmentIdToGroup[id]));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		groupIdsSet.delete(undefined as any);
		for (const groupId of groupIdsSet) {
			if (groupId) {
				groupIdToGroup[groupId].assignments?.forEach(pipelineAssignmentIdsSet.add, pipelineAssignmentIdsSet);
			}
		}

		const econGroupsIncludedInPipeline = groupIdsSet.size !== 0;
		return { wellPipelineCount: pipelineAssignmentIdsSet.size, econGroupsIncludedInPipeline };
	}, [selectedAssignmentIds, selectedEconGroupIds, econGroups]);

	const econRunWellLimit = econGroupsIncludedInPipeline ? ECON_GROUP_PIPELINE_LIMIT : ECON_PIPELINE_LIMIT;
	const maxCombos = Math.floor(econRunWellLimit / wellPipelineCount);

	const {
		economicsVisibility,
		setEconomicsVisibility,
		runEconomics,
		dialog: economicsDialog,
		runningEconomics,
	} = useEconomics({ project, scenario, maxCombos });

	const isEconomicsVisible = economicsVisibility !== 'hidden';

	const totalFilteredAssignments = filteredAssignmentIds.length;
	const selectedCountAssignments = selectedAssignmentIds.length;

	const totalFilteredGroups = filteredGroupIds.length;
	const selectedCountGroups = selectedEconGroupIds.length;

	const canRunEconomics = !isSorting && selectedCountAssignments + selectedCountGroups;

	const separation = '1rem';

	const { qualifierDialogs, createQualifier, manageQualifiers, mergeQualifiers, importQualifier, changeQualifier } =
		useQualifiers({
			scenarioId,
			qualifierColumns: columns,
			reload,
			selectedAssignmentIds,
		});

	const getQualifiersMenuItems = useCallbackRef((assumptionKey) => {
		const { activeQualifier, qualifiers } = columns[assumptionKey] ?? {};
		return [
			getItem('Create Qualifier', () => createQualifier({ assumptionKey }), !canUpdateScenario),
			getItem('Merge Qualifiers', () => mergeQualifiers({ assumptionKey }), !canUpdateScenario),
			getItem('Manage Qualifiers', () => manageQualifiers({ assumptionKey }), !canUpdateScenario),
			...(!NOT_IMPORTABLE_QUALIFIERS.includes(assumptionKey)
				? [getItem('Import Qualifier', () => importQualifier({ assumptionKey }), !canUpdateScenario)]
				: []),
			...Object.keys(qualifiers).map((key) => {
				const isSelected = key === activeQualifier;
				return getItem(
					qualifiers[key].name,
					() => {
						changeQualifier({ assumptionKey, qualifierKey: key });
					},
					isSelected || !canUpdateScenario
				);
			}),
		];
	});

	const getAssumptionMenuItems = useCallbackRef((assumptionKey) => {
		const isCCExport = ccToCcAsses.includes(assumptionKey);
		return [
			getItem(
				`Choose ${getAssumptionLabel(assumptionKey)}`,
				() => chooseModel({ assumptionKey }),
				!canUpdateScenario
			),
			assumptionKey === AssumptionKey.carbonNetwork &&
				getItem(`Mass Assign Latest Networks`, () => massAssignLastestNetworks(), !canUpdateScenario),
			assumptionKey !== AssumptionKey.carbonNetwork && // disabled for network and emission column until support is added
				assumptionKey !== AssumptionKey.emission &&
				getItem(`Choose Lookup Table`, () => chooseLookupTable({ assumptionKey }), !canUpdateScenario),
			assumptionKey === AssumptionKey.forecast &&
				getItem(`Choose TC Lookup Table`, () => chooseTCLookupTable({ assumptionKey }), !canUpdateScenario),
			getItem('Remove Assignments', () => removeAssignment({ assumptionKey }), !canUpdateScenario),
			SEPARATOR,
			getItem('Filter By', () => filterBy({ assumptionKey }), !canUpdateScenario),
			isCCExport && SEPARATOR,
			getItem('CSV/Excel Import', isCCExport && (() => importCSV({ assumptionKey })), !canUpdateScenario),
			getItem('CSV Export', isCCExport && (() => exportCSV({ assumptionKey }))),
		].filter(Boolean);
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [previewForecastDialog, showPreviewForecastDialog] = useDialog(PreviewForecast as any); // TODO: fix types

	const [deleteGroupsDialog, promptDeleteGroupsDialog] = useDialog(DeleteDialog);

	const handleDeleteEconGroup = useCallback(
		async (selectedEconGroupIds) => {
			await withLoadingBar(deleteEconGroups(selectedEconGroupIds));
			invalidateAssignments();
			invalidateSortedData();
			reload(undefined, ['econGroup']);
		},
		[deleteEconGroups, invalidateSortedData, invalidateAssignments, reload]
	);

	const handleDelete = async () => {
		await promptDeleteGroupsDialog({
			feat: 'Groups',
			valueToConfirm: 'Delete Groups',
			requireName: true,
			onDelete: () => {
				handleDeleteEconGroup(selectedEconGroupIds);
			},
		});
	};

	const openForecastPreview = useCallback(
		({
			_id: assignmentId,
			forecast: {
				model: { _id: fId },
			},
		}) => {
			const assignment = assignments.find(({ _id }) => _id === assignmentId); // HACK: assignment should be element of allAssignment
			showPreviewForecastDialog(({ onHide }) => ({
				fId,
				sId: scenarioId,
				source: 'scenario',
				initWell: assignment,
				wells: assignments.filter(({ well }) => well),
				wellKey: 'well',
				close: onHide,
				sorting,
			}));
		},
		[assignments, scenarioId, sorting, showPreviewForecastDialog]
	);
	const {
		runEconomicsMutation: { mutateAsync: runSingleEconomics },
	} = useQuickEconRunMutation();

	const [lastAssignment, setLastAssignment] = useState<Inpt.Api.Scenario.WellAssignmentBuild | undefined>();
	const lastRunId = lastAssignment?._id;
	const [econRun, setEconRun] = useState<{ monthly; oneLiner } | undefined>();

	const [singleRunVisible, setSingleRunVisible] = useState<'closed' | 'open' | 'expanded'>('closed');

	const runSingleWellAssignmentEconomics = useCallback(
		async (wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild): Promise<void> => {
			if (!scenario || !wellAssignment) {
				return;
			}

			const { monthly, oneLiner } = await withLoadingBar(
				runSingleEconomics({ scenarioId: scenario._id, wellAssignments: [wellAssignment] })
			);

			setEconRun({ monthly, oneLiner });

			confirmationAlert('Economics successfully ran');
			setLastAssignment(wellAssignment);
			setSingleRunVisible('open');
		},
		[runSingleEconomics, scenario]
	);

	const [singleWellDialog, _showWellDialog] = useDialog(SingleWellViewDialog);

	const showWellDialog = useCallbackRef(async (assignment) => {
		const { _id, well: wellId } = assignment;
		await _showWellDialog({
			wellId,
			context: { scenarioId, projectId },
		});
		reload([_id]);
	});

	const handleUpdateGroup = useCallback(
		async ({ value, assignment }) => {
			const assignmentId = assignment._id;
			await updateAssignmentEconGroup(assignment._id, value?._id);
			reload([assignmentId], ['econGroup'], value);
		},
		[updateAssignmentEconGroup, reload]
	);

	const [groupDialog, showGroupDialog] = useDialog(CreateGroupDialog);

	const handleCreateEconGroup = useCallback(
		async (groupConfiguration?: GroupConfiguration) => {
			if (!groupConfiguration) {
				return;
			}

			const {
				properties,
				configuration: { headers = [], groupName = '', massCreateGroups = false, headerAsName = false } = {},
			} = groupConfiguration ?? {};
			const newGroup = {
				properties,
				name: groupName,
				assignments: selectedAssignmentIds,
			};

			if (massCreateGroups) {
				await massCreateEconGroups(newGroup, headers, headerAsName);
			} else {
				await createEconGroup(newGroup);
			}
			invalidateAssignments();
			invalidateSortedData();
			reload(selectedAssignmentIds, ['econGroup']);
		},
		[
			createEconGroup,
			massCreateEconGroups,
			selectedAssignmentIds,
			invalidateSortedData,
			invalidateAssignments,
			reload,
		]
	);

	const handleUpdateEconGroup = useCallback(
		async (groupConfiguration?: GroupConfiguration) => {
			if (!groupConfiguration) {
				return;
			}
			await updateEconGroup({
				properties: groupConfiguration.properties,
				name: groupConfiguration.configuration.groupName,
				_id: groupConfiguration._id,
			});
			reload(undefined, ['econGroup']);
		},
		[reload, updateEconGroup]
	);

	const handleUpdateEconGroupHeaders = useCallback(
		async (group, colId, newValue) => {
			const isValueEmpty = (value) => value === '' || value === EMPTY;

			const visibleHeaders = headers;
			const headersToUpdate = headers.filter((header) => visibleHeaders.includes(header));
			const headersDataFromNodeEntries = Object.entries(group)
				.filter(([key]) => headersToUpdate.includes(key))
				.map(([key, value]) => (isValueEmpty(value) ? [key, null] : [key, value]));
			const headersDataFromNode = Object.fromEntries(headersDataFromNodeEntries);

			const valueToAssign = isValueEmpty(newValue) ? null : newValue;

			const newWellData = {
				...group.econGroup.well,
				...headersDataFromNode,
				[colId]: valueToAssign,
			};

			await withLoadingBar(
				updateEconGroup({
					_id: group._id,
					well: newWellData,
				})
			);
			reload([group._id], [colId], newValue);
		},
		[updateEconGroup, headers, reload]
	);

	const scenarioTableComponent = (
		<ScenarioTable
			ref={scenarioTableRef}
			{...{
				...props,
				assignments: sortedFilteredAssignments as Pick<Inpt.ScenarioWellAssignment, '_id' | 'well' | 'index'>[],
				assumptions,
				buildScenario,
				canUpdateScenario,
				chooseLookupTable,
				chooseModel,
				chooseTCLookupTable,
				columns,
				handleCreateEconGroup,
				handleUpdateEconGroup,
				econGroups,
				filters,
				getAssumptionMenuItems,
				getQualifiersMenuItems,
				headers,
				isSorting,
				lastRunId,
				lookupTables,
				setFilters: setHeaderFilters,
				onSortChange: setSorting,
				onVisibleHeadersChange,
				openForecastPreview,
				removeAssignment,
				requiredFields,
				runSingleWellAssignmentEconomics,
				selection,
				showCount: true,
				showInc,
				showSelection: true,
				showWellDialog,
				showGroupDialog,
				sorting,
				tcLookupTables,
				updateGroup: handleUpdateGroup,
				updateEconGroupHeaders: handleUpdateEconGroupHeaders,
				updateModel,
				visibleHeaders,
			}}
		/>
	);

	const dialogs = (
		<>
			{choosePSeriesDialog}
			{createIncrementalDialog}
			{economicsDialog}
			{exportDialogs}
			{exportProbabilisticDialog}
			{exportToAriesDialog}
			{exportToCsvDialog}
			{exportToPhdwinDialog}
			{filterDialogs}
			{gridItemDialog}
			{groupDialog}
			{massImportDialog}
			{previewForecastDialog}
			{qualifierDialogs}
			{rollupChart}
			{rollupDialog}
			{simpleSelectDialog}
			{singleWellDialog}
			{deleteGroupsDialog}
		</>
	);

	const [generalOptionModel, setGeneralOptionModel] = useState<{ name: string } | null>();

	useEffect(() => {
		(async () => {
			const model = await getApi(`/cost-model/getModelById/${general_options}`);
			setGeneralOptionModel(model);
		})();
	}, [general_options]);

	const generalOptionsTooltipTitle = generalOptionModel?.name || '';

	const scenarioTableHeadersWithSorting = useMemo(() => {
		const selectedHeadersSet = new Set(selectedHeaders);
		const headerToSorting = sorting
			.filter(({ field }) => selectedHeadersSet.has(field))
			.reduce((acc, { field, direction }, index) => {
				acc[field] = {
					priority: index + 1,
					direction: direction ? 'ASC' : 'DESC',
				};
				return acc;
			}, {});
		return selectedHeaders.map((header) => {
			const headerSortingData = headerToSorting[header];
			return {
				key: header,
				...headerSortingData,
			};
		});
	}, [selectedHeaders, sorting]);

	if (showToolbar) {
		return (
			<Section
				css={`
					padding: ${separation};
					height: 100%;
					width: 100%;
				`}
				fullPage
			>
				{dialogs}
				<SectionHeader
					as={Paper}
					css={`
						padding: 0.5rem;
						z-index: 3;
						display: flex;
						align-items: center;
						& > *:not(:first-child) {
							margin-left: 1rem;
						}
					`}
				>
					{!isEconomicsVisible && (
						<>
							<div
								css={`
									display: flex;
									flex-direction: column;
									> div:first-child {
										margin-top: 0;
									}
									> div {
										margin-top: 0.2rem;
									}
								`}
							>
								<SelectedCount
									count={selectedCountAssignments}
									total={totalFilteredAssignments}
									direction='row'
									itemName='Wells'
								/>
								{totalFilteredGroups > 0 && (
									<SelectedCount
										count={selectedCountGroups}
										total={totalFilteredGroups}
										direction='row'
										itemName='Groups'
									/>
								)}
							</div>
							<Separator />
						</>
					)}

					<div
						css={`
							display: flex;
							align-items: center;
							& > *:not(:first-child) {
								margin-left: 1rem;
							}
							& > *:not(:first-child) {
								margin-left: 0.5rem;
							}
						`}
					>
						{!isEconomicsVisible && (
							<>
								{wellFilterButton}
								<ScenarioHeadersSort
									onSorted={setSorting}
									// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
									currentSorting={sorting as any} // TODO: fix `ScenarioHeadersSort`'s `currentSorting` type
									usesGrouping
								/>

								{isFiltered && (
									<Button
										onClick={() => {
											clearWellFilter();
											removeAssumptionFilters();
											scenarioTableRef.current?.clearFilterModel();
											setHeaderFilters({});
										}}
										startIcon={faUndo}
										color='secondary'
									>
										Clear Filter
									</Button>
								)}
								<Button
									startIcon={faLayerPlus}
									onClick={async () => handleCreateEconGroup(await showGroupDialog())}
									disabled={!canCreateEconGroups && PERMISSIONS_TOOLTIP_MESSAGE}
								>
									Econ Group
								</Button>
								{!!selectedEconGroupIds?.length && (
									<Button
										color='warning'
										onClick={handleDelete}
										disabled={!canDeleteEconGroups && PERMISSIONS_TOOLTIP_MESSAGE}
									>
										Delete Groups
									</Button>
								)}
								<Button
									onClick={() => {
										chooseModel({
											assumptionKey: AssumptionKey.generalOptions,
											selectedModels: { general_options },
										});
									}}
									startIcon={requiredGeneralOptions ? null : faWrench}
									tooltipTitle={generalOptionsTooltipTitle}
								>
									{requiredGeneralOptions && <WarningIcon tooltipTitle={MISSING_GENERAL_OPTIONS} />}
									General Options
								</Button>
								{createIncrementalButton}
								{deleteIncrementalButton}
								{exportMenu}
								{importMenu}
							</>
						)}
						<MenuButton
							label='Roll Up'
							startIcon={faRabbitFast}
							disabled={!selectedCountAssignments && !rollUpDataExists}
						>
							<ButtonItem
								label='Generate Roll-Up'
								onClick={viewRollUp}
								disabled={!selectedCountAssignments || !canUpdateScenario}
							/>
							<ButtonItem
								label='View Roll-Up Chart'
								onClick={viewRollUpChart}
								disabled={!rollUpDataExists}
							/>
						</MenuButton>
						<Button
							color='secondary'
							disabled={
								!canRunEconomics ||
								runningEconomics ||
								(!canUpdateScenario && PERMISSIONS_TOOLTIP_MESSAGE) ||
								(wellPipelineCount > econRunWellLimit && 'Runs with Econ Groups limited to 5,000 wells')
							}
							onClick={() =>
								runEconomics(
									selectedAssignmentIds as Inpt.ObjectId<'scenario-well-assignment'>[],
									selectedEconGroupIds
								)
							}
							startIcon={FeatureIcons.economics}
							variant='outlined'
						>
							Run Scenario
						</Button>
					</div>
					<Box flex='1 1 0' />
					<Button onClick={() => setEconomicsVisibility((p) => (p === 'hidden' ? 'visible' : 'hidden'))}>
						{isEconomicsVisible ? 'Hide Economics' : 'Show Economics'}
					</Button>
				</SectionHeader>
				<SectionContent
					css={`
						display: flex;
						margin-top: ${separation};
					`}
				>
					{isEconomicsVisible ? (
						<EconomicsOutput
							css={economicsVisibility === 'visible' ? 'flex: 1;' : 'flex: 2;'}
							runningEconomics={runningEconomics}
							scenarioId={scenario._id}
							expanded={economicsVisibility === 'expanded'}
							scenarioTableHeaders={scenarioTableHeadersWithSorting}
							onToggleExpand={() =>
								setEconomicsVisibility((p) => (p === 'visible' ? 'expanded' : 'visible'))
							}
						/>
					) : (
						<div
							css={`
								flex: 1;
								width: 100%;
								height: 100%;
							`}
						>
							{scenarioTableComponent}
						</div>
					)}
					{singleRunVisible !== 'closed' && econRun && (
						<EconomicsRunCard
							css={{
								flex: singleRunVisible === 'expanded' ? 2 : 0.5,
								height: '100%',
								overflowY: 'auto',
							}}
							monthly={econRun.monthly}
							oneLiner={econRun.oneLiner}
							scenario={scenario}
							wellName={lastAssignment?.well_name}
							wellId={lastAssignment?.well}
							endActions={
								<>
									<IconButton
										size='small'
										onClick={() =>
											setSingleRunVisible((p) => (p === 'expanded' ? 'open' : 'expanded'))
										}
									>
										{singleRunVisible === 'expanded' ? FeatureIcons.compress : FeatureIcons.expand}
									</IconButton>
									<IconButton
										size='small'
										onClick={() => {
											setSingleRunVisible('closed');
											setLastAssignment(undefined);
										}}
									>
										{FeatureIcons.close}
									</IconButton>
								</>
							}
							title={ONELINER_HEADERS.map((key) =>
								lastAssignment?.[key] == null ? 'N/A' : lastAssignment?.[key]
							).join(' | ')}
						/>
					)}
				</SectionContent>
			</Section>
		);
	}

	return (
		<>
			{dialogs}
			{scenarioTableComponent}
		</>
	);
}

export function ScenarioPageContainer({ scenarioId, ...props }) {
	const { scenario, isFetching } = useScenario(scenarioId);
	const { project } = useCurrentProject();
	const { isFetching: isFetchingProject } = useCurrentProject();

	const isLoading = (isFetchingProject || isFetching) && !scenario?.wells?.length; // we send a partial scenario from the module list to show earlier the name of the scenario

	if (isLoading) return <Placeholder loading />;
	if (!scenario || !project) return <WithNotFound noData />;
	return <ScenarioPage scenario={scenario} project={project} {...props} />;
}

export function CurrentScenarioPage() {
	const scenarioId = useCurrentScenarioId();
	return <ScenarioPageContainer scenarioId={scenarioId} />;
}

export default CurrentScenarioPage;
