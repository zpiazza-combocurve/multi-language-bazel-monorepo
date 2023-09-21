import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { SortChangedEvent } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { useSelection } from '@/components/hooks';
import { Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography } from '@/components/v2';
import SidebarWithContent from '@/components/v2/misc/SidebarWithContent/SidebarWithContent';
import { customErrorAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { subscribe } from '@/helpers/alfa';
import { useDebounce } from '@/helpers/debounce';
import { addFilter as addFilterInfo, filterTypes, getFiltersObj, getSeparateFilters } from '@/helpers/filters';
import { toFeature } from '@/helpers/map/helpers';
import { getProjectHeaders, getProjectHeadersTypes, useRawProjectHeaders } from '@/helpers/project-custom-headers';
import { queryClient } from '@/helpers/query-cache';
import { deleteApi, postApi, putApi } from '@/helpers/routing';
import { fields as wellsHeaderTypesDt } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { Filter, Vis1Filter } from '@/inpt-shared/filters/shared';
import { useCurrentProject } from '@/projects/api';

import { Content, ContentHeaderLeft, ContentHeaderRight, ContentRef } from './NewWellFilterDialog/Content';
import { SidebarContent, SidebarFooter, SidebarHeader } from './NewWellFilterDialog/Sidebar';
import styles from './NewWellFilterDialog/new-well-filter.module.scss';
import { useMapFilter } from './NewWellFilterDialog/useMapFilter';
import { useVis1Filter } from './NewWellFilterDialog/useVis1Filter';
import { getWellsIds } from './api';
import { useFilterSettingsQuery, useSavedFilterQuery } from './queries';
import {
	INITIAL_FILTER_RESULT,
	SPECIAL_HEADERS,
	SPECIAL_HEADER_TYPES,
	getInitialFilters,
	getModuleNewTotalCount,
} from './shared';
import { LightFilterWellsResponseModel, WellFilterDialogProps } from './types';
import { WELL_FILTERS_QUERY_KEY } from './utils';
import { showFilterSaveDialog } from './well-filter-save';
import wellFilterTypes from './well-filter-types';

let filterGlobalCounter = 1;

const NewWellFilterDialog = (props: WellFilterDialogProps) => {
	const { onHide, visible, altProject, existingWells: _existingWells, wells, wellHeaders } = props;

	const [appliedSorting, setAppliedSorting] = useState<{ field: string; direction: 1 | -1 }[] | undefined>(undefined);
	const [filters, setFilters] = useState<Filter[]>([]);
	const [selectionFilters, setSelectionFilters] = useState<(Filter | Vis1Filter)[]>([]);
	const [filterResult, setFilterResult] = useState<LightFilterWellsResponseModel>(INITIAL_FILTER_RESULT);
	const [selectedWellHeaders, setSelectedWellHeaders] = useState<string[]>([]);
	const [selectedProjectHeaders, setSelectedProjectHeaders] = useState<string[]>([]);
	const [selectedSavedFilter, setSelectedSavedFilter] = useState<Filter | undefined>();
	const [filterSettingsUpdated, setFilterSettingsUpdated] = useState(false);
	const [mainView, setMainView] = useState<'map' | 'vis1' | undefined>();
	const [isLoading, setIsLoading] = useState(false);

	const appliedFilters = useMemo(
		() => [
			...getInitialFilters(wells),
			...(selectionFilters?.length
				? [
						{
							_id: filterGlobalCounter,
							name: `Filter${filterGlobalCounter++}`,
							...getFiltersObj(selectionFilters),
						},
				  ]
				: []),
		],
		[wells, selectionFilters]
	);

	const { project: currentProject } = useCurrentProject();
	//should be like this due to the logic of passing the props
	const project = altProject === undefined ? currentProject : altProject;

	const {
		canCreate: canCreateFilter,
		canDelete: canDeleteFilter,
		canUpdate: canUpdateFilter,
	} = usePermissions(SUBJECTS.Filters, project?._id);

	const { data: savedFilters, invalidate: invalidateSavedFilters } = useSavedFilterQuery(project?._id);
	const { data: filterSettings } = useFilterSettingsQuery(project?._id);

	const wellHeaderTypes = useMemo(() => {
		return { ...wellsHeaderTypesDt, ...SPECIAL_HEADER_TYPES };
	}, []);

	const { projectHeaders } = useRawProjectHeaders(project?._id);

	const projectHeaderNames = useMemo(() => getProjectHeaders(projectHeaders), [projectHeaders]);

	const projectHeaderTypes = useMemo(() => getProjectHeadersTypes(projectHeaders), [projectHeaders]);

	const existingWells = useMemo(() => (_existingWells ?? []) as Inpt.ObjectId<'well'>[], [_existingWells]);

	const isExcluding = useMemo(() => {
		return selectionFilters?.find(({ type }) => type === filterTypes.excludeMode)?.isExcluding ?? false;
	}, [selectionFilters]);

	const wellsForSelection = useMemo(() => {
		const lastIncludeFormFilters = appliedFilters.filter((filter) => !!filter?.include).pop();

		if (lastIncludeFormFilters) {
			return lastIncludeFormFilters?.include as Inpt.ObjectId<'well'>[];
		}

		return !wells || wells === 'ALL_WELLS' ? [] : (wells as unknown as Inpt.ObjectId<'well'>[]);
	}, [appliedFilters, wells]);

	const selection = useSelection(wellsForSelection);

	const contentRef = useRef<ContentRef>(null);
	const mapLayersRef = useRef();

	const addFilter = (filter) => {
		const newSelectionFilters = addFilterInfo(selectionFilters, filter);
		setSelectionFilters(newSelectionFilters);
	};

	const setExcludeMode = (isExcluding) => addFilter({ type: filterTypes.excludeMode, isExcluding });

	const setWellHeadersFilter = ({ headers }) => addFilter({ type: filterTypes.headersFilter, headers });

	const setProjectHeadersFilter = ({ headers }) => addFilter({ type: filterTypes.projectHeadersFilter, headers });

	const { mapFeatures, setMapFeatures, setGeoFilter } = useMapFilter(addFilter);

	const { defaultVis1Headers, deleteVis1Filter, applyVis1Filter, vis1Filters, setVis1Filters } = useVis1Filter(
		addFilter,
		selectionFilters,
		setSelectionFilters
	);
	const getWellIds = async () => {
		try {
			const { wells } = await getWellsIds(project?._id, appliedFilters, appliedSorting);

			return wells;
		} catch (error) {
			genericErrorAlert(error);
			return null;
		}
	};

	const resetFilter = useCallback(() => {
		setSelectionFilters([]);
		setMapFeatures([]);
		setSelectedSavedFilter(undefined);
	}, [setMapFeatures]);

	const saveAsFilter = () => {
		showFilterSaveDialog({
			updateSaveFilters: (newFilter) => {
				setSelectedSavedFilter(newFilter);
				invalidateSavedFilters();
			},
			project,
			appliedFilters,
		});
	};

	const saveFilter = async (filter?: Filter) => {
		try {
			setIsLoading(true);
			const appliedFilter = appliedFilters?.[appliedFilters.length - 1];
			if (!filter?._id || !filter) {
				return null;
			}

			await withLoadingBar(
				putApi(`/filters/updateFilter/${filter?._id}`, { filter: appliedFilter }),
				`${filter.name} Updated`
			);
			invalidateSavedFilters();
			setIsLoading(false);
		} catch (error) {
			setIsLoading(false);
			return genericErrorAlert(error);
		}
	};

	const deleteFilter = useCallback(
		async (filterId) => {
			if (filterId) {
				setIsLoading(true);
				await withLoadingBar(deleteApi(`/filters/deleteFilter/${filterId}`));
				invalidateSavedFilters();
				queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
				if (filterId === selectedSavedFilter?._id) {
					resetFilter();
				}
				setIsLoading(false);
			}
		},
		[selectedSavedFilter, invalidateSavedFilters, resetFilter]
	);

	const onApply = async () => {
		const {
			resolve,
			limit,
			type,
			returnFilters,
			confirm,
			wellsPerformanceThreshold,
			existingWells,
			wells: inputWells,
		} = props;

		const { totalCount = 0, newWellsCount = 0 } = filterResult;

		if (limit != null && totalCount > limit) {
			const filterType = type ? wellFilterTypes[type] : wellFilterTypes.filter;
			const typeWord = filterType.label.toLowerCase();
			customErrorAlert(`Can only ${typeWord} up to ${limit} wells`, 'Try again with fewer filtered wells');
			return;
		}

		const curExistingWells = (type === 'add' ? existingWells?.length : inputWells?.length) ?? 0;
		if (
			confirm &&
			!(await confirm(
				newWellsCount ?? totalCount,
				Number.isFinite(wellsPerformanceThreshold) &&
					getModuleNewTotalCount({ type, newWellsCount, existingWells: curExistingWells }) >
						(wellsPerformanceThreshold as number) // typescript being dumb? if Number.isFinite returns true it should be a number
					? wellsPerformanceThreshold
					: undefined
			))
		) {
			return;
		}

		if (returnFilters) {
			resetFilter();
			resolve(appliedFilters);
			return;
		}

		const wellIds = await getWellIds();

		if (!wellIds) {
			return;
		}

		resetFilter();
		resolve(wellIds);
	};

	const onSortChanged = useCallback((params: SortChangedEvent) => {
		const sorting = params.columnApi.getColumnState().find((column) => !!column.sort);
		setAppliedSorting(sorting ? [{ field: sorting.colId, direction: sorting.sort === 'asc' ? 1 : -1 }] : undefined);
	}, []);

	const onApplySelectionFilter = useCallback(() => {
		setSelectionFilters([
			{
				excludeAll: true,
				include: [...selection.selectedSet],
			},
		]);

		contentRef.current?.deselectAllRows();
		selection.deselectAll();
	}, [selection]);

	useEffect(() => {
		if (visible) {
			setFilters([...getInitialFilters(wells), ...(savedFilters ?? [])]);
		} else {
			setFilterResult(INITIAL_FILTER_RESULT);
			setFilters([]);
			setSelectionFilters([]);
		}
	}, [visible, wells, savedFilters]);

	useEffect(() => {
		if (filterSettings) {
			const { selectedHeaders: selectedWellHeaders, selectedProjectHeaders } = filterSettings;
			setSelectedWellHeaders(selectedWellHeaders);
			setSelectedProjectHeaders(selectedProjectHeaders);
		}
	}, [filterSettings]);

	const setSelectedFilter = useCallback(
		(filterId) => {
			const filter = filters.find((filter) => filter._id === filterId);
			const filterData = filter?.filter;

			const filterWellHeaders = filterData?.headers?.headers?.map(({ key }) => key) ?? [];
			const newSelectedWellHeaders = [...new Set((selectedWellHeaders || [])?.concat(filterWellHeaders))];
			const filterProjectHeaders = filterData?.projectHeaders?.headers?.map(({ key }) => key) ?? [];
			const newSelectedProjectHeaders = [
				...new Set((selectedProjectHeaders || [])?.concat(filterProjectHeaders)),
			];

			const selectionFilters = getSeparateFilters(filterData);

			setSelectionFilters(selectionFilters);
			setSelectedWellHeaders(newSelectedWellHeaders);
			setSelectedProjectHeaders(newSelectedProjectHeaders);
			setSelectedSavedFilter(filter);
			setMapFeatures(filterData.geo?.map(toFeature) ?? []);
		},
		[selectedProjectHeaders, selectedWellHeaders, filters, setMapFeatures]
	);

	const allWellHeaders = useMemo(() => {
		return { ...wellHeaders, ...SPECIAL_HEADERS };
	}, [wellHeaders]);

	const delayedFilterSettings = useDebounce(async (selectedHeaders, selectedProjectHeaders) => {
		await withLoadingBar(
			postApi('/filter-settings', {
				project: project?._id,
				settings: { selectedHeaders, selectedProjectHeaders },
			})
		);
	}, 1000);

	const saveFilterSettings = (selectedHeaders, selectedProjectHeaders) => {
		setSelectedProjectHeaders(selectedProjectHeaders);
		setSelectedWellHeaders(selectedHeaders);
		delayedFilterSettings(selectedHeaders, selectedProjectHeaders);
		setFilterSettingsUpdated(true);
	};

	const removeHeaderType = (inputKey: string, isProjectHeader: boolean) => {
		const newSelectedProjectHeaders = isProjectHeader
			? selectedProjectHeaders.filter((header) => header !== inputKey)
			: selectedProjectHeaders;
		const newSelectedWellHeaders = isProjectHeader
			? selectedWellHeaders
			: selectedWellHeaders.filter((header) => header !== inputKey);
		saveFilterSettings(newSelectedWellHeaders, newSelectedProjectHeaders);
	};

	const handleOnClose = () => {
		resetFilter();
		onHide();
	};

	const handleMainViewChange = (view?: 'map' | 'vis1') => {
		setMainView((prev) => {
			if (prev === view) {
				return undefined;
			}
			return view;
		});
	};

	const handleCenterMap = () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		mapLayersRef?.current?.mapRef.current?.centerMap();
	};

	return (
		<Dialog className={styles['new-wells-filtering-wrapper']} onClose={handleOnClose} open={visible} fullScreen>
			<DialogTitle disableTypography>
				<Typography>Filter Wells</Typography>
				<IconButton size='small' onClick={handleOnClose}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<Divider orientation='horizontal' />
			<DialogContent>
				<SidebarWithContent
					sidebarFlex={3}
					sidebarHeader={
						<SidebarHeader
							setSelectedFilter={setSelectedFilter}
							deleteFilter={deleteFilter}
							filters={filters}
							selectedSavedFilter={selectedSavedFilter}
							resetFilter={resetFilter}
							selectableWellHeaders={allWellHeaders}
							selectableProjectHeaders={projectHeaderNames}
							selectedHeaders={[...(selectedProjectHeaders ?? []), ...(selectedWellHeaders ?? [])]}
							onHeaderSelectChange={saveFilterSettings}
							canDeleteFilter={canDeleteFilter}
							setExcludeMode={setExcludeMode}
							isExcluding={isExcluding}
						/>
					}
					sidebarContent={
						<SidebarContent
							allWellHeaders={allWellHeaders}
							wellHeaderTypes={wellHeaderTypes}
							projectHeaders={projectHeaderNames}
							projectHeaderTypes={projectHeaderTypes}
							appliedFilters={appliedFilters}
							selectedWellHeaders={selectedWellHeaders}
							selectedProjectHeaders={selectedProjectHeaders}
							selectedSavedFilter={selectedSavedFilter}
							setWellHeadersFilter={setWellHeadersFilter}
							setProjectHeadersFilter={setProjectHeadersFilter}
							removeHeaderType={removeHeaderType}
							filterSettingsUpdated={filterSettingsUpdated}
							setFilterSettingsUpdated={setFilterSettingsUpdated}
						/>
					}
					sidebarFooter={
						<SidebarFooter
							onHide={handleOnClose}
							onApply={onApply}
							onSaveAs={saveAsFilter}
							onSave={saveFilter}
							canCreateFilter={canCreateFilter}
							projectId={project?._id}
							selectedSavedFilter={selectedSavedFilter}
							canUpdateFilter={canUpdateFilter}
							isLoading={isLoading}
						/>
					}
					contentHeaderLeft={
						<ContentHeaderLeft
							total={filterResult.totalCount}
							selection={selection}
							onApplySelectionFilter={onApplySelectionFilter}
							handleMainViewChange={handleMainViewChange}
							mainView={mainView}
						/>
					}
					contentHeaderRight={
						mainView === 'map' && (
							<ContentHeaderRight mapLayersRef={mapLayersRef} handleCenterMap={handleCenterMap} />
						)
					}
					content={
						<Content
							ref={contentRef}
							mapLayersRef={mapLayersRef}
							project={project}
							showMap={mainView === 'map'}
							projectId={project?._id}
							existingWells={existingWells}
							appliedFilters={appliedFilters}
							wells={wells}
							setFilterResult={setFilterResult}
							selection={selection}
							onSortChanged={onSortChanged}
							mapFeatures={mapFeatures}
							setGeoFilter={setGeoFilter}
							handleCenterMap={handleCenterMap}
							vis1Filters={vis1Filters}
							vis1Headers={defaultVis1Headers}
							setVis1Filters={setVis1Filters}
							applyVis1Filter={applyVis1Filter}
							deleteVis1Filter={deleteVis1Filter}
							wellHeaders={wellHeaders}
							wellHeaderTypes={wellHeaderTypes}
							mainView={mainView}
						/>
					}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default subscribe(NewWellFilterDialog, ['wellHeaders']);
