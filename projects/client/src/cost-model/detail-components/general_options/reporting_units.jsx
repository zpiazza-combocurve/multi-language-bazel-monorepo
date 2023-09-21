/* eslint-disable no-param-reassign */
import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

export function ReportingUnits(props) {
	const { reporting_units, fields, setReportingUnits, onSelect, selected } = props;

	const handleChange = (properties) => {
		const { value, key } = properties;
		reporting_units[key] = value;
		setReportingUnits(reporting_units, 'reporting_units');
	};

	const data = genData({ fieldsObj: fields, state: reporting_units, handleChange });

	if (!data || !data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			col.i = rowIndex;
			col.j = colIndex;
			col.lastCol = lastCol === colIndex;
			col.lastRow = lastRow === rowIndex;
			col.lastCell = lastRow === rowIndex && col.lastCol;
			col.className = classNames(
				col.className,
				`i_${rowIndex}`,
				`j_${colIndex}`,
				col.lastCol && 'last_col',
				col.lastRow && 'last_row',
				col.lastCell && 'last_cell',
				!rowIndex && !colIndex && 'read-only'
			);
		});
	});

	return (
		<div id='cost-model-detail-inputs' className='reporting_units_sheet sub-model-detail-sheet'>
			<h2 className='md-text'>Reporting Units</h2>
			<ReactDataSheet
				className='on-hover-paper-2 data-sheet-paper'
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected.reporting_units_sheet}
				onSelect={(sel) => onSelect('reporting_units_sheet', sel)}
			/>
		</div>
	);
}
