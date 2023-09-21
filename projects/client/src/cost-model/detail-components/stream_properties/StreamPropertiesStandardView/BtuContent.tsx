import classNames from 'classnames';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import { genData } from '@/cost-model/detail-components/helper';
import { BtuContentProps } from '@/cost-model/detail-components/stream_properties/StreamPropertiesStandardView/types';

const description = (
	<ul>
		<li>
			<div>
				<b>BTU Content</b>: Make sure these are correct if gas price is specified in $/MMBTU; Unshrunk Gas
				impacts Expenses only and Shrunk Gas impacts Revenues and possibly Expenses
			</div>
		</li>
	</ul>
);

export function BtuContent(props: BtuContentProps): JSX.Element | null {
	const { btu_content, fields, setBtuContent, selected, onSelect } = props;

	const handleChange = (properties) => {
		const { value, key } = properties;
		btu_content[key] = value;
		setBtuContent(btu_content, 'btu_content');
	};
	const data = genData({ fieldsObj: fields, state: btu_content, handleChange });

	if (!data || !data.length) {
		return null;
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
		<div id='cost-model-detail-inputs' className='btu_content_sheet sub-model-detail-sheet'>
			<Header>
				<h2 className='md-text'>BTU Content</h2>
				<InfoTooltip labelTooltip={description} fontSize='18px' />
			</Header>
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected.btu_content_sheet}
				className='on-hover-paper-2 data-sheet-paper'
				onSelect={(sel) => onSelect('btu_content_sheet', sel)}
			/>
		</div>
	);
}
