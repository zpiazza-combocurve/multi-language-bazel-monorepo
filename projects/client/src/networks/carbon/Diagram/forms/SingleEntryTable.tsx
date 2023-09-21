import { ColDef } from 'ag-grid-community';
import produce from 'immer';
import { useCallback, useMemo } from 'react';

import AgGrid, { DASHED_CELL_CLASS_NAME } from '@/components/AgGrid';
import { TextEditor } from '@/components/AgGrid/editors';

import CAPEX_OPTIONS from '../capex-options.json';
import { Criteria } from './shared';

function SingleEntryTable<T>({
	className,
	value = {} as T,
	onChange,
	columnDefs,
	label,
}: {
	className?: string;
	value: T;
	onChange: (newValue: T) => void;
	columnDefs: ColDef[];
	label?: string;
}) {
	/** @see https://www.ag-grid.com/react-data-grid/context-menu/#popup-parent */
	const popupParent = useMemo(() => {
		return document.querySelector('body') ?? undefined;
	}, []);

	const table = (
		<AgGrid
			className={className}
			css={`
				.ag-center-cols-clipper {
					// removes table min height https://www.ag-grid.com/react-data-grid/grid-size/#grid-auto-height
					min-height: unset !important;
				}
				.${DASHED_CELL_CLASS_NAME} {
					// https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/repeating-linear-gradient()
					color: var(--text-color-secondary);
					background-color: gray;
					background: var(--dash-cell-background);
					// HACK with the border the dashed pattern looks odd
					&.ag-cell:not(.ag-cell-range-selected) {
						border: 0;
					}
				}
			`}
			domLayout='autoHeight'
			columnDefs={columnDefs}
			defaultColDef={useMemo(() => ({ editable: true, cellEditor: TextEditor }), [])}
			rowData={useMemo(() => [value], [value])}
			readOnlyEdit
			stopEditingWhenCellsLoseFocus
			getRowId={useCallback(() => 'id', [])}
			onCellEditingStopped={(ev) => {
				const { data, column, newValue, oldValue } = ev;
				// Resetting fields if criteria type changed.
				if (
					newValue !== oldValue &&
					(column.getColId() === 'start_criteria' || column.getColId() === 'end_criteria')
				) {
					data[`${column.getColId()}_option`] = null;
					if (newValue === Criteria.FPD || newValue === Criteria.duration) {
						data[`${column.getColId().split('_')[0]}_value`] = 0;
					}
					if (newValue === Criteria.schedule) {
						data[`${column.getColId().split('_')[0]}_value`] = null;
						data[`${column.getColId()}_option`] = Object.keys(CAPEX_OPTIONS.fromSchedule)[0];
					}
					if (newValue === Criteria.headers) {
						data[`${column.getColId().split('_')[0]}_value`] = null;
						data[`${column.getColId()}_option`] = Object.keys(CAPEX_OPTIONS.fromHeaders)[0];
					}
				}

				onChange(
					produce(data as T, (draft) => {
						// @ts-expect-error // TODO figure out error later
						_.set(draft, column.getId(), newValue);
					})
				);
			}}
			onFirstDataRendered={(params) => {
				params.columnApi.autoSizeAllColumns();
			}}
			popupParent={popupParent}
		/>
	);
	if (label) {
		return (
			<div>
				<label>{label}</label>
				{table}
			</div>
		);
	}
	return table;
}

export default SingleEntryTable;
