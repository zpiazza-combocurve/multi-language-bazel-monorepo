import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { has } from 'lodash-es';
import { Component } from 'react';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import { InfoTooltip } from '@/components/tooltipped';
import { defaultHandlePasteCells, parseValue } from '@/cost-model/detail-components/copy-paste';
import {
	GenerateData,
	createNewRow,
	dataRenderer,
	rowDateRangeChange,
	valueRenderer,
} from '@/cost-model/detail-components/gen-data';
import { PriceModelProps } from '@/cost-model/detail-components/pricing/types';

const description = (
	<ul>
		<li>
			<div>
				<b>Gas pricing</b>: If specified in $/MMBTU then ensure that BTU content is defined correctly in Stream
				Properties
			</div>
		</li>
	</ul>
);

interface PhaseCheckResult {
	add: boolean;
	delete: boolean;
	showBtn: boolean;
}

interface CheckResult {
	oil: PhaseCheckResult;
	gas: PhaseCheckResult;
	ngl: PhaseCheckResult;
	drip_condensate: PhaseCheckResult;
	showAdd?: boolean;
	showDel?: boolean;
}

/**
 * Analyzes the price model and returns an object containing information about the add and delete button states for each
 * phase.
 *
 * @remarks
 *   The returned object has a property for each phase (oil, gas, ngl, and drip_condensate) with details on whether the
 *   add and delete buttons should be shown. The `showBtn` property for each phase indicates if either the add or delete
 *   button should be shown. Additionally, the returned object includes the `showAdd` and `showDel` properties
 *   indicating if any phase has the add or delete buttons enabled, respectively.
 * @param price_model - The price model object containing subItems and rows for each phase.
 * @returns An object containing add and delete button states for each phase and overall button states.
 */
export function checkAddDeleteRow(price_model): CheckResult {
	const check = {
		oil: { add: false, delete: false, rows: price_model.oil.subItems.row_view.rows, showBtn: false },
		gas: { add: false, delete: false, rows: price_model.gas.subItems.row_view.rows, showBtn: false },
		ngl: { add: false, delete: false, rows: price_model.ngl.subItems.row_view.rows, showBtn: false },
		drip_condensate: {
			add: false,
			delete: false,
			showBtn: false,
			rows: price_model.drip_condensate.subItems.row_view.rows,
		},
	};

	Object.keys(check).forEach((c) => {
		const phase = check[c];
		const len = phase.rows.length;
		const lastRow = phase.rows[len - 1];

		if (len >= 2) {
			phase.delete = true;
		}
		// Check if lastRow exists and has a price property
		if (lastRow && (lastRow.price || lastRow.price === 0)) {
			const criteria = lastRow.criteria;

			// Check if criteria exists and has start_date or period property
			if (criteria && (criteria.start_date || criteria.period)) {
				phase.add = true;
			}
		}
		delete phase.rows;
		if (phase.add) {
			check['showAdd'] = true;
		}
		if (phase.delete) {
			check['showDel'] = true;
		}
		if (phase.add || phase.delete) {
			phase.showBtn = true;
		}
	});

	return check;
}

