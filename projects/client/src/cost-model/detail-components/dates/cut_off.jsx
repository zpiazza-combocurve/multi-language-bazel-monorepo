import produce from 'immer';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { Typography } from '@/components/v2';
import { SheetItemSpoof } from '@/helpers/sheetItems';
import { FieldType } from '@/inpt-shared/constants';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

const descriptionItem = (title, text) => (
	<li>
		<div>
			<b>{title}</b>: {text}
		</div>
	</li>
);

const InfoDescription = () => (
	<>
		<Typography variant='h5' css='color: inherit; margin: 0.5rem;'>
			End to economic life based on criteria triggers:
		</Typography>
		<ul>
			{descriptionItem('Max Cum Cash Flow', '(most common) Maximize NPV at the specified Discount %.')}
			{descriptionItem(
				'First Negative Cash Flow',
				'Only use for very aggressive econ cut off.  Any monthly Revenue – Expenses < 0 will shut in well.'
			)}
			{descriptionItem('Last Positive Cash Flow', 'Shut in well when the last positive cash flow exists.')}
			{descriptionItem('No Cut Off', 'Run to Max Econ Life regardless of forecast end or economics.')}
			{descriptionItem(
				'Oil Rate, Gas Rate, Water Rate',
				'Shut in well when the prod stream reaches the specified rate. Items imported from other programs may default with a very small value if imported with “No Cut Off” so that the minor phases end at same time as major phase.'
			)}
			{descriptionItem('Date', 'Specifies a hardcoded date to cut off economics.')}
		</ul>
	</>
);

export function CutOff(props) {
	const { cut_off, fields, setCutOff, onSelect, selected } = props;

	const handleChange = (properties) => {
		const { value, key } = properties;
		const newCutOff = produce(cut_off, (draft) => {
			draft[key] = value;
		});
		setCutOff(newCutOff, 'cut_off');
	};

	const handleCriteriaChange = (properties) => {
		const { value, key } = properties;
		const newCutOff = produce(cut_off, (draft) => {
			draft[key].value = value;
		});
		setCutOff(newCutOff, 'cut_off');
	};

	const handleCriteriaSelect = (properties) => {
		const { value, key, fullMenuItem } = properties;

		const newCutOff = produce(cut_off, (draft) => {
			if (!(key in draft)) {
				// when key is missing from object
				draft[key] = {};
			}
			draft[key].criteria = fullMenuItem || value;
			if (draft[key].criteria.fieldType === FieldType.static) {
				draft[key].value = draft[key].criteria.staticValue;
			} else {
				draft[key].value = '';
			}
		});

		setCutOff(newCutOff, 'cut_off');
	};

	const handlers = { 'criteria-select': handleCriteriaSelect, criteria: handleCriteriaChange };
	const data = genData({ fieldsObj: fields, state: cut_off, handleChange, handlers });

	if (!data || !data.length) {
		return false;
	}

	const extraCol = {
		dataEditor: SheetItemSpoof,
		readOnly: true,
		className: 'read-only',
		value: '',
	};

	// add empty cell to table to make each row have same number of cells
	let maxRowLen = 0;
	data.forEach((d) => {
		if (d.length > maxRowLen) {
			maxRowLen = d.length;
		}
	});

	data.forEach((d_row) => {
		const addColNumber = maxRowLen - d_row.length;
		if (d_row.length < maxRowLen) {
			for (let i = 0; i < addColNumber; i++) {
				d_row.push(extraCol);
			}
		}
	});

	return (
		<div id='cost-model-detail-inputs' className='cut_off_sheet sub-model-detail-sheet'>
			<Header>
				<h2 className='md-text'>Cut Off</h2>
				<InfoTooltip labelTooltip={<InfoDescription />} fontSize='18px' />
			</Header>
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected.cut_off_sheet}
				className='on-hover-paper-2 data-sheet-paper'
				onSelect={(sel) => onSelect('cut_off_sheet', sel)}
			/>
		</div>
	);
}
