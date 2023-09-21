import { faMinus, faPlus, faRedo, faUndo } from '@fortawesome/pro-regular-svg-icons';
import { GridApi, ICellRendererParams, IHeaderParams, ProcessCellForExportParams } from 'ag-grid-community';
import {
	BaseColDefParams,
	ColDef,
	ValueFormatterParams,
	ValueParserParams,
} from 'ag-grid-community/dist/lib/entities/colDef';
import produce from 'immer';
import _, { groupBy, keyBy } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { UseQueryResult } from 'react-query';

import { CTRL_OR_COMMAND_KEY } from '@/components';
import { MODIFIED_CELL_CLASS_NAME } from '@/components/AdvancedTable/constants';
import AgGrid, {
	AgGridRef,
	DISABLED_CELL_CLASS_NAME,
	ERROR_CELL_CLASS_NAME,
	NUMBER_CELL_CLASS_NAME,
	getAgGridValueHandler,
} from '@/components/AgGrid';
import { useHotkey, useUndo } from '@/components/hooks';
import { useAggregatedSetState } from '@/components/hooks/useAggregatedSetState';
import { Button, Checkbox, IconButton, InfoIcon } from '@/components/v2';
import { warningAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { capitalize } from '@/helpers/text';
import { SetStateFunction, assert, numberWithCommas, resolveValueOrFunction } from '@/helpers/utilities';
import {
	CarbonEmissionProduct,
	EMISSION_CATEGORY_LABEL,
	EMISSION_ROW_DATA_EMISSION_NONE,
	EMISSION_UNIT_LABEL,
	EmissionCategory,
	EmissionData,
	EmissionRowData,
	EmissionTableData,
	EmissionUnitKey,
} from '@/inpt-shared/econ-models/emissions';
import ComboboxCellEditor from '@/networks/carbon/ComboboxCellEditor';
import { DeviceImage } from '@/networks/carbon/Diagram/Diagram';

import { Assumption } from '../shared';
import { AppendEmissionsDialog } from './AppendEmissionsDialog';
import ImportEmissionsDialog from './ImportEmissionsDialog';

const numberParser = (params: ValueParserParams) => {
	const asNumber = Number(params.newValue);
	if (Number.isFinite(asNumber)) return asNumber;
	return params.oldValue;
};

const NUMBER_MIN = -1e10;
const NUMBER_MAX = 1e10;

const ALL_EMISSION_UNIT_KEY: EmissionUnitKey[] = [
	EmissionUnitKey.mt_per_mbbl,
	EmissionUnitKey.mt_per_mmcf,
	EmissionUnitKey.mt_per_mboe,
	EmissionUnitKey.mt_per_well_per_year,
	EmissionUnitKey.mt_per_new_well,
];

const CARBON_EMISSION_PRODUCTS = [
	{ value: CarbonEmissionProduct.co2e, label: 'CO2e' },
	{ value: CarbonEmissionProduct.co2, label: 'CO2' },
	{ value: CarbonEmissionProduct.ch4, label: 'CH4' },
	{ value: CarbonEmissionProduct.n2o, label: 'N2O' },
];

const DEFAULT_ROW_ORDER = [
	EmissionCategory.associated_gas,
	EmissionCategory.acid_gas_removal_units,
	EmissionCategory.centrifugal_compressor,
	EmissionCategory.eor_hydrocarbon_liquids,
	EmissionCategory.eor_injection_pumps,
	EmissionCategory.liquids_unloading,
	EmissionCategory.pneumatic_device,
	EmissionCategory.dehydrators,
	EmissionCategory.equipment_leaks,
	EmissionCategory.atmospheric_tank,
	EmissionCategory.reciprocating_compressor,
	EmissionCategory.completions_with_fracturing,
	EmissionCategory.completions_without_fracturing,
	EmissionCategory.drilling,
	EmissionCategory.completion,
	EmissionCategory.combustion,
	EmissionCategory.pneumatic_pump,
	EmissionCategory.well_testing,
	EmissionCategory.blowdown_vent_stacks,
	EmissionCategory.flare,
	EmissionCategory.scope2,
	EmissionCategory.scope3,
];

const DEFAULT_CATEGORY_UNIT: Record<Exclude<EmissionCategory, EmissionCategory.custom_calculation>, EmissionUnitKey> = {
	[EmissionCategory.associated_gas]: EmissionUnitKey.mt_per_mmcf,
	[EmissionCategory.acid_gas_removal_units]: EmissionUnitKey.mt_per_mmcf,
	[EmissionCategory.centrifugal_compressor]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.eor_hydrocarbon_liquids]: EmissionUnitKey.mt_per_mbbl,
	[EmissionCategory.eor_injection_pumps]: EmissionUnitKey.mt_per_mbbl,
	[EmissionCategory.liquids_unloading]: EmissionUnitKey.mt_per_mmcf,
	[EmissionCategory.pneumatic_device]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.dehydrators]: EmissionUnitKey.mt_per_mmcf,
	[EmissionCategory.equipment_leaks]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.atmospheric_tank]: EmissionUnitKey.mt_per_mbbl,
	[EmissionCategory.reciprocating_compressor]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.completions_with_fracturing]: EmissionUnitKey.mt_per_new_well,
	[EmissionCategory.completions_without_fracturing]: EmissionUnitKey.mt_per_new_well,
	[EmissionCategory.drilling]: EmissionUnitKey.mt_per_new_well,
	[EmissionCategory.completion]: EmissionUnitKey.mt_per_new_well,
	[EmissionCategory.combustion]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.pneumatic_pump]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.well_testing]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.blowdown_vent_stacks]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.flare]: EmissionUnitKey.mt_per_mmcf,
	[EmissionCategory.scope2]: EmissionUnitKey.mt_per_well_per_year,
	[EmissionCategory.scope3]: EmissionUnitKey.mt_per_well_per_year,
};

