import { Grid } from '@material-ui/core';
import { ColDef, ValueFormatterParams, ValueParserParams } from 'ag-grid-community';
import { AgGridReactProps } from 'ag-grid-react';
import { MouseEvent, RefObject, useMemo, useRef } from 'react';
import { TextEditor } from 'react-data-grid-canary';
import {
	Controller,
	ControllerProps,
	ControllerRenderProps,
	FieldValues,
	UseFormGetValues,
	UseFormSetValue,
	useFormContext,
} from 'react-hook-form';
import styled from 'styled-components';

import AgGrid, { AgGridRef } from '@/components/AgGrid';
import { Button, RHFSelectField, Stack } from '@/components/v2';
import { TextFieldProps } from '@/components/v2/TextField';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { assert } from '@/helpers/utilities';

export interface ToolbarOperation {
	operationId: string;
	label: string;
	buttonProps?: React.ComponentProps<typeof Button>;
	handleOperation: (
		event: MouseEvent,
		data: {
			tableRef: RefObject<AgGridRef>;
			getValues: UseFormGetValues<FieldValues>;
			setValue: UseFormSetValue<FieldValues>;
		}
	) => void;
}

const OperationButton = styled(Button)`
	text-transform: none;
`;

interface TimeSeriesToolbarProps {
	operations?: ToolbarOperation[];
	dropdownOptions?: DropdownOption[];
	tableRef: RefObject<AgGridRef>;
}

function TimeSeriesToolbar(props: TimeSeriesToolbarProps) {
	const { operations, dropdownOptions, tableRef } = props;
	const { getValues, setValue } = useFormContext();
	return (
		<Stack direction='row' spacing={2} alignItems='center' justifyContent='flex-end'>
			{!!dropdownOptions && (
				<Grid container direction='row' spacing={2}>
					{dropdownOptions.map((option) => (
						<Grid item key={option.name} xs={6}>
							<RHFSelectField
								name={option.name}
								label={option.label}
								menuItems={option.menuItems}
								fullWidth
								variant='outlined'
								size='small'
								InputProps={{
									onChange: option.onChange,
								}}
							/>
						</Grid>
					))}
				</Grid>
			)}
			{operations && (
				<Stack spacing={2} direction='row' justifyContent='flex-end'>
					{operations.map((operation) => (
						<OperationButton
							key={operation.operationId}
							{...operation.buttonProps}
							onClick={(e) => operation.handleOperation(e, { tableRef, getValues, setValue })}
						>
							{operation.label}
						</OperationButton>
					))}
				</Stack>
			)}
		</Stack>
	);
}

const CustomNoRowsOverlay = () => {
	const {
		formState: { errors },
	} = useFormContext();
	const errorMessage = useMemo(
		// @ts-expect-error TODO: Check this error
		() => (errors?.time_series?.rows?.type === 'min' ? errors?.time_series?.rows?.message : undefined),
		[errors]
	);

	return (
		<div
			className='ag-overlay-loading-center'
			style={{ backgroundColor: errorMessage ? 'lightcoral' : 'transparent', height: '9%' }}
		>
			<i className='far fa-frown'> {errorMessage ?? 'No rows to display'}</i>
		</div>
	);
};

const defaultTableProps = {
	onCellEditRequest: (context) => (ev) => {
		const { data, rowIndex, newValue } = ev;
		assert(rowIndex !== null, 'rowIndex is null');
		const updatedValue = [...context.value];
		updatedValue.splice(rowIndex, 1, {
			...data,
			[ev.column.getColId()]: newValue,
		});
		context.onChange(updatedValue);
	},
	processCellForClipboard: (params) => {
		if (params.value instanceof Date) {
			// if date use valueformatter when available
			const colDef = params.column.getColDef();
			assert(typeof colDef.valueFormatter !== 'string', 'valueFormatter as string not supported');
			return (
				colDef.valueFormatter?.({
					...params,
					data: params.node?.data,
					colDef,
				} as ValueFormatterParams) ?? params.value
			);
		}
		return params.value;
	},
	processCellFromClipboard: (params) => {
		const colDef = params.column.getColDef();
		assert(typeof colDef.valueParser !== 'string', 'valueParser as string not supported');
		return (
			colDef.valueParser?.({
				...params,
				data: params.node?.data,
				colDef,
				oldValue: params.value, // this is not correct, only left here to silence typescript
				newValue: params.value,
			} as ValueParserParams) ?? params.value
		);
	},
};

