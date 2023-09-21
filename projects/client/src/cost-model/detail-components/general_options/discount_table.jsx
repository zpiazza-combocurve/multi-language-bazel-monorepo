/* eslint-disable no-param-reassign */
import { faExclamationTriangle, faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@material-ui/core';
import classNames from 'classnames';
import { Component } from 'react';
import { Button } from 'react-md';

import ReactDataSheet from '@/components/InptDataSheet';
import { Icon } from '@/components/v2';

import { dataRenderer, valueRenderer } from '../gen-data';
import { genData } from '../helper';

export class DiscountTable extends Component {
	setD = () => {
		const { discount_table, setDiscountTable } = this.props;
		setDiscountTable(discount_table, 'discount_table');
	};

	handleChange = ({ value, key }) => {
		const { discount_table } = this.props;
		discount_table[key] = value;
		this.setD();
	};

	handleRowChange = ({ value, key, index }) => {
		const { discount_table } = this.props;
		discount_table.vertical_row_view.rows[index][key] = value;
		this.setD();
	};

	addRow = () => {
		const { discount_table, fields } = this.props;
		const currentRows = discount_table.vertical_row_view.rows;
		const defaultRows = fields.vertical_row_view.defaultRows;

		if (currentRows.length < defaultRows.length) {
			currentRows.push(defaultRows[currentRows.length]);
		} else {
			currentRows.push({ discount_table: 0 });
		}

		this.setD();
	};

	deleteRow = () => {
		const { discount_table } = this.props;
		discount_table.vertical_row_view.rows.pop();
		this.setD();
	};

	getAddDeleteItems = (check) => {
		return [
			<Button
				icon
				key='add-rev'
				tooltipPosition='top'
				disabled={!check.add}
				tooltipLabel='Add Row'
				onClick={() => this.addRow()}
				className={classNames('discount_table_sheet', 'add-row')}
			>
				<FontAwesomeIcon icon={faPlus} className={classNames(!check.add ? 'themeMe' : 'primary-icon')} />
			</Button>,
			<Button
				icon
				key='del-rev'
				tooltipPosition='top'
				disabled={!check.delete}
				tooltipLabel='Delete Row'
				onClick={() => this.deleteRow()}
				className={classNames('discount_table_sheet delete-row warn-btn-icon')}
			>
				<FontAwesomeIcon icon={faMinus} className={classNames(!check.delete ? 'themeMe' : 'warn-icon')} />
			</Button>,
		];
	};

	render() {
		const { handleChange } = this;
		const { fields, discount_table, selected, onSelect } = this.props;

		const handlers = { row: this.handleRowChange };
		const data = genData({ fieldsObj: fields, state: discount_table, handleChange, handlers });

		const lastRow = data.length - 1;

		let warning;
		if (
			discount_table['cash_accrual_time']['value'] !== 'mid_month' ||
			discount_table['discount_method']['value'] !== 'yearly'
		) {
			warning = (
				<Box
					css={`
						display: flex;
						align-items: center;
						background: ${({ theme }) => theme.palette.background.transparent};
					`}
				>
					<Icon css='margin: 0 .5rem 0 .5rem' color='warning'>
						{faExclamationTriangle}
					</Icon>
					Yearly Mid-Month equiv to ARIES Monthly
				</Box>
			);
		}

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

		return (
			data && (
				<div id='cost-model-detail-inputs' className='discount_table_sheet sub-model-detail-sheet'>
					<h2 className='md-text'>Discount Table</h2>
					<div>
						{warning}
						<ReactDataSheet
							data={data}
							dataRenderer={dataRenderer}
							valueRenderer={valueRenderer}
							selected={selected.discount_table_sheet}
							className='on-hover-paper-2 data-sheet-paper'
							onSelect={(sel) => onSelect('discount_table_sheet', sel)}
						/>
					</div>
				</div>
			)
		);
	}
}
