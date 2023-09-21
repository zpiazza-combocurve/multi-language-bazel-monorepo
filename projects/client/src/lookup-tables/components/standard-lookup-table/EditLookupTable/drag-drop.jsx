/* eslint-disable */
const COL_TYPE = 'col';
const ROW_TYPE = 'row';

/** Specifies the drag source contract. Only `type` and `item` properties are required. */
export const getRowSourceSpec = (props) => ({
	type: ROW_TYPE,

	item: {
		rowIndex: props.rowIndex,
	},
});

export const getRowTargetSpec = (props) => ({
	accept: ROW_TYPE,

	canDrop(item) {
		return props.rowIndex !== item.rowIndex;
	},

	drop(item, monitor) {
		if (monitor.didDrop()) {
			return;
		}

		const { rowIndex: fromIndex } = item;
		const { rowIndex: toIndex, onRowDrop } = props;
		onRowDrop(fromIndex, toIndex);
	},

	collect(monitor) {
		return {
			isOver: monitor.isOver() && monitor.canDrop(),
		};
	},
});

export const getColSourceSpec = (props) => ({
	type: COL_TYPE,

	item: {
		columnIndex: props.columnIndex,
	},
});

export const getColTargetSpec = (props) => ({
	accept: COL_TYPE,

	canDrop(item) {
		return props.columnIndex !== item.columnIndex;
	},

	drop(item, monitor) {
		if (monitor.didDrop()) {
			return;
		}

		const { columnIndex: fromIndex } = item;
		const { columnIndex: toIndex, onColumnDrop } = props;
		onColumnDrop(fromIndex, toIndex);
	},

	collect(monitor) {
		return {
			isOver: monitor.isOver() && monitor.canDrop(),
		};
	},
});