const NONE_LABEL = 'None';

function getCategoryDefaultRowData(category: EmissionCategory) {
	return {
		selected: true,
		category,
		[CarbonEmissionProduct.co2e]: 0,
		[CarbonEmissionProduct.co2]: 0,
		[CarbonEmissionProduct.ch4]: 0,
		[CarbonEmissionProduct.n2o]: 0,
		unit: DEFAULT_CATEGORY_UNIT[category],
		escalation_model: EMISSION_ROW_DATA_EMISSION_NONE,
	};
}

const DEFAULT_EMISSION_TABLE_DATA: EmissionTableData = DEFAULT_ROW_ORDER.map((category) =>
	getCategoryDefaultRowData(category)
);

// @ts-expect-error lodash fault
const DEFAULT_EMISSION_DATA_MAP: Record<EmissionCategory, EmissionRowData> = keyBy(
	DEFAULT_EMISSION_TABLE_DATA,
	'category'
);

export const DEFAULT_EMISSION_DATA: EmissionData = {
	table: DEFAULT_EMISSION_TABLE_DATA,
};

const _getFieldPathBaseColDefParams = (params: BaseColDefParams) =>
	`table.${params.data.assignedRowIndex}.${params.colDef.field}`;

const _getFieldPathProcessCellForExportParams = (params: ProcessCellForExportParams) =>
	`table.${params?.node?.id}.${params.column.getColId()}`;

function checkNumberValid(num: number) {
	return Number.isFinite(num) && num >= NUMBER_MIN && num <= NUMBER_MAX;
}

function checkRowDataTypeValid(rowData: EmissionRowData) {
	return (
		typeof rowData.selected === 'boolean' && // selected
		Object.keys(EmissionCategory).includes(rowData.category) && // category
		checkNumberValid(rowData[CarbonEmissionProduct.co2e]) && // co2e
		checkNumberValid(rowData[CarbonEmissionProduct.co2]) && // co2
		checkNumberValid(rowData[CarbonEmissionProduct.ch4]) && // ch4
		checkNumberValid(rowData[CarbonEmissionProduct.n2o]) && // n2o
		Object.keys(EmissionUnitKey).includes(rowData.unit) && // unit
		typeof rowData.escalation_model === 'string' // escalation_model
	);
}

