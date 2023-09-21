/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import produce from 'immer';
import _ from 'lodash';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { useMergedState } from '@/components/hooks';

import { defaultHandlePasteCells, getSelectValueProps, parseValue } from '../copy-paste';
import { GenerateData, createNewRow, dataRenderer, valueRenderer } from '../gen-data';
import { addDeleteRow, rowDateRangeChange, rowNumberRangeChange } from '../helper';

const SCOPES = ['state_income_tax', 'federal_income_tax'];

function genData(props) {
	const { fieldsObj, state, omitSection } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'selectedName', 'search', 'omitSection', 'selected']);

	const data = [];
	Object.keys(state).forEach((key) => {
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

	return data;
}

export function IncomeTax(props) {
	const { income_tax, fields, setIncomeTax, onSelect, selected } = props;

	const setParent = () => setIncomeTax(income_tax, 'income_tax');

	const applyRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		income_tax[stateKey].subItems.row_view.rows[index][key] = value;
	};

	const handleRowChange = (properties) => {
		applyRowChange(properties);
		setParent();
	};

	const handleChange = (properties) => {
		const { value, key } = properties;
		setIncomeTax(
			produce(income_tax, (draft) => {
				draft[key] = value;
			}),
			'income_tax'
		);
	};

	const [collapseState, changeCollapseState] = useMergedState({});
	const setCollapseState = (partial) => changeCollapseState({ ...partial });

	const applyRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;
		const row_view = income_tax[stateKey].subItems.row_view;

		row_view.headers[key] = value;

		row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});

		if (value.value === 'entire_well_life') {
			row_view.rows = [row_view.rows[0]];
		}
	};

	const handleRowHeaderChange = (properties) => {
		applyRowHeaderChange(properties);
		setParent();
	};

	const checkAddDeleteRow = (income_tax) => {
		const check = SCOPES.reduce(
			(a, key) => ({
				...a,
				[key]: {
					add: false,
					delete: false,
					showBtn: false,
					rows: income_tax[key].subItems.row_view.rows,
				},
			}),
			{}
		);

		const rowValueKey = 'multiplier';

		addDeleteRow({ check, rowValueKey });

		return check;
	};

	const applyAddRow = (phase) => {
		const row_view = income_tax[phase].subItems.row_view;
		const columnFields = fields[phase].subItems.row_view.columns;

		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);

		row_view.rows.push(newRow);
	};

	const handleAddRow = (phase) => {
		applyAddRow(phase);
		setParent();
	};

	const handleSubChange = (properties) => {
		const { value, key, subKey } = properties;
		income_tax[key].subItems[subKey] = value;
		setParent();
	};

	const applyRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = income_tax[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	const handleRowDateRangeChange = (properties) => {
		applyRowDateRangeChange(properties);
		setParent();
	};

	const applyRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = income_tax[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	const handleRowNumberRangeChange = (properties) => {
		applyRowNumberRangeChange(properties);
		setParent();
	};

	const handlers = {
		subItems: handleSubChange,
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
	};

	const data = {};

	Object.keys(fields).forEach((scope) => {
		data[scope] = genData({
			fieldsObj: { [scope]: fields[scope] },
			state: { [scope]: income_tax[scope] },
			handlers,
			handleChange,
			collapseState,
			setCollapseState,
		});
	});

	const applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				applyRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				return;
			case 'number-range':
				applyRowNumberRangeChange({ ...meta, value });
				return;
			default:
				if (meta.subKey === 'row_view') {
					const selectProps = getSelectValueProps(meta, rawValue);
					if (selectProps) {
						applyRowHeaderChange({ ...meta, ...selectProps });
					}
					return;
				}
				if (meta.index || meta.index === 0) {
					applyRowChange({ ...meta, value });
				}
		}
	};

	const handlePasteCells = (phase, changes, additions) => {
		const onlyFirstRow = income_tax[phase].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => applyAddRow(phase),
			changeCell: applyChangeCell,
			onlyFirstRow,
		});

		setParent();
	};

	const deleteRow = (phase) => {
		const row_view = income_tax[phase].subItems.row_view;

		row_view.rows.pop();
		const new_rows = row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setParent();
	};

	const getAddDeleteItems = (allCheck, phase) => {
		return [
			<Button
				key='add-rev'
				tooltipPosition='top'
				tooltipLabel='Add Row'
				disabled={!allCheck[phase].add}
				onClick={() => handleAddRow(phase)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				key='del-rev'
				tooltipPosition='top'
				tooltipLabel='Delete Row'
				disabled={!allCheck[phase].delete}
				onClick={() => deleteRow(phase)}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	const renderScopeSheet = (scope, data) => {
		const selKey = `income_tax_${scope}_sheet`;
		return (
			<InptDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected[selKey]}
				onSelect={(sel) => onSelect(selKey, sel)}
				className='on-hover-paper-2 data-sheet-paper'
				onPasteCells={(changes, additions) => handlePasteCells(scope, changes, additions)}
			/>
		);
	};

	const renderIncomeTax = (data, allCheck) => {
		return (
			<>
				<div className='price-data-sheets main-expense-options fifteen-selection-container'>
					<div key='fifteen_depletion' className={`$'fifteen_depletion_sheet fifteen-selection-container`}>
						{renderScopeSheet('fifteen_depletion', data['fifteen_depletion'])}
						{renderScopeSheet('carry_forward', data['carry_forward'])}
					</div>
				</div>
				<div className='price-data-sheets main-expense-options'>
					{SCOPES.map((scope) => (
						<div key={scope} className={`$${scope}_sheet expense-table-container`}>
							{renderScopeSheet(scope, data[scope])}
							{allCheck[scope].showBtn && getAddDeleteItems(allCheck, scope)}
						</div>
					))}
				</div>
			</>
		);
	};

	const check = checkAddDeleteRow(income_tax);

	Object.keys(fields).forEach((scope) => {
		data[scope] = genData({
			fieldsObj: { [scope]: fields[scope] },
			state: { [scope]: income_tax[scope] },
			handlers,
			handleChange,
			collapseState,
			setCollapseState,
		});
	});

	const dataByScope = {};

	const incomeTaxOptions = Object.values(_.pickBy(dataByScope, (val, key) => !SCOPES.includes(key))).reduce(
		(arr, element) => {
			return arr.concat(element);
		},
		[]
	);

	return (
		<div id='cost-model-detail-inputs' className='income_tax_sheet sub-model-detail-sheet'>
			<Header>
				<h2 className='md-text'>Income Tax</h2>
			</Header>
			<div className='income_tax_sheet sub-model-detail-sheet'>
				<ReactDataSheet
					data={incomeTaxOptions}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.income_tax_sheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('income_tax_sheet', sel)}
				/>
				{renderIncomeTax(data, check)}
			</div>
		</div>
	);
}
