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
import { LossFlareProps } from '@/cost-model/detail-components/stream_properties/StreamPropertiesStandardView/types';

function checkAddDeleteRow(loss_flare) {
	const check = {
		gas_loss: {
			add: false,
			delete: false,
			showBtn: false,
			rows: loss_flare.gas_loss.subItems.row_view.rows,
		},
		gas_flare: {
			add: false,
			delete: false,
			showBtn: false,
			rows: loss_flare.gas_flare.subItems.row_view.rows,
		},
		oil_loss: {
			add: false,
			delete: false,
			showBtn: false,
			rows: loss_flare.oil_loss.subItems.row_view.rows,
		},
	};
	const rowValueKey = 'pct_remaining';

	addDeleteRow({ check, rowValueKey });

	return check;
}

type InlineBtnInfo = {
	[key: string]: {
		check: string;
		row: number | undefined;
		col: number | undefined;
	};
};

const inlineBtnInfo: InlineBtnInfo = {
	oil_loss: { check: 'oil_loss', row: undefined, col: undefined },
	gas_loss: { check: 'gas_loss', row: undefined, col: undefined },
	gas_flare: { check: 'gas_flare', row: undefined, col: undefined },
};

function genLossFlareData({ fieldsObj, state, handleChange, handlers, relianceKeys }) {
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

			if (col.value === 'Oil Loss') {
				inlineBtnInfo.oil_loss.row = rowIndex;
				inlineBtnInfo.oil_loss.col = colIndex;
				prevRow = 'list-item-oil_loss';
			}

			if (col.value === 'Gas Loss') {
				inlineBtnInfo.gas_loss.row = rowIndex;
				inlineBtnInfo.gas_loss.col = colIndex;
				prevRow = 'list-item-gas_loss';
			}

			if (col.value === 'Gas Flare') {
				inlineBtnInfo.gas_flare.row = rowIndex;
				inlineBtnInfo.gas_flare.col = colIndex;
				prevRow = 'list-item-gas_flare';
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

export function LossFlare(props: LossFlareProps) {
	const { loss_flare, fields, setLossFlare, selected, onSelect } = props;
	const oilLoss = loss_flare.oil_loss;
	const gasLoss = loss_flare.gas_loss;
	const gasFlare = loss_flare.gas_flare;

	const setLF = () => setLossFlare(loss_flare, 'loss_flare');

	const handleChange = (properties) => {
		const { value, key } = properties;
		loss_flare[key] = value;
		setLF();
	};

	const handleRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;

		loss_flare[stateKey].subItems.row_view.rows[index][key] = value;
		setLF();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;

		loss_flare[stateKey].subItems.row_view.headers[key] = value;
		loss_flare[stateKey].subItems.row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});
		if (value.value === 'entire_well_life') {
			loss_flare[stateKey].subItems.row_view.rows = [loss_flare[stateKey].subItems.row_view.rows[0]];
		}
		setLF();
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = loss_flare[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
		setLF();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = loss_flare[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
		setLF();
	};

	const handleRowNumberRangeRateChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = loss_flare[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
		setLF();
	};

	const addRow = (stateKey) => {
		const row = loss_flare[stateKey].subItems.row_view.rows[0];
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row, columnFields);
		loss_flare[stateKey].subItems.row_view.rows.push(newRow);
		setLF();
	};

	const deleteRow = (stateKey) => {
		loss_flare[stateKey].subItems.row_view.rows.pop();
		const new_rows = loss_flare[stateKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setLF();
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
		const onlyFirstRow = loss_flare[stateKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => addRow(stateKey),
			changeCell: (meta, rawValue) => applyChangeCell(meta, rawValue),
			onlyFirstRow,
		});

		setLF();
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const oilLossFields = {
		oil_loss: fields.oil_loss,
	};

	const gasLossFields = {
		gas_loss: fields.gas_loss,
	};

	const gasFlareFields = {
		gas_flare: fields.gas_flare,
	};

	const rateFields = {
		rate_type: fields.rate_type,
		rows_calculation_method: fields.rows_calculation_method,
	};

	const relianceKeys = ['oil_loss', 'gas_loss', 'gas_flare'];

	const oilLossData = genLossFlareData({
		fieldsObj: oilLossFields,
		state: { oil_loss: oilLoss },
		handleChange,
		handlers,
		relianceKeys: ['oil_loss'],
	});

	const gasLossData = genLossFlareData({
		fieldsObj: gasLossFields,
		state: { gas_loss: gasLoss },
		handleChange,
		handlers,
		relianceKeys: ['gas_loss'],
	});

	const gasFlareData = genLossFlareData({
		fieldsObj: gasFlareFields,
		state: { gas_flare: gasFlare },
		handleChange,
		handlers,
		relianceKeys: ['gas_flare'],
	});

	const rateData = genLossFlareData({
		fieldsObj: rateFields,
		state: { ...loss_flare },
		handleChange,
		handlers,
		relianceKeys,
	});

	const check = checkAddDeleteRow(loss_flare);
	const checkKeys = ['oil_loss', 'gas_loss', 'gas_flare'];

	checkKeys.forEach((key) => {
		let data;
		switch (key) {
			case 'oil_loss':
				data = oilLossData;
				break;
			case 'gas_loss':
				data = gasLossData;
				break;
			case 'gas_flare':
				data = gasFlareData;
				break;
			default:
				data = [];
				break;
		}
		getAddDeleteItemsInline({ check, key, data, inlineBtnInfo, addRow, deleteRow });
	});

	return (
		<div id='cost-model-detail-inputs' className='loss_flare_sheet sub-model-detail-sheet'>
			<div className='cost-model-detail-header-row'>
				<h2 className='md-text'>Loss/Flare</h2>
			</div>
			{rateData && (
				<ReactDataSheet
					data={rateData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.rate_loss_flare_sheet}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('rate_loss_flare_sheet', sel)}
				/>
			)}
			{oilLossData && (
				<ReactDataSheet
					data={oilLossData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.oil_loss_loss_flare_sheet}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('oil_loss_loss_flare_sheet', sel)}
					onPasteCells={(changes, additions) => {
						handlePasteCells('oil_loss', changes, additions);
					}}
				/>
			)}
			{gasLossData && (
				<ReactDataSheet
					data={gasLossData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.gas_loss_loss_flare_sheet}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('gas_loss_loss_flare_sheet', sel)}
					onPasteCells={(changes, additions) => {
						handlePasteCells('gas_loss', changes, additions);
					}}
				/>
			)}

			{gasFlareData && (
				<ReactDataSheet
					data={gasFlareData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.gas_flare_loss_flare_sheet}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('gas_flare_loss_flare_sheet', sel)}
					onPasteCells={(changes, additions) => {
						handlePasteCells('gas_flare', changes, additions);
					}}
				/>
			)}
		</div>
	);
}
