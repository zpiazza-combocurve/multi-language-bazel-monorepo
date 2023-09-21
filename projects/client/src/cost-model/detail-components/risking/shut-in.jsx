/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import produce from 'immer';
import { has } from 'lodash-es';
import { Button } from 'react-md';

import ReactDataSheet from '@/components/InptDataSheet';
import { makeLocal } from '@/helpers/date';
import { FieldType } from '@/inpt-shared/constants';

import { clone } from '../../../helpers/utilities';
import { dataRenderer, getShutInMaxDate, valueRenderer } from '../gen-data';
import { genData } from '../helper';

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };
	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];

	if (len > 0) {
		check.delete = true;
	}
	if (lastRow) {
		if (
			lastRow.multiplier &&
			lastRow.criteria &&
			((lastRow.criteria.start_date && lastRow.criteria.end_date) ||
				(lastRow.criteria.start && lastRow.criteria.end))
		) {
			check.add = true;
		}
	} else {
		check.add = true;
	}
	if (check.add || check.delete) {
		check.showBtn = true;
	}

	return check;
}

export function ShutInModel(props) {
	const { shutIn, fields, setShutIn, selected, onSelect } = props;

	const setSI = () => setShutIn(shutIn, 'shutIn');

	const handleRowChange = ({ value, key, index, currRow }) => {
		shutIn.row_view.rows[index][key] = value;

		const updatedShutIn = produce(shutIn, (draft) => {
			draft.row_view.rows[index][key] = value;
		});

		// special handle for repeat
		if (key === 'repeat_range_of_dates') {
			if (currRow?.criteria?.start_date && currRow?.criteria?.end_date) {
				const startDate = new Date(currRow.criteria.start_date);
				const endDate = new Date(currRow.criteria.end_date);
				const maxDate = getShutInMaxDate(currRow, startDate);
				if (maxDate && endDate.getTime() > maxDate.getTime()) {
					updatedShutIn.row_view.rows[index].criteria.end_date = '';
					updatedShutIn.row_view.rows[index][key] = value;
				}
			}
			if (currRow?.repeat_range_of_dates?.value === 'no_repeat') {
				updatedShutIn.row_view.rows[index].total_occurrences = 1;
			}
		}

		// special handle for econ limit
		if (currRow?.scale_post_shut_in_end_criteria?.value === 'econ_limit') {
			updatedShutIn.row_view.rows[index].scale_post_shut_in_end = ' ';
		}

		setShutIn(updatedShutIn, 'shutIn');
	};

	const handleRowNumberStart = ({ value, key, index }) => {
		if (!has(shutIn.row_view.rows[index][key], 'start')) {
			shutIn.row_view.rows[index][key] = { start: '', end: '' };
		}
		shutIn.row_view.rows[index][key].start = value;

		const end_number = shutIn.row_view.rows[index][key].end;
		if (end_number && value > end_number) {
			shutIn.row_view.rows[index][key].end = '';
		}

		setSI();
	};

	const handleRowNumberEnd = ({ value, key, index }) => {
		if (!has(shutIn.row_view.rows[index][key], 'end')) {
			shutIn.row_view.rows[index][key] = { start: '', end: '' };
		}
		shutIn.row_view.rows[index][key].end = value;
		setSI();
	};

	const handleRowDateStart = ({ value, key, index }) => {
		if (!has(shutIn.row_view.rows[index][key], 'start_date')) {
			shutIn.row_view.rows[index][key] = { start_date: '', end_date: '' };
		}
		// date pass in from datePicker of SheetItemDate (asUtc)
		shutIn.row_view.rows[index][key].start_date = makeLocal(value).toLocaleDateString();

		const end_date = shutIn.row_view.rows[index][key].end_date;
		if (end_date && new Date(value) > new Date(end_date)) {
			shutIn.row_view.rows[index][key].end_date = '';
		}

		setSI();
	};

	const handleRowDateEnd = ({ value, key, index }) => {
		if (!has(shutIn.row_view.rows[index][key], 'end_date')) {
			shutIn.row_view.rows[index][key] = { start_date: '', end_date: '' };
		}
		// date pass in from datePicker of SheetItemDate (asUtc)
		shutIn.row_view.rows[index][key].end_date = makeLocal(value).toLocaleDateString();

		const scale_end_date = shutIn.row_view.rows[index].scale_post_shut_in_end;
		if (scale_end_date && new Date(value) >= new Date(scale_end_date)) {
			shutIn.row_view.rows[index].scale_post_shut_in_end = '';
		}
		setSI();
	};

	const handleRowHeaderChange = ({ value, key, fullMenuItem }) => {
		shutIn.row_view.headers[key] = value;
		shutIn.row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else {
				r[key] = '';
				r['scale_post_shut_in_end'] = ' ';
				r['scale_post_shut_in_end_criteria'] = 'econ_limit';
			}
		});
		setSI();
	};

	const addRow = () => {
		const r = {};
		const allField = clone(fields.row_view.columns);

		Object.keys(allField).forEach((k) => {
			const colField = allField[k];
			if (colField.fieldType === FieldType.headerSelect) {
				r[k] = '';
			} else if (colField.fieldType === FieldType.postShutInEnd) {
				r[k] = ' ';
			} else if (colField.fieldType === FieldType.postShutInEndCriteria) {
				r[k] = 'econ_limit';
			} else {
				r[k] = colField.Default || colField.Default === 0 ? colField.Default : '';
			}
		});
		shutIn.row_view.rows.push(r);
		setSI();
	};

	const deleteRow = () => {
		shutIn.row_view.rows.pop();
		setSI();
	};

	const getAddDeleteItems = (check) => {
		const selKey = `shutInSheet`;
		return [
			<Button
				icon
				key='add-rev'
				onClick={addRow}
				disabled={!check.add}
				tooltipPosition='bottom'
				tooltipLabel='Add Row'
				className={classNames(selKey, 'add-row')}
			>
				<FontAwesomeIcon className={classNames(!check.add ? 'themeMe' : 'primary-icon')} icon={faPlus} />
			</Button>,
			<Button
				icon
				key='del-rev'
				onClick={deleteRow}
				tooltipPosition='bottom'
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
		'date-range-start': handleRowDateStart,
		'date-range-end': handleRowDateEnd,
		'number-range-start': handleRowNumberStart,
		'number-range-end': handleRowNumberEnd,
	};

	const data = genData({ fieldsObj: fields, state: shutIn, handlers });

	if (!data.length) {
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

	const check = checkAddDeleteRow(shutIn);

	return (
		<div id='cost-model-detail-inputs' className='shutInSheet sub-model-detail-sheet'>
			<h2 className='md-text'>Insert Shut-in Period</h2>
			<div className='data-sheet-paper'>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.shutInSheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('shutInSheet', sel)}
				/>
			</div>
			<div id='add-delete-row'>{check.showBtn && getAddDeleteItems(check)}</div>
		</div>
	);
}
