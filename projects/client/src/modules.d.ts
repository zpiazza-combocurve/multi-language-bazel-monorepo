declare module 'react-data-grid' {
	import { ReactNode, ComponentType } from 'react';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	type Node = any; // TODO what is node???

	/** @see [Columns Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid#columns-required) */
	export interface Column {
		/** The name of the column. By default it will be displayed in the header cell */
		name: Node;
		/** A unique key to distinguish each column */
		key: string;
		/**
		 * Column width. If not specified, it will be determined automatically based on grid width and specified widths
		 * of other columns
		 */
		width?: number;
		/** Enable filtering of a column */
		filterable?: boolean;
		/** Component to be used to filter the data of the column */
		filterRenderer?: Node;
		/** Enable resizing of a column */
		resizable?: boolean;
		/** Enable sorting of a column */
		sortable?: boolean;
		/** Sets the column sort order to be descending instead of ascending the first time the column is sorted */
		sortDescendingFirst?: boolean;
		/** Enable dragging of a column */
		dragable?: boolean;
		/**
		 * Enables cell editing. If set and no editor property specified, then a textinput will be used as the cell
		 * editor
		 */
		editable?: Node;
		/**
		 * Editor to be rendered when cell of column is being edited. If set, then the column is automatically set to be
		 * editable
		 */
		editor?: Node;
		/** Formatter to be used to render the cell content */
		formatter?: Node;
		/** Header renderer for each header cell */
		headerRenderer?: (props: { column: Column }) => JSX.Element;
		/** Determines whether column is frozen or not */
		frozen?: boolean;
		/**
		 * By adding an event object with callbacks for the native react events you can bind events to a specific
		 * column. That will not break the default behaviour of the grid and will run only for the specified column
		 */
		events?: object;
	}

	export interface Row {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		[key: string]: any;
	}

	export interface ReactDataGridProps {
		rowGetter: (idx: number) => Row;
		rowsCount: number;
		/**
		 * An array of objects representing each column on the grid. Can also be an ImmutableJS object
		 *
		 * @see [Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid#columns-required)
		 */
		columns: Column[];
		minHeight: number;
		minWidth: number;
		rowRenderer?: (props) => ReactNode;
		cellRangeSelection?;
		/** @see [Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid#ongridrowsupdated) */
		onGridRowsUpdated?(props: { fromRow: number; toRow: number; updated: Row }): void;
		/**
		 * Used to toggle whether cells can be selected or not
		 *
		 * @see [Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid#enablecellselect)
		 */
		enableCellSelect?: boolean;

		rowHeight?: number;
		// TODO add the rest
	}

	/** @see [React Data Grid Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid) */
	const ReactDataGrid: ComponentType<ReactDataGridProps>;

	export default ReactDataGrid;
}

declare module '*.png' {
	const src: string;
	export default src;
}
declare module '*.module.scss';
declare module '*.scss';
declare module '*.svg' {
	export const ReactComponent;
}

declare module 'mapbox-gl-draw-freehand-mode' {
	export default import('@mapbox/mapbox-gl-draw').DrawCustomMode;
}

declare module '*.mdx';
