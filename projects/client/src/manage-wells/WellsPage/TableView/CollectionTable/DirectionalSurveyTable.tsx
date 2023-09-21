import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { ProcessDataFromClipboardParams } from 'ag-grid-community';
import { AgGridColumn } from 'ag-grid-react';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { useMutation } from 'react-query';

import AgGrid, {
	AgGridRef,
	NEW_DESIGN_REWRITES,
	NUMBER_CELL_CLASS_NAME,
	useGridStateStorage,
} from '@/components/AgGrid';
import { ReactDataGridProps } from '@/components/ReactDataGrid';
import { useSelection } from '@/components/hooks';
import { useChooseItems } from '@/components/hooks/useChooseItems';
import SelectedCount from '@/components/misc/SelectedCount';
import { Button, Divider, IconButton, Typography } from '@/components/v2';
import { getNodesIdsInRange } from '@/helpers/ag-grid';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { getValueDisplay } from '@/helpers/headers';
import { useReactQueryEvent } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { labelWithUnit } from '@/helpers/text';
import { fields as SURVEY_UNITS } from '@/inpt-shared/display-templates/units/directional-survey-units.json';
import { fields as SURVEY_TYPES } from '@/inpt-shared/display-templates/wells/well_directional_survey_types.json';
import { Card } from '@/layouts/CardsLayout';
import { chooseHeadersIcon } from '@/manage-wells/shared/ChooseHeadersDialog';
import { useVirtualizedSurveyData } from '@/manage-wells/shared/utils';

import { DIRECTIONAL_SURVEY_HEADERS, MAX_WELLS_SHOWING_DIRECTIONAL_SURVEY, WithToolbarLike } from './shared';

const DEFAULT_WIDTH = 120;
const CACHE_BLOCK_SIZE = 5000;

const STRING_VALUES = ['well_name', 'well_number', 'api14', 'chosenID', 'inptID'];

const STORAGE_KEY = 'DIRECTIONAL_SURVEY_TABLE_V1';

function getColumns(headers: string[], allHeaders: Record<string, string>): ReactDataGridProps['columns'] {
	return headers.map((key) => ({
		key,
		name: labelWithUnit(allHeaders[key], SURVEY_UNITS[key]),
		width: DEFAULT_WIDTH,
	}));
}

interface DirectionalSurveyTableProps {
	wellsSelection?: import('@/components/hooks/useSelection').Selection;
	CardContainer?: WithToolbarLike;
	onDownloadTable?(): void;
	leftHeader?: React.ReactNode;
	initialHeaders: string[];
	downloadLimit: number;
	storageKey?: string;
	wellIds: string[];
	allWellIds?: string[];
	singleWellView?: boolean;
}

