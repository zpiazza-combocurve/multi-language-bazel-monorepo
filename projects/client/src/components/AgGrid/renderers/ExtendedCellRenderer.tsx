import { ICellRendererParams } from '@ag-grid-community/core';
import Box from '@mui/material/Box';

import InfoIcon from '@/components/v2/misc/InfoIcon';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExtendedCellRendererParams<TValue = any> {
	getIcon?: (value: TValue) => JSX.Element | undefined;
	getTooltip?: (value: TValue) => string | undefined;
}

interface ExtendedCellRendererProps extends ICellRendererParams, ExtendedCellRendererParams {}

/**
 * Adds support for tooltips and icons to the default cell renderer.
 *
 * @example
 * 	const tooltips = {
 * 		oil: 'Oil Phase',
 * 		gas: 'Gas Phase',
 * 		water: 'Water Phase',
 * 	};
 * 	const icons = {
 * 		oil: <OilIcon />,
 * 		gas: <GasIcon />,
 * 		water: <WaterIcon />,
 * 	};
 * 	const colDef = {
 * 		refData: {
 * 			oil: 'Oil',
 * 			gas: 'Gas',
 * 			water: 'Water',
 * 		},
 * 		cellRenderer: ExtendedCellRenderer,
 * 		cellRendererParams: {
 * 			getIcon: (value) => icons[value],
 * 			getTooltip: (value) => tooltips[value],
 * 		},
 * 	};
 */
export default function ExtendedCellRenderer(props: ExtendedCellRendererProps) {
	const cellValue = props.valueFormatted ? props.valueFormatted : props.value;
	const icon = props.getIcon?.(props.value);
	const tooltip = props.getTooltip?.(props.value);

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			{icon}
			{cellValue}
			<Box sx={{ flexGrow: 1 }} />
			{tooltip && <InfoIcon tooltipTitle={tooltip} />}
		</Box>
	);
}
