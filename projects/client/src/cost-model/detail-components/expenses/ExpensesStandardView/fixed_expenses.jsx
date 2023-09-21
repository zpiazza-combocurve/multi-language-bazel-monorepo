/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { Component } from 'react';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { defaultHandlePasteCells, getSelectValueProps, parseValue } from '@/cost-model/detail-components/copy-paste';
import { createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import {
	addDeleteRow,
	genData,
	rowDateRangeChange,
	rowNumberRangeChange,
	rowNumberRangeRateChange,
} from '@/cost-model/detail-components/helper';

const description = (
	<ul>
		<li>
			<div>Negative expenses will be treated as revenue</div>
		</li>
	</ul>
);

const fixedExpKeys = [
	'monthly_well_cost',
	'other_monthly_cost_1',
	'other_monthly_cost_2',
	'other_monthly_cost_3',
	'other_monthly_cost_4',
	'other_monthly_cost_5',
	'other_monthly_cost_6',
	'other_monthly_cost_7',
	'other_monthly_cost_8',
];

function checkAddDeleteRow(fixed_expense) {
	const check = fixedExpKeys.reduce(
		(a, key) => ({
			...a,
			[key]: {
				add: false,
				delete: false,
				showBtn: false,
				rows: fixed_expense[key].subItems.row_view.rows,
			},
		}),
		{}
	);

	const rowValueKey = 'fixed_expense';

	addDeleteRow({ check, rowValueKey });

	return check;
}

export class FixedExpenses extends Component {
	state = {
		popBool: false,
		collapse: {},
	};

	setCollapseState = (partial) =>
		this.setState((state) => ({
			collapse: { ...state.collapse, ...partial },
		}));

	setFE = () => {
		const { fixed_expenses, setFixedExpenses } = this.props;
		setFixedExpenses(fixed_expenses, 'fixed_expenses');
	};

	applySubChange = ({ value, stateKey, subKey }) => {
		const { fixed_expenses } = this.props;
		fixed_expenses[stateKey].subItems[subKey] = value;
	};

	handleSubChange = (props) => {
		this.applySubChange(props);
		this.setFE();
	};

	applyRowHeaderChange = ({ value, stateKey, key, fullMenuItem }) => {
		const { fixed_expenses } = this.props;
		if (key === 'category') {
			fixed_expenses[key] = value;
		} else {
			fixed_expenses[stateKey].subItems.row_view.headers[key] = value;
			fixed_expenses[stateKey].subItems.row_view.rows.forEach((r) => {
				if (fullMenuItem.Default || fullMenuItem.Default === 0) {
					r[key] = fullMenuItem.Default;
				} else if (fullMenuItem.staticValue) {
					r[key] = fullMenuItem.staticValue;
				} else {
					r[key] = '';
				}
			});
			if (value.value === 'entire_well_life') {
				fixed_expenses[stateKey].subItems.row_view.rows = [fixed_expenses[stateKey].subItems.row_view.rows[0]];
			}
		}
	};

	handleRowHeaderChange = (props) => {
		this.applyRowHeaderChange(props);
		this.setFE();
	};

	applyRowChange = ({ value, key, stateKey, index }) => {
		const { fixed_expenses } = this.props;
		fixed_expenses[stateKey].subItems.row_view.rows[index][key] = value;
	};

	handleRowChange = (props) => {
		this.applyRowChange(props);
		this.setFE();
	};

	applyRowDateRangeChange = ({ value, key, stateKey, index }) => {
		const { fixed_expenses } = this.props;
		const rows = fixed_expenses[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	handleRowDateRangeChange = (props) => {
		this.applyRowDateRangeChange(props);
		this.setFE();
	};

	applyRowNumberRangeChange = ({ value, key, stateKey, index }) => {
		const { fixed_expenses } = this.props;
		const rows = fixed_expenses[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	handleRowNumberRangeChange = (props) => {
		this.applyRowNumberRangeChange(props);
		this.setFE();
	};

	applyRowNumberRangeRateChange = ({ value, key, index, stateKey }) => {
		const { fixed_expenses } = this.props;
		const rows = fixed_expenses[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
	};

	handleRowNumberRangeRateChange = (propz) => {
		this.applyRowNumberRangeRateChange(propz);
		this.setFE();
	};

	applyAddRow = (categoryKey) => {
		const { fields, fixed_expenses } = this.props;
		const row = fixed_expenses[categoryKey].subItems.row_view.rows[0];
		const columnFields = fields[categoryKey].subItems.row_view.columns;
		const newRow = createNewRow(row, columnFields);
		fixed_expenses[categoryKey].subItems.row_view.rows.push(newRow);
	};

	handleAddRow = (categoryKey) => {
		this.applyAddRow(categoryKey);
		this.setFE();
	};

	applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				this.applyRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				return;
			case 'number-range':
				this.applyRowNumberRangeChange({ ...meta, value });
				return;
			case 'number-range-rate':
				this.applyRowNumberRangeRateChange({ ...meta, value });
				return;
			default:
				if (meta.subKey === 'row_view') {
					const selectProps = getSelectValueProps(meta, rawValue);
					if (selectProps) {
						this.applyRowHeaderChange({ ...meta, ...selectProps });
					}
					return;
				}
				if (meta.index || meta.index === 0) {
					this.applyRowChange({ ...meta, value });
					return;
				}
				this.applyChange?.({
					...meta,
					value,
					...getSelectValueProps(meta, rawValue),
				});
		}
	};

	handlePasteCells = (categoryKey, changes, additions) => {
		const { fixed_expenses } = this.props;
		const onlyFirstRow =
			fixed_expenses[categoryKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => this.applyAddRow(categoryKey),
			changeCell: this.applyChangeCell,
			onlyFirstRow,
		});

		this.setFE();
	};

	handleDeleteRow = (categoryKey) => {
		const { fixed_expenses } = this.props;
		fixed_expenses[categoryKey].subItems.row_view.rows.pop();
		const new_rows = fixed_expenses[categoryKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		this.setFE();
	};

	getAddDeleteItems = (check, categoryKey) => {
		return [
			<Button
				icon
				key='add-rev'
				tooltipPosition='top'
				tooltipLabel='Add Row'
				disabled={!check[categoryKey].add}
				onClick={() => this.handleAddRow(categoryKey)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				icon
				key='del-rev'
				tooltipPosition='top'
				tooltipLabel='Delete Row'
				disabled={!check[categoryKey].delete}
				onClick={() => this.handleDeleteRow(categoryKey)}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	renderSheet = (categoryKey, data) => {
		const { selected, onSelect } = this.props;
		const selKey = `fixed_exp_${categoryKey}_sheet`;

		return (
			<InptDataSheet
				data={data}
				selKey={selKey}
				onSelect={onSelect}
				selected={selected[selKey]}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				className='on-hover-paper-2 data-sheet-paper var-exp'
				onPasteCells={(changes, additions) => this.handlePasteCells(categoryKey, changes, additions)}
			/>
		);
	};

	changePopBool = () => {
		this.setState((state) => ({
			popBool: !state.popBool,
		}));
	};

	renderFixedExp = (categoryChoice, popBool, allData, check, fixedExpKey) => {
		return (
			(categoryChoice === fixedExpKey || popBool === true) && (
				<div className={`fixed_exp_${fixedExpKey}_sheet expense-table-container`}>
					{this.renderSheet(fixedExpKey, allData[fixedExpKey])}
					<div id='add-delete-row'>
						{check[fixedExpKey].showBtn && this.getAddDeleteItems(check, fixedExpKey)}
					</div>
				</div>
			)
		);
	};

	render() {
		const { setCollapseState } = this;
		const { collapse: collapseState, popBool } = this.state;
		const { fields, fixed_expenses, selected, onSelect } = this.props;
		const handlers = {
			row: this.handleRowChange,
			subItems: this.handleSubChange,
			rowHeader: this.handleRowHeaderChange,
			'date-range': this.handleRowDateRangeChange,
			'number-range': this.handleRowNumberRangeChange,
			'number-range-rate': this.handleRowNumberRangeRateChange,
		};

		const allData = {};
		Object.keys(fields).forEach((key) => {
			allData[key] = genData({
				fieldsObj: { [key]: fields[key] },
				state: { [key]: fixed_expenses[key] },
				handleChange: this.handleChange,
				handlers,
				collapseState,
				setCollapseState,
				addHeader: false,
			});
		});

		const check = checkAddDeleteRow(fixed_expenses);

		if (!allData) {
			return null;
		}

		const categoryChoice = fixed_expenses.category.value;

		return (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Fixed Expenses</h2>
					<InfoTooltip labelTooltip={description} fontSize='18px' />
				</Header>
				<div className='price-data-sheets fixed_exp_category_select_sheet phase-cat-selects'>
					<ReactDataSheet
						data={allData.category}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.fixed_exp_category_select_sheet}
						className='on-hover-paper-2 data-sheet-paper var-exp'
						onSelect={(sel) => onSelect('fixed_exp_category_select_sheet', sel)}
					/>
					<Button
						key='expand-var-expense'
						onClick={() => {
							this.changePopBool();
						}}
						disabled={false}
						tooltipLabel='Expand Fixed Expense'
						tooltipPosition='top'
						primary
						faIcon={faPlus}
					/>
				</div>
				<div className='price-data-sheets main-expense-options'>
					{fixedExpKeys.map((key) => this.renderFixedExp(categoryChoice, popBool, allData, check, key))}
				</div>
			</div>
		);
	}
}