export function DirectionalSurveyTable({
	wellIds,
	allWellIds = wellIds,
	CardContainer = Card,
	onDownloadTable,
	wellsSelection,
	leftHeader,
	storageKey = 'INPT_MANAGE_WELL_SURVEY_TABLE',
	initialHeaders,
	downloadLimit,
	singleWellView = false,
}: DirectionalSurveyTableProps) {
	const { wellHeaders } = useAlfa();
	const { directionalSurveyIds, fetch } = useVirtualizedSurveyData(wellIds);
	const directionalSurveySelection = useSelection(directionalSurveyIds);
	const { deselectAll: clearSelection } = directionalSurveySelection;

	const headers = useMemo(
		() => ({ ..._.pick(wellHeaders, initialHeaders), ...DIRECTIONAL_SURVEY_HEADERS }),
		[wellHeaders, initialHeaders]
	);

	const { selectedKeys: selectedHeaders, selectItems: selectHeaders } = useChooseItems({
		title: 'Directional Survey Columns',
		defaultKeys: initialHeaders,
		items: Object.keys(headers).map((key) => ({ key, label: headers[key] })),
		sections: [
			{
				key: 'Columns',
				label: 'Columns',
				itemKeys: Object.keys(headers),
			},
		],
		selectionLimit: 200,
		canSelectAll: false,
		storageKey,
		storageVersion: 2,
	});

	const totalWells = wellsSelection?.selectedSet?.size ?? 0;

	const canDownload = totalWells !== 0 && totalWells <= downloadLimit;

	const columns = useMemo(() => getColumns(selectedHeaders, headers), [selectedHeaders, headers]);

	// Why isn't this using mutateAsync?
	const { mutate: handleDownloadTable, isLoading: isDownloading } = useMutation(async () => {
		try {
			await postApi('/directional-surveys/export-data', {
				wellIds: allWellIds,
				headers: columns.map((column) => column.key),
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	const agGridRef = useRef<AgGridRef>(null);

	const handleSelectAll = () => {
		directionalSurveySelection.selectAll();
	};

	const refreshTable = () => {
		agGridRef.current?.api.refreshServerSideStore({});
	};

	useReactQueryEvent(['well-headers'], refreshTable);
	useReactQueryEvent(['well-data'], refreshTable);

	useEffect(() => {
		agGridRef.current?.api.redrawRows();
	}, [directionalSurveySelection.selectedSet]);

	useEffect(() => {
		clearSelection();
	}, [wellsSelection?.selectedSet, clearSelection]);

	const { tableStorageProps } = useGridStateStorage(STORAGE_KEY);

	return (
		<CardContainer
			opaque
			iconsColor='default'
			iconsSize='small'
			toolbarCss={`
				min-height: unset;
				margin-bottom: 0.5rem;
			`}
			left={
				<>
					{leftHeader}
					<Divider css='margin: 0 1rem 0 0.5rem' orientation='vertical' flexItem />
					<SelectedCount
						count={directionalSurveySelection.selectedSet.size}
						total={directionalSurveyIds?.length ?? 0}
						align='left'
					/>
					{totalWells > MAX_WELLS_SHOWING_DIRECTIONAL_SURVEY && (
						<Typography color='textSecondary' css='font-size: 14px; margin-left: 1rem;'>
							Directional survey table limited to {MAX_WELLS_SHOWING_DIRECTIONAL_SURVEY} wells
						</Typography>
					)}
				</>
			}
			right={
				<div
					css={`
						display: flex;
						width: 100%;
						${singleWellView ? 'margin: 10px 0; justify-content: flex-end;' : ''}
						align-items: center;
					`}
				>
					{directionalSurveyIds && directionalSurveyIds.length > 0 && (
						<Button
							css='text-transform: unset;'
							disabled={directionalSurveySelection.allSelected}
							onClick={handleSelectAll}
						>
							Select All
						</Button>
					)}
					<Divider css='margin: 0 1rem;' orientation='vertical' flexItem />
					<IconButton
						css='margin-right: 0.5rem;'
						iconSize='small'
						size='small'
						onClick={() => onDownloadTable?.() ?? handleDownloadTable()}
						disabled={
							(isDownloading && 'Downloading') ||
							(!onDownloadTable && !canDownload && `Download up to ${downloadLimit} wells`)
						}
					>
						{faDownload}
					</IconButton>
					<IconButton css='margin-right: 0.5rem;' iconSize='small' size='small' onClick={selectHeaders}>
						{chooseHeadersIcon}
					</IconButton>
				</div>
			}
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
				context={{ editing: false, selection: directionalSurveySelection }}
				rowModelType='serverSide'
				serverSideStoreType='partial'
				cacheBlockSize={CACHE_BLOCK_SIZE}
				{...tableStorageProps}
				processDataFromClipboard={(params: ProcessDataFromClipboardParams) =>
					params.data.slice(0, CACHE_BLOCK_SIZE)
				}
				defaultColDef={useMemo(
					() => ({
						valueFormatter: (params) => {
							const field = params.colDef?.field;
							const value = params.value;
							if (!field || value === null || value === undefined) {
								return '';
							}
							return getValueDisplay(value, SURVEY_TYPES[field]);
						},
						menuTabs: ['generalMenuTab'],
						resizable: true,
						filterParams: { suppressAndOrCondition: true },
						floatingFilterComponentParams: { suppressFilterButton: true },
						suppressKeyboardEvent: () => false,
						valueGetter: (params) => {
							if (!params.node?.id || !params.colDef.field) {
								return undefined;
							}

							return params.data[params.colDef.field];
						},
						editable: false,
						cellClassRules: {
							[NUMBER_CELL_CLASS_NAME]: (params) =>
								!STRING_VALUES.includes(params.colDef.field as string),
						},
					}),
					[]
				)}
				serverSideDatasource={useMemo(
					() => ({
						getRows: async (params) => {
							const { request, success } = params;

							if (!directionalSurveyIds) {
								success({ rowCount: 0, rowData: [] });
								return;
							}
							const rows = await fetch(request);
							success({ rowCount: directionalSurveyIds.length, rowData: rows });
						},
					}),
					[directionalSurveyIds, fetch]
				)}
				rowClassRules={{
					'ag-row-selected': (params) => params.context.selection?.selectedSet.has(params.node.id),
				}}
				onRowClicked={(params) => {
					if (!params.node?.id) {
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					if ((params.event as any | undefined)?.ctrlKey) {
						directionalSurveySelection.toggle(params.node.id);
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					if ((params.event as any | undefined)?.shiftKey) {
						const focussed = params.api.getFocusedCell();
						if (!focussed || params.rowIndex == null) {
							return;
						}
						directionalSurveySelection.select(
							getNodesIdsInRange(params.api, focussed.rowIndex, params.rowIndex)
						);
						return;
					}
					directionalSurveySelection.setSelectedSet([params.node.id]);
				}}
				onRangeSelectionChanged={(params) => {
					if (!params.finished || params.started) {
						return;
					}
					// adapt range selection to "selection" object
					const ranges = params.api.getCellRanges();
					if (!ranges) {
						clearSelection();
						return;
					}

					if (!ranges[0]) {
						return;
					}
					// if there is only a single cell in the selection we assume it was clicked or ctrl-clicked and ignore the selection
					if (ranges[0].startRow?.rowIndex === ranges[0].endRow?.rowIndex && ranges[0].columns.length === 1)
						return;

					const newSelection = ranges.flatMap((range) => {
						if (!range.startRow || !range.endRow) return [];
						return getNodesIdsInRange(params.api, range.startRow.rowIndex, range.endRow.rowIndex);
					});
					directionalSurveySelection.setSelectedSet(newSelection);
				}}
			>
				{columns.map(({ name, key }) => (
					<AgGridColumn
						key={key}
						field={key}
						type={SURVEY_TYPES[key]?.type}
						headerName={name}
						sortable={key === 'index'}
						editable={false}
					/>
				))}
			</AgGrid>
		</CardContainer>
	);
}
