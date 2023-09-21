import { ICellRendererParams } from 'ag-grid-community';

import { ERROR_CELL_CLASS_NAME } from '@/components/AgGrid';
import { Stack, Tooltip } from '@/components/v2';
import { assert } from '@/helpers/utilities';

import { getPreviousDay } from './forms/helpers';
import { useTimeSeriesInputStore } from './helpers';

export enum TimeSeriesTableCellRendererTypes {
	FPD = 'fpd',
	DateRange = 'dateRange',
	DateWindow = 'dateWindow',
	Standard = 'standard',
	Rate = 'timeRate',
}
interface TimeSeriesInputCellRendererProps extends ICellRendererParams {
	type: TimeSeriesTableCellRendererTypes;
	helperFormat: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getDefaultRenderer = (props: any) => {
	const cellValue = (props.valueFormatted ? props.valueFormatted : props.value) ?? '';
	if (!props.column.isCellEditable(props.node)) return <span />;
	return <span>{String(cellValue)}</span>;
};

const RENDERERS: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key in TimeSeriesTableCellRendererTypes]: (props: any) => JSX.Element;
} = {
	[TimeSeriesTableCellRendererTypes.Standard]: (props) => getDefaultRenderer(props),
	[TimeSeriesTableCellRendererTypes.DateRange]: (props) => {
		const cellValue = props.valueFormatted ? props.valueFormatted : props.value;
		const { rowIndex, column } = props;
		const nextRow = props.api.getDisplayedRowAtIndex(rowIndex + 1);
		const colId = column?.getColId();
		assert(colId, 'colId is not defined');
		const endDateHelper = nextRow
			? getPreviousDay(props.api.getValue(colId, nextRow), props.helperFormat)
			: 'Econ Limit';
		return (
			<Stack direction='row' justifyContent='space-between'>
				<span>{cellValue}</span>
				<span
					css={`
						color: ${({ theme }) => theme.palette.text.secondary};
					`}
				>{`- ${endDateHelper}`}</span>
			</Stack>
		);
	},
	[TimeSeriesTableCellRendererTypes.FPD]: (props) => getDefaultRenderer(props),
	[TimeSeriesTableCellRendererTypes.Rate]: (props) => {
		const cellValue = props.valueFormatted ? props.valueFormatted : props.value;

		return (
			<Stack direction='row' justifyContent='space-between'>
				<span>{cellValue}</span>

				{!!props.rate && (
					<span
						css={`
							color: ${({ theme }) => theme.palette.text.secondary};
						`}
					>
						{props.rate}
					</span>
				)}
			</Stack>
		);
	},
	[TimeSeriesTableCellRendererTypes.DateWindow]: (props) => {
		const cellValue = props.valueFormatted ? props.valueFormatted : props.value;
		const { rowIndex, column } = props;
		const nextRow = props.api.getDisplayedRowAtIndex(rowIndex + 1);
		const colId = column?.getColId();
		assert(colId, 'colId is not defined');
		const endDateHelper = nextRow
			? getPreviousDay(props.api.getValue(colId, nextRow), props.helperFormat)
			: 'Econ Limit';
		return (
			<Stack direction='row' justifyContent='space-between'>
				<span>{cellValue}</span>
				<span
					css={`
						color: ${({ theme }) => theme.palette.text.secondary};
					`}
				>{`- ${endDateHelper}`}</span>
			</Stack>
		);
	},
};

/** Renders a cell in the time series input table. Extracts errors from the store and displays them as a tooltip. */
function TimeSeriesInputCellRenderer(props: TimeSeriesInputCellRendererProps) {
	const { column, rowIndex, type } = props;
	const colId = column?.getColId();
	assert(colId, 'colId is not defined');
	const [errors] = useTimeSeriesInputStore((state) => [state.errors]);
	//@ts-expect-error TODO: fix this
	const rowErrors = errors?.time_series?.rows;
	const cellError = rowErrors?.[rowIndex]?.[colId];
	return (
		<Tooltip title={cellError?.message ?? ''}>
			<div
				className={cellError && ERROR_CELL_CLASS_NAME}
				css={`
					padding-left: ${({ theme }) => theme.spacing(1)}px;
					padding-right: ${({ theme }) => theme.spacing(1)}px;
				`}
			>
				{RENDERERS[type ?? TimeSeriesTableCellRendererTypes.Standard](props)}
			</div>
		</Tooltip>
	);
}

export default TimeSeriesInputCellRenderer;
