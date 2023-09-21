import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import produce from 'immer';
import { has } from 'lodash-es';
import { Button } from 'react-md';

import ReactDataSheet from '@/components/InptDataSheet';

import { createNewRow, dataRenderer, genData, rowDateRangeChange, valueRenderer } from '../gen-data';

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };

	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];

	if (len >= 2) {
		check.delete = true;
	}
	if (lastRow.escalation_value || lastRow.escalation_value === 0) {
		if (lastRow.criteria && lastRow.criteria.start_date) {
			check.add = true;
		}
		if (lastRow.criteria && lastRow.criteria.period) {
			check.add = true;
		}
	}
	if (check.add || check.delete) {
		check.showBtn = true;
	}

	return check;
}

export function EscalationModel(props) {
	const { escalation_model, fields, setEscalationModel, selected, onSelect } = props;

	const setEM = () => setEscalationModel(escalation_model, 'escalation_model');

	const handleChange = (properties) => {
		const { value, key } = properties;
		setEscalationModel(
			produce(escalation_model, (draft) => {
				draft[key] = value;
			}),
			'escalation_model'
		);
	};

	const handleRowChange = (properties) => {
		const { value, key, index, rowIndex } = properties;
		const ind = index || index === 0 ? index : rowIndex;
		escalation_model.row_view.rows[ind][key] = value;
		setEM();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, fullMenuItem } = properties;
		escalation_model.row_view.headers[key] = value;
		escalation_model.row_view.rows.forEach((r) => {
			/* eslint-disable no-param-reassign */
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
			/* eslint-enable no-param-reassign */
		});
		if (value.value === 'entire_well_life') {
			escalation_model.row_view.rows = [escalation_model.row_view.rows[0]];
		}
		setEM();
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index } = properties;
		const rows = escalation_model.row_view.rows;

		if (!has(rows[index][key], 'start_date')) {
			rows[index][key] = { start_date: '', end_date: '' };
		}
		rowDateRangeChange({ rows, value, key, index });
		setEM();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index } = properties;
		if (!has(escalation_model.row_view.rows[index][key], 'period')) {
			escalation_model.row_view.rows[index][key] = { start: '', end: '', period: '' };
		}

		const len = escalation_model.row_view.rows.length;
		const cur = escalation_model.row_view.rows[index][key];

		cur.period = value;

		if (index === 0) {
			cur.start = 1;
			cur.end = value;
		}

		if (index > 0) {
			const prev = escalation_model.row_view.rows[index - 1][key] || {};
			cur.start = prev.end + 1;
			cur.end = prev.end + value;
		}

		if (value >= 1) {
			let cum = cur.end;
			if (index + 1 !== len) {
				for (let i = index + 1; i < len; i += 1) {
					if (escalation_model.row_view.rows[i][key].period) {
						escalation_model.row_view.rows[i][key].start = cum + 1;
						escalation_model.row_view.rows[i][key].end =
							cum + escalation_model.row_view.rows[i][key].period;
						cum = escalation_model.row_view.rows[i][key].end;
					}
				}
			}
		}
		setEM();
	};

	const addRow = () => {
		const row_view = escalation_model.row_view;
		const columnFields = fields.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		escalation_model.row_view.rows.push(newRow);
		setEM();
	};

	const deleteRow = () => {
		escalation_model.row_view.rows.pop();
		setEM();
	};

	const getAddDeleteItems = (check) => {
		const selKey = 'escalation_sheet';
		return [
			<Button
				icon
				key='add-rev'
				onClick={addRow}
				disabled={!check.add}
				tooltipLabel='Add Row'
				tooltipPosition='top'
				className={classNames(selKey, 'add-row')}
			>
				<FontAwesomeIcon className={classNames(!check.add ? 'themeMe' : 'primary-icon')} icon={faPlus} />
			</Button>,
			<Button
				icon
				key='del-rev'
				onClick={deleteRow}
				tooltipPosition='top'
				disabled={!check.delete}
				tooltipLabel='Delete Row'
				className={classNames(selKey, 'warn-btn-icon delete-row')}
			>
				<FontAwesomeIcon className={classNames(!check.delete ? 'themeMe' : 'warn-icon')} icon={faMinus} />
			</Button>,
		];
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
	};
	const data = genData({ fieldsObj: fields, state: escalation_model, handleChange, handlers });
	const check = checkAddDeleteRow(escalation_model);

	return (
		data && (
			<div id='cost-model-detail-inputs' className='escalation_sheet sub-model-detail-sheet'>
				<h2 className='md-text'>Escalation Model</h2>
				<ReactDataSheet
					className='on-hover-paper-2 data-sheet-paper'
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.escalation_sheet}
					onSelect={(sel) => onSelect('escalation_sheet', sel)}
				/>
				<div id='add-delete-row'>{check.showBtn && getAddDeleteItems(check)}</div>
			</div>
		)
	);
}
