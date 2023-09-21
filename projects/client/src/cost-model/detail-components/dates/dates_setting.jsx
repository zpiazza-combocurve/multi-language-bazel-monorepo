import classNames from 'classnames';
import produce from 'immer';

import ReactDataSheet from '@/components/InptDataSheet';
import { FieldType } from '@/inpt-shared/constants';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

const defaultFpdSourceHierarchy = {
	first_fpd_source: {
		criteria: {
			label: 'Well Header',
			value: 'well_header',
			staticValue: '',
			fieldType: 'static',
			fieldName: 'Well Header',
		},
		value: '',
	},
	second_fpd_source: {
		criteria: {
			label: 'Prod Data',
			value: 'production_data',
			staticValue: '',
			fieldType: 'static',
			fieldName: 'Prod Data',
		},
		value: '',
	},
	third_fpd_source: {
		criteria: {
			label: 'Forecast/Schedule',
			value: 'forecast',
			staticValue: '',
			fieldType: 'static',
			fieldName: 'Forecast/Schedule',
		},
		value: '',
	},
	fourth_fpd_source: {
		criteria: {
			label: 'Not Used',
			value: 'not_used',
			staticValue: '',
			fieldType: 'static',
			fieldName: 'Not Used',
		},
		value: '',
	},
	use_forecast_schedule_when_no_prod: {
		label: 'Yes',
		value: 'yes',
	},
};

export function DatesSetting(props) {
	const { dates_setting, fields, setDatesSetting, onSelect, selected } = props;
	const handleChange = (properties) => {
		const { value, key } = properties;
		dates_setting[key] = value;
		setDatesSetting(dates_setting, 'dates_setting');
	};

	const handleSubChange = (properties) => {
		const { value, key, subKey } = properties;
		const newDatesSetting = produce(dates_setting, (draft) => {
			// handle old model that doesn't have the fpd_source_hierarchy field
			if (!draft[key]) {
				draft[key] = { subItems: defaultFpdSourceHierarchy };
			}
			draft[key].subItems[subKey] = value;
		});

		setDatesSetting(newDatesSetting, 'dates_setting');
	};

	const handleCriteriaChange = (properties) => {
		const { value, key } = properties;
		dates_setting[key].value = value;
		setDatesSetting(dates_setting, 'dates_setting');
	};

	const handleCriteriaSelect = (properties) => {
		const { value, key, fullMenuItem } = properties;
		dates_setting[key].criteria = fullMenuItem || value;
		if (dates_setting[key].criteria.fieldType === FieldType.static) {
			dates_setting[key].value = dates_setting[key].criteria.staticValue;
		} else {
			dates_setting[key].value = '';
		}
		setDatesSetting(dates_setting, 'dates_setting');
	};

	const handleSubCriteriaChange = (props) => {
		const { value, key, subKey } = props;
		const newDatesSetting = produce(dates_setting, (draft) => {
			draft[key].subItems[subKey].value = value;
		});
		setDatesSetting(newDatesSetting, 'dates_setting');
	};

	const handleSubCriteriaSelect = (props) => {
		const { value, key, subKey, fullMenuItem } = props;
		const newDatesSetting = produce(dates_setting, (draft) => {
			// handle old model that doesn't have the fpd_source_hierarchy field
			if (!draft[key]) {
				draft[key] = { subItems: defaultFpdSourceHierarchy };
			}

			const subState = draft[key].subItems[subKey];
			subState.criteria = fullMenuItem || value;
			if (subState.criteria.fieldType === FieldType.static) {
				subState.value = subState.criteria.staticValue;
			} else {
				subState.value = '';
			}
		});
		setDatesSetting(newDatesSetting, 'dates_setting');
	};

	const handlers = {
		'criteria-select': handleCriteriaSelect,
		criteria: handleCriteriaChange,
		subItems: handleSubChange,
		subHandlers: {
			'criteria-select': handleSubCriteriaSelect,
			criteria: handleSubCriteriaChange,
		},
	};
	const data = genData({ fieldsObj: fields, state: dates_setting, handleChange, handlers });

	if (!data || !data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			/* eslint-disable no-param-reassign */
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
			/* eslint-enable no-param-reassign */
		});
	});

	const extra = { ...data[0][0] };
	extra.value = '';
	let maxRowLen = 2;
	data.forEach((d) => {
		if (d.length === 3) {
			maxRowLen = 3;
		}
	});
	if (maxRowLen === 3) {
		data.forEach((d) => {
			if (d.length < 3) {
				d.push(extra);
			}
		});
	}

	return (
		<div id='cost-model-detail-inputs' className='dates_sheet sub-model-detail-sheet'>
			<h2 className='md-text'>Dates Setting</h2>
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected.dates_sheet}
				className='on-hover-paper-2 data-sheet-paper'
				onSelect={(sel) => onSelect('dates_sheet', sel)}
			/>
		</div>
	);
}
