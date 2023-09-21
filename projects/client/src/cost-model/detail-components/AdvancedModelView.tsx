import { Chip } from '@material-ui/core';
import { ColGroupDef, MenuItemDef, RowNode } from 'ag-grid-community';
import produce, { castDraft } from 'immer';
import { isNil, pick, uniq } from 'lodash';
import {
	Children,
	ForwardedRef,
	ReactElement,
	RefObject,
	cloneElement,
	forwardRef,
	isValidElement,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import AdvancedTable from '@/components/AdvancedTable';
import {
	LOOKUP_BY_FIELDS_KEY,
	LT_CELL_STRING_VALUE,
	LT_CELL_UNASSIGNED_STRING_VALUE,
	ROW_ID_KEY,
} from '@/components/AdvancedTable/constants';
import {
	DEFAULT_ADVANCED_MODEL_VALUE,
	advancedModelStateIsEqual,
	advancedModelStateIsValid,
	getSpecialCellStylesField,
} from '@/components/AdvancedTable/shared';
import { AdvancedTableCellEditorActions, AdvancedTableRef, AdvancedTableRow } from '@/components/AdvancedTable/types';
import { Block } from '@/components/KeyboardShortcutsButton';
import { useDraggingResize } from '@/components/hooks/useDraggingResize';
import { useSetHotkeyScope } from '@/components/hooks/useHotkey';
import { WithWindow } from '@/components/misc/WithWindow';
import { Divider, Stack } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { getHexColorForString } from '@/helpers/color';
import { useDialog } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { assert, stringToColor } from '@/helpers/utilities';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import EmbeddedLookupTableEditView from '@/lookup-tables/embedded-lookup-tables/EmbeddedLookupTableEditView';
import { findRuleForWell } from '@/lookup-tables/embedded-lookup-tables/LookupRules/helpers';
import { NewEmbeddedLookupTableDialog } from '@/lookup-tables/embedded-lookup-tables/NewEmbeddedLookupTableDialog';
import { getEmbeddedLookupTable } from '@/lookup-tables/embedded-lookup-tables/api';
import {
	useCreateEmbeddedLookupTableMutation,
	useUpdateEmbeddedLookupTableMutation,
} from '@/lookup-tables/embedded-lookup-tables/mutations';
import { useEmbeddedLookupTablesQuery } from '@/lookup-tables/embedded-lookup-tables/queries';
import {
	getEmbeddedLookupTableModel,
	getVirtualLinesForLookupRuleRow,
	parseConditionValue,
} from '@/lookup-tables/embedded-lookup-tables/shared';
import {
	EditEmbeddedLookupTableRef,
	EmbeddedLookupTableModel,
	LookupRuleRow,
	LookupRuleWithNestedRows,
	ModuleListEmbeddedLookupTableItem,
	NESTED_ROW_BEHAVIOR_KEY,
	VIRTUAL_LINES_KEY,
} from '@/lookup-tables/embedded-lookup-tables/types';
import { useAssumptionModelAdvancedViewELTDependencies } from '@/lookup-tables/embedded-lookup-tables/useAssumptionModelELTDependencies';
import { FilterResult } from '@/module-list/types';
import { useWellHeaderValuesQuery } from '@/wells/queries';

import AdvancedModelToolbar from './AdvancedModelView/AdvancedModelToolbar';
import styles from './AdvancedModelView/advanced-model-view.module.scss';
import EconModelV2, { AdvancedEconModelProps, EconModelV2Ref } from './EconModelV2';
import { SidebarContainer } from './EconModelsList';

const ELT_IDS_DIVIDER = ';';

const getELTLineAgGridId = (eltRowId: string, eltLineId: string) => `${eltRowId}__${eltLineId}`;

const tryGetEmbeddedLookupTable = async (eltId: Inpt.ObjectId<'embedded-lookup-table'>) => {
	let embeddedLookupTable: Inpt.EmbeddedLookupTable | undefined;

	try {
		embeddedLookupTable = await getEmbeddedLookupTable(eltId);
	} catch {
		embeddedLookupTable = undefined;
	}

	return embeddedLookupTable;
};

function getLTCellValueForWell<T extends AdvancedTableRow>(
	lookupByKey: string,
	match: LookupRuleWithNestedRows<T>,
	nonRegularBehaviorHeader: [string, RuleWellHeaderMatchBehavior] | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wellData: Record<string, any>,
	isLookupRuleValueColumnNumerical: (rule: LookupRuleRow<T>, lookupByKey: string) => boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): any {
	const value = match.root[lookupByKey];

	if (nonRegularBehaviorHeader && isLookupRuleValueColumnNumerical(match.root, lookupByKey)) {
		const [header, behavior] = nonRegularBehaviorHeader;
		const wellHeaderValue = !isNil(wellData[header]) ? Number(wellData[header]) : undefined;

		if (!isNil(wellHeaderValue)) {
			switch (behavior) {
				case RuleWellHeaderMatchBehavior.ratio: {
					const valueParsedToNumber = !isNil(value) ? Number(value) : NaN;
					return Number(((valueParsedToNumber / match.root[header]) * wellHeaderValue).toFixed(2));
				}

				case RuleWellHeaderMatchBehavior.interpolation: {
					const flattened = [match.root, ...match.nested];

					// we should have at least 2 rows for the rule
					if (flattened.length > 1) {
						for (let i = 0; i < flattened.length - 1; ++i) {
							const lower = flattened[i];
							const upper = flattened[i + 1];

							// as we allow the interpolation header values in a different order, we are trying to find
							// the first range in which well header value is present
							if (
								(lower[header] <= wellHeaderValue && wellHeaderValue <= upper[header]) ||
								(lower[header] >= wellHeaderValue && wellHeaderValue >= upper[header])
							) {
								return Number(
									((wellHeaderValue - lower[header]) *
										(Number(upper[lookupByKey]) - Number(lower[lookupByKey]))) /
										(upper[header] - lower[header]) +
										Number(lower[lookupByKey])
								).toFixed(2);
							}
						}
					}
					break;
				}

				default:
					break;
			}
		}

		return LT_CELL_UNASSIGNED_STRING_VALUE;
	}

	return value;
}

interface AdvancedModelViewProps<T extends AdvancedTableRow> {
	project: Inpt.ObjectId<'project'>;
	assumptionKey: AssumptionKey;
	econModelProps: AdvancedEconModelProps;
	getColumnsDef: (enableELTColumn: boolean) => ColGroupDef[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getRowDataOnAdd: () => any;
	adjustRowData(withoutAdjustedELTRows: T[]): T[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getStateFromAssumption: (assumption: any) => T[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getAssumptionFromState: (rows: T[]) => any;
	onELTsQueryDataChanged: (data: FilterResult<ModuleListEmbeddedLookupTableItem> | undefined) => void;
	contextMenuItems: (string | MenuItemDef)[];
	handleGetContextMenuItems?: (node: RowNode) => (string | MenuItemDef)[];
	getShortcutsInfo: () => Block[];
	addRowLabel?: string;
	/** AddRowButtonDisabled expects a boolean value, it will render the add row button disabled if passed true. */
	addRowButtonDisabled?: boolean;
	organizeRows?: { label: string; onClick: (rowData: T[]) => T[] };
	invalidateModelTemplateQuery?: () => void;
	fetchingModelTemplate?: boolean;
	allowNestedRows?: boolean;
	isNestedRowOnPaste?: (rowData: T) => boolean;
	addTreeDataInfo: (rowData: T[]) => T[];
	/**
	 * OnRowDataChange expects a void function that accepts an array as argument, the function will receive the updated
	 * rows data as argument and will be executed every time the table's rows data are updated.
	 */
	onRowDataChange?: (rowData: T[]) => void;
	/** HideLookupRows hides lookup row button in the AdvancedModelToolbar. */
	hideLookupRows?: boolean;
	extraActions?: React.ReactNode;
	children?: React.ReactNode;
	advancedTableClassName?: string;
	isStateValid?: (state: T[]) => boolean;
}

export interface AdvancedModelViewRef<T extends AdvancedTableRow> {
	advancedTableRef: RefObject<AdvancedTableRef<T>>;
}

const _AdvancedModelView = <T extends AdvancedTableRow>(
	props: AdvancedModelViewProps<T>,
	ref: ForwardedRef<AdvancedModelViewRef<T>>
) => {
	const {
		addRowLabel = 'Row',
		addRowButtonDisabled = false,
		assumptionKey,
		project,
		getColumnsDef,
		getRowDataOnAdd,
		organizeRows,
		adjustRowData: _adjustRowData,
		onELTsQueryDataChanged,
		contextMenuItems,
		handleGetContextMenuItems,
		getShortcutsInfo,
		econModelProps,
		getStateFromAssumption,
		getAssumptionFromState,
		invalidateModelTemplateQuery,
		fetchingModelTemplate,
		allowNestedRows = false,
		isNestedRowOnPaste,
		addTreeDataInfo,
		onRowDataChange,
		hideLookupRows,
		extraActions,
		children,
		advancedTableClassName,
		isStateValid,
	} = props;

	const { onToggleV2, wellAssignment } = econModelProps;
	const wellId = wellAssignment?.well?._id;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [wellData, setWellData] = useState<Record<string, any> | undefined>(undefined);
	const [rowData, setRowData] = useState<T[]>([]);
	const [editing, setEditing] = useState(false);
	const [sidebarOpened, setSidebarOpened] = useState(true);
	const [{ canUndo, canRedo }, setUndoState] = useState({ canUndo: false, canRedo: false });
	const [usedELTs, setUsedELTs] = useState<Inpt.EmbeddedLookupTable[]>([]);
	const [eltsLookupByDict, setELTsLookupByDict] = useState<
		Record<Inpt.ObjectId<'embedded-lookup-table'>, EmbeddedLookupTableModel<T>>
	>({});
	const [selectedRowData, setSelectedRowData] = useState<T | undefined>(undefined);
	const [wellHeadersForLookupBy, setWellHeadersForLookupBy] = useState<string[]>([]);
	const [eltDetached, setELTDetached] = useState(false);
	const [openedELT, setOpenedELT] = useState<Inpt.EmbeddedLookupTable | undefined>(undefined);
	const [detachedELT, setDetachedELT] = useState<Inpt.EmbeddedLookupTable | undefined>(undefined);

	const econModelRef = useRef<EconModelV2Ref>(null);
	const advancedTableRef = useRef<AdvancedTableRef<T>>(null);
	const openedELTRef = useRef<EditEmbeddedLookupTableRef>(null);

	const { dividerRef, boxARef, wrapperRef } = useDraggingResize({});
	const [newEmbeddedLookupTableDialog, showNewEmbeddedLookupTableDialog] = useDialog(NewEmbeddedLookupTableDialog);

	const {
		refetch: refetchELTs,
		data: elts,
		isFetching: fetchingELTs,
	} = useEmbeddedLookupTablesQuery(
		useMemo(() => ({ projectId: project, getAll: true, assumptionKey }), [assumptionKey, project]),
		!!project
	);

	const modelHotkeysScope = useMemo(() => 'advanced-model-hotkeys-scope-' + uuidv4(), []);
	const setHotkeysScope = useSetHotkeyScope(false);

	const shortcutsInfo = getShortcutsInfo();

	const usedELTIdsString = useMemo<string>(() => {
		const eltIds = rowData
			.filter(({ isELTRow, eltId }) => isELTRow && eltId)
			.map(({ eltId }) => eltId)
			.sort();

		return eltIds.join(ELT_IDS_DIVIDER);
	}, [rowData]);

	const modelELTIds = useMemo(() => rowData.filter(({ isELTRow }) => isELTRow).map(({ eltId }) => eltId), [rowData]);

	const eltChipLabelValue = useMemo(
		() => rowData.find(({ isELTRow, eltId }) => isELTRow && eltId === selectedRowData?.eltId)?.eltName,
		[rowData, selectedRowData?.eltId]
	);

	const { wellHeadersTypes } = useWellHeaders({ enableProjectCustomHeaders: true });
	const wellHeadersValuesForLookupByQuery = useWellHeaderValuesQuery(wellId, wellHeadersForLookupBy, project);

	const { mutateAsync: createELT } = useCreateEmbeddedLookupTableMutation();
	const updateEmbeddedLookupTableMutation = useUpdateEmbeddedLookupTableMutation({
		onSuccess: (updated) => {
			setUsedELTs(usedELTs.filter(({ _id }) => _id !== updated._id)); // will be fetched in the useEffect to trigger all needed events
			confirmationAlert('Embedded Lookup Table Updated!');
		},
	});

	const {
		nestedLineFieldsAllowedForLookupBy,
		ruleValueValidationIsBasedOnAnotherValue,
		applyLineToRowTransformation,
		applyRuleValuesToLookupRuleRowValuesTransformation,
		isLookupRuleValueColumnNumerical,
		adjustELTLinesRowData,
		addValidationToTheRuleVirtualLines,
		isLookupRuleRowValueCellDisabled,
	} = useAssumptionModelAdvancedViewELTDependencies<T>(
		useMemo(() => ({ project, assumptionKey }), [project, assumptionKey])
	);

	const setState = useCallback(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		(...args) => advancedTableRef.current?.setRowData(...args),
		[]
	);
	const setUndoStates = useCallback((...args) => advancedTableRef.current?.undoActions?.setUndoStates(...args), []);

	const onAdvancedTableRowClicked = useCallback((data: T) => setSelectedRowData(data), []);

	const onCloseELT = useCallback(() => {
		setSelectedRowData(undefined);
	}, []);

	const handleAddRow = useCallback(() => {
		if (addRowButtonDisabled) return;
		advancedTableRef.current?.setRowData((currentRows) => {
			const eltIndex = currentRows.findIndex(({ isELTRow }) => isELTRow);
			const indexOfFirstELTRowIfExists = Math.max(eltIndex, 0);
			const sliceIndex = eltIndex >= 0 ? indexOfFirstELTRowIfExists : currentRows.length;

			return [
				...currentRows.slice(0, sliceIndex),
				{
					[ROW_ID_KEY]: uuidv4(),
					...getRowDataOnAdd(),
				},
				...currentRows.slice(sliceIndex),
			];
		});
	}, [addRowButtonDisabled, getRowDataOnAdd]);

	const adjustELTRows = useCallback(
		(state: T[]) => {
			let modelIncludesELTs = false;
			const withoutELTLines: T[] = [];

			state.forEach((row) => {
				if (!row.isFromELTDataLines) {
					if (row.isELTRow) {
						modelIncludesELTs = true;
					}

					withoutELTLines.push(row);
				}
			});

			if (modelIncludesELTs) {
				const rowsWithAppendedELTsLines: T[] = [];

				withoutELTLines.forEach((notELTLineRow) => {
					rowsWithAppendedELTsLines.push(notELTLineRow);

					if (notELTLineRow.eltId && eltsLookupByDict[notELTLineRow.eltId]) {
						const eltData = eltsLookupByDict[notELTLineRow.eltId];
						const nonRegularBehaviorHeader = Object.entries(
							eltData.configuration.selectedHeadersMatchBehavior
						).find(([, behavior]) => behavior !== RuleWellHeaderMatchBehavior.regular);

						eltData.lines.forEach((eltLine) => {
							const eltLineWithLookupByValues = {
								...eltLine,
								isFromELTDataLines: true,
								eltId: notELTLineRow.eltId,
								// override it here to fix the issues for the case if user chooses the same ELT more
								// than once. ROW_ID_KEY keeps being static in the end, so doesn't produce side-effects
								[ROW_ID_KEY]: getELTLineAgGridId(notELTLineRow[ROW_ID_KEY], eltLine[ROW_ID_KEY]),
							};

							if (Object.keys(eltLineWithLookupByValues[LOOKUP_BY_FIELDS_KEY] ?? {}).length > 0) {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
								const fillLookupByCellData = (getValue: (lookupByKey: string) => any) => {
									Object.entries(eltLineWithLookupByValues[LOOKUP_BY_FIELDS_KEY] ?? {}).forEach(
										([key, lookupByKey]) => {
											eltLineWithLookupByValues[key] = getValue(lookupByKey);
											eltLineWithLookupByValues[getSpecialCellStylesField(key)] = {
												color: getHexColorForString(key),
											};
										}
									);
								};

								if (wellId && wellData) {
									const wellHeaderValues = pick(wellData, eltData.configuration.selectedHeaders);

									const match = findRuleForWell(
										eltData.configuration.selectedHeaders,
										eltData.rules,
										wellHeadersTypes,
										wellHeaderValues,
										eltData.configuration.selectedHeadersMatchBehavior
									);

									if (match) {
										fillLookupByCellData((lookupByKey) =>
											getLTCellValueForWell(
												lookupByKey,
												match,
												nonRegularBehaviorHeader,
												wellData,
												isLookupRuleValueColumnNumerical
											)
										);
									} else {
										fillLookupByCellData(() => LT_CELL_UNASSIGNED_STRING_VALUE);
									}
								} else {
									fillLookupByCellData(() => LT_CELL_STRING_VALUE);
								}
							}

							rowsWithAppendedELTsLines.push(eltLineWithLookupByValues);
						});
					}
				});

				return rowsWithAppendedELTsLines;
			}

			return withoutELTLines;
		},
		[eltsLookupByDict, wellId, wellData, wellHeadersTypes, isLookupRuleValueColumnNumerical]
	);

	const adjustRowData = useCallback(
		(rows: T[]) => addTreeDataInfo(adjustELTRows(_adjustRowData(rows.filter((row) => !!row)))),
		[_adjustRowData, adjustELTRows, addTreeDataInfo]
	);

	const onCreateELT = useCallback(
		async (rowId: string) => {
			assert(project, 'Expected project to be in the context');
			const result = await showNewEmbeddedLookupTableDialog({ chosenType: assumptionKey });

			if (!result) {
				return;
			}

			await createELT(
				{
					...result,
					project,
					rules: [],
					lines: [],
				},
				{
					onSuccess: (created) => {
						confirmationAlert('Embedded Lookup Table Created');
						refetchELTs();
						advancedTableRef.current?.setRowData((rows) => {
							const rowsShallowCopy = [...rows];
							const eltCreatedFromRow = rowsShallowCopy.find((r) => r[ROW_ID_KEY] === rowId);

							if (eltCreatedFromRow) {
								eltCreatedFromRow.eltName = created.name;
								eltCreatedFromRow.eltId = created._id;
							}

							return rowsShallowCopy;
						});
					},
				}
			);
		},
		[createELT, refetchELTs, project, showNewEmbeddedLookupTableDialog, assumptionKey]
	);

	const onELTSaveAs = useCallback(
		(createdFromELTId: Inpt.ObjectId<'embedded-lookup-table'>, created: Inpt.EmbeddedLookupTable) => {
			refetchELTs();
			advancedTableRef.current?.setRowData((rows) => {
				const rowsShallowCopy = [...rows];
				const eltSavedAsFromRow = rowsShallowCopy.find(
					({ isELTRow, eltId }) => isELTRow && eltId === createdFromELTId
				);

				if (eltSavedAsFromRow) {
					eltSavedAsFromRow.eltName = created.name;
					eltSavedAsFromRow.eltId = created._id;
				}

				return rowsShallowCopy;
			});
		},
		[refetchELTs]
	);

	const onBeforeChangeOpenedELTViewMode = useCallback(() => {
		const openedELTPartialState = openedELTRef.current?.getCurrentPartialState();

		if (openedELTPartialState) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			setDetachedELT({ ...openedELT, ...openedELTPartialState } as any as Inpt.EmbeddedLookupTable);
		}
	}, [openedELT]);

	const onDetachELT = useCallback(() => {
		onBeforeChangeOpenedELTViewMode();
		setELTDetached(true);
	}, [onBeforeChangeOpenedELTViewMode]);

	useEffect(() => {
		onELTsQueryDataChanged(elts);
	}, [onELTsQueryDataChanged, elts]);

	useEffect(() => {
		if (elts && elts.items?.length > 0) {
			//HACK: retrigger when ELT data changes
			advancedTableRef.current?.setRowData((p) => [...p]);
		}
	}, [elts, eltsLookupByDict, adjustRowData]);

	useEffect(() => {
		if (wellHeadersValuesForLookupByQuery.data && wellHeadersTypes) {
			setWellData(
				Object.entries(wellHeadersValuesForLookupByQuery.data).reduce((acc, [key, value]) => {
					acc[key] = parseConditionValue(key, value, wellHeadersTypes);
					return acc;
				}, {})
			);
		}
	}, [wellHeadersValuesForLookupByQuery.data, wellHeadersTypes]);

	useEffect(() => {
		if (usedELTIdsString) {
			const savedELTIds = usedELTs.map(({ _id }) => _id);
			const eltIdsNotInStateYet = usedELTIdsString
				.split(ELT_IDS_DIVIDER)
				.filter((eltId) => eltId && !savedELTIds.includes(eltId as Inpt.ObjectId<'embedded-lookup-table'>));

			if (eltIdsNotInStateYet.length > 0) {
				(async () => {
					const addedELTs = (
						await Promise.all(
							eltIdsNotInStateYet.map((eltId) =>
								tryGetEmbeddedLookupTable(eltId as Inpt.ObjectId<'embedded-lookup-table'>)
							)
						)
					)
						.filter((elt) => !!elt)
						.map((elt) => elt as Inpt.EmbeddedLookupTable);

					if (addedELTs.length > 0) {
						const newUsedELTs = [...usedELTs, ...addedELTs];

						const headersForLookupBy = uniq(
							newUsedELTs.flatMap(({ configuration }) => {
								if (configuration.selectedHeaders.length > 0) {
									return configuration.selectedHeaders;
								}

								return [];
							})
						);

						setUsedELTs(newUsedELTs);
						setWellHeadersForLookupBy(headersForLookupBy);
						setELTsLookupByDict(
							produce((draft) => {
								addedELTs.forEach((elt) => {
									draft[elt._id] = castDraft(
										getEmbeddedLookupTableModel<T>(
											elt,
											nestedLineFieldsAllowedForLookupBy,
											wellHeadersTypes,
											applyLineToRowTransformation,
											applyRuleValuesToLookupRuleRowValuesTransformation
										)
									);

									const adjustedLines = adjustELTLinesRowData(draft[elt._id].lines as T[], false);
									draft[elt._id].lines = castDraft(adjustedLines);

									if (wellId && ruleValueValidationIsBasedOnAnotherValue) {
										let parentRuleRow: LookupRuleRow<T> | undefined = undefined;
										const shouldUseParentRowColumnValue = (
											nestedRow: LookupRuleRow<T>,
											lookupByKey: string
										) =>
											nestedRow[NESTED_ROW_BEHAVIOR_KEY] ===
												RuleWellHeaderMatchBehavior.interpolation &&
											!isLookupRuleValueColumnNumerical(nestedRow, lookupByKey);

										draft[elt._id].rules.forEach((ruleRow) => {
											if (!ruleRow?.[NESTED_ROW_BEHAVIOR_KEY]) {
												parentRuleRow = ruleRow as LookupRuleRow<T>;
											}

											ruleRow[VIRTUAL_LINES_KEY] = castDraft(
												addValidationToTheRuleVirtualLines(
													getVirtualLinesForLookupRuleRow(
														adjustedLines,
														ruleRow as LookupRuleRow<T>,
														parentRuleRow,
														shouldUseParentRowColumnValue,
														isLookupRuleRowValueCellDisabled
													)
												)
											);
										});
									}
								});
							})
						);
					}
				})();
			}
		}
	}, [
		wellId,
		wellHeadersTypes,
		usedELTs,
		usedELTIdsString,
		nestedLineFieldsAllowedForLookupBy,
		ruleValueValidationIsBasedOnAnotherValue,
		applyLineToRowTransformation,
		applyRuleValuesToLookupRuleRowValuesTransformation,
		adjustELTLinesRowData,
		addValidationToTheRuleVirtualLines,
		isLookupRuleValueColumnNumerical,
		isLookupRuleRowValueCellDisabled,
	]);

	useEffect(() => {
		if (!selectedRowData?.eltId || !modelELTIds.includes(selectedRowData.eltId)) {
			setOpenedELT(undefined);
		} else {
			const toSetOpened = usedELTs.find(({ _id }) => _id === selectedRowData.eltId);

			//we should change only in case we found it in usedELTs, because we have situation when the ELT is in the
			//model but is not in the usedELTs (e.g. saving changes for the ELT)
			if (toSetOpened) {
				setOpenedELT(toSetOpened);
			}
		}
	}, [modelELTIds, selectedRowData?.eltId, usedELTs]);

	useEffect(() => {
		setDetachedELT(undefined);
	}, [openedELT]);

	useImperativeHandle(ref, () => ({ advancedTableRef }));

	const editorActions = useMemo(
		() =>
			({
				eltName: [
					{
						label: 'Create Lookup Table',
						onClick: onCreateELT,
					},
				],
			} as AdvancedTableCellEditorActions),
		[onCreateELT]
	);

	const handleAdvancedTableDataChange = useCallback(
		(_rowData: T[]) => {
			setRowData(_rowData);
			onRowDataChange?.(_rowData);
		},
		[setRowData, onRowDataChange]
	);

	const getWrapperHeight = () => {
		const eltIsRendered = openedELT && !eltDetached;
		if (eltIsRendered && children) return '225%';
		if (eltIsRendered) return '175%';
		if (children) return '150%';
		return '100%';
	};

	return (
		<EconModelV2
			ref={econModelRef}
			css={`
				${SidebarContainer} {
					transition: flex-grow 200ms;
					min-width: 0;
					flex: ${sidebarOpened ? 1 : 0} 1 0;
					${!sidebarOpened && 'padding: 0;'}
				}
			`}
			{...econModelProps}
			assumptionName={ASSUMPTION_LABELS[assumptionKey]}
			assumptionKey={assumptionKey}
			defaultValue={DEFAULT_ADVANCED_MODEL_VALUE}
			getStateFromAssumption={getStateFromAssumption}
			getAssumptionFromState={getAssumptionFromState}
			stateIsValid={isStateValid ?? advancedModelStateIsValid}
			stateIsEqual={advancedModelStateIsEqual}
			disableSave={editing}
			invalidateModelTemplateQuery={invalidateModelTemplateQuery}
			fetchingModelTemplate={fetchingModelTemplate}
			invalidateELTsQuery={refetchELTs}
			fetchingELTs={fetchingELTs}
			state={rowData}
			setState={setState}
			setUndoStates={setUndoStates}
			hotkeysScope={modelHotkeysScope}
			extraActions={extraActions}
		>
			{newEmbeddedLookupTableDialog}
			<div
				ref={wrapperRef}
				className={styles['wrapper']}
				css={`
					flex: 1;
					height: ${getWrapperHeight()};
				`}
			>
				<div
					ref={boxARef}
					className={styles['box']}
					onClick={() => {
						setHotkeysScope(modelHotkeysScope);
						return false;
					}}
					style={{ flex: children ? '0.4 1 auto' : '1 1 auto' }}
				>
					<Stack
						css={`
							flex: 1;
							margin-bottom: 8px;
						`}
						spacing={1}
					>
						<AdvancedModelToolbar
							addRowLabel={addRowLabel}
							addRowButtonDisabled={addRowButtonDisabled}
							assumptionKey={assumptionKey}
							econModelRef={econModelRef}
							tableRef={advancedTableRef}
							canUndo={canUndo}
							canRedo={canRedo}
							sidebarOpened={sidebarOpened}
							setSidebarOpened={setSidebarOpened}
							onToggleV2={onToggleV2}
							handleAddRow={handleAddRow}
							organizeRows={organizeRows}
							shortcutsInfo={shortcutsInfo}
							hotkeysScope={modelHotkeysScope}
							hideLookupRows={!!hideLookupRows}
						/>
						<AdvancedTable<T>
							ref={advancedTableRef}
							css='flex: 1'
							className={advancedTableClassName}
							adjustRowData={adjustRowData}
							onEditingChange={setEditing}
							getColumnsDef={getColumnsDef}
							onUndoChange={setUndoState}
							onDataChange={handleAdvancedTableDataChange}
							contextMenuItems={contextMenuItems}
							handleGetContextMenuItems={handleGetContextMenuItems}
							editorActions={editorActions}
							onRowClick={onAdvancedTableRowClicked}
							allowNestedRows={allowNestedRows}
							isNestedRowOnPaste={isNestedRowOnPaste}
							hotkeysScope={modelHotkeysScope}
						/>
					</Stack>
				</div>
				{!eltDetached && (
					<div ref={dividerRef} className={styles['handler']}>
						<Divider
							css={`
								padding: 1px 0 1px 0;
							`}
						/>
					</div>
				)}
				{children &&
					Children.map(children, (child) => {
						const props: Partial<T> = {};
						props['econModelRef'] = econModelRef;
						if (isValidElement(child)) {
							return cloneElement(child, props);
						}
						return child;
					})}
				{openedELT && (
					<WithWindow
						newWindow={eltDetached}
						name='Embedded Lookup Table'
						title='Embedded Lookup Table'
						handleOnClose={() => setELTDetached(false)}
						handleOnOpen={(popupWindow) => {
							popupWindow.addEventListener('beforeunload', onBeforeChangeOpenedELTViewMode);
						}}
					>
						<div className={styles['box']} css={eltDetached ? 'height: 100%;' : undefined}>
							{!eltDetached ? (
								<Chip
									css={`
										background-color: ${stringToColor(openedELT._id)};
										max-width: fit-content;
										margin-bottom: 1rem;
										overflow: hidden;
									`}
									label={eltChipLabelValue}
								/>
							) : null}
							<EmbeddedLookupTableEditView
								ref={openedELTRef}
								detachedELTData={detachedELT}
								lookupTableData={openedELT}
								updateEmbeddedLookupTableMutation={updateEmbeddedLookupTableMutation}
								onClose={onCloseELT}
								onSaveAs={onELTSaveAs}
								lookupByWellHeaders={wellData}
								detached={eltDetached}
								onDetach={onDetachELT}
							/>
						</div>
					</WithWindow>
				)}
			</div>
		</EconModelV2>
	);
};

const AdvancedModelView = forwardRef(_AdvancedModelView) as <T extends AdvancedTableRow>(
	props: AdvancedModelViewProps<T> & { ref: ForwardedRef<AdvancedModelViewRef<T>> }
) => ReactElement;

export default AdvancedModelView;
