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
import { YieldsProps } from '@/cost-model/detail-components/stream_properties/StreamPropertiesStandardView/types';

function checkAddDeleteRow(yields) {
	const check = {
		ngl: {
			add: false,
			delete: false,
			showBtn: false,
			rows: yields.ngl.subItems.row_view.rows,
		},
		drip_condensate: {
			add: false,
			delete: false,
			showBtn: false,
			rows: yields.drip_condensate.subItems.row_view.rows,
		},
	};

	const rowValueKey = 'yield';

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
	ngl: { check: 'ngl', row: undefined, col: undefined },
	drip_condensate: { check: 'drip_condensate', row: undefined, col: undefined },
};

function genYieldData({ fieldsObj, state, handleChange, handlers, relianceKeys }) {
	if (state && !Object.keys(state).length) {
		return null;
	}

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

			if (col.value === 'NGL') {
				inlineBtnInfo.ngl.row = rowIndex;
				inlineBtnInfo.ngl.col = colIndex;
				prevRow = 'list-item-ngl';
			}

			if (col.value === 'Drip Cond') {
				inlineBtnInfo.drip_condensate.row = rowIndex;
				inlineBtnInfo.drip_condensate.col = colIndex;
				prevRow = 'list-item-drip_condensate';
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

export function Yields(props: YieldsProps) {
	const { yields, fields, setYields, selected, onSelect } = props;
	const ngl = yields.ngl;
	const dripCondensate = yields['drip_condensate'];

	const setY = () => setYields(yields, 'yields');

	const handleChange = (properties) => {
		const { value, key } = properties;
		yields[key] = value;
		setY();
	};

	const handleRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;

		yields[stateKey].subItems.row_view.rows[index][key] = value;
		setY();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;

		yields[stateKey].subItems.row_view.headers[key] = value;

		yields[stateKey].subItems.row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});

		if (value.value === 'entire_well_life') {
			yields[stateKey].subItems.row_view.rows = [yields[stateKey].subItems.row_view.rows[0]];
		}
		setY();
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = yields[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
		setY();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = yields[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
		setY();
	};

	const handleRowNumberRangeRateChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = yields[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
		setY();
	};

	const addRow = (stateKey) => {
		const row = yields[stateKey].subItems.row_view.rows[0];
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row, columnFields);
		yields[stateKey].subItems.row_view.rows.push(newRow);
		setY();
	};

	const deleteRow = (stateKey) => {
		yields[stateKey].subItems.row_view.rows.pop();
		const new_rows = yields[stateKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setY();
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
		const onlyFirstRow = yields[stateKey].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => addRow(stateKey),
			changeCell: (meta, rawValue) => applyChangeCell(meta, rawValue),
			onlyFirstRow,
		});

		setY();
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const nglFields = {
		ngl: fields.ngl,
	};

	const dripCondensateFields = {
		drip_condensate: fields.drip_condensate,
	};

	const rowFields = {
		rate_type: fields.rate_type,
		rows_calculation_method: fields.rows_calculation_method,
	};

	const nglData = genYieldData({
		fieldsObj: nglFields,
		state: { ngl },
		handleChange,
		handlers,
		relianceKeys: ['ngl'],
	});

	const dripCondensateData = genYieldData({
		fieldsObj: dripCondensateFields,
		state: { drip_condensate: dripCondensate },
		handleChange,
		handlers,
		relianceKeys: ['drip_condensate'],
	});

	const ratesData = genYieldData({
		fieldsObj: rowFields,
		state: { ...yields },
		handleChange,
		handlers,
		relianceKeys: ['ngl', 'drip_condensate'],
	});

	const check = checkAddDeleteRow(yields);
	const checkKeys = ['ngl', 'drip_condensate'];
	checkKeys.forEach((key) => {
		const data = key === 'ngl' ? nglData : dripCondensateData;
		getAddDeleteItemsInline({ check, key, data, inlineBtnInfo, addRow, deleteRow });
	});

	return (
		<div id='cost-model-detail-inputs' className='yields_sheet sub-model-detail-sheet'>
			<div className='cost-model-detail-header-row'>
				<h2 className='md-text'>Yields</h2>
			</div>
			{ratesData && (
				<ReactDataSheet
					data={ratesData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.yields_sheet_rates}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('yields_sheet_rates', sel)}
				/>
			)}
			{nglData && (
				<span data-testid='ngl-data'>
					<ReactDataSheet
						data={nglData}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.yields_sheet_ngl}
						className='on-hover-paper-2 data-sheet-paper table-layout'
						onSelect={(sel) => onSelect('yields_sheet_ngl', sel)}
						onPasteCells={(changes, additions) => {
							handlePasteCells('ngl', changes, additions);
						}}
					/>
				</span>
			)}
			{dripCondensateData && (
				<ReactDataSheet
					data={dripCondensateData}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.yields_sheet_drip_condensate}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('yields_sheet_drip_condensate', sel)}
					onPasteCells={(changes, additions) => handlePasteCells('drip_condensate', changes, additions)}
				/>
			)}
		</div>
	);
}