function checkRowWarning(rowData: EmissionRowData) {
	const hasCo2e = !!rowData[CarbonEmissionProduct.co2e];
	const hasOtherProducts =
		!!rowData[CarbonEmissionProduct.co2] ||
		!!rowData[CarbonEmissionProduct.ch4] ||
		!!rowData[CarbonEmissionProduct.n2o];
	return (hasCo2e && hasOtherProducts) || !checkRowDataTypeValid(rowData);
}

export function checkEmissionModelDataValid(data: EmissionData) {
	for (const row of data.table) {
		if (checkRowWarning(row)) return false;
	}

	return true;
}

function checkHasWarning(rowData: EmissionRowData, field: string) {
	return (
		_.includes(
			CARBON_EMISSION_PRODUCTS.map((v) => v.value),
			field
		) &&
		checkRowWarning(rowData) &&
		rowData[field]
	);
}

const DEFAULT_COLUMN_DEF: ColDef = {
	valueGetter: (params) => _.get(params.context, _getFieldPathBaseColDefParams(params)),
	width: 100,
	resizable: true,
	sortable: true,
	cellClassRules: {
		[DISABLED_CELL_CLASS_NAME]: (params) =>
			!resolveValueOrFunction(
				params.colDef.editable,
				// @ts-expect-error type don't exactly match, TODO fix later
				params
			),
		[ERROR_CELL_CLASS_NAME]: (params) => {
			const rowData: EmissionRowData = params.context.table[params.data.assignedRowIndex];
			const { category } = rowData;
			const field = params.colDef.field;

			if (field == null || field === '' || category == null) return false;
			return checkHasWarning(rowData, field);
		},
		[MODIFIED_CELL_CLASS_NAME]: (params) => {
			const rowData: EmissionRowData = params.context.table[params.data.assignedRowIndex];
			const { category } = rowData;
			const field = params.colDef.field;
			if (field == null || field === '' || category == null) return false;
			const cellData = rowData[field];
			const defaultCellData = DEFAULT_EMISSION_DATA_MAP[category][field];
			return cellData !== defaultCellData;
		},
	},
	tooltipValueGetter: (params) => {
		const rowData: EmissionRowData = params.context.table[params.data.assignedRowIndex];
		const { category } = rowData;
		if (
			params.colDef == null ||
			!('field' in params.colDef) ||
			params.node == null ||
			params.colDef.field == null ||
			params.colDef.field === '' ||
			params.node.id == null ||
			category == null
		)
			return false;
		const field = params.colDef.field;

		return checkHasWarning(rowData, field) ? 'CO2e and (CO2, CH4, N2O) can not be used together' : null;
	},
};

const CATEGORY_TOOLTIPS = {
	[EmissionCategory.drilling]: 'Drilling emissions are reported within Combustion category in EPA reports',
	[EmissionCategory.completion]: 'Completion emissions are reported within Combustion category in EPA reports',
};