function genData(props: PriceModelProps) {
	const { fieldsObj, state } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'search', 'subItems', 'selected']);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data: Array<any[]> = [];

	Object.keys(state).forEach((key) => {
		if (ignore.has(key)) {
			return;
		}
		if (key === 'phase') {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key], addHeader: false });
		} else {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key] });
		}
	});

	if (!data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	if (!data[0] || !data[0][0]) {
		return false;
	}

	data[0][0].readOnly = false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data.forEach((row: Array<any>, rowIndex) => {
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
			/* eslint-enable no-param-reassign */
		});
	});

	return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export class PriceModel extends Component<any, any> {
	state = {
		collapse: {},
	};

	setCollapseState = (partial) =>
		this.setState((state) => ({
			collapse: { ...state.collapse, ...partial },
		}));

	setPM = () => {
		const { price_model, setPriceModel } = this.props;
		setPriceModel(price_model, 'price_model');
	};

	applySubChange = ({ value, key, subKey }) => {
		const { price_model } = this.props;
		price_model[key].subItems[subKey] = value;
	};

	handleSubChange = (propz) => {
		this.applySubChange(propz);
		this.setPM();
	};

	applyRowChange = ({ value, key, index, stateKey }) => {
		const { price_model } = this.props;
		price_model[stateKey].subItems.row_view.rows[index][key] = value;
	};

	handleRowChange = (propz) => {
		this.applyRowChange(propz);
		this.setPM();
	};

	applyRowHeaderChange = ({ value, key, stateKey, fullMenuItem }) => {
		const { price_model } = this.props;
		if (key === 'phase') {
			price_model[key] = value;
		} else {
			price_model[stateKey].subItems.row_view.headers[key] = value;
			price_model[stateKey].subItems.row_view.rows.forEach((rr) => {
				const r = rr;
				if (fullMenuItem.Default || fullMenuItem.Default === 0) {
					r[key] = fullMenuItem.Default;
				} else if (fullMenuItem.staticValue) {
					r[key] = fullMenuItem.staticValue;
				} else {
					r[key] = '';
				}
			});
			if (value.value === 'entire_well_life') {
				price_model[stateKey].subItems.row_view.rows = [price_model[stateKey].subItems.row_view.rows[0]];
			}
		}
	};

	handleRowHeaderChange = (propz) => {
		this.applyRowHeaderChange(propz);
		this.setPM();
	};

	applyRowDateRangeChange = ({ value, key, index, stateKey }) => {
		const { price_model } = this.props;
		const rows = price_model[stateKey].subItems.row_view.rows;

		if (!has(rows[index][key], 'start_date')) {
			rows[index][key] = { start_date: '', end_date: '' };
		}

		rowDateRangeChange({ rows, value, key, index });
	};

	handleRowDateRangeChange = (propz) => {
		this.applyRowDateRangeChange(propz);
		this.setPM();
	};

	applyRowNumberRangeChange = ({ value, key, index, stateKey }) => {
		const { price_model } = this.props;

		if (!has(price_model[stateKey].subItems.row_view.rows[index][key], 'start')) {
			price_model[stateKey].subItems.row_view.rows[index][key] = { start: '', end: '', period: '' };
		}
		const len = price_model[stateKey].subItems.row_view.rows.length;
		const cur = price_model[stateKey].subItems.row_view.rows[index][key];

		cur.period = value;

		if (index === 0) {
			cur.start = 1;
			cur.end = value;
		}

		if (index > 0) {
			const prev = price_model[stateKey].subItems.row_view.rows[index - 1][key] || {};
			cur.start = prev.end + 1;
			cur.end = prev.end + value;
		}

		if (value >= 1) {
			let cum = cur.end;
			if (index + 1 !== len) {
				for (let i = index + 1; i < len; i++) {
					if (price_model[stateKey].subItems.row_view.rows[i][key].period) {
						price_model[stateKey].subItems.row_view.rows[i][key].start = cum + 1;
						price_model[stateKey].subItems.row_view.rows[i][key].end =
							cum + price_model[stateKey].subItems.row_view.rows[i][key].period;
						cum = price_model[stateKey].subItems.row_view.rows[i][key].end;
					}
				}
			}
		}
	};

	handleRowNumberRangeChange = (propz) => {
		this.applyRowNumberRangeChange(propz);
		this.setPM();
	};

	applyAddRow = (stateKey) => {
		const { fields, price_model } = this.props;
		const row_view = price_model[stateKey].subItems.row_view;
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		price_model[stateKey].subItems.row_view.rows.push(newRow);
	};

	handleAddRow = (stateKey) => {
		this.applyAddRow(stateKey);
		this.setPM();
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

	handlePasteCells = (stateKey, changes, additions) => {
		const { price_model } = this.props;
		const onlyFirstRow = price_model[stateKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => this.applyAddRow(stateKey),
			changeCell: this.applyChangeCell,
			onlyFirstRow,
		});

		this.setPM();
	};

	deleteRow = (stateKey) => {
		const { price_model } = this.props;
		price_model[stateKey].subItems.row_view.rows.pop();
		const new_rows = price_model[stateKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		this.setPM();
	};

	getAddDeleteItems = (check, stateKey) => {
		return [
			<Button
				key='add-rev'
				tooltipPosition='top'
				tooltipLabel='Add Row'
				disabled={!check[stateKey].add}
				onClick={() => this.handleAddRow(stateKey)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				key='del-rev'
				tooltipPosition='top'
				tooltipLabel='Delete Row'
				disabled={!check[stateKey].delete}
				onClick={() => this.deleteRow(stateKey)}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	renderPhaseSheet = (key, data) => {
		const { selected, onSelect } = this.props;
		const selKey = `price_${key}_sheet`;

		return (
			<InptDataSheet
				data={data}
				dataRenderer={dataRenderer}
				selected={selected[selKey]}
				valueRenderer={valueRenderer}
				onSelect={(sel) => onSelect(selKey, sel)}
				className='on-hover-paper-2 data-sheet-paper'
				onPasteCells={(changes, additions) => this.handlePasteCells(key, changes, additions)}
			/>
		);
	};

	render() {
		const { setCollapseState } = this;
		const { collapse: collapseState } = this.state;
		const { fields, price_model } = this.props;
		const { oil, gas, ngl, drip_condensate } = price_model;

		const handlers = {
			row: this.handleRowChange,
			subItems: this.handleSubChange,
			rowHeader: this.handleRowHeaderChange,
			'date-range': this.handleRowDateRangeChange,
			'number-range': this.handleRowNumberRangeChange,
			setCollapseState: this.setCollapseState,
		};

		const oilData = genData({ fieldsObj: fields, state: { oil }, handlers, collapseState, setCollapseState });
		const gasData = genData({ fieldsObj: fields, state: { gas }, handlers, collapseState, setCollapseState });
		const nglData = genData({ fieldsObj: fields, state: { ngl }, handlers, collapseState, setCollapseState });
		const dripData = genData({
			fieldsObj: fields,
			state: { drip_condensate },
			handlers,
			collapseState,
			setCollapseState,
		});
		const data = gasData && oilData && nglData && dripData;

		if (!data) {
			return null;
		}
		const check = checkAddDeleteRow(price_model);

		return (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Price Model</h2>
					<InfoTooltip labelTooltip={description} fontSize='18px' />
				</Header>
				<div className='price-data-sheets main-expense-options'>
					<div className='price_oil_sheet expense-table-container'>
						{this.renderPhaseSheet('oil', oilData)}
						{check.oil.showBtn && this.getAddDeleteItems(check, 'oil')}
					</div>
					<div className='price_gas_sheet expense-table-container'>
						{this.renderPhaseSheet('gas', gasData)}
						{check.gas.showBtn && this.getAddDeleteItems(check, 'gas')}
					</div>
					<div className='price_ngl_sheet expense-table-container'>
						{this.renderPhaseSheet('ngl', nglData)}
						{check.ngl.showBtn && this.getAddDeleteItems(check, 'ngl')}
					</div>
					<div className='price_drip_condensate_sheet expense-table-container'>
						{this.renderPhaseSheet('drip_condensate', dripData)}
						{check.drip_condensate.showBtn && this.getAddDeleteItems(check, 'drip_condensate')}
					</div>
				</div>
			</div>
		);
	}
}
