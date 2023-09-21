import { convertDateToIdx } from '@combocurve/forecast/helpers';
import { RowDataChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { memo } from 'react';

import { ControlledTooltip, isNodeFocused } from '@/components/AdvancedTable/ag-grid-shared';
import { AgGridProps, CHECKBOX_COLUMN_DEF, Editors, forceFocusOnTheTable } from '@/components/AgGrid';
import { useHotkey, useUndo } from '@/components/hooks';
import { ActivityStep, Resource } from '@/inpt-shared/scheduling/shared';

import BooleanEditor from '../../components/AgGrid/Editors/BooleanEditor';
import MultiSelectEditor from '../../components/AgGrid/Editors/MultiSelectEditor';
import { StyledAgGrid, handleSelectMultipleRows } from '../../components/AgGrid/StyledAgGrid';
import { REDO_SHORTCUT, SCOPES, UNDO_SHORTCUT } from '../../shared/hotkeys';
import { useSchedulingFormContext } from '../shared/FormContext';
import { generalValueSetter, parseStringToArrayNumber } from '../shared/helpers';
import { ResourceSchema } from './ResourceValidationSchema';
import { resourceFormatter, resourceFromClipboardFormatters } from './resourceFormatter';

const valueSetter = generalValueSetter(ResourceSchema);

const cellRenderer = (props) => {
	const { valueFormatted, value, tooltipMessage } = props;

	if (tooltipMessage) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const isFocused = isNodeFocused(props.api, props.node, props.column!);

		return (
			<ControlledTooltip forceOpen={isFocused} title={tooltipMessage}>
				<div>{valueFormatted ? valueFormatted : value}</div>
			</ControlledTooltip>
		);
	}

	return valueFormatted ? valueFormatted : value;
};

type ResourcesGridProps = {
	agGridRef: { current: AgGridReact | null };
	setSelectedRows: (rows: Resource[]) => void;
};