const COLUMN_DEFS: ColDef[] = [
	{
		headerName: 'Category',
		field: 'category',
		editable: true,
		cellEditor: ComboboxCellEditor,
		cellEditorParams: { options: DEFAULT_ROW_ORDER },
		cellRenderer: (params: ICellRendererParams) => {
			const rowData: EmissionRowData = params.context.table[params.data.assignedRowIndex];
			const category = rowData.category;
			return (
				<div css='display:flex; align-items: center;gap:0.5rem; width: 280px;'>
					<DeviceImage type={category} width='24px' height='24px' />
					<div css='display:flex; align-items: center; justify-content: space-between; width: 100%'>
						<span>{EMISSION_CATEGORY_LABEL[category]}</span>
						{CATEGORY_TOOLTIPS?.[category] && <InfoIcon tooltipTitle={CATEGORY_TOOLTIPS?.[category]} />}
					</div>
				</div>
			);
		},
		...getAgGridValueHandler(DEFAULT_ROW_ORDER.map((key) => ({ value: key, label: EMISSION_CATEGORY_LABEL[key] }))),
	},
	...CARBON_EMISSION_PRODUCTS.map((product) => ({
		headerName: product.label,
		field: product.value,
		valueParser: numberParser,
		valueFormatter: (params: ValueFormatterParams) => numberWithCommas(params.value),
		type: 'number',
		editable: true,
		width: 80,
	})),
	{
		headerName: 'Unit',
		field: 'unit',
		editable: true,
		cellEditor: ComboboxCellEditor,
		cellEditorParams: { options: ALL_EMISSION_UNIT_KEY },
		...getAgGridValueHandler(ALL_EMISSION_UNIT_KEY.map((key) => ({ value: key, label: EMISSION_UNIT_LABEL[key] }))),
	},
];

function useStateChangeEffect(state: EmissionData, agGridRef: RefObject<AgGridRef>) {
	const allSelectedRef = useRef(true);

	useEffect(() => {
		if (!agGridRef.current?.api) return;
		agGridRef.current.api.refreshCells();

		// refresh header
		const newAllSelected = state.table.reduce((acc, item) => acc && item.selected, true);
		if (newAllSelected !== allSelectedRef.current) {
			agGridRef.current.api.refreshHeader();
		}
		allSelectedRef.current = newAllSelected;
	}, [state, agGridRef]);
}

function CheckboxHeaderComponent(params: IHeaderParams) {
	const allSelected = (params.context.table as EmissionTableData).reduce((acc, item) => acc && item.selected, true);
	return (
		<Checkbox
			checked={allSelected}
			onClick={() => {
				params.context.setState?.(
					produce<EmissionData>((draft) => {
						draft.table.forEach((_value, index) => {
							const path = `table.${index}.selected`;
							_.set(draft, path, !allSelected);
						});
					})
				);
			}}
		/>
	);
}

function CheckboxCellRenderer(params: ICellRendererParams) {
	const rowData: EmissionRowData = params.context.table[params.data.assignedRowIndex];
	const { selected } = rowData;

	assert(params.colDef, 'Expected colDef');

	return (
		<Checkbox
			checked={selected}
			onClick={() => {
				params.context.setState?.(
					produce<EmissionData>((draft) => {
						const path = _getFieldPathBaseColDefParams(params as BaseColDefParams);
						const checked = _.get(draft, path);
						_.set(draft, path, !checked);
					})
				);
			}}
			onChange={(e) => {
				if (e.nativeEvent.type === 'click') {
					e.target.blur();
				}
				return false;
			}}
		/>
	);
}

/** @returns Focused row node */
function getSelectedNode(gridApi: GridApi) {
	const cellPosition = gridApi.getFocusedCell();
	if (!cellPosition) return null;
	return gridApi.getModel().getRow(cellPosition.rowIndex) ?? null;
}

function focusAgGrid(gridApi: GridApi) {
	const focus = gridApi.getFocusedCell();
	if (focus) gridApi.setFocusedCell(focus.rowIndex, focus.column, focus.rowPinned ?? undefined);
}

