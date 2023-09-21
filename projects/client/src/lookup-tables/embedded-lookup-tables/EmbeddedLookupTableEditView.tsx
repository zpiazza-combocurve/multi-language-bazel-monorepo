import { ColDef, ColGroupDef } from 'ag-grid-community';
import produce from 'immer';
import {
	RefAttributes,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import { FreeSoloCellEditor, GenericCellEditor } from '@/components/AdvancedTable/ag-grid-shared';
import { LOOKUP_BY_FIELDS_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { getWithNestedRows } from '@/components/AdvancedTable/shared';
import { TemplateSelect, TemplateYupDescription } from '@/components/AdvancedTable/types';
import { useDraggingResize } from '@/components/hooks/useDraggingResize';
import { useSetHotkeyScope } from '@/components/hooks/useHotkey';
import { Divider, Stack, Typography } from '@/components/v2';
import AdvancedModelToolbar from '@/cost-model/detail-components/AdvancedModelView/AdvancedModelToolbar';
import { useDoggo } from '@/helpers/alerts';
import { useWellHeaders } from '@/helpers/headers';
import { useUnsavedWork } from '@/helpers/unsaved-work';
import { assert } from '@/helpers/utilities';
import { SelectFieldType } from '@/inpt-shared/constants';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { HeaderOptions, useCurrentProject } from '@/projects/api';
import { useCurrentScenario } from '@/scenarios/api';

import LookupRules from './LookupRules';
import { HeaderTooltipComponent } from './LookupRules/HeaderTooltipComponent';
import { LookupRuleValueColumnHeaderComponent } from './LookupRules/LookupRuleValueColumnHeaderComponent';
import { checkRuleValueCellsAreValid } from './LookupRules/helpers';
import { EmbeddedLookupLinesTable } from './components/EmbeddedLookupLinesTable';
import { EmbeddedLookupTableContext, EmbeddedLookupTableProvider } from './context/EmbeddedLookupTableContext';
import styles from './elt.module.scss';
import { useHeadersCombinationsQuery } from './queries';
import {
	checkIfAllRowsShouldBeInterpolatedOrRatioed,
	defaultColDef,
	getEmbeddedLookupTableModel,
	getFieldFromLookupByKey,
	getLinesAndRulesFromRows,
	getVirtualLinesForLookupRuleRow,
	getWellHeaderColGroupDef,
} from './shared';
import {
	EditEmbeddedLookupTableProps,
	EditEmbeddedLookupTableRef,
	LookupRuleRow,
	NESTED_ROW_BEHAVIOR_KEY,
	VIRTUAL_LINES_KEY,
} from './types';
import useAssumptionModelELTDependencies from './useAssumptionModelELTDependencies';

const ELT_UNSAVED_WORK_SCOPES = [Symbol('elt-scope')];

const _EmbeddedLookupTableEditView = (
	{
		lookupTableData: _lookupTableData,
		updateEmbeddedLookupTableMutation,
		onClose,
		lookupByWellHeaders,
		onDetach,
		detached,
		detachedELTData,
		onSaveAs,
	}: EditEmbeddedLookupTableProps,
	ref
) => {
	const lookupTableData = detachedELTData ?? _lookupTableData;

	const { project } = useCurrentProject();
	const { scenario } = useCurrentScenario();

	assert(project);

	const [validatingLookupRulesValues, setValidatingLookupRulesValues] = useState(false);

	const {
		linesRows,
		setValuesColDef,
		linesRef,
		headersColDef,
		setHeadersColDef,
		setRulesRows,
		chosenHeaders,
		setChosenHeaders,
		selectedLinesWithLTs,
		rulesRef,
		canUndo,
		canRedo,
		editing,
		rulesAreValid,
		linesAreValid,
		setInitialLinesRows,
		setInitialRulesRows,
		setInitialChosenHeaders,
		setInitialHeadersMatchBehavior,
		setHeadersMatchBehavior,
		headersMatchBehavior,
		hasBeenEdited,
		waitingOnSaveAsComplete,
		setWaitingOnSaveAsComplete,
		setRulesValuesWereValidated,
		ruleValueCellsAreValid,
		rulesValuesWereValidated,
	} = useContext(EmbeddedLookupTableContext);

	const {
		addRowLabel,
		handleAddRow,
		toolbarContext: _toolbarContext,
		enableCollapsibleRows,
		shortcutsInfo,
		ltColumnsOrdered,
		getTemplateColumnLabel,
		organizeRows,
		rowSchema,
		nestedLineFieldsAllowedToHaveValue,
		nestedLineFieldsAllowedForLookupBy,
		getLookupByValueHeaderExtraText,
		getLookupByOnColumnError,
		getColumnsDef,
		adjustELTLinesRowData,
		addValidationToTheRuleVirtualLines,
		applyLineToRowTransformation,
		applyRowToLineTransformation,
		applyRuleValuesToLookupRuleRowValuesTransformation,
		applyLookupRuleRowValueToRuleValueTransformation,
		lookupByDependencies,
		getRemoveLookupByFromColumnError,
		isLookupRuleRowValueCellDisabled,
		contextMenuItems,
		allowNestedRows,
		isLookupRuleValueColumnNumerical,
		isNestedRowOnPaste,
	} = useAssumptionModelELTDependencies(lookupTableData);

	useUnsavedWork(hasBeenEdited && !waitingOnSaveAsComplete, ELT_UNSAVED_WORK_SCOPES);

	const eltLinesHotkeysScope = useMemo(() => 'elt-lines-hotkeys-scope-' + uuidv4(), []);
	const setHotkeysScope = useSetHotkeyScope(false);

	const allRowsShouldInterpolateOrBeRatioed = checkIfAllRowsShouldBeInterpolatedOrRatioed(headersMatchBehavior);

	const combinationsHeaders = useMemo(
		() =>
			Object.entries(headersMatchBehavior)
				.filter(
					([, behavior]) =>
						allRowsShouldInterpolateOrBeRatioed || behavior === RuleWellHeaderMatchBehavior.regular
				)
				.map(([header]) => header),
		[allRowsShouldInterpolateOrBeRatioed, headersMatchBehavior]
	);

	const combinationsHeadersOptions: HeaderOptions = useMemo(
		() => ({
			headers: combinationsHeaders,
			caseInsensitiveMatching: lookupTableData.configuration.caseInsensitiveMatching,
		}),
		[combinationsHeaders, lookupTableData.configuration.caseInsensitiveMatching]
	);

	const { data: combinationsData } = useHeadersCombinationsQuery(project?._id, combinationsHeadersOptions, true);
	const { wellHeadersLabels, wellHeadersTypes, fetchingPCHsData } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});

	// Initialization of the elt. Should fire in the next cases:
	// 1. opening the elt edit view
	// 2. after updating the elt
	// 3. on changing the elt to look at when clicking on the elt row of the advanced model
	// 4. detaching elt from/attaching elt to the advanced model view
	useEffect(() => {
		if (lookupTableData && linesRef.current && wellHeadersTypes && !fetchingPCHsData) {
			const model = getEmbeddedLookupTableModel(
				lookupTableData,
				nestedLineFieldsAllowedForLookupBy,
				wellHeadersTypes,
				applyLineToRowTransformation,
				applyRuleValuesToLookupRuleRowValuesTransformation
			);

			linesRef.current?.setRowData(model.lines); //this will also call the setLinesRows

			setInitialLinesRows(model.lines);

			setChosenHeaders(model.configuration.selectedHeaders);
			setInitialChosenHeaders(model.configuration.selectedHeaders);

			setHeadersMatchBehavior(model.configuration.selectedHeadersMatchBehavior);
			setInitialHeadersMatchBehavior(model.configuration.selectedHeadersMatchBehavior);

			setRulesRows(model.rules);
			setInitialRulesRows(model.rules);

			setWaitingOnSaveAsComplete(false);
		}
	}, [
		applyLineToRowTransformation,
		applyRuleValuesToLookupRuleRowValuesTransformation,
		linesRef,
		lookupTableData,
		nestedLineFieldsAllowedForLookupBy,
		setChosenHeaders,
		setHeadersMatchBehavior,
		setInitialChosenHeaders,
		setInitialHeadersMatchBehavior,
		setInitialLinesRows,
		setInitialRulesRows,
		setRulesRows,
		setWaitingOnSaveAsComplete,
		wellHeadersTypes,
		fetchingPCHsData,
	]);

	// Updating of the column definitions of the lookup by cells chosen on the lines table
	// Fires on any change done in the lines table, but ideally should fire only in the cases
	// when lookup by cell was added/removed or lines with lookup by cells were deleted
	useEffect(() => {
		const colGroupDefs: ColGroupDef[] = [];
		const selectedLinesWithLTsIds = selectedLinesWithLTs.map((line) => line[ROW_ID_KEY]);
		const withNested = getWithNestedRows(linesRows);

		withNested.forEach((row, rowIndex) => {
			if (!selectedLinesWithLTsIds.length || selectedLinesWithLTsIds.includes(row.root[ROW_ID_KEY])) {
				const lookupByFieldColumns: Record<string, string[]> = {};

				const colGroupDefChildren = [row.root, ...row.nested].flatMap((line, lineIndex) =>
					Object.entries(line[LOOKUP_BY_FIELDS_KEY] ?? {}).map(([colId, lookupByKey]) => {
						lookupByFieldColumns[colId] ??= [];
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						const metadata = rowSchema!.describe({ value: line })?.['fields']?.[
							colId
						] as TemplateYupDescription;
						const fieldType = (metadata?.meta?.template as TemplateSelect)?.fieldType ?? metadata.type;

						const headerIndex =
							row.nested.length && row.nested[0][colId] !== undefined
								? lineIndex
									? lineIndex + 1
									: 1
								: '';
						const headerName = `${getTemplateColumnLabel(colId)} ${headerIndex}` ?? colId;

						lookupByFieldColumns[colId].push(headerName);

						return {
							...defaultColDef,
							field: lookupByKey,
							headerName,
							type: fieldType,
							headerComponent: LookupRuleValueColumnHeaderComponent,
							cellEditor: Object.values(SelectFieldType).find((type) => type === fieldType)
								? FreeSoloCellEditor
								: GenericCellEditor,
							cellEditorParams: {
								getOptions: (lookupByKey: string, rule: LookupRuleRow): string[] => {
									const field = getFieldFromLookupByKey(lookupByKey);

									const virtualLine = getVirtualLinesForLookupRuleRow(linesRows, rule).find(
										(line) => {
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
											return line[LOOKUP_BY_FIELDS_KEY]?.[field!] === lookupByKey;
										}
									);

									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									const metadata = rowSchema!.describe({ value: virtualLine })?.['fields']?.[
										colId
									] as TemplateYupDescription;

									return metadata?.oneOf ?? [];
								},
							},
						} as ColDef;
					})
				);

				const columnsOrder = Object.keys(lookupByFieldColumns)
					.sort((a, b) => ltColumnsOrdered.indexOf(a) - ltColumnsOrdered.indexOf(b))
					.reduce((acc, field) => {
						acc.push(...lookupByFieldColumns[field]);
						return acc;
					}, [] as string[]);

				const assignment: ColGroupDef = {
					headerName: `Line ${rowIndex + 1} ${getLookupByValueHeaderExtraText(row.root)}`,
					children: colGroupDefChildren.sort((a, b) => {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						return columnsOrder.indexOf(a.headerName!) - columnsOrder.indexOf(b.headerName!);
					}),
				};

				colGroupDefs.push(assignment);
			}
		});

		setValuesColDef([{ headerName: 'Values', children: colGroupDefs }]);
	}, [
		getLookupByValueHeaderExtraText,
		getTemplateColumnLabel,
		setValuesColDef,
		linesRows,
		ltColumnsOrdered,
		rowSchema,
		selectedLinesWithLTs,
	]);

	// Updating of the column definitions of well headers from which conditions of the rules are created
	useEffect(() => {
		const headers: ColGroupDef[] = [
			{
				headerName: 'Headers',
				headerGroupComponent: HeaderTooltipComponent,
				children: chosenHeaders.map((key) => {
					const options = combinationsData?.options?.[key] ?? [];

					return getWellHeaderColGroupDef(
						key,
						wellHeadersLabels[key] ?? key,
						wellHeadersTypes[key]?.type,
						headersMatchBehavior[key],
						options
					);
				}),
			},
		];

		setHeadersColDef(headers);
	}, [
		chosenHeaders,
		headersMatchBehavior,
		combinationsData?.options,
		setHeadersColDef,
		wellHeadersLabels,
		wellHeadersTypes,
	]);

	const getCurrentRulesAndLines = useCallback(() => {
		const linesRowData = linesRef?.current?.rowData ?? [];
		const rulesRowData = rulesRef.current?.getCurrentRows() ?? [];
		const wellHeaderAgGridColIds: string[] = [];

		const addFieldsFromDefinition = (colDef: ColGroupDef | ColDef) => {
			const asGroup = colDef as ColGroupDef;

			if (asGroup?.children?.length > 0) {
				asGroup.children.forEach((child) => {
					addFieldsFromDefinition(child);
				});

				return;
			}

			const asColDef = colDef as ColDef;

			if (asColDef?.field) {
				wellHeaderAgGridColIds.push(asColDef.field);
			}
		};

		headersColDef.forEach((colDef) => addFieldsFromDefinition(colDef));

		return getLinesAndRulesFromRows(
			linesRowData,
			rulesRowData,
			wellHeaderAgGridColIds,
			headersMatchBehavior,
			nestedLineFieldsAllowedToHaveValue,
			nestedLineFieldsAllowedForLookupBy,
			isLookupRuleValueColumnNumerical,
			applyRowToLineTransformation,
			applyLookupRuleRowValueToRuleValueTransformation
		);
	}, [
		applyLookupRuleRowValueToRuleValueTransformation,
		applyRowToLineTransformation,
		headersColDef,
		linesRef,
		nestedLineFieldsAllowedToHaveValue,
		nestedLineFieldsAllowedForLookupBy,
		rulesRef,
		headersMatchBehavior,
		isLookupRuleValueColumnNumerical,
	]);

	const getDataToSave = useCallback(
		() => ({
			name: lookupTableData.name,
			...getCurrentRulesAndLines(),
			configuration: {
				...lookupTableData.configuration,
				selectedHeaders: chosenHeaders,
				selectedHeadersMatchBehavior: headersMatchBehavior,
			},
		}),
		[
			chosenHeaders,
			getCurrentRulesAndLines,
			headersMatchBehavior,
			lookupTableData.configuration,
			lookupTableData.name,
		]
	);

	const handleClear = useCallback(() => {
		linesRef.current?.setRowData([]);
	}, [linesRef]);

	const onValidateLookupRulesValues = useCallback(
		(): Promise<boolean> =>
			new Promise((resolve) => {
				if (rulesValuesWereValidated && ruleValueCellsAreValid) {
					resolve(true);
					return;
				}

				setValidatingLookupRulesValues(true);

				setTimeout(() => {
					setRulesRows(
						produce((draft) => {
							let parentRuleRow: LookupRuleRow | undefined = undefined;
							const shouldUseParentRowColumnValue = (nestedRow: LookupRuleRow, lookupByKey: string) =>
								nestedRow[NESTED_ROW_BEHAVIOR_KEY] === RuleWellHeaderMatchBehavior.interpolation &&
								!isLookupRuleValueColumnNumerical(nestedRow, lookupByKey);

							draft.forEach((ruleRow) => {
								if (!ruleRow?.[NESTED_ROW_BEHAVIOR_KEY]) {
									parentRuleRow = ruleRow;
								}

								ruleRow[VIRTUAL_LINES_KEY] = addValidationToTheRuleVirtualLines(
									getVirtualLinesForLookupRuleRow(
										linesRows,
										ruleRow,
										parentRuleRow,
										shouldUseParentRowColumnValue,
										isLookupRuleRowValueCellDisabled
									)
								);
							});

							resolve(checkRuleValueCellsAreValid(draft));
						})
					);

					setValidatingLookupRulesValues(false);
					setRulesValuesWereValidated(true);
				}, 100);
			}),
		[
			addValidationToTheRuleVirtualLines,
			isLookupRuleValueColumnNumerical,
			linesRows,
			setRulesRows,
			setRulesValuesWereValidated,
			rulesValuesWereValidated,
			ruleValueCellsAreValid,
			isLookupRuleRowValueCellDisabled,
		]
	);

	const toolbarContext = useMemo(
		() => ({
			..._toolbarContext,
			onSaveAs,
			getCurrentRulesAndLines,
			getDataToSave,
			updateEmbeddedLookupTableMutation,
			editing,
			rulesAreValid,
			linesAreValid,
			detached,
			onDetach,
			onClose,
			onValidateLookupRulesValues,
		}),
		[
			_toolbarContext,
			detached,
			editing,
			getCurrentRulesAndLines,
			getDataToSave,
			linesAreValid,
			onClose,
			onDetach,
			onSaveAs,
			rulesAreValid,
			updateEmbeddedLookupTableMutation,
			onValidateLookupRulesValues,
		]
	);

	const { dividerRef, boxARef, wrapperRef } = useDraggingResize({});

	useImperativeHandle(ref, () => ({
		getCurrentPartialState: getDataToSave,
	}));

	const updatingELT = updateEmbeddedLookupTableMutation.isLoading;

	useDoggo(validatingLookupRulesValues, 'Validating Lookup Rules Values...');
	useDoggo(updatingELT, 'Saving...');

	const detachedName = detached
		? `${project?.name ? project.name + ' - ' : ''}${scenario?.name ? scenario.name + ' - ' : ''}${
				lookupTableData.name
		  }`
		: null;

	return (
		<div
			css={`
				padding: ${onClose && !detached ? 0 : '12px'};
				height: 100%;
				width: 100%;
			`}
		>
			<Stack ref={wrapperRef} css='height: 100%' spacing={1} className={styles['wrapper']}>
				{detachedName && <Typography align='center'>{detachedName}</Typography>}
				<div
					css={`
						display: flex;
						flex-direction: column;
						margin-bottom: ${detached ? '0.5rem' : 0};
						gap: 0.5rem;
					`}
					ref={boxARef}
					className={styles['box']}
					onClick={() => {
						setHotkeysScope(eltLinesHotkeysScope);
						return false;
					}}
				>
					<AdvancedModelToolbar
						assumptionKey={lookupTableData.assumptionKey}
						addRowLabel={addRowLabel}
						tableRef={linesRef}
						canUndo={canUndo}
						canRedo={canRedo}
						handleAddRow={handleAddRow}
						organizeRows={organizeRows}
						enableCollapsibleRows={enableCollapsibleRows}
						shortcutsInfo={shortcutsInfo}
						eltModeContext={toolbarContext}
						onClearData={handleClear}
						hotkeysScope={eltLinesHotkeysScope}
					/>
					<EmbeddedLookupLinesTable
						getLookupByOnColumnError={getLookupByOnColumnError}
						getRemoveLookupByFromColumnError={getRemoveLookupByFromColumnError}
						nestedLineFieldsAllowedForLookupBy={nestedLineFieldsAllowedForLookupBy}
						getColumnsDef={getColumnsDef}
						adjustRowData={adjustELTLinesRowData}
						lookupByDependencies={lookupByDependencies}
						contextMenuItems={contextMenuItems}
						allowNestedRows={allowNestedRows}
						isNestedRowOnPaste={isNestedRowOnPaste}
						hotkeysScope={eltLinesHotkeysScope}
					/>
				</div>
				{!detached && (
					<div ref={dividerRef} className={styles['handler']}>
						<Divider
							css={`
								padding: 1px 0 1px 0;
							`}
						/>
					</div>
				)}
				<LookupRules
					ref={rulesRef}
					className={styles['box']}
					updating={updatingELT}
					headersCombinations={combinationsData}
					lookupByWellHeaders={lookupByWellHeaders}
					isLookupRuleRowValueCellDisabled={isLookupRuleRowValueCellDisabled}
					isLookupRuleValueColumnNumerical={isLookupRuleValueColumnNumerical}
					wellHeadersTypes={wellHeadersTypes}
					wellHeadersLabels={wellHeadersLabels}
					onValidateLookupRulesValues={onValidateLookupRulesValues}
				/>
			</Stack>
		</div>
	);
};

const EmbeddedLookupTableWithRef = forwardRef<EditEmbeddedLookupTableRef, EditEmbeddedLookupTableProps>(
	_EmbeddedLookupTableEditView
);

const EmbeddedLookupTableEditView = (
	props: EditEmbeddedLookupTableProps & RefAttributes<EditEmbeddedLookupTableRef>
) => (
	<EmbeddedLookupTableProvider>
		<EmbeddedLookupTableWithRef {...props} />
	</EmbeddedLookupTableProvider>
);

export default EmbeddedLookupTableEditView;
