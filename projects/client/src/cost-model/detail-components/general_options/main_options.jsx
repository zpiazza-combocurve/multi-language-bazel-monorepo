/* eslint-disable no-param-reassign */
import produce from 'immer';

import ReactDataSheet from '@/components/InptDataSheet';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

export function MainOptions(props) {
	const { main_options, fields, setMainOptions, setOmitSection, onSelect, selected } = props;

	const handleChange = (properties) => {
		const { value, key, fullMenuItem } = properties;
		const newMainOptions = produce(main_options, (draft) => {
			draft[key] = fullMenuItem || value;
			if (key === 'reporting_period') {
				if (value.value === 'fiscal') {
					// set fiscal year to default when using fiscal as reporting period
					draft.fiscal = {
						label: 'JUN - MAY',
						value: '5-4',
					};
				}
			}
		});
		setMainOptions(newMainOptions, 'main_options');

		if (key === 'income_tax') {
			if (value.value === 'yes') {
				setOmitSection('income_tax', false);
			} else if (value.value === 'no') {
				setOmitSection('income_tax', true);
			}
		}
	};

	const data = genData({ fieldsObj: fields, state: main_options, handleChange });

	return (
		data && (
			<div id='cost-model-detail-inputs' className='main_options_sheet sub-model-detail-sheet'>
				<h2 className='md-text'>Main Settings</h2>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.main_options_sheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('main_options_sheet', sel)}
				/>
			</div>
		)
	);
}
