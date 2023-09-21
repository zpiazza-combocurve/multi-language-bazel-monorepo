import { RowDataChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { memo, useContext, useRef } from 'react';

import {
	AgGridProps,
	CHECKBOX_COLUMN_DEF,
	Editors,
	forceFocusOnTheTable,
	getAgGridValueHandler,
} from '@/components/AgGrid';
import { useHotkey, useUndo } from '@/components/hooks';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { withDialog } from '@/helpers/dialog';
import {
	ACTIVITY_STEP_NAME_LABELS,
	ACTIVITY_STEP_NAME_OPTIONS,
	ActivityStep,
	PAD_OPERATION_LABELS,
	PAD_OPERATION_OPTIONS,
	Resource,
} from '@/inpt-shared/scheduling/shared';
import { useLookupTables } from '@/lookup-tables/scheduling-lookup-table/api';

import { ChooseLookupDialog } from '../../LookupTable/ChooseLookupDialog';
import { ScheduleLookupTableContext } from '../../LookupTable/ScheduleLookupTableContext';
import ColorPickerEditor from '../../components/AgGrid/Editors/ColorPickerEditor';
import CreatableComboboxEditor from '../../components/AgGrid/Editors/CreatableComboboxEditor';
import MultiSelectEditor from '../../components/AgGrid/Editors/MultiSelectEditor';
import ColoredCircleRenderer from '../../components/AgGrid/Renderers/ColoredCircleRenderer';
import { StyledAgGrid, handleSelectMultipleRows } from '../../components/AgGrid/StyledAgGrid';
import { REDO_SHORTCUT, SCOPES, UNDO_SHORTCUT } from '../../shared/hotkeys';
import { useSchedulingFormContext } from '../shared/FormContext';
import { generalValueSetter, parseStringToArrayNumber } from '../shared/helpers';
import { ActivityStepSchema } from './ActivityStepValidationSchema';
import { DurationCellEditor } from './Duration/DurationCellEditor';
import { DurationCellRerender } from './Duration/DurationCellRerender';
import { DurationValueFormatter } from './Duration/DurationValueFormatter';
import { activityStepFormatters, activityStepFromClipboardFormatters } from './activityStepFormatters';

const valueSetter = generalValueSetter(ActivityStepSchema);

type ActivityStepsGridProps = {
	agGridRef: { current: AgGridReact | null };
	setSelectedRows: (rows: ActivityStep[]) => void;
};

const chooseLookup = withDialog(ChooseLookupDialog);

const ActivityStepsGrid = ({ agGridRef, setSelectedRows }: ActivityStepsGridProps) => {
	const { setValue, watch } = useSchedulingFormContext();
	const [activitySteps, resources] = watch(['activitySteps', 'resources']);
	const { isSchedulingLookupTableEnabled } = useLDFeatureFlags();
	const { setIsBuilderOpen } = useContext(ScheduleLookupTableContext);
	const { project: { _id: projectId } = {} } = useAlfa();

	const undoActions = useUndo(activitySteps, (rowData) =>
		setValue('activitySteps', rowData, { shouldValidate: true })
	);
	const { prevState, nextState, canUndo, canRedo } = undoActions;

	useHotkey(UNDO_SHORTCUT, SCOPES.activitySteps, (e) => {
		e.preventDefault();
		if (!canUndo) return;
		prevState();
	});

	useHotkey(REDO_SHORTCUT, SCOPES.activitySteps, (e) => {
		e.preventDefault();
		if (!canRedo) return;
		nextState();
	});

	useHotkey('shift+space', SCOPES.activitySteps, (e) => {
		e.preventDefault();
		if (!agGridRef.current?.api) return;
		handleSelectMultipleRows(agGridRef.current?.api);
	});

	const handleValueChanged = (event: RowDataChangedEvent) => {
		const rowData: ActivityStep[] = [];
		event.api.forEachNode((rowNode) => rowData.push(rowNode.data as ActivityStep));

		setValue('activitySteps', rowData, { shouldValidate: true });
	};

	const { lookupTables } = useLookupTables(projectId);

	const defaultExportParams = {
		processCellCallback: (params) => activityStepFormatters(params, activitySteps),
		sheetName: 'Activity Steps',
		fileName: 'ActivityStepsExport',
	};

	const getColorStyleId = (color = '') => `color-${color.replace('#', '')}`;

	const scrollCallbacksRef = useRef<Record<string, () => void>>({});

	const gridOptions = {
		context: {
			isSchedulingLookupTableEnabled,
			buildLookupTable: () => {
				setIsBuilderOpen(true);
			},
			assignLookupTable: async (step: ActivityStep) => {
				const option = await chooseLookup({
					lookupTables,
				});

				if (!option) return;

				const index = activitySteps.findIndex((s) => s.stepIdx === step.stepIdx);
				const newStep = {
					...step,
					stepDuration: { ...step.stepDuration, useLookup: true, scheduleLookupId: option },
				};
				const updatedActivitySteps = activitySteps.with(index, newStep);
				setValue('activitySteps', updatedActivitySteps, { shouldValidate: true });
			},
			removeLookupTable: (step: ActivityStep) => {
				const index = activitySteps.findIndex((s) => s.stepIdx === step.stepIdx);
				const newStep = {
					...step,
					stepDuration: { ...step.stepDuration, useLookup: false },
				};
				const updatedActivitySteps = activitySteps.with(index, newStep);
				setValue('activitySteps', updatedActivitySteps, { shouldValidate: true });
			},
			lookupTables,
			scrollCallbacks: scrollCallbacksRef.current,
		},
		onBodyScroll: () => {
			Object.values(scrollCallbacksRef.current).forEach((cb) => cb());
		},
		columnDefs: [
			{
				...CHECKBOX_COLUMN_DEF,
				pinned: 'left',
				maxWidth: 55,
			},
			{
				field: 'color',
				headerName: 'Color',
				type: 'colorpicker',
				maxWidth: 150,
				valueSetter,
				cellRenderer: ColoredCircleRenderer,
				cellClass: (params) => getColorStyleId(params.value),
			},
			{
				field: 'name',
				headerName: 'Name',
				type: 'creatableCombobox',
				minWidth: 150,
				cellEditorParams: {
					options: ACTIVITY_STEP_NAME_OPTIONS.map((option) => ({
						key: option,
						label: ACTIVITY_STEP_NAME_LABELS[option],
						hide: activitySteps.some((step) => step.name === ACTIVITY_STEP_NAME_LABELS[option]),
					})),
				},
				refData: ACTIVITY_STEP_NAME_LABELS,
				...{
					...getAgGridValueHandler(ACTIVITY_STEP_NAME_LABELS),
					valueParser: (params) => (params.newValue ? params.newValue : params.oldValue),
					valueSetter: (params) => {
						const newValue = params.newValue ? params.newValue : params.oldValue;
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						params.data[params.colDef.field!] = newValue;
						return true;
					},
				},
				valueSetter: ({ data, newValue }) => {
					const newValueWithoutSpaces = newValue.trim();

					const isValid = ActivityStepSchema.isValidSync({
						...data,
						name: newValueWithoutSpaces,
					});

					if (isValid) {
						const nameExists = activitySteps.some((step) => step.name === newValueWithoutSpaces);
						if (nameExists) return false;

						data.name = ACTIVITY_STEP_NAME_LABELS[newValueWithoutSpaces] || newValueWithoutSpaces;
						return true;
					}

					return false;
				},
			},
			{
				field: 'previousStepIdx',
				headerName: 'Previous Step',
				type: 'multiselect',
				cellEditorParams: {
					options: activitySteps.map((value: ActivityStep) => ({
						value: value.stepIdx,
						label: value.name,
					})),
					filter: (options, compareValue) => {
						return options.filter((option) => option.value !== compareValue);
					},
					forceOpen: true,
				},
				valueSetter: ({ data, newValue, colDef }) =>
					valueSetter({ data, newValue: parseStringToArrayNumber(newValue), colDef }),
			},
			{
				field: 'padOperation',
				headerName: 'Pad Operation',
				type: 'combobox',
				cellEditorParams: { options: PAD_OPERATION_OPTIONS },
				refData: PAD_OPERATION_LABELS,
				...getAgGridValueHandler(PAD_OPERATION_LABELS),
			},
			{
				field: isSchedulingLookupTableEnabled ? 'stepDuration' : 'stepDuration.days',
				headerName: 'Step Duration (w/o mobilization)',
				minWidth: 220,
				valueSetter: ({ data, newValue }) => {
					const scheduleLookupId = newValue._id;
					const useLookup = Boolean(scheduleLookupId);
					const days = Number(newValue);

					const stepDuration = {
						...data.stepDuration,
						useLookup,
						...(useLookup ? { scheduleLookupId } : { days }),
					};

					const isValid = ActivityStepSchema.isValidSync({
						...data,
						stepDuration,
					});

					if (isValid) data.stepDuration = stepDuration;
				},
				...(isSchedulingLookupTableEnabled
					? {
							cellEditor: DurationCellEditor,
							cellRenderer: DurationCellRerender,
							valueFormatter: DurationValueFormatter,
					  }
					: {}),
			},
			{
				field: 'requiresResources',
				headerName: 'Requires Resources',
				type: 'boolean',
				valueSetter: ({ data, newValue }) => {
					const isValid = ActivityStepSchema.isValidSync({
						...data,
						requiresResources: newValue,
					});
					if (isValid) {
						const updatedSteps = activitySteps.map((step: ActivityStep) =>
							step.stepIdx === data.stepIdx
								? {
										...step,
										requiresResources: newValue,
								  }
								: step
						);

						const updatedResources = resources.map((resource: Resource) => ({
							...resource,
							active:
								resource.stepIdx.filter(
									(stepIdx) => updatedSteps.find((step) => step.stepIdx === stepIdx).requiresResources
								).length > 0,
						}));
						setValue('activitySteps', updatedSteps, { shouldValidate: true });
						setValue('resources', updatedResources, { shouldValidate: true });
					}
				},
				cellEditorParams: {
					forceOpen: true,
				},
			},
		],
		columnTypes: {
			number: { cellEditor: Editors.NumberEditor },
			combobox: { cellEditor: Editors.ComboboxEditor },
			creatableCombobox: { cellEditor: CreatableComboboxEditor },
			boolean: { cellEditor: Editors.BooleanEditor },
			multiselect: { cellEditor: MultiSelectEditor },
			date: { cellEditor: Editors.DateEditor },
			colorpicker: { cellEditor: ColorPickerEditor },
		},
		defaultColDef: {
			flex: 1,
			minWidth: 100,
			resizable: true,
			editable: true,
			valueFormatter: (params) => activityStepFormatters(params, activitySteps),
		},
		rowData: activitySteps,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		suppressMultiRangeSelection: true,
		suppressLastEmptyLineOnPaste: true,
		enableRangeSelection: true,
		onRowSelected: (event) => {
			forceFocusOnTheTable(agGridRef.current);
			setSelectedRows(event.api.getSelectedRows());
		},
		onCellValueChanged: handleValueChanged,
		processCellFromClipboard(params) {
			return activityStepFromClipboardFormatters(params, activitySteps);
		},
		processCellForClipboard(params) {
			return activityStepFormatters(params, activitySteps);
		},
		excelStyles: activitySteps.map(({ color }) => ({
			id: getColorStyleId(color),
			interior: {
				color,
				pattern: 'Solid',
			},
		})),
		defaultExcelExportParams: defaultExportParams,
		defaultCsvExportParams: defaultExportParams,
	} as AgGridProps;

	return <StyledAgGrid ref={agGridRef} {...gridOptions} />;
};

export const MemoizedActivityStepsGrid = memo(ActivityStepsGrid);
