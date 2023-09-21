/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { Component } from 'react';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { InfoTooltip } from '@/components/tooltipped';
import { defaultHandlePasteCells, parseValue } from '@/cost-model/detail-components/copy-paste';
import { createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import {
	addDeleteRow,
	genData,
	rowDateRangeChange,
	rowNumberRangeChange,
	rowNumberRangeRateChange,
} from '@/cost-model/detail-components/helper';
import { clone } from '@/helpers/utilities';

const description = (
	<ul>
		<li>
			<div>Negative expenses will be treated as revenue</div>
		</li>
	</ul>
);

function checkAddDeleteRow(variable_expenses) {
	const check = {
		oil: {
			gathering: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.oil.subItems.gathering.subItems.row_view.rows,
			},
			processing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.oil.subItems.processing.subItems.row_view.rows,
			},
			transportation: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.oil.subItems.transportation.subItems.row_view.rows,
			},
			marketing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.oil.subItems.marketing.subItems.row_view.rows,
			},
			other: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.oil.subItems.other.subItems.row_view.rows,
			},
		},
		gas: {
			gathering: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.gas.subItems.gathering.subItems.row_view.rows,
			},
			processing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.gas.subItems.processing.subItems.row_view.rows,
			},
			transportation: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.gas.subItems.transportation.subItems.row_view.rows,
			},
			marketing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.gas.subItems.marketing.subItems.row_view.rows,
			},
			other: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.gas.subItems.other.subItems.row_view.rows,
			},
		},
		ngl: {
			gathering: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.ngl.subItems.gathering.subItems.row_view.rows,
			},
			processing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.ngl.subItems.processing.subItems.row_view.rows,
			},
			transportation: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.ngl.subItems.transportation.subItems.row_view.rows,
			},
			marketing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.ngl.subItems.marketing.subItems.row_view.rows,
			},
			other: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.ngl.subItems.other.subItems.row_view.rows,
			},
		},
		drip_condensate: {
			gathering: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.drip_condensate.subItems.gathering.subItems.row_view.rows,
			},
			processing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.drip_condensate.subItems.processing.subItems.row_view.rows,
			},
			transportation: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.drip_condensate.subItems.transportation.subItems.row_view.rows,
			},
			marketing: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.drip_condensate.subItems.marketing.subItems.row_view.rows,
			},
			other: {
				add: false,
				delete: false,
				showBtn: false,
				rows: variable_expenses.drip_condensate.subItems.other.subItems.row_view.rows,
			},
		},
		collapse: {
			gathering: { showBtn: false },
			processing: { showBtn: false },
			transportation: { showBtn: false },
			marketing: { showBtn: false },
			other: { showBtn: false },
		},
	};
	const rowValueKey = 'unit_cost';

	Object.keys(check).forEach((c) => {
		if (c !== 'collapse') {
			const phaseCheck = check[c];

			addDeleteRow({ check: phaseCheck, rowValueKey });
		}
	});

	return check;
}

export class VariableExpenses extends Component {
	state = {
		collapse: {
			oil: {},
			gas: {},
			ngl: {},
			drip_condensate: {},
		},
		popBool: false,
	};

	setCollapseState = (partial) => {
		const { keyList, bool } = partial;
		const { collapse } = this.state;
		const newCollapse = clone(collapse);
		newCollapse[keyList[0]][keyList[1]] = bool;
		this.setState({
			collapse: newCollapse,
		});
	};

	setVE = () => {
		const { setVariableExpenses, variable_expenses } = this.props;
		setVariableExpenses(variable_expenses, 'variable_expenses');
	};

	applySubChange = ({ value, keyList }) => {
		const { variable_expenses } = this.props;
		variable_expenses[keyList[0]].subItems[keyList[1]].subItems[keyList[2]] = value;
	};

	handleSubChange = (propz) => {
		this.applySubChange(propz);
		this.setVE();
	};

	applyRowHeaderChange = ({ value, fullMenuItem, key, keyList }) => {
		const { variable_expenses } = this.props;
		if (key === 'phase' || key === 'category') {
			variable_expenses[key] = value;
		} else {
			const row_view = variable_expenses[keyList[0]].subItems[keyList[1]].subItems.row_view;
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
		}
	};

	handleRowHeaderChange = (propz) => {
		this.applyRowHeaderChange(propz);
		this.setVE();
	};

	applyRowChange = ({ value, index, key, keyList }) => {
		const { variable_expenses } = this.props;
		variable_expenses[keyList[0]].subItems[keyList[1]].subItems.row_view.rows[index][key] = value;
	};

	handleRowChange = (propz) => {
		this.applyRowChange(propz);
		this.setVE();
	};

