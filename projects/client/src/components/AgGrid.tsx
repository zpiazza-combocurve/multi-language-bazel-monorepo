import {
	CellValueChangedEvent,
	ColDef,
	GetContextMenuItemsParams,
	SelectionChangedEvent,
	ValueFormatterParams,
	ValueGetterFunc,
} from 'ag-grid-community';
import { LicenseManager } from 'ag-grid-enterprise';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import classnames from 'classnames';
import _ from 'lodash';
import { ForwardedRef, useEffect, useMemo, useRef } from 'react';
import * as React from 'react';

import type { Selection } from '@/components/hooks/useSelection';
import { useDebounce } from '@/helpers/debounce';
import { local } from '@/helpers/storage';
import { arrayToRecord, compareSets, formatValue } from '@/helpers/utilities';

import styles from './AgGrid.module.scss';

import './ag-grid-themes.scss';

import { AG_GRID_LICENSE_KEY } from '@/helpers/ag-grid-license';

import * as Editors from './AgGrid/editors';
import { useCallbackRef } from './hooks/useCallbackRef';

LicenseManager.setLicenseKey(AG_GRID_LICENSE_KEY);

export { Editors };
export * from './AgGrid/shared';

/** Reexported ag grid ref for consistency */
export type AgGridRef = AgGridReact;

interface EventMap {
	selectionChanged: SelectionChangedEvent;
	cellValueChanged: CellValueChangedEvent;
}

function useAgGridEvent<Ev extends keyof EventMap>(
	agGridRef: React.RefObject<AgGridRef | undefined>,
	event: Ev,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	cb: (ev: EventMap[Ev]) => any
) {
	const cbRef = useCallbackRef(cb);
	useEffect(() => {
		if (!agGridRef.current) {
			return;
		}

		const gridApi = agGridRef.current.api;

		gridApi.addEventListener(event, cbRef);
		return () => gridApi.removeEventListener(event, cbRef);
	}, [agGridRef, cbRef, event]);
}

// +Helpers
export function useAgGridSelection(
	agGridRef: React.RefObject<AgGridRef | undefined>,
	selection: Selection | undefined
) {
	const { setSelectedSet: select, selectedSet } = selection ?? {};

	const lastSelectedRef = useRef<string[]>([]);

	useAgGridEvent(agGridRef, 'selectionChanged', (ev) => {
		if (!select) {
			return;
		}

		const newSelectedIds = _.map(ev.api.getSelectedNodes(), 'id') as string[];

		if (compareSets(lastSelectedRef.current, newSelectedIds)) {
			return;
		}

		lastSelectedRef.current = newSelectedIds;

		select(newSelectedIds);
	});

	useEffect(() => {
		if (!agGridRef.current || !selectedSet) {
			return;
		}
		const gridApi = agGridRef.current.api;

		const selectedIds = _.map(gridApi.getSelectedNodes(), 'id') as string[];

		if (compareSets([...selectedSet], selectedIds)) {
			return;
		}

		gridApi.forEachNode((node) => {
			if (!node.id) {
				return;
			}

			node.setSelected(selectedSet.has(node.id));
		});
	}, [selectedSet, agGridRef]);
}

export function defaultValueFormatter(params: ValueFormatterParams, items?: { value: string; label: string }[]) {
	const field = params.colDef?.field;
	if (field === 'scope' && items) {
		return _.find(items, { value: params.value })?.label ?? String(params.value);
	}
	const value = params.value;
	if (value == null) {
		return value;
	}

	return formatValue(value, params.column.getColDef().type as string);
}

