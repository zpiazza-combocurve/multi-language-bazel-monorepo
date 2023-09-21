/* eslint-disable no-param-reassign */
import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

export function BoeConversion(props) {
	const { boe_conversion, fields, setBoeConversion, onSelect, selected } = props;

	const handleChange = (properties) => {
		const { value, key } = properties;
		boe_conversion[key] = value;
		setBoeConversion(boe_conversion, 'boe_conversion');
	};

	const data = genData({ fieldsObj: fields, state: boe_conversion, handleChange });

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
		<div id='cost-model-detail-inputs' className='boe_conversion_sheet sub-model-detail-sheet'>
			<h2 className='md-text'>BOE Conversion</h2>
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected.boe_conversion_sheet}
				className='on-hover-paper-2 data-sheet-paper'
				onSelect={(sel) => onSelect('boe_conversion_sheet', sel)}
			/>
		</div>
	);
}