	applyRowDateRangeChange = ({ value, key, index, keyList }) => {
		const { variable_expenses } = this.props;
		const rows = variable_expenses[keyList[0]].subItems[keyList[1]].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	handleRowDateRangeChange = (propz) => {
		this.applyRowDateRangeChange(propz);
		this.setVE();
	};

	applyRowNumberRangeChange = ({ value, key, index, keyList }) => {
		const { variable_expenses } = this.props;
		const rows = variable_expenses[keyList[0]].subItems[keyList[1]].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	handleRowNumberRangeChange = (propz) => {
		this.applyRowNumberRangeChange(propz);
		this.setVE();
	};

	applyRowNumberRangeRateChange = ({ value, key, index, keyList }) => {
		const { variable_expenses } = this.props;
		const rows = variable_expenses[keyList[0]].subItems[keyList[1]].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
	};

	handleRowNumberRangeRateChange = (propz) => {
		this.applyRowNumberRangeRateChange(propz);
		this.setVE();
	};

	applyAddRow = (phaseKey, classKey) => {
		const { fields, variable_expenses } = this.props;
		const row_view = variable_expenses[phaseKey].subItems[classKey].subItems.row_view;
		const columnFields = fields[phaseKey].subItems[classKey].subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
	};

	handleAddRow = (phaseKey, classKey) => {
		this.applyAddRow(phaseKey, classKey);
		this.setVE();
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
					const index = meta.fullMenuItems.findIndex(
						(item) => item.value === rawValue || item.label === rawValue
					);
					const fullMenuItem = meta.fullMenuItems[index];
					const itemValue = meta.menuItems[index];

					if (fullMenuItem && itemValue) {
						this.applyRowHeaderChange({
							...meta,
							fullMenuItem,
							value: itemValue,
						});
					}
					return;
				}
				if (meta.subKey) {
					let subValue = value;
					if (meta.fullMenuItems) {
						const index = meta.fullMenuItems.findIndex(
							(item) => item.value === rawValue || item.label === rawValue
						);
						if (index !== -1) {
							subValue = meta.menuItems[index];
						}
					}
					this.applySubChange({ ...meta, value: subValue });
					return;
				}
				if (meta.index || meta.index === 0) {
					this.applyRowChange({ ...meta, value });
				}
		}
	};