/** @param storageKey Key to access grid settings from localStorage */
export function useGridStateStorage(storageKey: string) {
	const tableStateRef = useRef(local.getItem(storageKey) ?? {});
	const isInitialLoad = useRef(false);

	/** Stores the relevant column and table state to localStorage when the columnState or columnGroupState is changed */
	const onColumnEverythingChanged = useDebounce((params) => {
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
			return;
		}

		const columnState = params.columnApi.getColumnState();
		const columnGroupState = params.columnApi.getColumnGroupState();

		// add if check because sometimes initial rendering caused columnState to return [];
		if (columnState.length) {
			tableStateRef.current.columnState = columnState;
		}

		if (columnGroupState.length) {
			tableStateRef.current.columnGroupState = columnGroupState;
		}

		local.setItem(storageKey, tableStateRef.current);
	});

	/** Stores the relevant filter table state to localStorage when the filters change */
	const onFilterChanged = React.useCallback(
		(params) => {
			const filterState = params.api.getFilterModel();
			tableStateRef.current.filterState = filterState;
			local.setItem(storageKey, tableStateRef.current);
		},
		[storageKey]
	);

	/** Callback to load all the relevant information stored in localStorage to restore the entire grid's state */
	const loadInitialState = React.useCallback(
		(params) => {
			const initialTableState = local.getItem(storageKey);

			const { columnState, columnGroupState, filterState } = initialTableState ?? {};

			if (columnState) {
				params.columnApi.applyColumnState({ state: columnState, applyOrder: true });
			}
			if (columnGroupState) {
				params.columnApi.setColumnGroupState(columnGroupState);
			}
			if (filterState) {
				params.api.setFilterModel(filterState);
			}
			isInitialLoad.current = true;
		},
		[storageKey]
	);

	/**
	 * An Object containing all the relevant events that should run the above callbacks to save and load the grid's
	 * state from localStorage. Refer to the AgGrid documentation to get a description for each event
	 */
	const tableStorageProps = useMemo(
		() => ({
			onColumnMoved: onColumnEverythingChanged,
			onColumnPinned: onColumnEverythingChanged,
			onColumnResized: onColumnEverythingChanged,
			onColumnRowGroupChanged: onColumnEverythingChanged,
			onColumnValueChanged: onColumnEverythingChanged,
			onColumnVisible: onColumnEverythingChanged,
			onFilterChanged,
			// onFirstDataRendered: loadInitialState, // TODO check if needed
			onGridReady: loadInitialState,
			onSortChanged: onColumnEverythingChanged,
		}),
		[onColumnEverythingChanged, onFilterChanged, loadInitialState]
	);

	return {
		onColumnEverythingChanged,
		tableStorageProps,
	};
}
// -Helpers

export type AgGridProps = Omit<AgGridReactProps, 'getRowId' | 'getRowNodeId'> & {
	getRowNodeId?: AgGridReactProps['getRowNodeId'] | string | symbol;
	getRowId?: AgGridReactProps['getRowId'] | string | symbol;
};

/** Adds support for selection object to ag grid component */
export function withAgGridSelection(Component: React.ComponentType<AgGridProps>) {
	type AgGridWithSelectionProps = AgGridProps & { selection };

	function ComponentVirtualizedSelection({ selection, ...props }: AgGridWithSelectionProps, ref) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const agGridRef = useRef<any>();

		useAgGridSelection(agGridRef, selection);

		React.useImperativeHandle(ref, () => agGridRef.current);

		return (
			<Component
				{...props}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				ref={agGridRef}
			/>
		);
	}

	return React.forwardRef(ComponentVirtualizedSelection);
}

export const defaultGetContextMenuItems = (params: GetContextMenuItemsParams) =>
	params.defaultItems?.filter((item) => item !== 'paste') ?? [];

/** @see https://www.ag-grid.com/react-data-grid/reference-data */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getAgGridValueHandler(items: { value: any; label: any }[] | Record<string, string>) {
	const valueToLabel = Array.isArray(items) ? arrayToRecord(items, 'value', 'label') : items;
	return {
		valueFormatter: (params) => valueToLabel[params.value] ?? String(params.value),
		valueParser: (params) => (valueToLabel[params.newValue] ? params.newValue : params.oldValue),
		valueSetter: (params) => {
			const newValue = valueToLabel[params.newValue] ? params.newValue : params.oldValue;
			params.data[params.colDef.field] = newValue;
			return true;
		},
	};
}

/**
 * Column definition for a checkbox header
 *
 * @example
 * 	<AgGridColumn {...CHECKBOX_COLUMN_DEF} />;
 */
export const CHECKBOX_COLUMN_DEF = {
	filter: null,
	checkboxSelection: true,
	editable: false,
	field: '',
	flex: 0,
	headerCheckboxSelection: true,
	headerName: '',
	maxWidth: 60,
	minWidth: 60,
	suppressMenu: true,
	resizable: false,
	sortable: false,
	suppressMovable: true,
	lockVisible: true,
	lockPosition: true,
};