const ResourcesGrid = ({ agGridRef, setSelectedRows }: ResourcesGridProps) => {
	const { setValue, watch } = useSchedulingFormContext();
	const [activitySteps, resources] = watch(['activitySteps', 'resources']);

	const undoActions = useUndo(resources, (rowData) => setValue('resources', rowData, { shouldValidate: true }));
	const { prevState, nextState, canUndo, canRedo } = undoActions;

	useHotkey(UNDO_SHORTCUT, SCOPES.resources, (e) => {
		e.preventDefault();
		if (!canUndo) return;
		prevState();
	});

	useHotkey(REDO_SHORTCUT, SCOPES.resources, (e) => {
		e.preventDefault();
		if (!canRedo) return;
		nextState();
	});

	useHotkey('shift+space', SCOPES.resources, (e) => {
		e.preventDefault();
		if (!agGridRef.current?.api) return;
		handleSelectMultipleRows(agGridRef.current?.api);
	});

	const stepsIdxThatDoesNotRequireResources: number[] = activitySteps
		.filter((step: ActivityStep) => !step.requiresResources)
		.map((step: ActivityStep) => step.stepIdx);

	const isResourceActive = (resource: Resource, newValue: boolean) =>
		resource.stepIdx.length > 0 &&
		resource.stepIdx.some((stepIdx: number) => !stepsIdxThatDoesNotRequireResources.includes(stepIdx))
			? newValue
			: false;

	const removeStepsThatDoesNotRequireResources = () => {
		return resources.map((resource: Resource) => ({
			...resource,
			stepIdx: resource.stepIdx.filter((stepIdx) => !stepsIdxThatDoesNotRequireResources.includes(stepIdx)),
		}));
	};

	const filteredResources = removeStepsThatDoesNotRequireResources();

	const handleValueChanged = (event: RowDataChangedEvent) => {
		const rowData: Resource[] = [];
		event.api.forEachNode((rowNode) => rowData.push(rowNode.data as Resource));

		setValue('resources', rowData, { shouldValidate: true });
	};

	const defaultExportParams = {
		processCellCallback: (params) => resourceFormatter(params, activitySteps),
		sheetName: 'Resources',
		fileName: 'ResourcesExport',
	};

	const gridOptions = {
		columnDefs: [
			{
				...CHECKBOX_COLUMN_DEF,
				pinned: 'left',
				maxWidth: 55,
			},
			{
				field: 'name',
				headerName: 'Name',
				minWidth: 220,
				valueSetter: ({ data, newValue }) => {
					const isValid = ResourceSchema.isValidSync({
						...data,
						name: newValue,
					});

					if (isValid) {
						const nameExists = resources.some((resource) => resource.name === newValue);
						if (nameExists) return false;

						data.name = newValue;
						return true;
					}

					return false;
				},
			},
			{
				field: 'stepIdx',
				headerName: 'Activity Step',
				type: 'multiselect',
				cellEditorParams: {
					options: activitySteps
						.filter((step: ActivityStep) => step.requiresResources)
						.map((value: ActivityStep) => ({
							value: value.stepIdx,
							label: value.name,
						})),
					forceOpen: true,
				},
				valueSetter: ({ data, newValue }) => {
					const formattedNewValue = parseStringToArrayNumber(newValue);

					const isValid = ResourceSchema.isValidSync({
						...data,
						stepIdx: formattedNewValue,
					});

					if (isValid) {
						data.stepIdx = formattedNewValue;
						data.active = formattedNewValue.length > 0;
						return true;
					}

					return false;
				},
			},
			{
				field: 'mobilizationDays',
				headerName: 'Mobilization',
				type: 'number',
				valueSetter: ({ data, newValue, colDef }) => {
					const mobilizationDays = Number(newValue);
					return valueSetter({ data, newValue: mobilizationDays, colDef });
				},
			},
			{
				field: 'demobilizationDays',
				headerName: 'Demobilization',
				type: 'number',
				valueSetter: ({ data, newValue, colDef }) => {
					const demobilizationDays = Number(newValue);
					return valueSetter({ data, newValue: demobilizationDays, colDef });
				},
			},
			{
				field: 'data.availability.start',
				headerName: 'From (date)',
				type: 'date',
				cellEditorParams: {
					forceOpen: true,
				},
				valueSetter: ({ data, newValue }) => {
					const availabilityStart = convertDateToIdx(newValue);
					const isValid = ResourceSchema.isValidSync({
						...data,
						availability: { ...data.availability, start: availabilityStart },
					});

					if (isValid) data.availability.start = availabilityStart;
					return isValid;
				},
			},
			{
				field: 'data.availability.end',
				headerName: 'To (date)',
				type: 'date',
				cellEditorParams: {
					forceOpen: true,
				},
				valueSetter: ({ data, newValue }) => {
					const availabilityEnd = convertDateToIdx(newValue);
					const isValid = ResourceSchema.isValidSync({
						...data,
						availability: { ...data.availability, end: availabilityEnd },
					});
					if (isValid) data.availability.end = availabilityEnd;
				},
			},
			{
				field: 'workOnHolidays',
				headerName: 'Works Holidays (Y/N)',
				type: 'boolean',
				valueSetter,
				hide: true,
				cellEditorParams: {
					forceOpen: true,
				},
			},
			{
				field: 'active',
				headerName: 'Active',
				type: 'boolean',
				cellRendererParams: {
					tooltipMessage: 'Must have a step assigned to be active',
				},
				valueSetter: ({ data, newValue }) => {
					const isValid = ResourceSchema.isValidSync({
						...data,
						active: newValue,
					});

					if (isValid) {
						data.active = isResourceActive(data, newValue);
						return true;
					}

					return false;
				},
				cellEditorParams: {
					forceOpen: true,
				},
			},
		],
		columnTypes: {
			number: { cellEditor: Editors.NumberEditor },
			boolean: { cellEditor: BooleanEditor },
			date: { cellEditor: Editors.DateEditor },
			multiselect: { cellEditor: MultiSelectEditor },
		},
		defaultColDef: {
			flex: 1,
			minWidth: 100,
			resizable: true,
			editable: true,
			valueFormatter: (params) => resourceFormatter(params, activitySteps),
			cellRenderer,
		},
		rowData: filteredResources,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		suppressLastEmptyLineOnPaste: true,
		suppressMultiRangeSelection: true,
		enableRangeSelection: true,
		onRowSelected: (event) => {
			forceFocusOnTheTable(agGridRef.current);
			setSelectedRows(event.api.getSelectedRows());
		},
		onCellValueChanged: handleValueChanged,
		processCellForClipboard: (params) => {
			return resourceFormatter(params, activitySteps);
		},
		processCellFromClipboard(params) {
			return resourceFromClipboardFormatters(params, activitySteps);
		},
		defaultExcelExportParams: defaultExportParams,
		defaultCsvExportParams: defaultExportParams,
	} as AgGridProps;

	return <StyledAgGrid ref={agGridRef} {...gridOptions} />;
};

export const MemoizedResourcesGrid = memo(ResourcesGrid);
