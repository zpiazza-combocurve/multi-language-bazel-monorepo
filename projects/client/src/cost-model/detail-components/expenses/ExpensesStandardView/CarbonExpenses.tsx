import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltipWrapper } from '@/components/v2';
import { defaultHandlePasteCells, getSelectValueProps, parseValue } from '@/cost-model/detail-components/copy-paste';
import { CARBON_EXPENSES, CARBON_EXPENSES_KEYS } from '@/cost-model/detail-components/expenses/constants';
import { createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import {
	addDeleteRow,
	genData,
	rowDateRangeChange,
	rowNumberRangeChange,
	rowNumberRangeRateChange,
} from '@/cost-model/detail-components/helper';

import { CarbonExpenseRenderData, CarbonExpensesInterface, CarbonExpensesProps } from './CarbonExpenses.types';

const description = <div>Negative expenses will be treated as revenue</div>;

function checkAddDeleteRow(carbonExpenses: CarbonExpensesInterface) {
	const check = CARBON_EXPENSES_KEYS.reduce(
		(a, key) => ({
			...a,
			[key]: {
				add: false,
				delete: false,
				showBtn: false,
				rows: carbonExpenses[key].subItems.row_view.rows,
			},
		}),
		{}
	);

	const rowValueKey = 'carbon_expense';

	addDeleteRow({ check, rowValueKey });

	return check;
}

export const CarbonExpenses = (props: CarbonExpensesProps): JSX.Element | null => {
	const [popBool, setPopBool] = useState(false);
	const [collapse, setCollapse] = useState({});

	const { carbon_expenses, setCarbonExpenses, fields, selected, onSelect } = props;

	//TODO: Improve types for functions

	const setCollapseState = (partial) =>
		setCollapse((prevState) => ({
			...prevState,
			...partial,
		}));

	const setFE = () => {
		setCarbonExpenses(carbon_expenses, CARBON_EXPENSES);
	};

	const applySubChange = ({ value, stateKey, subKey }) => {
		carbon_expenses[stateKey].subItems[subKey] = value;
	};

	const handleSubChange = (props) => {
		applySubChange(props);
		setFE();
	};

	const applyRowHeaderChange = ({ value, stateKey, key, fullMenuItem }) => {
		if (key === 'category') {
			carbon_expenses[key] = value;
		} else {
			carbon_expenses[stateKey].subItems.row_view.headers[key] = value;
			carbon_expenses[stateKey].subItems.row_view.rows.forEach((r) => {
				if (fullMenuItem.Default || fullMenuItem.Default === 0) {
					r[key] = fullMenuItem.Default;
				} else if (fullMenuItem.staticValue) {
					r[key] = fullMenuItem.staticValue;
				} else {
					r[key] = '';
				}
			});
			if (value.value === 'entire_well_life') {
				carbon_expenses[stateKey].subItems.row_view.rows = [
					carbon_expenses[stateKey].subItems.row_view.rows[0],
				];
			}
		}
	};

	const handleRowHeaderChange = (props) => {
		applyRowHeaderChange(props);
		setFE();
	};

	const applyRowChange = ({ value, key, stateKey, index }) => {
		carbon_expenses[stateKey].subItems.row_view.rows[index][key] = value;
	};

	const handleRowChange = (props) => {
		applyRowChange(props);
		setFE();
	};

	const applyRowDateRangeChange = ({ value, key, stateKey, index }) => {
		const rows = carbon_expenses[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	const handleRowDateRangeChange = (props) => {
		applyRowDateRangeChange(props);
		setFE();
	};

	const applyRowNumberRangeChange = ({ value, key, stateKey, index }) => {
		const rows = carbon_expenses[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	const handleRowNumberRangeChange = (props) => {
		applyRowNumberRangeChange(props);
		setFE();
	};

	const applyRowNumberRangeRateChange = ({ value, key, index, stateKey }) => {
		const rows = carbon_expenses[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
	};

	const handleRowNumberRangeRateChange = (props) => {
		applyRowNumberRangeRateChange(props);
		setFE();
	};

	const applyAddRow = (categoryKey) => {
		const row = carbon_expenses[categoryKey].subItems.row_view.rows[0];
		const columnFields = fields[categoryKey].subItems.row_view.columns;
		const newRow = createNewRow(row, columnFields);
		carbon_expenses[categoryKey].subItems.row_view.rows.push(newRow);
	};

	const handleAddRow = (categoryKey) => {
		applyAddRow(categoryKey);
		setFE();
	};

	const applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				applyRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				break;
			case 'number-range':
				applyRowNumberRangeChange({ ...meta, value });
				break;
			case 'number-range-rate':
				applyRowNumberRangeRateChange({ ...meta, value });
				break;
			default:
				if (meta.subKey === 'row_view') {
					const selectProps = getSelectValueProps(meta, rawValue);
					if (selectProps) {
						applyRowHeaderChange({ ...meta, ...selectProps });
					}
					break;
				}
				if (meta.index || meta.index === 0) {
					applyRowChange({ ...meta, value });
					break;
				}
				applySubChange?.({
					...meta,
					value,
					...getSelectValueProps(meta, rawValue),
				});
		}
	};

	const handlePasteCells = (categoryKey, changes, additions) => {
		const onlyFirstRow =
			carbon_expenses[categoryKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => applyAddRow(categoryKey),
			changeCell: applyChangeCell,
			onlyFirstRow,
		});

		setFE();
	};

	const handleDeleteRow = (categoryKey) => {
		carbon_expenses[categoryKey].subItems.row_view.rows.pop();
		const new_rows = carbon_expenses[categoryKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setFE();
	};

	const getAddDeleteItems = (check, categoryKey) => {
		return [
			<Button
				icon
				key='add-rev'
				tooltipPosition='top'
				tooltipLabel='Add Row'
				disabled={!check[categoryKey].add}
				onClick={() => handleAddRow(categoryKey)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				icon
				key='del-rev'
				tooltipPosition='top'
				tooltipLabel='Delete Row'
				disabled={!check[categoryKey].delete}
				onClick={() => handleDeleteRow(categoryKey)}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	const renderSheet = (categoryKey, data) => {
		const selKey = `carbon_exp_${categoryKey}_sheet`;

		return (
			<InptDataSheet
				data={data}
				selKey={selKey}
				onSelect={onSelect}
				selected={selected[selKey]}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				className='on-hover-paper-2 data-sheet-paper var-exp'
				onPasteCells={(changes, additions) => handlePasteCells(categoryKey, changes, additions)}
			/>
		);
	};

	const changePopBool = () => {
		setPopBool((prevState) => !prevState);
	};

	const renderCarbonExp = (categoryChoice, popBool, allData, check, carbonExpKey) => {
		return (
			(categoryChoice === carbonExpKey || popBool) && (
				<div className={`carbon_exp_${carbonExpKey}_sheet expense-table-container`}>
					{renderSheet(carbonExpKey, allData[carbonExpKey])}
					<div id='add-delete-row'>
						{check[carbonExpKey].showBtn && getAddDeleteItems(check, carbonExpKey)}
					</div>
				</div>
			)
		);
	};

	const handlers = {
		row: handleRowChange,
		subItems: handleSubChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const allData: CarbonExpenseRenderData = {
		category: [],
	};

	Object.keys(fields).forEach((key: string) => {
		allData[key] = genData({
			fieldsObj: { [key]: fields[key] },
			state: { [key]: carbon_expenses[key] },
			handleChange: handleSubChange,
			handlers,
			collapseState: collapse,
			setCollapseState,
			addHeader: false,
		});
	});

	const check = checkAddDeleteRow(carbon_expenses);

	if (!allData) {
		return null;
	}

	const categoryChoice = carbon_expenses.category.value;

	return (
		<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
			<Header>
				<h2 className='md-text'>
					<InfoTooltipWrapper tooltipTitle={description} placeIconAfter iconFontSize='18px'>
						Carbon Expenses
					</InfoTooltipWrapper>
				</h2>
			</Header>
			<div className='price-data-sheets carbon_exp_category_select_sheet phase-cat-selects'>
				<ReactDataSheet
					data={allData.category}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.carbon_exp_category_select_sheet}
					className='on-hover-paper-2 data-sheet-paper var-exp'
					onSelect={(sel) => onSelect('carbon_exp_category_select_sheet', sel)}
				/>
				<Button
					key='expand-var-expense'
					onClick={() => {
						changePopBool();
					}}
					disabled={false}
					tooltipLabel='Expand Carbon Expense'
					tooltipPosition='top'
					primary
					faIcon={faPlus}
				/>
			</div>
			<div className='price-data-sheets main-expense-options'>
				{CARBON_EXPENSES_KEYS.map((key) => renderCarbonExp(categoryChoice, popBool, allData, check, key))}
			</div>
		</div>
	);
};