export const getCountColumnDef = (valueGetter: string | ValueGetterFunc | undefined = undefined): ColDef => {
	return {
		filter: false,
		colId: '####',
		headerName: '#',
		width: 60,
		minWidth: 60,
		suppressMenu: true,
		resizable: true,
		sortable: false,
		valueGetter:
			valueGetter ??
			((params) => {
				if (params.node?.rowIndex == null) {
					throw new Error('Ag Grid auto incremental column was passed rowIndex == null');
				}
				return params.node.rowIndex + 1;
			}),
		valueFormatter: (params) => params.value,
	};
};

export const CHECKBOX_WITH_NUMBER_COLUMN_DEF = {
	...CHECKBOX_COLUMN_DEF,
	headerName: '#',
	maxWidth: undefined,
	valueGetter: (params) => {
		if (params.node?.rowIndex == null) {
			throw new Error('Ag Grid auto incremental column was passed rowIndex == null');
		}
		return params.node.rowIndex + 1;
	},
	valueFormatter: (params) => params.value,
};

/**
 * ClassName to apply to number cells to align them to the right
 *
 * @example
 * 	<AgGrid columnTypes={{ number: { cellClass: NUMBER_CELL_CLASS_NAME } }} />;
 */
export const NUMBER_CELL_CLASS_NAME = styles['right-aligned-cells'];

/**
 * ClassName to apply to disabled cells when editing is an option
 *
 * @example
 * 	<AgGrid columnTypes={{ number: { cellClass: DISABLED_CELL_CLASS_NAME } }} />;
 *
 * @note see also https://www.ag-grid.com/javascript-data-grid/cell-styles/#cell-class-rules to apply multiple classes
 */
export const DISABLED_CELL_CLASS_NAME = styles['disabled-cells'];
export const ERROR_CELL_CLASS_NAME = styles['error-cells'];
export const WARNING_CELL_CLASS_NAME = styles['warning-cells'];
export const DASHED_CELL_CLASS_NAME = styles['dashed-cells'];

export const NEW_DESIGN_REWRITES = `
.ag-root-wrapper,
.ag-header,
.ag-input-field-input {
	background-color: var(--background-opaque) !important;
}`;

/**
 * Wrapper over AgGrid with theme support and other goodies
 *
 * Changes made:
 *
 * - Add the possibility to use a lodash iterator for the getRowNodeId (or getRowId) parameters, ie you can pass strings
 *   instead of functions: <AgGrid getRowId='_id' />
 * - Add support for application theme
 * - Paste option in context menu will be removed by default due to browser limitations, see
 *   https://www.ag-grid.com/react-data-grid/context-menu/?, to override this behavior change the `getContextMenuItem`
 *   property
 *
 * @example
 * 	const agGridRef = useRef<AgGridRef>(null);
 *
 * 	<AgGrid ref={agGridRef} />;
 *
 * @note avoid straying too far from their api unless needed or it's really helpful and document changes
 */
function AgGrid({ className, getRowNodeId, getRowId, ...props }: AgGridProps, ref: ForwardedRef<AgGridRef>) {
	const getRowNodeIdEx = useMemo(() => {
		if (getRowNodeId === undefined) return {};
		if (typeof getRowNodeId === 'string' || typeof getRowNodeId === 'symbol') {
			return { getRowNodeId: _.iteratee(getRowNodeId) };
		}
		return { getRowNodeId };
	}, [getRowNodeId]);

	const getRowIdEx = useMemo(() => {
		if (getRowId === undefined) return {};
		if (typeof getRowId === 'string' || typeof getRowId === 'symbol') {
			return { getRowId: (ev) => ev.data[getRowId] };
		}
		return { getRowId };
	}, [getRowId]);

	return (
		<div className={classnames(className, 'ag-theme-combocurve')}>
			<AgGridReact
				getContextMenuItems={defaultGetContextMenuItems}
				{...props}
				{...getRowNodeIdEx}
				{...getRowIdEx}
				ref={ref}
			/>
		</div>
	);
}

export default React.forwardRef(AgGrid);