function EmissionTable({
	className,
	state,
	setState: actualSetState,
	escalationQuery,
}: {
	className?: string;
	state: EmissionData;
	setState: SetStateFunction<EmissionData>;
	escalationQuery: UseQueryResult<Assumption[]>;
}) {
	const setState = useAggregatedSetState(actualSetState);
	const agGridRef = useRef<AgGridRef>(null);
	const undoActions = useUndo(state, setState);
	const hasEscalationData = escalationQuery?.data && escalationQuery?.data?.length;

	const [columnDefs, escalationOptions] = useMemo(() => {
		// selection
		const selectionCol: ColDef = {
			headerComponent: CheckboxHeaderComponent,
			cellRenderer: CheckboxCellRenderer,
			field: 'selected',
		};

		// escalation
		let escalationColDef = {
			headerName: 'Escalation',
			field: 'escalation_model',
			editable: !!hasEscalationData,
			cellEditor: ComboboxCellEditor,
		};
		const options = [EMISSION_ROW_DATA_EMISSION_NONE];
		const items = [{ value: EMISSION_ROW_DATA_EMISSION_NONE, label: NONE_LABEL }];

		if (hasEscalationData) {
			escalationQuery.data.forEach((v) => {
				options.push(v._id);
				items.push({ value: v._id, label: v.name });
			});
		}
		escalationColDef = {
			...escalationColDef,
			// @ts-expect-error type don't exactly match, TODO fix later
			cellEditorParams: { options },
			...getAgGridValueHandler(items),
		};

		return [[selectionCol, ...COLUMN_DEFS, escalationColDef], options];
	}, [escalationQuery.data, hasEscalationData]);

	const getEditValueError = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(colId: string, newValue: any) => {
			// for product
			// const colId = params.column.getColId();
			if (colId === 'category') {
				return {
					error: !_.includes(DEFAULT_ROW_ORDER, newValue) && 'Category is not valid',
					value: newValue,
				};
			}
			if (colId === 'unit') {
				return {
					error: !_.includes(ALL_EMISSION_UNIT_KEY, newValue) && 'Unit is not valid',
					value: newValue,
				};
			}
			if (colId === 'escalation_model') {
				return {
					error:
						!_.includes(escalationOptions, newValue) &&
						'Selected escalation is not a valid escalation from this project',
					value: newValue,
				};
			}
			if (_.includes(Object.values(CarbonEmissionProduct), colId)) {
				const asNumber = Number(newValue);

				return {
					error:
						!checkNumberValid(asNumber) &&
						`Valid number is between ${NUMBER_MIN} and ${numberWithCommas(NUMBER_MAX)}`,
					value: asNumber,
				};
			}
			return { error: '', value: newValue };
		},
		[escalationOptions]
	);

	const [importEmissionsDialog, showImportEmissionsDialog] = useDialog(ImportEmissionsDialog);
	const [appendEmissionsDialog, showAppendEmissionsDialog] = useDialog(AppendEmissionsDialog);
	const handleImportEmission = async () => {
		const importedData = await showImportEmissionsDialog();
		if (!importedData) return;
		setState((p) => {
			const groupedByCategory = groupBy(p.table, 'category') as Partial<
				Record<EmissionCategory, EmissionRowData[]>
			>;
			for (const importedRow of importedData) {
				groupedByCategory[importedRow.category] = [importedRow];
			}
			const newRows = Object.values(groupedByCategory).flat();
			return { table: newRows };
		});
	};

	const handleAddRow = () => {
		assert(agGridRef.current, 'Expected agGrid');
		const selectedNode = getSelectedNode(agGridRef.current.api);

		const category = selectedNode
			? state.table[selectedNode.data.assignedRowIndex].category
			: EmissionCategory.associated_gas;

		setState(
			produce((draft) => {
				draft.table.push(getCategoryDefaultRowData(category));
			})
		);
		focusAgGrid(agGridRef.current.api);
	};

	const handleRemoveDefaultRows = () => {
		assert(agGridRef.current, 'Expected agGrid');

		setState(
			produce((draft) => {
				draft.table = draft.table.filter((row) => !_.isEqual(row, getCategoryDefaultRowData(row['category'])));
			})
		);
	};

	const handleAppendEmissionModels = async () => {
		const appendedModels = await showAppendEmissionsDialog();
		if (appendedModels?.length) {
			setState(
				produce((draft) => {
					appendedModels.forEach((model) => {
						draft.table.push(...model.econ_function.table);
					});
				})
			);
		}
	};
	const handleDelete = () => {
		assert(agGridRef.current, 'Expected agGrid');
		const selectedNode = getSelectedNode(agGridRef.current.api);

		if (!selectedNode) return;

		setState(
			produce((draft) => {
				draft.table.splice(selectedNode.data.assignedRowIndex, 1);
			})
		);
		focusAgGrid(agGridRef.current.api);
	};

	useStateChangeEffect(state, agGridRef);

	useHotkey(`${CTRL_OR_COMMAND_KEY}+z`, () => {
		undoActions.prevState();
	});

	useHotkey(`${CTRL_OR_COMMAND_KEY}+y,${CTRL_OR_COMMAND_KEY}+shift+z`, (e) => {
		e.preventDefault();
		undoActions.nextState();
		return false;
	});

	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				width: 100%;
				gap: ${({ theme }) => theme.spacing(1)}px;
			`}
		>
			<div
				css={`
					display: flex;
					flex-direction: row;
					gap: ${({ theme }) => theme.spacing(1)}px;
					span.MuiButton-label {
						text-transform: none;
					}
				`}
			>
				<Button size='small' color='secondary' variant='outlined' onClick={handleImportEmission}>
					Import Emissions
				</Button>
				<Button size='small' color='secondary' variant='outlined' onClick={handleAddRow} startIcon={faPlus}>
					Row
				</Button>
				<Button size='small' color='secondary' variant='outlined' onClick={handleAppendEmissionModels}>
					Append Emissions
				</Button>
				<Button
					size='small'
					color='secondary'
					variant='outlined'
					onClick={handleRemoveDefaultRows}
					startIcon={faMinus}
				>
					Remove Default Rows
				</Button>
				<Button size='small' onClick={handleDelete}>
					Delete
				</Button>
				<IconButton
					size='small'
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onClick={undoActions.prevState}
					disabled={!undoActions.canUndo}
					tooltipTitle={`${capitalize(CTRL_OR_COMMAND_KEY)}+z`}
				>
					{faUndo}
				</IconButton>
				<IconButton
					size='small'
					// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
					onClick={undoActions.nextState}
					disabled={!undoActions.canRedo}
					tooltipTitle={`${capitalize(CTRL_OR_COMMAND_KEY)}+y`}
				>
					{faRedo}
				</IconButton>
				{importEmissionsDialog}
				{appendEmissionsDialog}
			</div>
			<AgGrid
				ref={agGridRef}
				className={className}
				css={`
					flex: 1;
					&&& {
						.${MODIFIED_CELL_CLASS_NAME} {
							color: ${({ theme }) => theme.palette.secondary.main};
						}
					}
				`}
				context={useMemo(() => ({ table: state.table, setState }), [state.table, setState])}
				rowData={useMemo(
					() => _.range(0, state.table.length).map((assignedRowIndex) => ({ assignedRowIndex })),
					[state.table.length]
				)}
				defaultColDef={DEFAULT_COLUMN_DEF}
				columnTypes={useMemo(
					() => ({
						number: {
							cellClass: NUMBER_CELL_CLASS_NAME,
						},
					}),
					[]
				)}
				getRowId={useCallback((params) => params.data.assignedRowIndex, [])}
				columnDefs={columnDefs}
				onFirstDataRendered={(params) => {
					params.columnApi.autoSizeAllColumns();
				}}
				tooltipShowDelay={300}
				enableRangeSelection
				readOnlyEdit
				onCellEditRequest={(params) => {
					const { error, value } = getEditValueError(params.column.getColId(), params.newValue);
					if (error) {
						warningAlert(error);
						return;
					}
					setState(
						produce((draft) => {
							_.set(draft, _getFieldPathBaseColDefParams(params), value);
						})
					);
				}}
				suppressRowClickSelection
				processCellFromClipboard={(params) => {
					const { error, value } = getEditValueError(params.column.getColId(), params.value);
					if (error) {
						warningAlert(error);
						return;
					}
					setState?.(
						produce((draft) => {
							_.set(draft, _getFieldPathProcessCellForExportParams(params), value);
						})
					);
				}}
			/>
		</div>
	);
}

export default EmissionTable;
