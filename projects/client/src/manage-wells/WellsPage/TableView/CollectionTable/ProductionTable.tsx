import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { ProcessDataFromClipboardParams } from 'ag-grid-community';
import { AgGridColumn } from 'ag-grid-react';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import AgGrid, {
	AgGridRef,
	DISABLED_CELL_CLASS_NAME,
	NEW_DESIGN_REWRITES,
	NUMBER_CELL_CLASS_NAME,
	defaultValueFormatter,
	useGridStateStorage,
} from '@/components/AgGrid';
import { ReactDataGridProps } from '@/components/ReactDataGrid';
import { useSelection } from '@/components/hooks';
import SelectedCount from '@/components/misc/SelectedCount';
import { Button, Divider, IconButton, InfoIcon, Typography } from '@/components/v2';
import { getNodesIdsInRange, handleAgGridDeleteRangeSelectedCells } from '@/helpers/ag-grid';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { useReactQueryEvent } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import { hasNonWhitespace, labelWithUnit, pluralize } from '@/helpers/text';
import { formatIdx } from '@/helpers/utilities';
import { fields as dailyUnitsTemplates } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as monthlyUnitsTemplates } from '@/inpt-shared/display-templates/units/monthly-units.json';
import { Card } from '@/layouts/CardsLayout';
import { ExportToCSVDialog } from '@/manage-wells/WellsPage/TableView/CollectionTable/ExportToCSVDialog';
import { chooseHeadersIcon } from '@/manage-wells/shared/ChooseHeadersDialog';
import {
	ROW_ID_SPLITTER,
	updateProduction,
	useVirtualizedProductionData,
	useWellsProductionMapBaseQuery,
} from '@/manage-wells/shared/utils';
import { useCurrentProject } from '@/projects/api';

import { useProductionDataColumns } from './ProductionTable/ChooseProductionDataColumnsDialog';
import { INVALID_VALUE, MAX_WELLS_SHOWING_PRODUCTION_DATA, WithToolbarLike, getNonNegativeNumberValue } from './shared';
import useDeleteProductionData from './useDeleteProductionData';

const PRODUCTION_UNITS = {
	daily: dailyUnitsTemplates,
	monthly: monthlyUnitsTemplates,
};

const DEFAULT_WIDTH = 120;
const CACHE_BLOCK_SIZE = 5000;

const NON_EDITABLE_COLUMNS = ['well_name', 'well_number', 'api14', 'chosenID', 'inptID', 'index'];
const STRING_VALUES = ['operational_tag', 'well_name', 'well_number', 'api14', 'chosenID', 'inptID', 'index'];

function getColumns(
	headers: string[],
	allHeaders: Record<string, string>,
	resolution: 'monthly' | 'daily'
): ReactDataGridProps['columns'] {
	return headers.map((key) => ({
		key,
		name: labelWithUnit(allHeaders[key], PRODUCTION_UNITS[resolution][key]),
		width: DEFAULT_WIDTH,
	}));
}

interface ProductionTableProps {
	resolution: 'monthly' | 'daily';
	wellsSelection?: import('@/components/hooks/useSelection').Selection;
	CardContainer?: WithToolbarLike;
	onDownloadTable?(): void;
	leftHeader?: React.ReactNode;
	initialHeaders: string[];
	storageKey?: string;
	wellIds: string[];
	allWellIds?: string[];
	onEditedStateChanged?: (state: boolean) => void;
	singleWellView?: boolean;
	gridStorageKey: string;
	isWellsCollectionWells: boolean;
}

