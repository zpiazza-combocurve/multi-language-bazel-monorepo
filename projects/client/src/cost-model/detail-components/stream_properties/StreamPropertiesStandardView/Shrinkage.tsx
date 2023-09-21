import classNames from 'classnames';

import ReactDataSheet from '@/components/InptDataSheet';
import { defaultHandlePasteCells, parseValue } from '@/cost-model/detail-components/copy-paste';
import { createNewRow, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import {
	addDeleteRow,
	genData,
	getAddDeleteItemsInline,
	rowDateRangeChange,
	rowNumberRangeChange,
	rowNumberRangeRateChange,
} from '@/cost-model/detail-components/helper';
import { ShrinkageProps } from '@/cost-model/detail-components/stream_properties/StreamPropertiesStandardView/types';

function checkAddDeleteRow(shrinkage) {
	const check = {
		oil: {
			add: false,
			delete: false,
			showBtn: false,
			rows: shrinkage.oil.subItems.row_view.rows,
		},
		gas: {
			add: false,
			delete: false,
			showBtn: false,
			rows: shrinkage.gas.subItems.row_view.rows,
		},
	};
	const rowValueKey = 'pct_remaining';

	addDeleteRow({ check, rowValueKey });

	return check;
}

const inlineBtnInfo = {
	oil: { check: 'oil', row: 0, col: 0 },
	gas: { check: 'gas', row: 0, col: 0 },
};

function genShrinkageData({ fieldsObj, state, handleChange, handlers, relianceKeys }) {
	const data = genData({ fieldsObj, state, handleChange, handlers, relianceKeys });

	if (!data || !data.length) {
		return null;
	}

	let prevRow = '';
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

			if (col.value === 'Oil') {
				inlineBtnInfo.oil.row = rowIndex;
				inlineBtnInfo.oil.col = colIndex;
				prevRow = 'list-item-oil';
			}

			if (col.value === 'Gas') {
				inlineBtnInfo.gas.row = rowIndex;
				inlineBtnInfo.gas.col = colIndex;
				prevRow = 'list-item-gas';
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
	});

	return data;
}

export function Shrinkage(props: ShrinkageProps): JSX.Element | null {
	const { shrinkage, fields, setShrinkage, selected, onSelect } = props;
	const gas = shrinkage.gas;
	const oil = shrinkage.oil;

	const setSK = () => setShrinkage(shrinkage, 'shrinkage');

	const handleChange = (properties) => {
		const { value, key } = properties;
		shrinkage[key] = value;
		setSK();
	};

	const handleRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;

		shrinkage[stateKey].subItems.row_view.rows[index][key] = value;
		setSK();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;

		shrinkage[stateKey].subItems.row_view.headers[key] = value;
		shrinkage[stateKey].subItems.row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});
		if (value.value === 'entire_well_life') {
			shrinkage[stateKey].subItems.row_view.rows = [shrinkage[stateKey].subItems.row_view.rows[0]];
		}
		setSK();
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = shrinkage[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
		setSK();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = shrinkage[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
		setSK();
	};

	const handleRowNumberRangeRateChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = shrinkage[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
		setSK();
	};

	const addRow = (stateKey) => {
		const row = shrinkage[stateKey].subItems.row_view.rows[0];
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row, columnFields);
		shrinkage[stateKey].subItems.row_view.rows.push(newRow);
		setSK();
	};

	const deleteRow = (stateKey) => {
		shrinkage[stateKey].subItems.row_view.rows.pop();
		const new_rows = shrinkage[stateKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setSK();
	};

	const applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				handleRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				return;
			case 'number-range':
				handleRowNumberRangeChange({ ...meta, value });
				return;
			case 'number-range-rate':
				handleRowNumberRangeRateChange({ ...meta, value });
				return;
			default:
				if (meta.subKey === 'row_view' && rawValue !== '[object Object]') {
					const index = meta.fullMenuItems.findIndex(
						(item) => item.value === rawValue || item.label === rawValue
					);
					handleRowHeaderChange({
						...meta,
						fullMenuItem: meta.fullMenuItems[index],
						value: meta.menuItems[index],
					});
					return;
				}
				if (meta.index || meta.index === 0) {
					handleRowChange({ ...meta, value });
				}
		}
	};

	const handlePasteCells = (stateKey, changes, additions) => {
		const onlyFirstRow = shrinkage[stateKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => addRow(stateKey),
			changeCell: (meta, rawValue) => applyChangeCell(meta, rawValue),
			onlyFirstRow,
		});

		setSK();
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const relianceKeys = ['oil', 'gas'];
	const data = genShrinkageData({
		fieldsObj: fields,
		state: shrinkage,
		handleChange,
		handlers,
		relianceKeys,
	});

	const oilFields = {
		oil: fields.oil,
	};

	const gasFields = {
		gas: fields.gas,
	};

	const rateFields = {
		rate_type: fields.rate_type,
		rows_calculation_method: fields.rows_calculation_method,
	};

	const oilData = genShrinkageData({
		fieldsObj: oilFields,
		state: { oil },
		handleChange,
		handlers,
		relianceKeys: ['oil'],
	});
	const gasData = genShrinkageData({
		fieldsObj: gasFields,
		state: { gas },
		handleChange,
		handlers,
		relianceKeys: ['gas'],
	});

	const rateData = genShrinkageData({
		fieldsObj: rateFields,
		state: { ...shrinkage },
		handleChange,
		handlers,
		relianceKeys: ['oil', 'gas'],
	});

	const check = checkAddDeleteRow(shrinkage);
	const checkKeys = ['oil', 'gas'];
	checkKeys.forEach((key) => {
		const data = key === 'oil' ? oilData : gasData;
		getAddDeleteItemsInline({ check, key, data, inlineBtnInfo, addRow, deleteRow });
	});

	return (
		data && (
			<div id='cost-model-detail-inputs' className='shrinkage_sheet sub-model-detail-sheet'>
				<div className='cost-model-detail-header-row'>
					<h2 className='md-text'>Shrinkage</h2>
				</div>

				{rateData && (
					<ReactDataSheet
						data={rateData}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.rate_shrinkage_sheet}
						className='on-hover-paper-2 data-sheet-paper table-layout'
						onSelect={(sel) => onSelect('rate_shrinkage_sheet', sel)}
					/>
				)}

				{oilData && (
					<ReactDataSheet
						data={oilData}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.oil_shrinkage_sheet}
						className='on-hover-paper-2 data-sheet-paper table-layout'
						onSelect={(sel) => onSelect('oil_shrinkage_sheet', sel)}
						onPasteCells={(changes, additions) => {
							handlePasteCells('oil', changes, additions);
						}}
					/>
				)}

				{gasData && (
					<ReactDataSheet
						data={gasData}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.gas_shrinkage_sheet}
						className='on-hover-paper-2 data-sheet-paper table-layout'
						onSelect={(sel) => onSelect('gas_shrinkage_sheet', sel)}
						onPasteCells={(changes, additions) => handlePasteCells('gas', changes, additions)}
					/>
				)}
			</div>
		)
	);
}
