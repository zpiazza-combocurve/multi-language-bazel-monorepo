import produce from 'immer';
import { uniq } from 'lodash';
import { RefObject, useCallback, useContext } from 'react';

import { CTRL_OR_COMMAND_KEY, CTRL_OR_COMMAND_TEXT } from '@/components';
import AdvancedTable from '@/components/AdvancedTable';
import { IS_NESTED_ROW_KEY, LOOKUP_BY_FIELDS_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRef, AdvancedTableRow } from '@/components/AdvancedTable/types';
import { getParentsOfDisplayedRowsInRange, getSelectedRange } from '@/components/AgGrid';
import { tryCatchFalse, useHotkey } from '@/components/hooks';
import { failureAlert } from '@/helpers/alerts';
import { assert } from '@/helpers/utilities';

import { EmbeddedLookupTableContext } from '../context/EmbeddedLookupTableContext';
import { generateLookupByKey } from '../shared';

const UNICODE_SPACE_CHAR = '\u0020';

export const EmbeddedLookupLinesTable = <T extends AdvancedTableRow>({
	getLookupByOnColumnError,
	getRemoveLookupByFromColumnError,
	nestedLineFieldsAllowedForLookupBy,
	getColumnsDef,
	adjustRowData,
	contextMenuItems,
	lookupByDependencies,
	allowNestedRows,
	isNestedRowOnPaste,
	hotkeysScope,
}) => {
	const { linesRef, setUndoState, setSelectedLinesWithLTs, setEditing, setLinesRows } =
		useContext(EmbeddedLookupTableContext);

	const onLinesEditingChange = useCallback(
		(editing) => {
			setEditing(editing);
		},
		[setEditing]
	);

	const handleLookupBy = () => {
		if (linesRef.current == null) return;

		const agGrid = linesRef.current.agGrid;

		assert(agGrid);

		const range = getSelectedRange(agGrid);

		assert(range);

		const {
			startIndex,
			endIndex,
			cellRange: { columns },
			selectedCount,
		} = range;

		const parents = getParentsOfDisplayedRowsInRange(agGrid, startIndex, endIndex);

		const isRangeSelection = selectedCount > 1;

		if (!isRangeSelection) {
			const { startRow } = range;
			const isParentRow = !startRow?.data?.[IS_NESTED_ROW_KEY];

			if (!isParentRow) {
				failureAlert(`Can't lookup by on a nested row`);
				return;
			}
		}

		const errors: string[] = [];

		linesRef.current.setRowData(
			produce((draft) => {
				parents.forEach((parent) => {
					const { rowIndex } = parent;

					if (rowIndex === null) return;

					columns.forEach((column) => {
						const colId = column?.getColId();

						// Ignore if already in use
						if (draft[rowIndex][LOOKUP_BY_FIELDS_KEY]?.[colId]) {
							return;
						}

						const rowColumnError = getLookupByOnColumnError(colId, parent.data);

						if (rowColumnError) {
							errors.push(rowColumnError);
							return;
						}

						draft[rowIndex][LOOKUP_BY_FIELDS_KEY] ??= {};
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						draft[rowIndex][LOOKUP_BY_FIELDS_KEY]![colId] = generateLookupByKey(colId);

						if (lookupByDependencies[colId]) {
							lookupByDependencies[colId].forEach((col) => {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								draft[rowIndex][LOOKUP_BY_FIELDS_KEY]![col] = generateLookupByKey(col);
							});
						}

						// apply lookup by for the nested rows
						if (nestedLineFieldsAllowedForLookupBy.includes(colId)) {
							let nestedRowIndex = rowIndex + 1;

							while (draft[nestedRowIndex] && draft[nestedRowIndex][IS_NESTED_ROW_KEY]) {
								draft[nestedRowIndex][LOOKUP_BY_FIELDS_KEY] ??= {};
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								draft[nestedRowIndex][LOOKUP_BY_FIELDS_KEY]![colId] = generateLookupByKey(colId);
								++nestedRowIndex;
							}
						}
					});
				});
			})
		);

		if (errors.length) {
			uniq(errors).forEach((error) => {
				failureAlert(error);
			});
		}
	};

	const handleRemoveLookupBy = () => {
		if (linesRef.current == null) return;

		const agGrid = linesRef.current.agGrid;

		assert(agGrid);

		const range = getSelectedRange(agGrid);

		assert(range);

		const {
			startIndex,
			endIndex,
			cellRange: { columns },
		} = range;

		const parents = getParentsOfDisplayedRowsInRange(agGrid, startIndex, endIndex);

		const errors: string[] = [];

		const columnIdsInSelectedRange = columns.map((column) => column?.getColId());

		linesRef.current.setRowData(
			produce((draft) => {
				parents.forEach((parent) => {
					const { rowIndex } = parent;

					if (rowIndex === null) return;

					columnIdsInSelectedRange.forEach((colId) => {
						const rowColumnError = getRemoveLookupByFromColumnError(
							columnIdsInSelectedRange,
							colId,
							parent.data
						);

						if (rowColumnError) {
							errors.push(rowColumnError);
							return;
						}

						if (draft?.[rowIndex]?.[LOOKUP_BY_FIELDS_KEY]?.[colId]) {
							draft[rowIndex][colId] = undefined; // undefined would make the cell have the default value
							delete draft[rowIndex][LOOKUP_BY_FIELDS_KEY]?.[colId];

							// remove lookup by for the nested rows
							if (nestedLineFieldsAllowedForLookupBy.includes(colId)) {
								let nestedRowIndex = rowIndex + 1;

								while (draft[nestedRowIndex] && draft[nestedRowIndex][IS_NESTED_ROW_KEY]) {
									// Set an empty value that differs from '' to trigger cell change.
									draft[nestedRowIndex][colId] = UNICODE_SPACE_CHAR;
									delete draft[nestedRowIndex][LOOKUP_BY_FIELDS_KEY]?.[colId];
									++nestedRowIndex;
								}
							}
						}
					});
				});
			})
		);

		if (errors.length) {
			uniq(errors).forEach((error) => {
				failureAlert(error);
			});
		}
	};

	const onLinesSelected = useCallback(
		(rows: T[]) => {
			setSelectedLinesWithLTs(
				rows.filter((row) => !row[IS_NESTED_ROW_KEY] && Object.keys(row[LOOKUP_BY_FIELDS_KEY] ?? {}).length > 0)
			);
		},
		[setSelectedLinesWithLTs]
	);

	const onAdvancedTableDataChange = useCallback(
		<T extends AdvancedTableRow>(lines: T[]) => {
			setLinesRows(lines);
		},
		[setLinesRows]
	);

	useHotkey(`${CTRL_OR_COMMAND_KEY}+b`, hotkeysScope, tryCatchFalse(handleLookupBy));
	useHotkey(`${CTRL_OR_COMMAND_KEY}+shift+b`, hotkeysScope, tryCatchFalse(handleRemoveLookupBy));

	return (
		<AdvancedTable<T>
			ref={linesRef as unknown as RefObject<AdvancedTableRef<T>>}
			css='flex: 1'
			adjustRowData={adjustRowData}
			onEditingChange={onLinesEditingChange}
			getColumnsDef={getColumnsDef}
			onUndoChange={setUndoState}
			onDataChange={onAdvancedTableDataChange}
			contextMenuItems={[
				{
					name: 'Lookup By',
					action: handleLookupBy,
					shortcut: `${CTRL_OR_COMMAND_TEXT}+b`,
				},
				{
					name: 'Remove Lookup By',
					action: handleRemoveLookupBy,
					shortcut: `${CTRL_OR_COMMAND_TEXT}+shift+b`,
				},
				...contextMenuItems,
			]}
			onRowsSelected={onLinesSelected}
			nestedLineFieldsAllowedForLookupBy={nestedLineFieldsAllowedForLookupBy}
			allowNestedRows={allowNestedRows}
			isNestedRowOnPaste={isNestedRowOnPaste}
			hotkeysScope={hotkeysScope}
		/>
	);
};
