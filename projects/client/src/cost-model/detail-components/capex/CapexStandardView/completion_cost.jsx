import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton, SwitchField } from '@/components/v2';
import { GenerateData, createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';

function checkAddDeleteRow(data) {
	const check = {
		showBtn: false,
		showAdd: false,
		showDel: false,
		horizontal: { add: false, delete: false, rows: data.dollar_per_ft_of_horizontal.subItems.row_view.rows },
		criteria: { add: false, delete: false, rows: data.empty_header.subItems.row_view.rows },
	};
	const ignore = new Set(['showBtn', 'showAdd', 'showDel']);

	Object.keys(check).forEach((c) => {
		if (!ignore.has(c)) {
			const phase = check[c];
			const len = phase.rows.length;
			const lastRow = phase.rows[len - 1];
			if (len >= 2) {
				phase.delete = true;
			}
			if (lastRow.pct_of_total_cost || lastRow.pct_of_total_cost === 0) {
				if (lastRow.criteria || lastRow.criteria === 0) {
					phase.add = true;
				}
			}
			if (lastRow.prop_ll || lastRow.prop_ll === 0) {
				if (lastRow.unit_cost || lastRow.unit_cost === 0) {
					phase.add = true;
				}
			}
			delete phase.rows;
			if (phase.add) {
				check.showAdd = true;
			}
			if (phase.delete) {
				check.showDel = true;
			}
			if (phase.add || phase.delete) {
				check.showBtn = true;
			}
		}
	});
	return check;
}

// const empty_header = { check: 'criteria'};
// const dollar_per_ft_of_horizontal = {check: 'horizontal'};

const inlineBtnInfo = {
	empty_header: { check: 'criteria' },
	dollar_per_ft_of_horizontal: { check: 'horizontal' },
};

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

	let prevRow = false;
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

			if (col.value === 'Fixed Cost') {
				prevRow = false;
			}

			if (col.value === '$/FT PLL') {
				inlineBtnInfo.dollar_per_ft_of_horizontal.row = rowIndex;
				inlineBtnInfo.dollar_per_ft_of_horizontal.col = colIndex;
				prevRow = 'list-item-dollar_per_ft_of_horizontal';
			}

			if (col.value === 'Cost Schedule') {
				inlineBtnInfo.empty_header.row = rowIndex;
				inlineBtnInfo.empty_header.col = colIndex;
				prevRow = 'list-item-empty_header';
			}

			col.className = classNames(
				prevRow,
				col.className,
				`i_${rowIndex}`,
				`j_${colIndex}`,
				col.lastCol && 'last_col',
				col.lastRow && 'last_row',
				col.lastCell && 'last_cell',
				!rowIndex && !colIndex && 'read-only'
			);
		});
		/* eslint-enable no-param-reassign */
	});

	return data;
}

export function CompletionCost(props) {
	const { completion_cost, fields, setCompletionCost, omitSection, AddDeleteCC, selected, onSelect } = props;

	const setDC = () => setCompletionCost(completion_cost, 'completion_cost');

	const handleChange = ({ value, key }) => {
		completion_cost[key] = value;
		setDC();
	};

	const handleRowChange = ({ value, key, index, stateKey }) => {
		completion_cost[stateKey].subItems.row_view.rows[index][key] = value;
		setDC();
	};

	const handleRowHeaderChange = ({ value, key, fullMenuItem, stateKey }) => {
		completion_cost[stateKey].subItems.row_view.headers[key] = value;
		completion_cost[stateKey].subItems.row_view.rows.forEach((r) => {
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

	const addRow = (stateKey) => {
		const row_view = completion_cost[stateKey].subItems.row_view;
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
		setDC();
	};

	const deleteRow = (stateKey) => {
		completion_cost[stateKey].subItems.row_view.rows.pop();
		setDC();
	};

	const getAddDeleteItems = (check, inline, data) => {
		const btnInfo = inlineBtnInfo[inline];
		// const selKey = 'completion_cost_sheet';
		const addDisabled = !check.showAdd || !check[btnInfo.check].add;
		const delDisabled = !check.showDel || !check[btnInfo.check].delete;

		const { row, col } = btnInfo;

		const btns = [
			<IconButton disabled={addDisabled} key={`${inline}-add-row`} onClick={() => addRow(inline)} color='primary'>
				{faPlus}
			</IconButton>,
			<IconButton
				disabled={delDisabled}
				key={`${inline}-del-row`}
				onClick={() => deleteRow(inline)}
				color='warning'
			>
				{faMinus}
			</IconButton>,
		];

		// eslint-disable-next-line no-param-reassign
		data[row][col].rowBtns = btns;
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
	};

	const data = genData({
		fieldsObj: fields,
		state: completion_cost,
		handlers,
		handleChange,
		omitSection: omitSection.completion_cost,
	});

	const check = checkAddDeleteRow(completion_cost);

	if (!omitSection.completion_cost && check.showBtn) {
		getAddDeleteItems(check, 'empty_header', data);
		getAddDeleteItems(check, 'dollar_per_ft_of_horizontal', data);
	}

	if (!data) {
		return null;
	}

	return (
		<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
			<div className='cost-model-detail-header-row'>
				<h2 className='md-text reversion-header'>
					<SwitchField
						label='Completion Cost Model'
						checked={!omitSection.completion_cost}
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						onChange={(e) => AddDeleteCC(!e.target.checked)}
					/>
				</h2>
			</div>
			<div className='price-data-sheets completion_cost_sheet'>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.completion_cost_sheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('completion_cost_sheet', sel)}
				/>
			</div>
		</div>
	);
}
