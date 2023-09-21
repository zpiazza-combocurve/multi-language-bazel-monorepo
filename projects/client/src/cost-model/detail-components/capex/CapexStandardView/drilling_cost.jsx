import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton, SwitchField } from '@/components/v2';
import { GenerateData, createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };

	const len = data.empty_header.subItems.row_view.rows.length;
	const lastRow = data.empty_header.subItems.row_view.rows[len - 1];

	if (len >= 2) {
		check.delete = true;
	}

	if (lastRow.pct_of_total_cost || lastRow.pct_of_total_cost === 0) {
		if (lastRow.criteria || lastRow.criteria === 0) {
			check.add = true;
		}
	}

	if (check.add || check.delete) {
		check.showBtn = true;
	}
	return check;
}

function genData(props) {
	const { fieldsObj, state, omitSection } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'search', 'subItems', 'omitSection', 'selected']);

	const data = [];
	Object.keys(fieldsObj).forEach((key) => {
		if (!ignore.has(key)) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key], omitSection });
		}
	});

	if (!data.length) {
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

	return data;
}

export function DrillingCost(props) {
	const { drilling_cost, fields, setDrillingCost, omitSection, AddDeleteDC, selected, onSelect } = props;

	const setDC = () => setDrillingCost(drilling_cost, 'drilling_cost');

	const handleChange = ({ value, key }) => {
		drilling_cost[key] = value;
		setDC();
	};

	const handleRowChange = ({ value, key, index, stateKey }) => {
		if (drilling_cost[stateKey]) {
			drilling_cost[stateKey].subItems.row_view.rows[index][key] = value;
		}
		setDC();
	};

	const handleRowHeaderChange = ({ value, key, fullMenuItem, stateKey }) => {
		drilling_cost[stateKey].subItems.row_view.headers[key] = value;
		drilling_cost[stateKey].subItems.row_view.rows.forEach((r) => {
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
		setDC();
	};

	const addRow = () => {
		const row_view = drilling_cost.empty_header.subItems.row_view;
		const columnFields = fields.empty_header.subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
		setDC();
	};

	const deleteRow = () => {
		drilling_cost.empty_header.subItems.row_view.rows.pop();
		setDC();
	};

	const getAddDeleteItems = (check, data) => {
		const selKey = 'drilling_cost_sheet';
		const btns = [
			<IconButton
				key='add-rev'
				onClick={addRow}
				disabled={!check.add}
				tooltipPlacement='top'
				tooltipTitle='Add Row'
				className={classNames(selKey, 'add-row')}
			>
				{faPlus}
			</IconButton>,
			<IconButton
				key='del-rev'
				onClick={deleteRow}
				tooltipPlacement='top'
				disabled={!check.delete}
				tooltipTitle='Delete Row'
				className={classNames(selKey, 'warn-btn-icon delete-row')}
			>
				{faMinus}
			</IconButton>,
		];

		data[8][0].rowBtns = btns;
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
	};

	const data = genData({
		fieldsObj: fields,
		state: drilling_cost,
		handlers,
		handleChange,
		omitSection: omitSection.drilling_cost,
	});

	const check = checkAddDeleteRow(drilling_cost);

	if (!omitSection.drilling_cost && check.showBtn) {
		getAddDeleteItems(check, data);
	}

	if (!data) {
		return null;
	}

	return (
		<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
			<div className='cost-model-detail-header-row'>
				<h2 className='md-text reversion-header'>
					<SwitchField
						label='Drilling Cost Model'
						checked={!omitSection.drilling_cost}
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						onChange={(e) => AddDeleteDC(!e.target.checked)}
					/>
				</h2>
			</div>

			<div className='price-data-sheets drilling_cost_sheet'>
				<ReactDataSheet
					className='on-hover-paper-2 data-sheet-paper'
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.drilling_cost_sheet}
					onSelect={(sel) => onSelect('drilling_cost_sheet', sel)}
				/>
			</div>
		</div>
	);
}