export function ProductionTable({
	wellIds,
	allWellIds = wellIds,
	resolution,
	CardContainer = Card,
	onDownloadTable,
	wellsSelection,
	leftHeader,
	storageKey = `INPT_MANAGE_WELL_${resolution}_TABLE`,
	initialHeaders,
	onEditedStateChanged,
	singleWellView = false,
	gridStorageKey,
	isWellsCollectionWells = false,
}: ProductionTableProps) {
	const { wellHeaders } = useAlfa();
	const { project } = useCurrentProject();

	const { productionIds, invalidateProductionCount, fetch } = useVirtualizedProductionData(wellIds, resolution);
	const productionsSelection = useSelection(productionIds);
	const { deselectAll: clearProductionsSelection } = productionsSelection;
	const { invalidate: invalidateMapData } = useWellsProductionMapBaseQuery(wellIds, resolution);

	const wellHeaderColumns = useMemo(() => _.pick(wellHeaders, initialHeaders), [initialHeaders, wellHeaders]);

	const {
		selectedKeys: selectedColumns,
		selectItems: selectColumns,
		allColumns,
	} = useProductionDataColumns(project?._id, resolution, initialHeaders, wellHeaderColumns, storageKey);

	const totalWells = wellsSelection?.selectedSet?.size ?? 0;

	const canDownload = totalWells !== 0 && productionIds?.length !== 0;

	const columns = useMemo(() => {
		const storedColumnOrder = local.getItem(gridStorageKey);
		const sortOrder = storedColumnOrder?.columnState?.map((column) => column.colId) ?? [];
		const sorter = (a, b) => sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key);
		return getColumns(selectedColumns, allColumns, resolution).sort(sorter);
	}, [selectedColumns, resolution, gridStorageKey, allColumns]);

	const [exportToCsvDialog, promptExportToCsvDialog] = useDialog(ExportToCSVDialog);

	// Why isn't this using mutateAsync?
	const { mutate: handleDownloadTable, isLoading: isDownloading } = useMutation(async () => {
		const results = await promptExportToCsvDialog({
			resolution,
			totalWells,
		});

		if (!results) {
			return;
		}

		const { resolution: exportResolution, startDate, endDate } = results;

		try {
			await postApi('/well/production-data/export', {
				wellIds: allWellIds,
				headers: columns.map((column) => column.key).map((header) => (header === 'index' ? 'date' : header)),
				settings: {
					production: {
						resolution: exportResolution,
						start: startDate,
						end: endDate,
					},
				},
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	const [hasBeenEdited, setHasBeenEdited] = useState(false);
	const [editing, setEditing] = useState(false);
	const [updating, setUpdating] = useState(false);

	const agGridRef = useRef<AgGridRef>(null);
	const modifiedRowsRef = useRef({});

	const { deleting, deleteMenuButton, deleteDialogForSelectedOrAll, deleteFromInputForm } = useDeleteProductionData(
		resolution,
		wellsSelection,
		productionsSelection,
		agGridRef,
		invalidateProductionCount,
		singleWellView,
		invalidateMapData
	);

	const updateMutation = useMutation(
		async () => {
			setUpdating(true);
			const updates: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				[key: string]: any[];
			} = {};

			Object.keys(modifiedRowsRef.current).forEach((prodId) => {
				const prodDataUpdate = _.omit(
					{
						...modifiedRowsRef.current[prodId],
						index: modifiedRowsRef.current[prodId].modifiedIndex,
					},
					['modifiedIndex']
				);

				const wellId = prodId.split(ROW_ID_SPLITTER)[0];
				updates[wellId] = updates[wellId] || [];
				updates[wellId].push(prodDataUpdate);
			});

			const updatedCount = await updateProduction(resolution, updates);
			return updatedCount;
		},
		{
			onError: (error: Error) => {
				setUpdating(false);
				genericErrorAlert(error);
			},
			onSuccess: (updatedCount) => {
				setHasBeenEdited(false);
				setUpdating(false);
				modifiedRowsRef.current = {};
				confirmationAlert(
					`Updated ${pluralize(updatedCount, 'production data row', 'production data rows')} successfully`
				);
				agGridRef.current?.api.refreshServerSideStore({ purge: true });

				if (singleWellView) {
					invalidateMapData();
				}
			},
		}
	);

	const invalidateEdited = useCallback(() => {
		setHasBeenEdited(false);
		modifiedRowsRef.current = {};
	}, []);

	const handleToggleEditing = () => {
		setEditing((p) => !p);
		agGridRef.current?.api.deselectAll();

		if (editing) {
			invalidateEdited();
		}
	};

	const handleUpdate = () => updateMutation.mutateAsync().then(() => setEditing(false));

	const handleSelectAll = () => {
		productionsSelection.selectAll();
	};

	const refreshTable = () => {
		agGridRef.current?.api.refreshServerSideStore({});
	};

	useReactQueryEvent(['well-headers'], refreshTable);
	useReactQueryEvent(['well-data'], refreshTable);

	useEffect(() => {
		invalidateEdited();
	}, [resolution, invalidateEdited]);

	useEffect(() => {
		agGridRef.current?.api.redrawRows();
	}, [productionsSelection.selectedSet]);

	useEffect(() => {
		clearProductionsSelection();

		if (editing) {
			invalidateEdited();
		}
	}, [wellsSelection?.selectedSet, editing, invalidateEdited, clearProductionsSelection]);

	const editButtons = editing ? (
		<>
			<Button
				color='secondary'
				css='text-transform: unset;'
				disabled={!hasBeenEdited || updating}
				onClick={handleUpdate}
			>
				Save
			</Button>
			<Button css='text-transform: unset;' onClick={handleToggleEditing} disabled={updating}>
				Cancel
			</Button>
			<InfoIcon
				tooltipTitle={
					<>
						Edit existing production records only:
						<br />
						Copy and paste up to {CACHE_BLOCK_SIZE} rows at a time
						<br />
						Adding production records - coming soon!
					</>
				}
			/>
		</>
	) : (
		<Button
			color='secondary'
			css='text-transform: unset;'
			onClick={handleToggleEditing}
			tooltipTitle='Edit existing production records only'
		>
			Edit
		</Button>
	);

	useLoadingBar(updating || deleting);

	useEffect(() => {
		onEditedStateChanged?.(hasBeenEdited);
	}, [hasBeenEdited, onEditedStateChanged]);

	useEffect(() => {
		invalidateEdited();
	}, [resolution, invalidateEdited]);

	const { tableStorageProps } = useGridStateStorage(gridStorageKey);

	return (
		<>
			{exportToCsvDialog}
			{deleteDialogForSelectedOrAll}
			{deleteFromInputForm}
			<CardContainer
				opaque
				iconsColor='default'
				iconsSize='small'
				toolbarCss={`
					flex-wrap: wrap;
					min-height: unset;
					margin-bottom: 0.5rem;
				`}
				left={
					<>
						{leftHeader}
						<Divider css='margin: 0 1rem 0 0.5rem' orientation='vertical' flexItem />
						<SelectedCount
							count={productionsSelection.selectedSet.size}
							total={productionIds?.length ?? 0}
							align='left'
						/>
						{totalWells > MAX_WELLS_SHOWING_PRODUCTION_DATA && (
							<Typography color='textSecondary' css='font-size: 14px; margin-left: 1rem;'>
								Prod table limited to {MAX_WELLS_SHOWING_PRODUCTION_DATA} wells
							</Typography>
						)}
					</>
				}
				right={
					<div
						css={`
							display: flex;
							width: 100%;
							justify-content: flex-end;
							${singleWellView ? 'margin: 10px 0; justify-content: flex-end;' : ''}
							align-items: center;
						`}
					>
						{!isWellsCollectionWells && editButtons}
						{productionIds && productionIds.length > 0 && !editing && (
							<Button
								css='text-transform: unset;'
								disabled={productionsSelection.allSelected}
								onClick={handleSelectAll}
							>
								Select All
							</Button>
						)}
						{totalWells > 0 && !isWellsCollectionWells && deleteMenuButton}
						<Divider css='margin: 0 1rem;' orientation='vertical' flexItem />
						<div
							css={`
								display: flex;
							`}
						>
							<IconButton
								css='margin-right: 0.5rem;'
								iconSize='small'
								size='small'
								onClick={() => onDownloadTable?.() ?? handleDownloadTable()}
								disabled={(isDownloading && 'Downloading') || (!onDownloadTable && !canDownload)}
							>
								{faDownload}
							</IconButton>
							<IconButton
								css='margin-right: 0.5rem;'
								iconSize='small'
								size='small'
								onClick={selectColumns}
							>
								{chooseHeadersIcon}
							</IconButton>
						</div>
					</div>
				}
				rightCss='min-width: 315px'
			>
				<AgGrid
					css={`
						width: 100%;
						height: 100%;
						${NEW_DESIGN_REWRITES}
					`}
					ref={agGridRef}
					suppressReactUi
					suppressMultiSort
					suppressRowClickSelection
					suppressMultiRangeSelection
					suppressCsvExport
					suppressExcelExport
					stopEditingWhenCellsLoseFocus
					suppressLastEmptyLineOnPaste
					enableRangeSelection
					immutableData
					getRowNodeId='_id'
					context={{ editing, selection: productionsSelection }}
					rowModelType='serverSide'
					serverSideStoreType='partial'
					cacheBlockSize={CACHE_BLOCK_SIZE}
					processDataFromClipboard={(params: ProcessDataFromClipboardParams) =>
						params.data.slice(0, CACHE_BLOCK_SIZE)
					}
					{...tableStorageProps}
					defaultColDef={useMemo(
						() => ({
							valueFormatter: defaultValueFormatter,
							menuTabs: ['generalMenuTab'],
							resizable: true,
							filterParams: { suppressAndOrCondition: true },
							floatingFilterComponentParams: { suppressFilterButton: true },
							suppressKeyboardEvent: (params) => {
								if (params.event.key === 'Delete' && params.context.editing) {
									const newData = handleAgGridDeleteRangeSelectedCells(params.api, {
										ignoreColumns: NON_EDITABLE_COLUMNS,
										includeColumnsWithoutModification: ['index'],
									});
									if (newData === undefined) {
										return true;
									}

									// HACK Check with Roman
									Object.keys(newData).forEach((key) => {
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
										// @ts-expect-error
										newData[key].modifiedIndex = newData[key].index;
									});

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
									if (!params.newValue || params.newValue.trim?.() === '') {
										return null;
									}
									if (!STRING_VALUES.includes(params.colDef.field as string)) {
										return getNonNegativeNumberValue(params.newValue);
									}
									return params.newValue.trim();
								})();

								if (val === params.oldValue || val === INVALID_VALUE) {
									return false;
								}

								const { index: productionDateIndex } = params.node.data;

								modifiedRowsRef.current[params.node.id] ??= { modifiedIndex: productionDateIndex };
								modifiedRowsRef.current[params.node.id][params.colDef.field] = val;

								setHasBeenEdited(true);

								return true;
							},
							valueGetter: (params) => {
								if (!params.node?.id || !params.colDef.field) {
									return undefined;
								}

								const modifiedValue = modifiedRowsRef.current[params.node.id]?.[params.colDef.field];

								if (modifiedValue !== undefined && hasNonWhitespace(modifiedValue)) {
									return modifiedValue;
								}

								if (params.colDef.field === 'index') {
									const formattedIdx = formatIdx(params.data.index);
									return formattedIdx;
								}

								return params.data[params.colDef.field];
							},
							editable: (params) => {
								return (
									params.context.editing && !NON_EDITABLE_COLUMNS.includes(params.column.getColId())
								);
							},
							cellClassRules: {
								[NUMBER_CELL_CLASS_NAME]: (params) =>
									!STRING_VALUES.includes(params.colDef.field as string),
								[DISABLED_CELL_CLASS_NAME]: (params) =>
									params.context.editing &&
									NON_EDITABLE_COLUMNS.includes(params.colDef.field as string),
							},
						}),
						[]
					)}
					serverSideDatasource={useMemo(
						() => ({
							getRows: async (params) => {
								const { request, success } = params;

								if (!productionIds) {
									success({ rowCount: 0, rowData: [] });
									return;
								}
								const rows = await fetch(request);
								success({ rowCount: productionIds.length, rowData: rows });
							},
						}),
						[productionIds, fetch]
					)}
					rowClassRules={{
						'ag-row-selected': (params) => params.context.selection?.selectedSet.has(params.node.id),
					}}
					onRowClicked={(params) => {
						if (editing || !params.node?.id) return;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						if ((params.event as any | undefined)?.ctrlKey) {
							productionsSelection.toggle(params.node.id);
							return;
						}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						if ((params.event as any | undefined)?.shiftKey) {
							const focussed = params.api.getFocusedCell();
							if (!focussed || params.rowIndex == null) return;
							productionsSelection.select(
								getNodesIdsInRange(params.api, focussed.rowIndex, params.rowIndex)
							);
							return;
						}
						productionsSelection.setSelectedSet([params.node.id]);
					}}
					onRangeSelectionChanged={(params) => {
						if (!params.finished || params.started || editing) {
							return;
						}
						// adapt range selection to "selection" object
						const ranges = params.api.getCellRanges();
						if (!ranges) {
							clearProductionsSelection();
							return;
						}

						if (!ranges[0]) {
							return;
						}
						// if there is only a single cell in the selection we assume it was clicked or ctrl-clicked and ignore the selection
						if (
							ranges[0].startRow?.rowIndex === ranges[0].endRow?.rowIndex &&
							ranges[0].columns.length === 1
						)
							return;

						const newSelection = ranges.flatMap((range) => {
							if (!range.startRow || !range.endRow) return [];
							return getNodesIdsInRange(params.api, range.startRow.rowIndex, range.endRow.rowIndex);
						});
						productionsSelection.setSelectedSet(newSelection);
					}}
				>
					{columns.map(({ name, key }) => (
						<AgGridColumn
							key={key}
							field={key}
							type=''
							headerName={name}
							sortable={key === 'index' || !NON_EDITABLE_COLUMNS.includes(key)}
							editable={editing && !NON_EDITABLE_COLUMNS.includes(key)}
						/>
					))}
				</AgGrid>
			</CardContainer>
		</>
	);
}
