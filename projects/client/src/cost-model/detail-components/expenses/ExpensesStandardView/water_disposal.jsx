/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { Component } from 'react';

import { Button, InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import { InfoTooltip } from '@/components/tooltipped';
import { defaultHandlePasteCells, getSelectValueProps, parseValue } from '@/cost-model/detail-components/copy-paste';
import { createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import {
	genData,
	rowDateRangeChange,
	rowNumberRangeChange,
	rowNumberRangeRateChange,
} from '@/cost-model/detail-components/helper';

const description = (
	<ul>
		<li>
			<div>Negative Water Disposal costs will be treated as revenue</div>
		</li>
	</ul>
);

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };
	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];

	if (len >= 2) {
		check.delete = true;
	}

	if (lastRow.unit_cost || lastRow.unit_cost === 0) {
		if (lastRow.criteria && lastRow.criteria.start_date) {
			check.add = true;
		}
		if (lastRow.criteria && (lastRow.criteria.start || lastRow.criteria.start === 0)) {
			check.add = true;
		}
	}

	if (check.add || check.delete) {
		check.showBtn = true;
	}
	return check;
}

export class WaterDisposal extends Component {
	state = {
		collapse: {},
	};

	setCollapseState = (partial) =>
		this.setState((state) => ({
			collapse: { ...state.collapse, ...partial },
		}));

	setWD = () => {
		const { setWaterDisposal, water_disposal } = this.props;
		setWaterDisposal(water_disposal, 'water_disposal');
	};

	applyChange = ({ value, key }) => {
		const { water_disposal } = this.props;
		water_disposal[key] = value;
	};

	handleChange = (props) => {
		this.applyChange(props);
		this.setWD();
	};

	applyRowHeaderChange = ({ value, key, fullMenuItem }) => {
		const { water_disposal } = this.props;
		water_disposal.row_view.headers[key] = value;
		water_disposal.row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});
		if (value.value === 'entire_well_life') {
			water_disposal.row_view.rows = [water_disposal.row_view.rows[0]];
		}
	};

	handleRowHeaderChange = (props) => {
		this.applyRowHeaderChange(props);
		this.setWD();
	};

	applyRowChange = ({ value, key, index }) => {
		const { water_disposal } = this.props;
		water_disposal.row_view.rows[index][key] = value;
	};

	handleRowChange = (props) => {
		this.applyRowChange(props);
		this.setWD();
	};

	applyRowDateRangeChange = ({ value, key, index }) => {
		const { water_disposal } = this.props;
		const rows = water_disposal.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	handleRowDateRangeChange = (props) => {
		this.applyRowDateRangeChange(props);
		this.setWD();
	};

	applyRowNumberRangeChange = ({ value, key, index }) => {
		const { water_disposal } = this.props;
		const rows = water_disposal.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	handleRowNumberRangeChange = (props) => {
		this.applyRowNumberRangeChange(props);
		this.setWD();
	};

	applyRowNumberRangeRateChange = ({ value, key, index }) => {
		const { water_disposal } = this.props;
		const rows = water_disposal.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
	};

	handleRowNumberRangeRateChange = (propz) => {
		this.applyRowNumberRangeRateChange(propz);
		this.setWD();
	};

	applyAddRow = () => {
		const { fields, water_disposal } = this.props;
		const row_view = water_disposal.row_view;
		const columnFields = fields.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
	};

	handleAddRow = () => {
		this.applyAddRow();
		this.setWD();
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
					const selectValueProps = getSelectValueProps(meta, rawValue);
					if (selectValueProps) {
						this.applyRowHeaderChange({ ...meta, ...selectValueProps });
					}
					return;
				}
				if (meta.index || meta.index === 0) {
					this.applyRowChange({ ...meta, value });
					return;
				}
				this.applyChange({
					...meta,
					value,
					...getSelectValueProps(meta, rawValue),
				});
		}
	};

	handlePasteCells = (changes, additions) => {
		const { water_disposal } = this.props;
		const onlyFirstRow = water_disposal.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: this.applyAddRow,
			changeCell: this.applyChangeCell,
			onlyFirstRow,
		});

		this.setWD();
	};

	handleDeleteRow = () => {
		const { water_disposal } = this.props;
		water_disposal.row_view.rows.pop();
		const new_rows = water_disposal.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		this.setWD();
	};

	getAddDeleteItems = (check) => {
		return [
			<Button
				icon
				key='add-rev'
				disabled={!check.add}
				tooltipPosition='top'
				tooltipLabel='Add Row'
				onClick={this.handleAddRow}
				primary
				faIcon={faPlus}
			/>,
			<Button
				icon
				key='del-rev'
				tooltipPosition='top'
				disabled={!check.delete}
				tooltipLabel='Delete Row'
				onClick={this.handleDeleteRow}
				warning
				faIcon={faMinus}
			/>,
		];
	};

	render() {
		const { collapse: collapseState } = this.state;
		const { handleChange, setCollapseState } = this;
		const { fields, water_disposal, selected, onSelect } = this.props;
		const handlers = {
			row: this.handleRowChange,
			rowHeader: this.handleRowHeaderChange,
			'date-range': this.handleRowDateRangeChange,
			'number-range': this.handleRowNumberRangeChange,
			'number-range-rate': this.handleRowNumberRangeRateChange,
		};

		const data = genData({
			fieldsObj: fields,
			state: water_disposal,
			handlers,
			handleChange,
			collapseState,
			setCollapseState,
		});

		const check = checkAddDeleteRow(water_disposal);

		if (!data.length) {
			return null;
		}

		return (
			<div id='cost-model-detail-inputs' className='water_disposal_expenses_sheet sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Water Disposal</h2>
					<InfoTooltip labelTooltip={description} fontSize='18px' />
				</Header>
				<InptDataSheet
					data={data}
					onSelect={onSelect}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					onPasteCells={this.handlePasteCells}
					selKey='water_disposal_expenses_sheet'
					className='on-hover-paper-2 data-sheet-paper'
					selected={selected.water_disposal_expenses_sheet}
				/>
				<div id='add-delete-row'>{check.showBtn && this.getAddDeleteItems(check)}</div>
			</div>
		);
	}
}
