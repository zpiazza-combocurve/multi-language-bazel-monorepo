import { AgGridColumn } from 'ag-grid-react';
import produce from 'immer';
import _ from 'lodash';
import { Dispatch, SetStateAction, useMemo, useRef, useState } from 'react';

import AgGrid, {
	AgGridRef,
	DISABLED_CELL_CLASS_NAME,
	Editors,
	NUMBER_CELL_CLASS_NAME,
	defaultValueFormatter,
	getCountColumnDef,
} from '@/components/AgGrid';
import { utcDateFormatter } from '@/components/AgGrid/editors/DateEditor';
import { Button } from '@/components/v2';
import { handleAgGridDeleteRangeSelectedCells } from '@/helpers/ag-grid';
import { hasNonWhitespace } from '@/helpers/text';
import {
	INVALID_VALUE,
	WELL_HEADER_NUMBER_COLUMNS,
	getBooleanValue,
	getNumberValue,
	getWellHeaderColumnType,
} from '@/manage-wells/WellsPage/TableView/CollectionTable/shared';

import styles from './create-wells.module.scss';
import { WellHeaderInfo, WellHeaderValue } from './models';

type CreateWellsPreviewProps = {
	searchHeader: React.ReactNode;
	rowData: Record<string, WellHeaderValue>[];
	wellHeadersDict: Record<string, WellHeaderInfo>;
	setRowData: Dispatch<SetStateAction<Record<string, WellHeaderValue>[]>>;
	setEditingForParent: Dispatch<SetStateAction<boolean>>;
};

const NON_EDITABLE_HEADERS = ['well_name', 'pad_name'];

const CreateWellsPreview = ({
	searchHeader,
	rowData,
	wellHeadersDict,
	setRowData,
	setEditingForParent,
}: CreateWellsPreviewProps) => {
	const columns = rowData.length ? Object.keys(rowData[0]) : [];

	const [editing, setEditing] = useState(false);
	const [hasBeenEdited, setHasBeenEdited] = useState(false);

	const agGridRef = useRef<AgGridRef>(null);
	const modifiedRowsRef = useRef({});

	const handleToggleEditing = () => {
		setEditing((p) => {
			setEditingForParent(!p);
			return !p;
		});

		if (editing) {
			setHasBeenEdited(false);
			modifiedRowsRef.current = {};
		}
	};

	const handleSave = () => {
		setRowData(
			produce((draft) => {
				for (let i = 0; i < draft.length; ++i) {
					const updates = modifiedRowsRef.current[draft[i].well_name as string];

					if (updates) {
						draft[i] = { ...draft[i], ...updates };
					}
				}
			})
		);

		modifiedRowsRef.current = {};
		setHasBeenEdited(false);
		setEditing(false);
		setEditingForParent(false);
	};

	const editButtons = editing ? (
		<div>
			<Button css='margin-right: 24px;' onClick={handleToggleEditing}>
				Cancel
			</Button>
			<Button color='secondary' variant='contained' disabled={!hasBeenEdited} onClick={handleSave}>
				Save
			</Button>
		</div>
	) : (
		<Button onClick={handleToggleEditing}>Edit</Button>
	);

	return (
		<div className={styles['preview-content']}>
			<div className={styles.toolbar}>
				{searchHeader}
				{editButtons}
			</div>
			<div className={styles.grid}>
				<AgGrid
					css='width: 100%; height: 100%;'
					rowData={rowData}
					ref={agGridRef}
					suppressReactUi
					suppressRowClickSelection
					suppressMultiRangeSelection
					enableRangeSelection
					getRowNodeId='well_name'
					context={{ editing }}
					defaultColDef={useMemo(
						() => ({
							valueFormatter: (params) => {
								const field = params?.colDef?.field;
								const items = field ? wellHeadersDict[field].options : [];

								return defaultValueFormatter(params, items);
							},
							resizable: true,
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
									if (params.newValue?.trim?.() === '') {
										return null;
									}
									if (params.newValue == null) {
										return null;
									}
									if (WELL_HEADER_NUMBER_COLUMNS.includes(params.colDef.type as string)) {
										return getNumberValue(params.newValue);
									}
									if (params.colDef.type === 'boolean') {
										return getBooleanValue(params.newValue);
									}
									if (params.colDef.type === 'date') {
										return params.newValue;
									}
									return params.newValue.trim();
								})();

								if (val === INVALID_VALUE) {
									return false;
								}

								modifiedRowsRef.current[params.node.id] ??= {};
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

								return params.data[params.colDef.field];
							},
							editable: (params) => {
								return (
									params.context.editing && !NON_EDITABLE_HEADERS.includes(params.column.getColId())
								);
							},
							cellClassRules: {
								[NUMBER_CELL_CLASS_NAME]: (params) =>
									WELL_HEADER_NUMBER_COLUMNS.includes(params.colDef.type as string),
								[DISABLED_CELL_CLASS_NAME]: (params) =>
									params.context.editing &&
									!!NON_EDITABLE_HEADERS.includes(params.colDef.field as string),
							},
						}),
						[wellHeadersDict]
					)}
					columnTypes={{
						string: {
							cellEditor: Editors.TextEditor,
						},
						'multi-select': {
							cellEditor: Editors.TextEditor,
						},
						date: {
							cellEditor: Editors.DateEditor,
							valueFormatter: utcDateFormatter,
						},
						boolean: { cellEditor: Editors.BooleanEditor },
						number: { cellEditor: Editors.NumberEditor },
						percent: { cellEditor: Editors.NumberEditor },
						'precise-number': { cellEditor: Editors.NumberEditor },
					}}
					suppressMultiSort
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
				>
					<AgGridColumn {...getCountColumnDef()} />
					{columns.map((key) => {
						return (
							<AgGridColumn
								key={key}
								field={key}
								headerName={wellHeadersDict[key].label}
								type={getWellHeaderColumnType(key, wellHeadersDict)}
								editable={editing && !NON_EDITABLE_HEADERS.includes(key)}
							/>
						);
					})}
				</AgGrid>
			</div>
		</div>
	);
};

export default CreateWellsPreview;
