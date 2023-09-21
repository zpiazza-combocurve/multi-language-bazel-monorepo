import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { ColDef, EditableCallback, GetContextMenuItemsParams, MenuItemDef, ValueGetterParams } from 'ag-grid-community';
import { AgGridColumn } from 'ag-grid-react';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import AgGrid, {
	AgGridRef,
	DASHED_CELL_CLASS_NAME,
	DISABLED_CELL_CLASS_NAME,
	Editors,
	NEW_DESIGN_REWRITES,
	NUMBER_CELL_CLASS_NAME,
	defaultGetContextMenuItems,
	getCountColumnDef,
	useGridStateStorage,
} from '@/components/AgGrid';
import { Column } from '@/components/ReactDataGrid';
import { useChooseWellHeaders } from '@/components/hooks/useChooseWellHeaders';
import { Button, Divider, IconButton, Typography } from '@/components/v2';
import InfoIcon from '@/components/v2/misc/InfoIcon';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { getNodesIdsInRange, handleAgGridDeleteRangeSelectedCells } from '@/helpers/ag-grid';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import {
	EDITABLE_ID_HEADERS,
	NON_EDITABLE_HEADERS,
	SCOPE_KEY,
	WELLS_COLLECTION_KEY,
	useWellHeaders,
} from '@/helpers/headers';
import { updateProjectCustomHeadersData } from '@/helpers/project-custom-headers';
import { useSubscribeToCustomEvent } from '@/helpers/pub-sub';
import { useReactQueryEvent } from '@/helpers/query-cache';
import { postApi, putApi } from '@/helpers/routing';
import { hasNonWhitespace, pluralize } from '@/helpers/text';
import { formatValue } from '@/helpers/utilities';
import { Card } from '@/layouts/CardsLayout';
import { chooseHeadersIcon } from '@/manage-wells/shared/ChooseHeadersDialog';
import { WellsPageContext } from '@/manage-wells/shared/WellsPageContext';
import { MAP_TILE_QUERY_PREFIX } from '@/map/MapWellsCache';
import { Notification, NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { useCopyWells } from '@/projects/current-project/useCopyWells';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';
import useAddWellsToWellsCollection from '@/wells-collections/useAddWellsToWellsCollection';
import useRemoveWellsFromWellsCollections from '@/wells-collections/useRemoveWellsFromWellsCollections';
import { useStartExportWellsMutation } from '@/wells/mutations';

import WellsCollectionGroupCellRenderer from './WellsCollectionGroupCellRenderer';
import {
	COLLECTIONS,
	INVALID_VALUE,
	LATITUDE_HEADERS,
	LOCATION_HEADERS,
	LONGITUDE_HEADERS,
	PROJECT_CUSTOM_HEADERS_UPDATED_EVENT_NAME,
	WELLS_COLLECTION_FIELD_KEY,
	WELL_HEADER_NUMBER_COLUMNS,
	WithToolbarLike,
	getAgGridNodeIdByIds,
	getAgGridNodeIdFromWellRowData,
	getAgGridNodeIdInfo,
	getBooleanValue,
	getDateValue,
	getNumberValue,
	getNumberValueInRange,
	getWellHeaderColumnType,
	getWellHeaderValueFormatter,
	getWellIdFromAgGridNodeId,
	getWellsTableRowStyle,
	isIdValueValid,
	projectCustomHeaderTemplate,
	projectHeadersStorage,
	withUnits,
} from './shared';

const COUNT_COLUMN_DEF = getCountColumnDef();

const CACHE_BLOCK_SIZE = 5000;
/** Time to wait before actually fetching the data, useful when scrolling too much to lighten the db load */
const SCROLL_DEBOUNCE_TIME = 200;

const WELLS_COLLECTION_GROUPING_FIELD = '_id';

const STORAGE_KEY = 'HEADERS_TABLE_V1';

export function getColumns(headers: string[], wellHeaders: Record<string, string>): Column[] {
	return headers.map((key) => ({
		key,
		name: wellHeaders[key],
		width: 120,
		formatter: ({ value }) => formatValue(value),
	}));
}

type HeaderResolution = typeof COLLECTIONS.headers.value | typeof COLLECTIONS.customHeaders.value;

interface HeadersTableProps {
	CardContainer?: WithToolbarLike;
	leftHeader?: React.ReactNode;
	initialHeaders: string[];
	downloadLimit: number;
	resolution?: HeaderResolution;
	manageWellsCollections?: boolean;
	addRemoveWellsCollectionWells?: boolean;
	isWellsCollectionWells: boolean;
}

const EDITABLE_COLUMNS = ['string', 'date', 'boolean', 'number', 'integer', 'precise-number', 'percent'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function updateHeaders(data: Record<string, any>): Promise<{
	modified: number;
	total: number;
}> {
	return putApi('/well/updateWells', data);
}

const getCoordinatesValue = (header: string, val: unknown) => {
	if (LONGITUDE_HEADERS.includes(header)) {
		return getNumberValueInRange(val, -180, 180);
	}

	if (LATITUDE_HEADERS.includes(header)) {
		return getNumberValueInRange(val, -90, 90);
	}
};

const defaultColDefEditableCallback: EditableCallback = (params) => {
	if (params.context.editing && params.node.level === 0) {
		return (
			EDITABLE_COLUMNS.includes(params.column.getColDef().type as string) &&
			!NON_EDITABLE_HEADERS.includes(params.column.getColId())
		);
	}

	return false;
};

const regularWellHeaderEditableCallback = defaultColDefEditableCallback;

function HeadersTable({
	CardContainer = Card,
	leftHeader,
	initialHeaders,
	downloadLimit,
	manageWellsCollections = false,
	addRemoveWellsCollectionWells = false,
	isWellsCollectionWells,
}: HeadersTableProps) {
	const { project } = useCurrentProject();

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const {
		wellIds,
		getWellIds,
		allWellCount: totalWells,
		selection: idsSelection,
		nodeIdsSelection,
		filters: extraFilters,
		companyOnly,
		editingWells: editing,
		setEditingWells: setEditing,
	} = useContext(WellsPageContext);

	const { wellHeadersLabels, wellHeadersTypes, wellHeadersUnits, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: !companyOnly,
		enableScopeHeader: true,
		enableWellsCollectionHeader: !companyOnly && isWellsCollectionsEnabled,
	});

	const { data: _wellsCollectionsQueryData, invalidate: invalidateWellsCollectionsQuery } = useWellsCollectionsQuery(
		project?._id,
		manageWellsCollections || addRemoveWellsCollectionWells
	);
	const { wellsCollectionsQueryData, wellsCollectionsQueryDataIdsSet } = useMemo(() => {
		if (isWellsCollectionWells) {
			return {
				wellsCollectionsQueryData: [],
				wellsCollectionsQueryDataIdsSet: new Set<Inpt.ObjectId<'wells-collection'>>(),
			};
		}

		const data = _wellsCollectionsQueryData ?? [];

		return {
			wellsCollectionsQueryData: data,
			wellsCollectionsQueryDataIdsSet: new Set(data.map(({ _id }) => _id)),
		};
	}, [isWellsCollectionWells, _wellsCollectionsQueryData]);

	const hasWellsCollectionsToShow = wellsCollectionsQueryDataIdsSet.size > 0;

	const { add: addWellsToWellsCollection, addWellToCollectionDialog } = useAddWellsToWellsCollection(
		project?._id,
		idsSelection,
		manageWellsCollections
	);

	const { canUpdate: canUpdateWellsCollections } = usePermissions(SUBJECTS.WellsCollections, project?._id);

	const { remove: removeWellsFromWellsCollections, removing: removingWellsFromWellsCollection } =
		useRemoveWellsFromWellsCollections(project?._id, nodeIdsSelection, manageWellsCollections);

	const agGridRef = useRef<AgGridRef>(null);

	const modifiedRowsRef = useRef({});

	const {
		selectedKeys: uncleanSelectedHeaders,
		selectItems: selectHeaders,
		setSelectedItems: setSelectedHeaders,
	} = useChooseWellHeaders({
		companyOnly,
		defaultKeys: initialHeaders,
		enableProjectCustomHeaders: !companyOnly,
		storageKey: projectHeadersStorage.getKey(project?._id),
		storageVersion: projectHeadersStorage.version,
	});

	const onPCHsChanged = useCallback(
		(newHeaders: string[]) => {
			setSelectedHeaders((p) => _.uniq([...p, ...newHeaders]));
		},
		[setSelectedHeaders]
	);
	useSubscribeToCustomEvent(PROJECT_CUSTOM_HEADERS_UPDATED_EVENT_NAME, onPCHsChanged);

	const selectedHeaders = useMemo(
		() => uncleanSelectedHeaders.filter((key) => !!wellHeadersLabels[key]),
		[uncleanSelectedHeaders, wellHeadersLabels]
	);

	const { isLoading: startingExportWells, mutateAsync: startExportWells } = useStartExportWellsMutation();

	const canDownload = (() => {
		if (idsSelection?.selectedSet?.size) {
			return idsSelection.selectedSet.size <= downloadLimit;
		}
		return typeof totalWells === 'number' && totalWells <= downloadLimit;
	})();

	const columns = useMemo(() => getColumns(selectedHeaders, wellHeadersLabels), [selectedHeaders, wellHeadersLabels]);

	const { globalColumns = [], customColumns = [] } = _.groupBy(columns, (column) =>
		projectCustomHeadersKeys.includes(column.key) ? 'customColumns' : 'globalColumns'
	);

	const [hasBeenEdited, setHasBeenEdited] = useState(false);

	const [filteredIds, setFilteredIds] = useState<string[] | undefined>(undefined);

	const queryClient = useQueryClient();

	const saveMutation = useMutation(
		async () => {
			const modifiedHeaders = modifiedRowsRef.current;

			if (companyOnly || !project) {
				return {
					headersUpdateResult: await updateHeaders(modifiedHeaders),
				};
			}

			const customKeys = _.map(customColumns, 'key');

			if (customKeys.length === 0) {
				return {
					headersUpdateResult: await updateHeaders(modifiedHeaders),
				};
			}

			// get custom headers in the right format to save in db
			const customHeadersUpdate = _.map(modifiedHeaders, (value, well) => ({
				well,
				customHeaders: _.pick(value, customKeys),
			}));

			// TODO merge these two operations in one in the server
			const [headersUpdateResult] = await Promise.all([
				updateHeaders(modifiedHeaders), // NOTE it is sending project custom header data too
				updateProjectCustomHeadersData(project._id, customHeadersUpdate),
			]);

			return { headersUpdateResult };
		},
		{
			onError: (error: Error) => genericErrorAlert(error),
			onSuccess: ({ headersUpdateResult: { modified } }) => {
				modifiedRowsRef.current = {};
				setHasBeenEdited(false);

				if (modified > 0) {
					const pluralWells = pluralize(modified, 'item', 'items');
					confirmationAlert(`Updated ${pluralWells} successfully`);

					agGridRef.current?.api.refreshServerSideStore({ purge: true });
					queryClient.invalidateQueries([MAP_TILE_QUERY_PREFIX]);

					invalidateWellsCollectionsQuery(); // TODO Check if needed
				}
			},
		}
	);

	const handleExportWells = async () => {
		const wellIds = (
			idsSelection?.selectedSet?.size ? [...idsSelection.selectedSet] : await getWellIds()
		) as Inpt.ObjectId<'well'>[];
		const projectId = companyOnly ? undefined : project?._id;

		await startExportWells({ wellIds, projectId });
	};

	const handleSave = () => saveMutation.mutateAsync().then(() => setEditing(false));
	const handleToggleEditing = () => {
		setEditing((p) => !p);
		agGridRef.current?.api.deselectAll();
		if (editing === true) {
			agGridRef.current?.api.refreshServerSideStore({});
			setHasBeenEdited(false);
			modifiedRowsRef.current = {};
		}
	};

	const handleSelectAll = () => {
		if (filteredIds) {
			const wellsCollectionsWellsNodeIds = wellsCollectionsQueryData
				.filter(({ _id }) => filteredIds.includes(_id))
				.flatMap(({ _id, wells_collection_items }) =>
					wells_collection_items.map((item) => getAgGridNodeIdByIds(_id, item))
				);

			nodeIdsSelection.setSelectedSet([...filteredIds, ...wellsCollectionsWellsNodeIds]);

			return;
		}

		const wellsCollectionsWellsNodeIds = wellsCollectionsQueryData.flatMap(({ _id, wells_collection_items }) =>
			wells_collection_items.map((item) => getAgGridNodeIdByIds(_id, item))
		);

		nodeIdsSelection.setSelectedSet([...idsSelection.all, ...wellsCollectionsWellsNodeIds]);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const isServerSideGroup = useCallback((dataItem: any) => {
		return !!dataItem[WELLS_COLLECTION_FIELD_KEY];
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const getServerSideGroupKey = useCallback((dataItem: any) => {
		return dataItem._id;
	}, []);

	const onRowGroupOpened = useCallback(() => {
		agGridRef.current?.api.redrawRows();
	}, []);

	const defaultValueGetter = useCallback((params: ValueGetterParams) => {
		if (!params.node?.id || !params.colDef.field) {
			return undefined;
		}

		const modifiedValue = modifiedRowsRef.current[getWellIdFromAgGridNodeId(params.node.id)]?.[params.colDef.field];

		if (modifiedValue !== undefined && hasNonWhitespace(modifiedValue)) {
			return modifiedValue;
		}

		return params.data[params.colDef.field];
	}, []);

	const wellsCollectionValueGetter = useCallback((params: ValueGetterParams) => {
		return params.data.wells_collection_items ? 'Yes' : 'No';
	}, []);

	const pchEditableCallback: EditableCallback = useCallback(
		(params) =>
			params.context.editing &&
			params.node.level === 0 &&
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			EDITABLE_COLUMNS.includes(getWellHeaderColumnType(params.column.getColId(), wellHeadersTypes)!),
		[wellHeadersTypes]
	);

	const autoGroupColumnDef = useMemo<ColDef | undefined>(() => {
		return {
			hide: !hasWellsCollectionsToShow,
			field: WELLS_COLLECTION_GROUPING_FIELD,
			headerName: '',
			cellRenderer: 'agGroupCellRenderer',
			cellRendererParams: {
				innerRenderer: WellsCollectionGroupCellRenderer,
			},
			editable: false,
			sortable: false,
			suppressMovable: true,
			floatingFilter: false,
			width: 130,
		};
	}, [hasWellsCollectionsToShow]);

	const { handleCopyWells } = useCopyWells({
		projectId: project?._id,
	});

	const getContextMenuItems = useCallback(
		(params: GetContextMenuItemsParams): (string | MenuItemDef)[] => {
			const additionalMenuItems: (string | MenuItemDef)[] = [];

			if (manageWellsCollections && params.node?.id && params.node?.data) {
				if (nodeIdsSelection.selectedSet.size > 0 && nodeIdsSelection.isSelected(params.node.id)) {
					additionalMenuItems.push({
						name: 'Make copy',
						action: () => {
							return handleCopyWells({
								wellIds: [...nodeIdsSelection.selectedSet].map((nodeId) => {
									const nodeIdInfo = getAgGridNodeIdInfo(nodeId, wellsCollectionsQueryDataIdsSet);
									if (nodeIdInfo.wellId) {
										return nodeIdInfo.wellId;
									} else {
										return nodeIdInfo.wellsCollectionId;
									}
								}) as Inpt.ObjectId[],
							});
						},
					});
				} else {
					additionalMenuItems.push({
						name: 'Make copy',
						action: () => {
							return handleCopyWells({
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								wellIds: [params.node!.data._id] as Inpt.ObjectId<'Well'>[],
							});
						},
					});
				}
			}

			if ((manageWellsCollections || addRemoveWellsCollectionWells) && params.node?.id && params.node?.data) {
				if (nodeIdsSelection.selectedSet.size > 0 && nodeIdsSelection.isSelected(params.node.id)) {
					const wellsOnly = new Set<string>();
					const removeWellsPreliminaryData = wellsCollectionsQueryData.reduce((acc, curr) => {
						acc[curr._id] = new Set<string>();
						return acc;
					}, {} as Record<string, Set<string>>);

					[...nodeIdsSelection.selectedSet].forEach((nodeId) => {
						const nodeIdInfo = getAgGridNodeIdInfo(nodeId, wellsCollectionsQueryDataIdsSet);

						if (nodeIdInfo.wellId) {
							wellsOnly.add(nodeIdInfo.wellId);

							if (nodeIdInfo.wellsCollectionId) {
								removeWellsPreliminaryData[nodeIdInfo.wellsCollectionId].add(nodeIdInfo.wellId);
							} else {
								Object.keys(removeWellsPreliminaryData).forEach((wellsCollectionId) =>
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									removeWellsPreliminaryData[wellsCollectionId].add(nodeIdInfo.wellId!)
								);
							}
						}
					});

					if (wellsOnly.size > 0) {
						additionalMenuItems.push({
							name: `Add selected ${pluralize(wellsOnly.size, 'Well', 'Wells')} to Wells Collection`,
							action: () => addWellsToWellsCollection([...wellsOnly] as Inpt.ObjectId<'well'>[]),
							disabled: !canUpdateWellsCollections,
						});
					}

					const removeWellsFinalData = Object.entries(removeWellsPreliminaryData).reduce(
						(acc, [wellsCollectionId, set]) => {
							if (set.size > 0) {
								acc[wellsCollectionId] = [...set] as Inpt.ObjectId<'well'>[];
							}
							return acc;
						},
						{} as Record<string, Inpt.ObjectId<'well'>[]>
					);

					const wellsCollectionsToRemoveWellsCount = Object.keys(removeWellsFinalData).length;

					if (wellsCollectionsToRemoveWellsCount > 0) {
						additionalMenuItems.push({
							name: `Remove selected Wells from ${pluralize(
								wellsCollectionsToRemoveWellsCount,
								'Wells Collection',
								'Wells Collections'
							)}`,
							action: () => removeWellsFromWellsCollections(removeWellsFinalData),
							disabled: !canUpdateWellsCollections,
						});
					}
				} else if (!params.node.data[WELLS_COLLECTION_FIELD_KEY]) {
					additionalMenuItems.push({
						name: 'Add this Well to Wells Collection',
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						action: () => addWellsToWellsCollection([params.node!.data._id]),
						disabled: !canUpdateWellsCollections,
					});

					//shown at the top level
					if (params.node.level === 0) {
						const wellsCollectionsWithWell = wellsCollectionsQueryData
							.filter(({ wells_collection_items }) =>
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								wells_collection_items.includes(params.node!.data?._id)
							)
							.map(({ _id }) => _id);

						if (wellsCollectionsWithWell.length > 0) {
							additionalMenuItems.push({
								name: `Remove this Well from ${pluralize(
									wellsCollectionsWithWell.length,
									'Wells Collection',
									'Wells Collections'
								)}`,
								action: () =>
									removeWellsFromWellsCollections(
										wellsCollectionsWithWell.reduce((acc, wellCollectionId) => {
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
											acc[wellCollectionId] = [params.node!.data._id];
											return acc;
										}, {})
									),
								disabled: !canUpdateWellsCollections,
							});
						}
					}
					// shown as a well of wells collection
					else if (params.node.level === 1) {
						const wellsCollection = wellsCollectionsQueryData.find(({ wells_collection_items }) =>
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							wells_collection_items.includes(params.node!.data?._id)
						);

						if (wellsCollection) {
							additionalMenuItems.push({
								name: `Remove this Well from Wells Collection '${wellsCollection.well_name}'`,
								action: () =>
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									removeWellsFromWellsCollections({ [wellsCollection._id]: [params.node!.data._id] }),
								disabled: !canUpdateWellsCollections,
							});
						}
					}
				}
			}

			return [...defaultGetContextMenuItems(params), ...additionalMenuItems];
		},
		[
			addRemoveWellsCollectionWells,
			addWellsToWellsCollection,
			canUpdateWellsCollections,
			handleCopyWells,
			manageWellsCollections,
			nodeIdsSelection,
			removeWellsFromWellsCollections,
			wellsCollectionsQueryData,
			wellsCollectionsQueryDataIdsSet,
		]
	);

	useReactQueryEvent(['well-headers'], () => agGridRef.current?.api.refreshServerSideStore({ purge: true }));

	const editButtons = editing ? (
		<>
			<Button
				css='text-transform: unset;'
				color='secondary'
				disabled={!hasBeenEdited || saveMutation.isLoading}
				onClick={handleSave}
			>
				Save
			</Button>
			<Button css='text-transform: unset;' onClick={handleToggleEditing}>
				Cancel
			</Button>
			<InfoIcon tooltipTitle={`Copy and paste up to ${CACHE_BLOCK_SIZE} rows at a time`} />
		</>
	) : (
		<Button color='secondary' css='text-transform: unset;' onClick={handleToggleEditing}>
			Edit
		</Button>
	);

	useEffect(() => {
		agGridRef.current?.api.redrawRows();
		const topLevelIds = new Set([...nodeIdsSelection.selectedSet].map((nId) => getWellIdFromAgGridNodeId(nId)));
		idsSelection.setSelectedSet(topLevelIds);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodeIdsSelection.selectedSet]);

	const createWellsNotificationCallback = useCallback(
		async (notification: Notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.projectId === project?._id) {
				if (
					notification.status === TaskStatus.COMPLETED &&
					notification.extra?.body?.projectId === project?._id
				) {
					setSelectedHeaders((p) => _.uniq([...p, ...notification.extra.body.headers]));
				}
			}
		},
		[project?._id, setSelectedHeaders]
	);

	const companyWellsDeletedNotificationCallback = useCallback(
		async (notification: Notification) => {
			if (companyOnly && notification.status === TaskStatus.COMPLETED) {
				agGridRef.current?.api.refreshServerSideStore({ purge: true });
				nodeIdsSelection.setSelectedSet([]);
			}
		},
		[companyOnly, nodeIdsSelection]
	);

	const { tableStorageProps } = useGridStateStorage(STORAGE_KEY);

	useUserNotificationCallback(NotificationType.CREATE_WELLS, createWellsNotificationCallback);
	useUserNotificationCallback(NotificationType.DELETE_WELLS, companyWellsDeletedNotificationCallback);

	useLoadingBar(removingWellsFromWellsCollection || startingExportWells);

	return (
		<CardContainer
			opaque
			forceMaximized={isWellsCollectionWells}
			iconsColor='default'
			iconsSize='small'
			toolbarCss={`
				min-height: unset;
				margin-bottom: 0.5rem;
			`}
			left={
				<>
					<Typography>Wells Table</Typography>
					{!isWellsCollectionWells && (
						<>
							<Divider css='margin: 0 1px 0 1rem;' orientation='vertical' flexItem />
							{leftHeader}
							{editButtons}
							{!companyOnly && !editing && (
								<Button css='text-transform: unset;' onClick={handleSelectAll}>
									Select All
								</Button>
							)}
						</>
					)}
				</>
			}
			right={
				<>
					{Number.isFinite(totalWells) && (
						<IconButton
							css='margin-right: 0.5rem;'
							iconSize='small'
							size='small'
							onClick={() => handleExportWells()}
							disabled={
								(startingExportWells && 'Starting export...') ||
								(!canDownload && `Export up to ${downloadLimit} wells`)
							}
						>
							{faDownload}
						</IconButton>
					)}
					<IconButton css='margin-right: 0.5rem;' iconSize='small' size='small' onClick={selectHeaders}>
						{chooseHeadersIcon}
					</IconButton>
				</>
			}
		>
			{addWellToCollectionDialog}
			<AgGrid
				key={hasWellsCollectionsToShow.toString()}
				getRowClass={(params) => {
					return wellsCollectionsQueryDataIdsSet.has(params.data?._id) ? 'wells-collection-row' : undefined;
				}}
				css={`
					width: 100%;
					height: 100%;
					${NEW_DESIGN_REWRITES}
					.ag-row.wells-collection-row {
						.ag-group-contracted,
						.ag-group-expanded {
							margin-right: 1rem;
						}
					}
				`}
				ref={agGridRef}
				onRowGroupOpened={onRowGroupOpened}
				suppressReactUi
				suppressRowClickSelection
				suppressMultiRangeSelection
				enableRangeSelection
				treeData={hasWellsCollectionsToShow}
				isServerSideGroup={hasWellsCollectionsToShow ? isServerSideGroup : undefined}
				getServerSideGroupKey={hasWellsCollectionsToShow ? getServerSideGroupKey : undefined}
				autoGroupColumnDef={autoGroupColumnDef}
				enableGroupEdit
				getRowId={getAgGridNodeIdFromWellRowData}
				rowModelType='serverSide'
				context={{ editing, nodeIdsSelection }}
				serverSideStoreType='partial'
				cacheBlockSize={CACHE_BLOCK_SIZE}
				blockLoadDebounceMillis={SCROLL_DEBOUNCE_TIME}
				{...tableStorageProps}
				serverSideDatasource={useMemo(
					() => ({
						getRows: async (params) => {
							try {
								const request = { ...params.request };

								// HACK: wellsCollectionsQueryData check is redundant here but it is needed to correctly
								// handle the refresh after adding/removing wells to/from collection and hide the
								// useMemo deps error
								const isWellsCollectionWellsRequest =
									wellsCollectionsQueryData && request.groupKeys.length > 0;

								if (isWellsCollectionWellsRequest) {
									//we don't want to filter the wells inside wells collection
									request.filterModel = {};
								}

								const noSortingAndSearch =
									_.isEmpty(request.filterModel) && _.isEmpty(request.sortModel);
								const getCount = !noSortingAndSearch || companyOnly;

								// HACK for scope, use set filter instead
								if (request.filterModel.scope) {
									const regexp = new RegExp(_.escapeRegExp(request.filterModel.scope.filter), 'i');
									if (regexp.test('Company') && regexp.test('Project')) {
										request.filterModel.scope.filter = 'both';
									} else if (regexp.test('Company')) {
										request.filterModel.scope.filter = false;
									} else if (regexp.test('Project')) {
										request.filterModel.scope.filter = true;
									}
								}

								if (request.filterModel.wells_collection) {
									const regexp = new RegExp(
										_.escapeRegExp(request.filterModel.wells_collection.filter),
										'i'
									);
									if (regexp.test('Yes') && regexp.test('No')) {
										request.filterModel.wells_collection.filter = 'both';
									} else if (regexp.test('No')) {
										request.filterModel.wells_collection.filter = false;
									} else if (regexp.test('Yes')) {
										request.filterModel.wells_collection.filter = true;
									}
								}

								const {
									rowData,
									ids = wellIds,
									rowCount = wellIds?.length,
								} = await (postApi(`/well/agGrid`, {
									request,
									extraFilters,
									companyOnly,
									project: project?._id,
									fields: selectedHeaders,
									getCount,
								}) as Promise<{ ids: string[]; rowData: object[]; rowCount: number }>);

								// we don't want to update this when querying for the wells under wells collection
								if (!isWellsCollectionWellsRequest) {
									setFilteredIds(ids);
								}

								params.success({ rowData, rowCount });
								// eslint-disable-next-line no-useless-return -- TODO eslint fix later
								return;
							} catch (err) {
								params.fail();
							}
						},
					}),
					[companyOnly, extraFilters, project?._id, selectedHeaders, wellIds, wellsCollectionsQueryData]
				)}
				defaultColDef={useMemo(
					() => ({
						valueFormatter: getWellHeaderValueFormatter(wellHeadersTypes),
						sortable: true,
						menuTabs: ['generalMenuTab'],
						resizable: true,
						filterParams: { suppressAndOrCondition: true },
						floatingFilterComponentParams: { suppressFilterButton: true },
						suppressKeyboardEvent: (params) => {
							if (params.event.key === 'Delete' && params.context.editing) {
								const newData = handleAgGridDeleteRangeSelectedCells(params.api, {
									ignoreColumns: NON_EDITABLE_HEADERS,
								});
								if (newData === undefined) {
									return true;
								}
								_.merge(modifiedRowsRef.current, newData);
								setHasBeenEdited(true);

								agGridRef.current?.api.refreshCells();

								return true;
							}
							return false;
						},
						valueSetter: (params) => {
							if (!params.node?.id || !params.colDef.field) {
								return false;
							}

							const val = (() => {
								if (params.newValue?.trim?.() === '' || params.newValue == null) {
									if (
										!!params.data[WELLS_COLLECTION_FIELD_KEY] &&
										params.colDef.field === 'well_name'
									) {
										return params.oldValue;
									}

									return null;
								}
								if (EDITABLE_ID_HEADERS.includes(params.colDef.field)) {
									return isIdValueValid(params.newValue, params.colDef.field);
								}
								if (WELL_HEADER_NUMBER_COLUMNS.includes(params.colDef.type as string)) {
									if (LOCATION_HEADERS.includes(params.colDef.field)) {
										return getCoordinatesValue(params.colDef.field, params.newValue);
									}
									return getNumberValue(params.newValue);
								}
								if (params.colDef.type === 'boolean') {
									return getBooleanValue(params.newValue);
								}
								if (params.colDef.type === 'date') {
									return getDateValue(params.newValue);
								}
								return params.newValue.trim();
							})();

							if (val === INVALID_VALUE) {
								return false;
							}
							const id = getWellIdFromAgGridNodeId(params.node.id);
							modifiedRowsRef.current[id] ??= {};
							modifiedRowsRef.current[id][params.colDef.field] = val;

							setHasBeenEdited(true);

							return true;
						},
						valueGetter: defaultValueGetter,
						editable: defaultColDefEditableCallback,
						cellClassRules: {
							[NUMBER_CELL_CLASS_NAME]: (params) =>
								WELL_HEADER_NUMBER_COLUMNS.includes(params.colDef.type as string),
							[DISABLED_CELL_CLASS_NAME]: (params) =>
								params.node.level !== 0 ||
								(params.context.editing &&
									!(
										EDITABLE_COLUMNS.includes(params.colDef.type as string) &&
										!NON_EDITABLE_HEADERS.includes(params.colDef.field as string)
									)),
							[DASHED_CELL_CLASS_NAME]: (params) =>
								params.colDef.field === WELLS_COLLECTION_GROUPING_FIELD &&
								!params.data[WELLS_COLLECTION_FIELD_KEY],
						},
					}),
					[wellHeadersTypes, defaultValueGetter]
				)}
				columnTypes={{
					string: {
						cellEditor: Editors.TextEditor,
						filter: 'agTextColumnFilter',
						floatingFilter: true,
						filterParams: { filterOptions: ['contains'] },
					},
					'multi-select': {
						cellEditor: Editors.TextEditor,
						filter: 'agTextColumnFilter',
						floatingFilter: true,
						filterParams: { filterOptions: ['contains'] },
					},
					date: {
						cellEditor: Editors.DateEditor,
					},
					boolean: { cellEditor: Editors.BooleanEditor },
					number: { cellEditor: Editors.NumberEditor },
					percent: { cellEditor: Editors.NumberEditor },
					integer: { cellEditor: Editors.NumberEditor },
					'precise-number': { cellEditor: Editors.NumberEditor },
				}}
				suppressCsvExport
				suppressExcelExport
				processCellForClipboard={(params) => {
					const colDef = params.column.getColDef();
					if (colDef.type !== 'date') {
						return params.value;
					}
					if (typeof colDef.valueFormatter === 'function') {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						return colDef.valueFormatter(params as any);
					}
					return params.value;
				}}
				suppressLastEmptyLineOnPaste // fixes excel issue https://www.ag-grid.com/javascript-data-grid/grid-properties/#reference-clipboard
				maintainColumnOrder
				rowClassRules={{
					'ag-row-selected': (params) =>
						params.node?.id && params.context.nodeIdsSelection?.selectedSet.has(params.node.id),
				}}
				getRowStyle={useMemo(
					() => getWellsTableRowStyle(wellsCollectionsQueryDataIdsSet),
					[wellsCollectionsQueryDataIdsSet]
				)}
				onRowClicked={(params) => {
					if (editing || !params.node?.id) return;

					const nodeId = params.node.id;

					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					if ((params.event as any | undefined)?.ctrlKey || (params.event as any | undefined)?.metaKey) {
						nodeIdsSelection.toggle(nodeId);

						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					if ((params.event as any | undefined)?.shiftKey) {
						const focussed = params.api.getFocusedCell();
						if (!focussed || params.rowIndex == null) return;

						const nodeIds = getNodesIdsInRange(params.api, focussed.rowIndex, params.rowIndex);
						nodeIdsSelection.select(nodeIds);

						return;
					}

					nodeIdsSelection.setSelectedSet([nodeId]);
				}}
				onRangeSelectionChanged={(params) => {
					if (!params.finished || params.started || editing) {
						return;
					}
					// adapt range selection to "selection" object
					const ranges = params.api.getCellRanges();

					if (!ranges) {
						nodeIdsSelection.deselectAll();
						return;
					}

					if (!ranges[0]) {
						return;
					}

					// if there is only a single cell in the selection we assume it was clicked or ctrl-clicked and ignore the selection
					if (ranges[0].startRow?.rowIndex === ranges[0].endRow?.rowIndex && ranges[0].columns.length === 1) {
						return;
					}

					const newNodeIdsSelection = ranges.flatMap((range) => {
						if (!range.startRow || !range.endRow) return [];
						return getNodesIdsInRange(params.api, range.startRow.rowIndex, range.endRow.rowIndex);
					});

					nodeIdsSelection.setSelectedSet(newNodeIdsSelection);
				}}
				getContextMenuItems={getContextMenuItems}
			>
				<AgGridColumn {...COUNT_COLUMN_DEF} />
				{withUnits(globalColumns, wellHeadersUnits).map(({ name, key }) => {
					return (
						<AgGridColumn
							key={key}
							field={key}
							headerName={name}
							type={getWellHeaderColumnType(key, wellHeadersTypes)}
							editable={regularWellHeaderEditableCallback}
							{...(key === WELLS_COLLECTION_KEY ? { valueGetter: wellsCollectionValueGetter } : {})}
							{...(key === SCOPE_KEY || key === WELLS_COLLECTION_KEY ? { sortable: false } : {})}
						/>
					);
				})}
				{customColumns?.map(({ name, key }) => (
					<AgGridColumn
						key={key}
						field={key}
						headerName={name}
						type={getWellHeaderColumnType(key, wellHeadersTypes)}
						editable={pchEditableCallback}
						// disable filter for custom headers
						headerComponentParams={{ template: projectCustomHeaderTemplate }}
					/>
				))}
			</AgGrid>
		</CardContainer>
	);
}

export default HeadersTable;
