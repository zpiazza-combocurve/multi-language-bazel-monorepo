import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ColDef, Column, GetContextMenuItemsParams, MenuItemDef } from 'ag-grid-community';
import classNames from 'classnames';
import { cloneDeep, isEqual, isNil } from 'lodash';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import {
	GenericCellEditor,
	suppressKeyboardEventOnCtrlEnter,
	suppressKeyboardEventOnCtrlShift,
	suppressKeyboardEventOnEditingEnter,
	suppressKeyboardEventOnEditingTab,
	suppressKeyboardEventOnShiftEnter,
} from '@/components/AdvancedTable/ag-grid-shared';
import { TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { clipboardToRows } from '@/components/AdvancedTable/shared';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';
import AgGrid, {
	AgGridRef,
	DASHED_CELL_CLASS_NAME,
	ERROR_CELL_CLASS_NAME,
	NUMBER_CELL_CLASS_NAME,
	WARNING_CELL_CLASS_NAME,
	defaultGetContextMenuItems,
	getSelectedRange,
} from '@/components/AgGrid';
import { CTRL_OR_COMMAND_KEY } from '@/components/Hotkey';
import { tryCatchFalse, useHotkey, useSelection, useSetHotkeyScope } from '@/components/hooks';
import { confirm } from '@/components/v2/alerts';
import { ToolBarButton } from '@/cost-model/detail-components/AdvancedModelView/AdvancedModelToolbar';
import { WellHeaderInfo } from '@/create-wells/models';
import { getNodesIdsInRange, handleAgGridDeleteRangeSelectedCells } from '@/helpers/ag-grid';
import { warningAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { rangesHaveOverlap } from '@/helpers/range';
import { theme as styledTheme } from '@/helpers/styled';
import { assert } from '@/helpers/utilities';
import { getObjectSchemaValidationErrors } from '@/helpers/yup-helpers';
import { FieldType } from '@/inpt-shared/constants';
import {
	RuleWellHeaderLabels,
	RuleWellHeaderMatchBehavior,
} from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { isPCH } from '@/inpt-shared/project/project-custom-headers/shared';
import { WellsHeadersCombinations } from '@/projects/api';

import SelectHeadersDialog from './LookupRules/SelectHeadersDialog';
import {
	findRuleForWell,
	formatWellHeaderValue,
	getHeadersValidationSchema,
	getWellHeaderRangeDefinitions,
	isCellEditable,
	mapCombinationToRule,
	ruleMatchesWellHeadersCombination,
	useDebouncedCellChange,
} from './LookupRules/helpers';
import { EmbeddedLookupTableContext } from './context/EmbeddedLookupTableContext';
import styles from './elt.module.scss';
import {
	checkIfAllRowsShouldBeRatioed,
	checkIfAllRowsShouldInterpolate,
	defaultColDef,
	getFieldAndVirtualLineByLookupByKey,
	getLookupRuleRowFieldValidationError,
	getWellHeaderFromRangeField,
	getWithNestedRules,
	parseConditionValue,
} from './shared';
import {
	HEADER_VALIDATION_ERRORS_KEY,
	IS_INVALID_COMBINATION_KEY,
	IS_OVERLAPPING_COMBINATION_KEY,
	LookupRuleRow,
	LookupRulesRef,
	NESTED_ROW_BEHAVIOR_KEY,
	UUID_KEY,
} from './types';

const addInterpolationRowHotkey = `${CTRL_OR_COMMAND_KEY}+i`;

type LookupRulesProps = {
	updating: boolean;
	headersCombinations?: WellsHeadersCombinations;
	className: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	lookupByWellHeaders?: Record<string, any>;
	isLookupRuleRowValueCellDisabled: <T extends AdvancedTableRow>(virtualLine: T, field: string) => boolean;
	isLookupRuleValueColumnNumerical: <T extends AdvancedTableRow>(
		rule: LookupRuleRow<T>,
		lookupByKey: string
	) => boolean;
	wellHeadersTypes: Record<string, { type: string }>;
	wellHeadersLabels: Record<string, string>;
	onValidateLookupRulesValues: () => Promise<boolean>;
};

const LookupRules = forwardRef<LookupRulesRef, LookupRulesProps>(
	(
		{
			updating,
			headersCombinations: _headersCombinations,
			className,
			lookupByWellHeaders,
			isLookupRuleRowValueCellDisabled,
			isLookupRuleValueColumnNumerical,
			wellHeadersTypes,
			wellHeadersLabels,
			onValidateLookupRulesValues,
		}: LookupRulesProps,
		ref
	) => {
		const {
			rulesRows: rows,
			setRulesRows: setRows,
			rulesColDef: columnDefs,
			chosenHeaders,
			setChosenHeaders,
			setRulesAreValid: onRulesAreValidCheck,
			selectedLinesWithLTs,
			setSelectedLinesWithLTs,
			setHeadersMatchBehavior,
			headersMatchBehavior,
			rulesValuesWereValidated,
		} = useContext(EmbeddedLookupTableContext);

		const [wellHeaderRangeDefinitions, setWellHeaderRangeDefinitions] = useState<
			Record<string, { type: string; behavior: RuleWellHeaderMatchBehavior; colIds: string[] }>
		>({});
		const [headersValidationSchema, setHeadersValidationSchema] = useState<yup.Schema>(
			getHeadersValidationSchema(wellHeaderRangeDefinitions, wellHeadersLabels)
		);

		const hotkeysScope = useMemo(() => 'elt-lookup-rules-hotkeys-scope-' + uuidv4(), []);

		const interpolationHeaderKey = useMemo(
			() =>
				Object.entries(wellHeaderRangeDefinitions).find(
					([, { behavior }]) => behavior === RuleWellHeaderMatchBehavior.interpolation
				)?.[0],
			[wellHeaderRangeDefinitions]
		);

		const headersCombinations = useMemo((): WellsHeadersCombinations => {
			if (_headersCombinations && wellHeadersTypes) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const parsedCombinations: Record<string, any>[] = [];

				_headersCombinations.combinations.forEach((combination) => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					const parsedCombination: Record<string, any> = {};

					Object.entries(combination).forEach(([key, value]) => {
						parsedCombination[key] = parseConditionValue(key, value, wellHeadersTypes);
					});

					parsedCombinations.push(parsedCombination);
				});

				return {
					options: _headersCombinations.options,
					combinations: parsedCombinations,
				};
			}

			return { options: {}, combinations: [] };
		}, [_headersCombinations, wellHeadersTypes]);

		const {
			newRows: rowsWithValidatedHeaders,
			rowsHaveHeaderValidationErrors,
			rowsHaveOverlaps,
			allRowsShouldInterpolate,
			allRowsShouldBeRatioed,
		} = useMemo(() => {
			const newRows = cloneDeep(rows);
			const wellHeaderRangeDefinitionsEntries = Object.entries(wellHeaderRangeDefinitions);

			const allRowsShouldInterpolate = checkIfAllRowsShouldInterpolate(headersMatchBehavior);
			const allRowsShouldBeRatioed = checkIfAllRowsShouldBeRatioed(headersMatchBehavior);
			const allRowsShouldInterpolateOrBeRatioed = allRowsShouldInterpolate || allRowsShouldBeRatioed;

			// If all rows should be interpolated, only the first row should be taken into consideration
			// as the new row without a nested behavior.
			const newRowsWithoutNested = allRowsShouldInterpolate
				? newRows[0]
					? [newRows[0]]
					: []
				: newRows.filter((rule) => !rule[NESTED_ROW_BEHAVIOR_KEY]);
			let rowsHaveHeaderValidationErrors = false;
			let rowsHaveOverlaps = false;

			// basic headers values validation (for types, ranges, ratio, interpolation etc.)
			for (let i = 0; i < newRows.length; ++i) {
				const previousRow = i ? newRows[i - 1] : undefined;
				const currentRow = newRows[i];
				const nextRow = i < newRows.length - 1 ? newRows[i + 1] : undefined;

				const validationErrors = getObjectSchemaValidationErrors(headersValidationSchema, currentRow, {
					context: { currentRow, previousRow, nextRow },
				});

				if (validationErrors) {
					currentRow[HEADER_VALIDATION_ERRORS_KEY] = validationErrors;
					rowsHaveHeaderValidationErrors = true;
				}
			}

			// proceed with invalid and overlapping combinations only in case no basic validation errors are present as
			// overlapping and invalid errors will highlight the whole row
			if (!rowsHaveHeaderValidationErrors) {
				const validRulesSet = new Set<string>();

				// extracting valid combinations
				for (const combination of headersCombinations.combinations) {
					for (const rule of newRowsWithoutNested) {
						if (ruleMatchesWellHeadersCombination(rule, combination, wellHeaderRangeDefinitionsEntries)) {
							validRulesSet.add(rule[UUID_KEY]);
						}
					}
				}

				// validation for overlapping rules and setting invalid ones
				for (let i = 0; i < newRowsWithoutNested.length; ++i) {
					const rule1 = newRowsWithoutNested[i];
					rule1[IS_INVALID_COMBINATION_KEY] = !validRulesSet.has(rule1[UUID_KEY]);

					for (let j = i + 1; j < newRowsWithoutNested.length; ++j) {
						const rule2 = newRowsWithoutNested[j];
						let overlapFound = true;

						for (const [header, { behavior, colIds }] of wellHeaderRangeDefinitionsEntries) {
							if (
								behavior !== RuleWellHeaderMatchBehavior.regular &&
								!allRowsShouldInterpolateOrBeRatioed
							) {
								continue;
							}

							if (colIds.length === 2) {
								const [[lower1, lower2], [upper1, upper2]] = colIds.map((colId) => [
									rule1[colId],
									rule2[colId],
								]);

								overlapFound = rangesHaveOverlap(lower1, upper1, lower2, upper2);
							} else if (
								rule1[header] !== rule2[header] &&
								(!isNil(rule1[header]) || !isNil(rule2[header]))
							) {
								overlapFound = false;
							}

							if (!overlapFound) {
								break;
							}
						}

						if (overlapFound) {
							rowsHaveOverlaps = true;
							rule1[IS_OVERLAPPING_COMBINATION_KEY] = true;
							rule2[IS_OVERLAPPING_COMBINATION_KEY] = true;
						}
					}
				}
			}

			return {
				newRows,
				rowsHaveHeaderValidationErrors,
				rowsHaveOverlaps,
				allRowsShouldInterpolate,
				allRowsShouldBeRatioed,
			};

			// We don't want to run this hook whenever headersMatchBehavior changes as there
			// is data transformation that needs to take place before that which updates
			// the current rows' state and then is when this hook is run.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [rows, wellHeaderRangeDefinitions, headersValidationSchema, headersCombinations.combinations]);

		const { highlightedRows, highlightedRowsUUIds, highlightedRowsUUIdsString } = useMemo(() => {
			const result: {
				highlightedRows: LookupRuleRow[];
				highlightedRowsUUIds: string[];
				highlightedRowsUUIdsString: string;
			} = {
				highlightedRows: [],
				highlightedRowsUUIds: [],
				highlightedRowsUUIdsString: '',
			};

			if (lookupByWellHeaders) {
				const foundRule = findRuleForWell(
					chosenHeaders,
					rowsWithValidatedHeaders,
					wellHeadersTypes,
					lookupByWellHeaders,
					headersMatchBehavior
				);

				if (foundRule) {
					result.highlightedRows = [foundRule.root, ...foundRule.nested];
					result.highlightedRowsUUIds = result.highlightedRows.map((row) => row[UUID_KEY]);
					result.highlightedRowsUUIdsString = result.highlightedRowsUUIds.join(',');
				}
			}

			return result;
		}, [chosenHeaders, headersMatchBehavior, lookupByWellHeaders, rowsWithValidatedHeaders, wellHeadersTypes]);

		const rowsToDisplay = useMemo(
			() => [
				...highlightedRows,
				...rowsWithValidatedHeaders.filter((row) => !highlightedRowsUUIds.includes(row[UUID_KEY])),
			],
			[highlightedRows, highlightedRowsUUIds, rowsWithValidatedHeaders]
		);

		const rowIds = useMemo(() => rows.map((row) => row[UUID_KEY]), [rows]);
		const selection = useSelection(rowIds);

		const agGridRef = useRef<AgGridRef>(null);

		const [selectHeadersDialog, promptSelectHeadersDialog] = useDialog(SelectHeadersDialog);

		const rowsShouldBeFixed = rowsHaveHeaderValidationErrors || rowsHaveOverlaps;

		const wellHeadersDict = useMemo(() => {
			const wellHeadersDict: Record<string, WellHeaderInfo> = {};

			if (wellHeadersTypes && wellHeadersLabels) {
				Object.entries(wellHeadersTypes).forEach(([key, { type }]) => {
					wellHeadersDict[key] = {
						label: wellHeadersLabels[key],
						type,
						isPCH: isPCH(key),
					};
				});
			}

			return wellHeadersDict;
		}, [wellHeadersTypes, wellHeadersLabels]);

		const getCurrentRows = useCallback(() => {
			const currentRows = cloneDeep(rows);
			return currentRows;
		}, [rows]);

		/**
		 * @param insertInLastRow - If true, attempts to inserts new row after the last row in the table if no selection
		 *   is present. Otherwise, inserts new row after the last selected row.
		 */
		const addInterpolationRow = useCallback(
			(insertInLastRow?: boolean) => {
				if (!interpolationHeaderKey || agGridRef.current == null) return;

				const range = getSelectedRange(agGridRef.current, insertInLastRow);

				if (range == null) return;

				const { endRow } = range;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				const parentRowId = endRow.level ? endRow.parent!.data[UUID_KEY] : endRow.data[UUID_KEY];
				const endRowId = endRow.data[UUID_KEY];

				setRows((currentRows) => {
					const newRows: LookupRuleRow[] = [];

					currentRows.forEach((currentRow) => {
						newRows.push(currentRow);

						if (currentRow[UUID_KEY] === endRowId) {
							const nestedRowId = uuidv4();

							newRows.push({
								[UUID_KEY]: nestedRowId,
								[TREE_DATA_KEY]: [parentRowId, nestedRowId],
								[NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation,
							});
						}
					});

					return newRows;
				});
			},
			[interpolationHeaderKey, setRows]
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const getNextPossibleCombinations = (): Record<string, any>[] => {
			const currentRows = getCurrentRows().filter((rule) => !rule[NESTED_ROW_BEHAVIOR_KEY]);
			const wellHeaderRangeDefinitionsEntries = Object.entries(wellHeaderRangeDefinitions);

			return headersCombinations.combinations.filter((combination) =>
				currentRows.every(
					(rule) => !ruleMatchesWellHeadersCombination(rule, combination, wellHeaderRangeDefinitionsEntries)
				)
			);
		};

		const onSelectHeaders = async () => {
			const { newHeaders, newBehavior } =
				(await promptSelectHeadersDialog({
					allHeaders: wellHeadersDict,
					initialHeaders: chosenHeaders,
					initialHeadersMatchBehavior: headersMatchBehavior,
				})) ?? {};

			if (newBehavior && !isEqual(headersMatchBehavior, newBehavior)) {
				setHeadersMatchBehavior(newBehavior);
			}

			if (newHeaders && !isEqual(chosenHeaders, newHeaders)) {
				setChosenHeaders(newHeaders);
			}
		};

		const onAddRow = () => {
			if (rows.length && allRowsShouldInterpolate) {
				return addInterpolationRow(true);
			}

			const parentRowId = uuidv4();
			const newRows = [{ [UUID_KEY]: parentRowId, [TREE_DATA_KEY]: [parentRowId] } as LookupRuleRow];

			if (interpolationHeaderKey) {
				const nestedRowId = uuidv4();

				newRows.push({
					[UUID_KEY]: nestedRowId,
					[TREE_DATA_KEY]: [parentRowId, nestedRowId],
					[NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation,
				});
			}

			setRows([...rows, ...newRows]);
		};

		const onRemoveSelectedRows = () => {
			const idsToRemove = [...selection.selectedSet];
			const withNested = getWithNestedRules(rows);
			const resultRows: LookupRuleRow[] = [];

			//don't keep nested rows if 'parent' was deleted
			withNested.forEach(({ root, nested }) => {
				if (!idsToRemove.includes(root[UUID_KEY])) {
					resultRows.push(root);

					nested.forEach((nestedRow) => {
						if (!idsToRemove.includes(nestedRow[UUID_KEY])) {
							resultRows.push(nestedRow);
						}
					});
				}
			});

			setRows(resultRows);
		};

		const onBuildTable = async () => {
			if (
				await confirm({
					title: 'This will generate the rest of the possible well headers combinations from the wells in the current project. Proceed? ',
					confirmText: 'Yes',
					cancelText: 'No',
				})
			) {
				const nextPossibleCombinations = getNextPossibleCombinations();
				const mappedCombinations: LookupRuleRow[] = [];

				for (const nextPossibleCombination of nextPossibleCombinations) {
					const parentRowId = uuidv4();

					mappedCombinations.push({
						[UUID_KEY]: parentRowId,
						[TREE_DATA_KEY]: [parentRowId],
						...mapCombinationToRule(nextPossibleCombination, wellHeadersTypes),
					});

					if (interpolationHeaderKey) {
						const nestedRowId = uuidv4();

						mappedCombinations.push({
							[UUID_KEY]: nestedRowId,
							[TREE_DATA_KEY]: [parentRowId, nestedRowId],
							[NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation,
						});
					}
				}

				if (mappedCombinations.length > 0) {
					setRows([...rows, ...mappedCombinations]);
				}
			}
		};

		useEffect(() => {
			agGridRef.current?.api?.redrawRows();
		}, [lookupByWellHeaders, highlightedRowsUUIdsString]);

		useEffect(() => {
			const newRows = cloneDeep(rows);

			const _allRowsShouldInterpolate = checkIfAllRowsShouldInterpolate(headersMatchBehavior);
			const _allRowsShouldBeRatioed = checkIfAllRowsShouldBeRatioed(headersMatchBehavior);

			if (_allRowsShouldInterpolate || _allRowsShouldBeRatioed) {
				// basic headers values validation (for types, ranges, ratio, interpolation etc.)
				for (let i = 0; i < newRows.length; ++i) {
					const currentRow = newRows[i];

					// We should make sure that all rows are properly interpolated at this point
					// as when headers get updated, row interpolation re-calculation doesn't occur.
					if (allRowsShouldInterpolate && i !== 0) {
						currentRow[NESTED_ROW_BEHAVIOR_KEY] = RuleWellHeaderMatchBehavior.interpolation;
						currentRow[TREE_DATA_KEY] = [newRows[0][UUID_KEY], currentRow[UUID_KEY]];
					}

					if (allRowsShouldBeRatioed && i !== 0) {
						delete currentRow[NESTED_ROW_BEHAVIOR_KEY];
						currentRow[TREE_DATA_KEY] = [currentRow[UUID_KEY]];
					}
				}

				setRows(newRows);
			}

			// We don't want to listen for row changes on this hook as it's duty
			// is to keep the current rows' state in sync with the updated headersMatchBehavior.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [headersMatchBehavior]);

		useEffect(() => {
			const newDefinitions = getWellHeaderRangeDefinitions(chosenHeaders, wellHeadersTypes, headersMatchBehavior);
			setWellHeaderRangeDefinitions(newDefinitions);
			setHeadersValidationSchema(getHeadersValidationSchema(newDefinitions, wellHeadersLabels));
		}, [chosenHeaders, wellHeadersTypes, headersMatchBehavior, wellHeadersLabels]);

		useEffect(() => {
			onRulesAreValidCheck(!rowsShouldBeFixed);
		}, [onRulesAreValidCheck, rowsShouldBeFixed]);

		useImperativeHandle(ref, () => ({
			getCurrentRows,
		}));

		const handleSingleCellChange = useDebouncedCellChange(setRows);

		const setHotkeysScope = useSetHotkeyScope(false);
		useHotkey(
			addInterpolationRowHotkey,
			hotkeysScope,
			tryCatchFalse(() => addInterpolationRow())
		);

		const indexHeader = useMemo(
			() => ({
				...defaultColDef,
				headerName: '#',
				valueGetter: 'node.rowIndex + 1',
				pinned: true,
				sortable: false,
				width: 80,
				minWidth: 80,
			}),
			[]
		);

		const headersWithIndex = useMemo(() => {
			const headersWithIndex = [indexHeader, ...columnDefs];

			return headersWithIndex;
		}, [indexHeader, columnDefs]);

		const isEmptyValue = (value) => value === null || value === undefined || value.length === 0;

		const buildRow = (baseRow?: LookupRuleRow): { rowId: string; rowObject: LookupRuleRow } => {
			const rowId = baseRow?.[UUID_KEY] ?? uuidv4();
			const rowObject = baseRow
				? { ...baseRow }
				: {
						[UUID_KEY]: rowId,
						[TREE_DATA_KEY]: [rowId],
				  };

			return { rowId, rowObject };
		};

		const setupPasteOperations = async () => {
			const { api, columnApi } = agGridRef?.current ?? {};
			if (!window?.navigator?.clipboard) return;
			assert(api, 'Expected to have API');
			assert(columnApi, 'Expected to have column API');

			const copiedText = await window.navigator.clipboard.readText();
			const data = clipboardToRows(copiedText);
			if (!data) return;

			const allColumns = columnApi?.getAllColumns();
			if (!allColumns || !allColumns.length) return;

			const isEntireRowPaste = !!allColumns?.length && allColumns.length <= data[0].length;

			const currentRows: LookupRuleRow[] = [];
			api.forEachNodeAfterFilterAndSort((rowNode) => currentRows.push(rowNode.data as LookupRuleRow));

			return { api, columnApi, allColumns, data, isEntireRowPaste, currentRows };
		};

		const adjustRowsTree = useCallback(
			(rowsToAdjust: LookupRuleRow[]): LookupRuleRow[] => {
				let lastParentRowId: string = '';
				const adjustedRows = rowsToAdjust.map((row, index) => {
					if (
						(!allRowsShouldInterpolate && !row[NESTED_ROW_BEHAVIOR_KEY]) ||
						(allRowsShouldInterpolate && index === 0)
					) {
						lastParentRowId = row[UUID_KEY];
					} else {
						if (row[TREE_DATA_KEY][0] !== lastParentRowId) {
							row[TREE_DATA_KEY] = [lastParentRowId, row[UUID_KEY]];
							row[NESTED_ROW_BEHAVIOR_KEY] = RuleWellHeaderMatchBehavior.interpolation;
						}
					}
					return row;
				});

				return adjustedRows;
			},
			[allRowsShouldInterpolate]
		);

		const handlePaste = useCallback(
			async (operation: 'paste' | 'insert') => {
				const setup = await setupPasteOperations();
				if (!setup) return;

				const { api, columnApi, allColumns, data, isEntireRowPaste, currentRows } = setup;

				if (operation === 'insert' && !isEntireRowPaste) {
					warningAlert('Pasted rows number of columns does not match table number of columns.');
					return;
				}

				// Initialize table state variables
				const rowCount = api.getModel().getRowCount();
				const lastIndex = rowCount - 1;
				const focusedCell = api.getFocusedCell();
				const focusedColumn: Column = focusedCell?.column ?? allColumns[0];
				const focusedRowIndex = focusedCell ? focusedCell.rowIndex : 0;
				const focusedRow = currentRows[focusedRowIndex];
				const parentRow =
					focusedRow?.[TREE_DATA_KEY]?.length > 1
						? currentRows.find((row) => row[UUID_KEY] === focusedRow[TREE_DATA_KEY][0])
						: focusedRow;
				const parentRowIndex = currentRows.findIndex((row) => row[UUID_KEY] === parentRow?.[UUID_KEY]);
				const rowsToUpdate = currentRows.slice(0, operation === 'paste' ? rowCount : focusedRowIndex);
				const remainingRows = operation === 'insert' ? currentRows.slice(focusedRowIndex, rowCount) : [];
				const resultLastIndex = focusedRowIndex + (data.length - 1);
				const numRowsToAdd = rowsToUpdate.length ? resultLastIndex - lastIndex : data.length;
				const numRowsToUpdate = resultLastIndex - numRowsToAdd;
				const rowsToAdd: LookupRuleRow[] = [];
				let lastParentRow: LookupRuleRow = parentRow ?? focusedRow;

				// Header labels that nested rows are anchored to
				const parentHeaderLabels: string[] = [
					RuleWellHeaderLabels.range,
					RuleWellHeaderLabels.ratio,
					RuleWellHeaderLabels.match,
				];

				const pasteCopiedValuesOverRow = ({
					baseRow,
					isFirstInterpolationRow,
				}: {
					baseRow?: LookupRuleRow;
					isFirstInterpolationRow?: boolean;
				}): LookupRuleRow | undefined => {
					const copiedValues = data.shift();
					const { rowObject, rowId } = buildRow(baseRow);

					if (!copiedValues) return;

					let currentColumn: Column | null = isEntireRowPaste ? allColumns[0] : focusedColumn;
					let isParentRow = false;
					copiedValues.forEach((copiedValue) => {
						if (!currentColumn) {
							return;
						}

						const currentColumnDef = currentColumn.getColDef();
						const isNumericColumn = currentColumnDef.type === 'number';

						if (isEntireRowPaste) {
							const isParentHeader =
								currentColumnDef.headerName && parentHeaderLabels.includes(currentColumnDef.headerName);

							if (isParentHeader && !isEmptyValue(copiedValue)) {
								isParentRow = true;
							}
						}

						rowObject[currentColumn.getColId()] =
							isNumericColumn && !isNaN(Number(copiedValue)) ? Number(copiedValue) : copiedValue;
						currentColumn = columnApi.getDisplayedColAfter(currentColumn);
					});

					if (rowObject[HEADER_VALIDATION_ERRORS_KEY]) delete rowObject[HEADER_VALIDATION_ERRORS_KEY];
					if (!isEntireRowPaste) return rowObject;

					if (isParentRow || isFirstInterpolationRow) {
						if (rowObject[NESTED_ROW_BEHAVIOR_KEY]) delete rowObject[NESTED_ROW_BEHAVIOR_KEY];
						rowObject[UUID_KEY] = rowId;
						rowObject[TREE_DATA_KEY] = [rowId];
						lastParentRow = rowObject;
					} else {
						rowObject[UUID_KEY] = rowId;
						rowObject[TREE_DATA_KEY] = [lastParentRow[UUID_KEY], rowId];
						rowObject[NESTED_ROW_BEHAVIOR_KEY] = RuleWellHeaderMatchBehavior.interpolation;
					}

					return rowObject;
				};

				// replace current rows with copied values
				for (let i = focusedRowIndex; i <= numRowsToUpdate; i++) {
					const pastedRow = pasteCopiedValuesOverRow({
						baseRow: rowsToUpdate[i],
						isFirstInterpolationRow: allRowsShouldInterpolate && i === parentRowIndex,
					});
					if (!pastedRow) break;
					rowsToUpdate[i] = pastedRow;
				}

				// add new rows
				for (let i = 0; i < numRowsToAdd; i++) {
					const pastedRow = pasteCopiedValuesOverRow({
						baseRow: undefined,
						isFirstInterpolationRow: allRowsShouldInterpolate && i === 0,
					});
					if (!pastedRow) break;
					rowsToAdd.push(pastedRow);
				}

				setRows(adjustRowsTree([...rowsToUpdate, ...rowsToAdd, ...remainingRows]));
				api.redrawRows();
			},
			[adjustRowsTree, allRowsShouldInterpolate, setRows]
		);

		useHotkey(
			`${CTRL_OR_COMMAND_KEY}+v`,
			hotkeysScope,
			tryCatchFalse(() => handlePaste('paste'))
		);

		useHotkey(
			`${CTRL_OR_COMMAND_KEY}+shift+v`,
			hotkeysScope,
			tryCatchFalse(() => handlePaste('insert'))
		);

		const handleInterpolationRowsPaste = useCallback(async () => {
			const setup = await setupPasteOperations();
			if (!setup) return;

			const { api, columnApi, allColumns, data, isEntireRowPaste, currentRows } = setup;

			const focusedCell = api.getFocusedCell();
			if (!focusedCell) {
				warningAlert('You must be focused on a row before pasting interpolation rows.');
				return;
			}

			// Initialize table state variables
			const focusedColumn: Column = focusedCell.column;
			const focusedRowIndex = focusedCell.rowIndex;
			const focusedRow = currentRows[focusedRowIndex];
			const parentRow = currentRows.find((row) => row[UUID_KEY] === focusedRow[TREE_DATA_KEY][0]);
			if (!parentRow) {
				warningAlert('You must be focused on an interpolation row before pasting interpolation rows.');
				return;
			}

			const rowsBefore = currentRows.slice(0, focusedRowIndex + 1);
			const rowsAfter = currentRows.slice(focusedRowIndex + 1);
			const rowsToAdd: LookupRuleRow[] = [];
			const numRowsToAdd = data.length;

			for (let i = 0; i < numRowsToAdd; i++) {
				const copiedValues = data.shift();
				if (!copiedValues) break;
				const { rowObject } = buildRow();
				rowObject[TREE_DATA_KEY].unshift(parentRow[UUID_KEY]);
				rowObject[NESTED_ROW_BEHAVIOR_KEY] = RuleWellHeaderMatchBehavior.interpolation;

				let currentColumn: Column | null = isEntireRowPaste ? allColumns[0] : focusedColumn;
				copiedValues.forEach((copiedValue) => {
					if (!currentColumn) {
						return;
					}

					const currentColumnDef = currentColumn.getColDef();
					const isNumericColumn = currentColumnDef.type === 'number';

					rowObject[currentColumn.getColId()] =
						isNumericColumn && !isNaN(Number(copiedValue)) ? Number(copiedValue) : copiedValue;
					currentColumn = columnApi.getDisplayedColAfter(currentColumn);
				});

				if (rowObject[HEADER_VALIDATION_ERRORS_KEY]) delete rowObject[HEADER_VALIDATION_ERRORS_KEY];
				rowsToAdd.push(rowObject);
			}

			setRows(adjustRowsTree([...rowsBefore, ...rowsToAdd, ...rowsAfter]));
			api.redrawRows();
		}, [adjustRowsTree, setRows]);

		useHotkey(
			`${CTRL_OR_COMMAND_KEY}+shift+i`,
			hotkeysScope,
			tryCatchFalse(() => {
				if (!interpolationHeaderKey) {
					warningAlert('The table must have an interpolation column to paste interpolation rows.');
					return;
				}
				handleInterpolationRowsPaste();
			})
		);

		const getContextMenuItems = useCallback(
			(params: GetContextMenuItemsParams): (string | MenuItemDef)[] => {
				const additionalMenuItems: (string | MenuItemDef)[] = [];

				if (interpolationHeaderKey) {
					additionalMenuItems.push({
						name: `Add interpolation row (${CTRL_OR_COMMAND_KEY}+i)`,
						action: addInterpolationRow,
					});

					additionalMenuItems.push({
						name: `Insert copied interpolation rows (${CTRL_OR_COMMAND_KEY}+shift+i)`,
						action: handleInterpolationRowsPaste,
					});
				}

				additionalMenuItems.push({
					name: `Insert copied rows (${CTRL_OR_COMMAND_KEY}+shift+v)`,
					action: () => handlePaste('insert'),
				});

				return [...defaultGetContextMenuItems(params), ...additionalMenuItems];
			},
			[addInterpolationRow, handleInterpolationRowsPaste, handlePaste, interpolationHeaderKey]
		);

		return (
			<div
				className={classNames(styles['lookup-rules'], className)}
				onClick={() => {
					setHotkeysScope(hotkeysScope);
					return false;
				}}
			>
				{selectHeadersDialog}
				<div>
					<div
						css={`
							display: flex;
							margin-bottom: 0.5rem;
						`}
					>
						<ToolBarButton
							color='secondary'
							variant='outlined'
							onClick={onSelectHeaders}
							disabled={updating}
						>
							Select Headers
						</ToolBarButton>
						<ToolBarButton
							color='secondary'
							variant='outlined'
							startIcon={faPlus}
							onClick={onAddRow}
							disabled={!chosenHeaders.length || updating}
						>
							Row
						</ToolBarButton>
						<ToolBarButton
							onClick={onRemoveSelectedRows}
							disabled={!selection.selectedSet.size || updating}
						>
							Delete
						</ToolBarButton>
						<ToolBarButton
							color='secondary'
							variant='outlined'
							disabled={rowsShouldBeFixed || updating}
							onClick={onBuildTable}
						>
							Build Table
						</ToolBarButton>
						{selectedLinesWithLTs.length > 0 && (
							<ToolBarButton
								color='secondary'
								variant='outlined'
								onClick={() => setSelectedLinesWithLTs([])}
							>
								Show All LTs
							</ToolBarButton>
						)}
						{!rulesValuesWereValidated && (
							<ToolBarButton color='secondary' variant='contained' onClick={onValidateLookupRulesValues}>
								Validate Values
							</ToolBarButton>
						)}
					</div>
				</div>
				<div className={styles['lookup-rules-table']}>
					<AgGrid
						getRowClass={(params) =>
							highlightedRowsUUIds.includes(params.data?.[UUID_KEY]) ? 'match-for-well' : undefined
						}
						css={`
							width: 100%;
							height: 100%;
							.ag-sort-order {
								margin-left: 0.5rem;
							}
							.ag-react-container {
								align-items: center;
								display: flex;
								flex: 1;
								height: 100%;
							}
							.ag-row.match-for-well .ag-cell {
								background-color: ${styledTheme.primaryColorSolidOpaque};
							}
						`}
						rowData={rowsToDisplay}
						ref={agGridRef}
						getRowId={useCallback((params) => params.data[UUID_KEY], [])}
						columnDefs={headersWithIndex}
						defaultColDef={useMemo(
							() => ({
								editable: true,
								cellEditor: GenericCellEditor,
								comparator: (valueA, valueB, nodeA, nodeB) => {
									if (!nodeA.data[NESTED_ROW_BEHAVIOR_KEY] && !nodeB[NESTED_ROW_BEHAVIOR_KEY]) {
										const isANumber = /^\d+$/.test(valueA);
										const isBNumber = /^\d+$/.test(valueB);
										const newAValue = isANumber ? Number(valueA) : valueA;
										const newBValue = isBNumber ? Number(valueB) : valueB;

										if (isNil(newAValue) || isNil(newBValue)) {
											return -1;
										}

										// sorting strings
										if (!isANumber && !isBNumber) {
											if (newAValue === newBValue) return 0;
											return newAValue > newBValue ? 1 : -1;
										}

										//sorting numbers
										if (isANumber && isBNumber) {
											return newAValue - newBValue;
										}

										//numbers have priority over strings
										if (!isANumber && isBNumber) {
											return -1;
										}

										//numbers have priority over string
										if (isANumber && !isBNumber) {
											return 1;
										}
									}

									return 0;
								},
								valueGetter: (params) => {
									if (!params.node?.id || !params.colDef.field) {
										return undefined;
									}

									const wellHeader = getWellHeaderFromRangeField(params.colDef.field);
									if (chosenHeaders.includes(wellHeader)) {
										return formatWellHeaderValue(
											wellHeader,
											params.data[params.colDef.field],
											params.colDef.type as string,
											interpolationHeaderKey,
											params.data[NESTED_ROW_BEHAVIOR_KEY]
										);
									}

									return params.data[params.colDef.field];
								},
								valueSetter: (params) => {
									if (!params.node?.id || !params.colDef.field) {
										return false;
									}

									const editableInfo = isCellEditable(
										params.data,
										params.colDef.field,
										chosenHeaders,
										isLookupRuleValueColumnNumerical,
										interpolationHeaderKey
									);

									if (editableInfo.editable) {
										let newValue = params.newValue?.label || params.newValue;
										newValue = !editableInfo.header && newValue === '' ? undefined : newValue; //fixes validation
										const oldValue = params.oldValue?.label || params.oldValue;

										handleSingleCellChange(
											params.node.id,
											params.colDef.field,
											newValue,
											oldValue,
											!!editableInfo.header,
											wellHeadersTypes?.[editableInfo.header]?.type
										);
									}

									return true;
								},
								cellClassRules: {
									[NUMBER_CELL_CLASS_NAME]: (params) => {
										return params.colDef.type === FieldType.number;
									},
									[WARNING_CELL_CLASS_NAME]: (params) => params.data?.[IS_INVALID_COMBINATION_KEY],
									[ERROR_CELL_CLASS_NAME]: (params) => {
										if (params.colDef.field) {
											if (params.data?.[HEADER_VALIDATION_ERRORS_KEY]?.[params.colDef.field]) {
												return true;
											}

											if (
												!chosenHeaders.includes(
													getWellHeaderFromRangeField(params.colDef.field)
												) &&
												getLookupRuleRowFieldValidationError(params.data, params.colDef.field)
											) {
												return true;
											}

											if (params.data?.[IS_OVERLAPPING_COMBINATION_KEY]) {
												return true;
											}
										}

										return false;
									},
									[DASHED_CELL_CLASS_NAME]: (params) => {
										const editableInfo = isCellEditable(
											params.data,
											params.colDef.field,
											chosenHeaders,
											isLookupRuleValueColumnNumerical,
											interpolationHeaderKey
										);

										if (!editableInfo.editable) {
											return true;
										}

										if (!editableInfo.header && params.colDef.field) {
											const { virtualLine, field } = getFieldAndVirtualLineByLookupByKey(
												params.data,
												params.colDef.field
											);

											if (virtualLine && field) {
												return isLookupRuleRowValueCellDisabled(virtualLine, field);
											}
										}

										return false;
									},
								},
								tooltipValueGetter: (params) => {
									const errors: string[] = [];

									if (params.data?.[IS_INVALID_COMBINATION_KEY]) {
										errors.push(
											'Project does not have the well with a provided headers combination.'
										);
									}

									if (params.data?.[IS_OVERLAPPING_COMBINATION_KEY]) {
										errors.push('Combination overlaps another combination.');
									}

									const colDefField = (params.colDef as ColDef)?.field;

									if (colDefField) {
										const valuesValidationError = !chosenHeaders.includes(colDefField)
											? getLookupRuleRowFieldValidationError(params.data, colDefField)
											: undefined;

										if (valuesValidationError) {
											errors.push(valuesValidationError);
										}

										const headersValidationError =
											params.data?.[HEADER_VALIDATION_ERRORS_KEY]?.[colDefField];

										if (headersValidationError) {
											errors.push(headersValidationError);
										}
									}

									return errors.length > 0 ? errors.join(' ') : undefined;
								},

								suppressKeyboardEvent: (params) => {
									if (params.event.key === 'Delete') {
										const newData = handleAgGridDeleteRangeSelectedCells(params.api);

										if (newData === undefined) {
											return true;
										}

										Object.keys(newData).forEach((nodeId) => {
											Object.keys(newData[nodeId]).forEach((field) => {
												handleSingleCellChange(nodeId, field, newData[nodeId][field]);
											});
										});

										agGridRef.current?.api.refreshCells();

										return true;
									}

									return (
										suppressKeyboardEventOnEditingTab(params) ||
										suppressKeyboardEventOnEditingEnter(params) ||
										suppressKeyboardEventOnCtrlEnter(params) ||
										suppressKeyboardEventOnCtrlShift(params) ||
										suppressKeyboardEventOnShiftEnter(params)
									);
								},
							}),
							[
								chosenHeaders,
								handleSingleCellChange,
								interpolationHeaderKey,
								isLookupRuleRowValueCellDisabled,
								wellHeadersTypes,
								isLookupRuleValueColumnNumerical,
							]
						)}
						onRowClicked={(params) => {
							if (!params.node?.id) {
								return;
							}

							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
							if ((params.event as any | undefined)?.shiftKey) {
								const focused = params.api.getFocusedCell();

								if (!focused || params.rowIndex == null) {
									return;
								}

								selection.select(getNodesIdsInRange(params.api, focused.rowIndex, params.rowIndex));

								return;
							}

							if (selection.selectedSet.size === 1 && selection.isSelected(params.node.id)) {
								return;
							}

							selection.setSelectedSet([params.node.id]);
						}}
						onRangeSelectionChanged={(params) => {
							if (!params.finished || params.started) {
								return;
							}

							// adapt range selection to "selection" object
							const ranges = params.api.getCellRanges();
							if (!ranges) {
								selection.deselectAll();
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
								if (!range.startRow || !range.endRow) {
									return [];
								}

								return getNodesIdsInRange(params.api, range.startRow.rowIndex, range.endRow.rowIndex);
							});

							selection.setSelectedSet(newSelection);
						}}
						getContextMenuItems={getContextMenuItems}
						enableRangeSelection
						suppressRowClickSelection
						suppressMultiRangeSelection
						tooltipShowDelay={0}
						suppressCsvExport
						multiSortKey='ctrl'
						suppressExcelExport
						suppressLastEmptyLineOnPaste
						treeData
						getDataPath={useCallback((data) => data[TREE_DATA_KEY], [])}
						groupDisplayType='custom'
						groupDefaultExpanded={-1}
						/* Needed so AgGrid does not act on the paste event as We are handling it with our useHotkey hook  */
						processDataFromClipboard={() => []}
					/>
				</div>
			</div>
		);
	}
);

export default LookupRules;