	handlePasteCells = (phaseKey, detailKey, changes, additions) => {
		const { variable_expenses } = this.props;
		const onlyFirstRow =
			variable_expenses[phaseKey].subItems[detailKey].subItems.row_view.headers.criteria.value ===
			'entire_well_life';
		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => this.applyAddRow(phaseKey, detailKey),
			changeCell: this.applyChangeCell,
			onlyFirstRow,
		});

		this.setVE();
	};

	deleteRow = (phaseKey, classKey) => {
		const { variable_expenses } = this.props;
		variable_expenses[phaseKey].subItems[classKey].subItems.row_view.rows.pop();
		const new_rows = variable_expenses[phaseKey].subItems[classKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		this.setVE();
	};

	getAddDeleteItems = (check, phaseKey, detailKey) => {
		return [
			<Button
				icon
				key='add-rev'
				tooltipLabel='Add Row'
				tooltipPosition='bottom'
				disabled={!check[phaseKey][detailKey].add}
				onClick={() => this.handleAddRow(phaseKey, detailKey)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				icon
				key='del-rev'
				tooltipPosition='bottom'
				tooltipLabel='Delete Row'
				disabled={!check[phaseKey][detailKey].delete}
				onClick={() => this.deleteRow(phaseKey, detailKey)}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	renderSheet = (phaseKey, detailKey, data) => {
		const { selected, onSelect } = this.props;
		const selKey = `var_exp_${detailKey}_sheet`;

		return (
			<InptDataSheet
				data={data}
				selKey={selKey}
				onSelect={onSelect}
				dataRenderer={dataRenderer}
				selected={selected[selKey]}
				valueRenderer={valueRenderer}
				className='on-hover-paper-2 data-sheet-paper'
				onPasteCells={(changes, additions) => this.handlePasteCells(phaseKey, detailKey, changes, additions)}
			/>
		);
	};

	changePopBool = () => {
		this.setState((state) => ({
			popBool: !state.popBool,
		}));
	};

	// eslint-disable-next-line complexity
	render() {
		const { setCollapseState } = this;
		const { collapse: collapseState, popBool } = this.state;
		const { categoryChoice, fields, variable_expenses, selected, onSelect } = this.props;
		const handlers = {
			row: this.handleRowChange,
			subItems: this.handleSubChange,
			rowHeader: this.handleRowHeaderChange,
			'date-range': this.handleRowDateRangeChange,
			'number-range': this.handleRowNumberRangeChange,
			'number-range-rate': this.handleRowNumberRangeRateChange,
		};

		const data = genData({
			fieldsObj: fields,
			state: variable_expenses,
			handlers,
			collapseState,
			setCollapseState,
			addHeader: false,
		});

		if (!data || !data.length) {
			return null;
		}

		const dataPhaseSelect = [data[0]];
		const dataCategorySelect = [data[data.length - 1]];
		let dataGathering = [];
		let dataProcessing = [];
		let dataTransportation = [];
		let dataMarketing = [];
		let dataOther = [];
		if (data.length > 2) {
			const indexList = {};
			const NameList = ['G & P', 'OPC', 'TRN', 'MKT', 'Other'];
			data.forEach((r, i) => {
				if (r[0].fullWidthCell && (NameList.includes(r[0].originalValue) || NameList.includes(r[0].value))) {
					indexList[r[0].originalValue] = i;
				}
			});
			dataGathering = data.slice(indexList['G & P'], indexList.OPC);
			dataProcessing = data.slice(indexList.OPC, indexList.TRN);
			dataTransportation = data.slice(indexList.TRN, indexList.MKT);
			dataMarketing = data.slice(indexList.MKT, indexList.Other);
			dataOther = data.slice(indexList.Other, data.length - 1);
			dataGathering[0][0].readOnly = false;
			dataProcessing[0][0].readOnly = false;
			dataTransportation[0][0].readOnly = false;
			dataMarketing[0][0].readOnly = false;
			dataOther[0][0].readOnly = false;
		}

		const check = checkAddDeleteRow(variable_expenses);

		return (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Variable Expenses</h2>
					<InfoTooltip labelTooltip={description} fontSize='18px' />
				</Header>
				<div className='price-data-sheets phase-cat-selects'>
					<ReactDataSheet
						data={dataPhaseSelect}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.var_exp_phase_select_sheet}
						onSelect={(sel) => onSelect('var_exp_phase_select_sheet', sel)}
						className='var_exp_phase_select_sheet on-hover-paper-2 data-sheet-paper var-exp'
					/>
				</div>
				<div className='price-data-sheets phase-cat-selects'>
					<ReactDataSheet
						data={dataCategorySelect}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.var_exp_category_select_sheet}
						onSelect={(sel) => onSelect('var_exp_category_select_sheet', sel)}
						className='var_exp_category_select_sheet on-hover-paper-2 data-sheet-paper var-exp'
					/>
					<Button
						key='expand-var-expense'
						onClick={() => {
							this.changePopBool();
						}}
						disabled={false}
						tooltipLabel='Expand Variable Expense'
						tooltipPosition='top'
						primary
						faIcon={faPlus}
					/>
				</div>
				<div className='price-data-sheets main-expense-options'>
					{(categoryChoice === 'gathering' || popBool === true) && (
						<div className='var_exp_gathering_sheet expense-table-container'>
							{this.renderSheet(variable_expenses.phase.value, 'gathering', dataGathering)}
							<div>
								{check[variable_expenses.phase.value].gathering.showBtn &&
									this.getAddDeleteItems(check, variable_expenses.phase.value, 'gathering')}
							</div>
						</div>
					)}
					{(categoryChoice === 'processing' || popBool === true) && (
						<div className='var_exp_processing_sheet expense-table-container'>
							{this.renderSheet(variable_expenses.phase.value, 'processing', dataProcessing)}
							<div>
								{check[variable_expenses.phase.value].processing.showBtn &&
									this.getAddDeleteItems(check, variable_expenses.phase.value, 'processing')}
							</div>
						</div>
					)}
					{(categoryChoice === 'transportation' || popBool === true) && (
						<div className='var_exp_transportation_sheet expense-table-container'>
							{this.renderSheet(variable_expenses.phase.value, 'transportation', dataTransportation)}
							<div>
								{check[variable_expenses.phase.value].transportation.showBtn &&
									this.getAddDeleteItems(check, variable_expenses.phase.value, 'transportation')}
							</div>
						</div>
					)}
					{(categoryChoice === 'marketing' || popBool === true) && (
						<div className='var_exp_marketing_sheet expense-table-container'>
							{this.renderSheet(variable_expenses.phase.value, 'marketing', dataMarketing)}
							<div>
								{check[variable_expenses.phase.value].marketing.showBtn &&
									this.getAddDeleteItems(check, variable_expenses.phase.value, 'marketing')}
							</div>
						</div>
					)}
					{(categoryChoice === 'other' || popBool === true) && (
						<div className='var_exp_other_sheet expense-table-container'>
							{this.renderSheet(variable_expenses.phase.value, 'other', dataOther)}
							<div>
								{check[variable_expenses.phase.value].other.showBtn &&
									this.getAddDeleteItems(check, variable_expenses.phase.value, 'other')}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
}