interface TimeSeriesTableProps {
	columnsDef: TimeSeriesInputProps['columnsDef'];
	tableRef: RefObject<AgGridRef>;
	onChange: ControllerRenderProps['onChange'];
	value: ControllerRenderProps['value'];
	agGridProps?: TimeSeriesInputProps['agGridProps'];
}
function TimeSeriesTable(props: TimeSeriesTableProps) {
	const { columnsDef, tableRef, value, onChange, agGridProps } = props;
	const { trigger } = useFormContext();

	return (
		<AgGrid
			css={`
				/* TODO: Ask about this, it's provoking a weird bug */
				/* .ag-center-cols-clipper {
					// removes table min height https://www.ag-grid.com/react-data-grid/grid-size/#grid-auto-height
					min-height: unset !important;
				} */

				.ag-selection-checkbox,
				.ag-header-select-all {
					margin-right: ${({ theme }) => theme.spacing(4)}px;
				}
				.ag-cell {
					padding: 0 !important;
				}
				.ag-body-viewport {
					height: 384px;
					overflow-y: auto;
					overflow-x: hidden;
				}
			`}
			domLayout='autoHeight'
			columnDefs={columnsDef}
			defaultColDef={useMemo(() => ({ editable: true, cellEditor: TextEditor }), [])}
			rowData={useMemo(() => value, [value])}
			readOnlyEdit
			stopEditingWhenCellsLoseFocus
			onCellEditRequest={
				agGridProps?.onCellEditRequest
					? (ev) => agGridProps?.onCellEditRequest?.(ev, { onChange, value })
					: defaultTableProps.onCellEditRequest({ onChange, value })
			}
			onCellEditingStopped={
				agGridProps?.onCellEditingStopped
					? (ev) => agGridProps?.onCellEditingStopped?.(ev, { onChange, value })
					: () => {
							trigger();
					  }
			}
			onRowDataChanged={() => {
				trigger();
			}}
			onPasteEnd={() => {
				trigger();
			}}
			rowSelection='multiple'
			suppressCopyRowsToClipboard
			onGridReady={(params) => {
				params.api.sizeColumnsToFit();
			}}
			onFirstDataRendered={(params) => {
				params.api.sizeColumnsToFit();
			}}
			noRowsOverlayComponent={CustomNoRowsOverlay}
			ref={tableRef}
			processCellForClipboard={agGridProps?.processCellForClipboard ?? defaultTableProps.processCellForClipboard}
			processCellFromClipboard={
				agGridProps?.processCellFromClipboard ?? defaultTableProps.processCellFromClipboard
			}
		/>
	);
}

export interface DropdownOption {
	name: ControllerProps['name'];
	label: string;
	menuItems: MenuItem[];
	onChange?: TextFieldProps['onChange'];
}

interface TimeSeriesInputProps {
	toolbarOperations?: ToolbarOperation[];
	dropdownOptions?: DropdownOption[];
	columnsDef: ColDef[];
	agGridProps?: Partial<Omit<AgGridReactProps, 'onCellEditRequest' | 'onCellEditingStopped'>> &
		Partial<{
			onCellEditRequest: (event, context) => void;
			onCellEditingStopped: (event, context) => void;
		}>;
}

function TimeSeriesInput(props: TimeSeriesInputProps) {
	const { toolbarOperations, dropdownOptions, columnsDef, agGridProps } = props;
	const { control } = useFormContext();
	const tableRef: RefObject<AgGridRef> = useRef(null);
	return (
		<>
			{toolbarOperations || dropdownOptions ? (
				<TimeSeriesToolbar
					operations={toolbarOperations}
					tableRef={tableRef}
					dropdownOptions={dropdownOptions}
				/>
			) : null}
			<Controller
				control={control}
				name='time_series.rows'
				render={({ field: { onChange, value } }) => (
					<TimeSeriesTable
						columnsDef={columnsDef}
						tableRef={tableRef}
						onChange={onChange}
						value={value}
						agGridProps={agGridProps}
					/>
				)}
			/>
		</>
	);
}

export default TimeSeriesInput;
