/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton, InfoTooltipWrapper } from '@/components/v2';
import { clone } from '@/helpers/utilities';

import { GenerateData, createNewRow, dataRenderer, valueRenderer } from '../gen-data';
import { rowDateRangeChange, rowNumberRangeChange, rowNumberRangeRateChange } from '../helper';

const description = (
	<>
		<div>
			A simplistic State Tax regime can be selected as a starting point. These models have the default full-rate
			sev/adv taxes for each state but do not include:
		</div>
		<ul>
			<li>tax holidays</li>
			<li>stripper well status reversions</li>
		</ul>
		<div>
			Detailed &quot;PA Impact Fees&quot; for both Horizontal and Vertical lookup tables are listed below to be
			inserted into Ad Valorem Tax.
		</div>
	</>
);

const defaultEscalationModel = {
	subItems: {
		row_view: {
			headers: {
				escalation_model_1: { label: 'None', value: 'none' },
				escalation_model_2: { label: 'None', value: 'none' },
			},
			rows: [],
		},
	},
};

// eslint-disable-next-line complexity
function checkAddDeleteRow(severance_tax) {
	const check = {
		showBtn: false,
		showAdd: false,
		showDel: false,
		oil: { add: false, delete: false, rows: severance_tax.oil.subItems.row_view.rows },
		gas: { add: false, delete: false, rows: severance_tax.gas.subItems.row_view.rows },
		ngl: { add: false, delete: false, rows: severance_tax.ngl.subItems.row_view.rows },
		drip_condensate: { add: false, delete: false, rows: severance_tax.drip_condensate.subItems.row_view.rows },
	};
	const ignore = new Set(['showBtn', 'showAdd', 'showDel']);

	// eslint-disable-next-line complexity
	Object.keys(check).forEach((c) => {
		if (!ignore.has(c)) {
			const phase = check[c];
			const len = phase.rows.length;
			const lastRow = phase.rows[len - 1];
			if (len >= 2) {
				phase.delete = true;
			}
			if (
				lastRow.severance_tax ||
				lastRow.severance_tax === 0 ||
				lastRow.severance_tax_2 ||
				lastRow.severance_tax_2 === 0
			) {
				if (lastRow.criteria && lastRow.criteria.start_date) {
					phase.add = true;
				}
				if (lastRow.criteria && (lastRow.criteria.start || lastRow.criteria.start === 0)) {
					phase.add = true;
				}
			}
			delete phase.rows;
			if (phase.add) {
				check.showAdd = true;
			}
			if (phase.delete) {
				check.showDel = true;
			}
			if (phase.add || phase.delete) {
				check.showBtn = true;
			}
		}
	});
	return check;
}

const inlineBtnInfo = {
	oil: { check: 'oil' },
	gas: { check: 'gas' },
	ngl: { check: 'ngl' },
	drip_condensate: { check: 'drip_condensate' },
};

function genData(props) {
	const { fieldsObj, state, handleSpecialRowHeaderChange } = props;

	const esc_models = fieldsObj.oil.subItems.escalation_model.subItems.row_view.columns.escalation_model_1.menuItems;
	let escalationPermittedValues = esc_models.map((val) => val.value);
	for (let phase of ['oil', 'gas', 'ngl', 'drip_condensate']) {
		for (let esc_model of ['escalation_model_1', 'escalation_model_2']) {
			if (state[phase].subItems.escalation_model === undefined) {
				// old models
				continue;
			}
			if (state[phase].subItems.escalation_model.subItems.row_view.headers[esc_model] !== undefined) {
				// not imported escalation models
				let esc_model_id = state[phase].subItems.escalation_model.subItems.row_view.headers[esc_model].value;
				if (!escalationPermittedValues.includes(esc_model_id)) {
					state[phase].subItems.escalation_model.subItems.row_view.headers[esc_model] =
						defaultEscalationModel.subItems.row_view.headers[esc_model];
				}
			}
		}
	}

	if (state && !Object.keys(state).length) {
		return null;
	}
	const phases = ['oil', 'gas', 'ngl', 'drip_condensate'];

	const data = [];
	Object.keys(fieldsObj).forEach((key) => {
		const field = fieldsObj[key];

		if (key === 'state') {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({
				...props,
				data,
				field,
				stateKey: key,
				state: state[key],
				handlers: { rowHeader: handleSpecialRowHeaderChange },
				addHeader: false,
			});
			return;
		}

		if (field.multiRowHeaderReliance) {
			let needField = false;
			const relianceKey = Object.keys(field.multiRowHeaderReliance)[0];
			const relianceList = field.multiRowHeaderReliance[relianceKey];
			phases.forEach((phase) => {
				const phaseRelianceValue = state[phase].subItems.row_view.headers[relianceKey].value;
				if (relianceList.includes(phaseRelianceValue)) {
					needField = true;
				}
			});
			if (!needField) {
				return;
			}
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		GenerateData({ ...props, data, field, stateKey: key, state: state[key] });
	});

	if (!data.length) {
		return false;
	}

	let prevRow = false;
	const lastRow = data.length - 1;

	data[0][0].readOnly = false;
	data[1][0].readOnly = false;
	data[1][0].className += ' read-only';

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

export function SeveranceTax(props) {
	const { severance_tax, state_models, fields, setSeveranceTax, selected, onSelect } = props;
	const setSE = () => setSeveranceTax(severance_tax, 'severance_tax');

	const handleChange = (properties) => {
		const { value, key } = properties;
		severance_tax[key] = value;
		setSE();
	};

	const handleRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;

		severance_tax[stateKey].subItems.row_view.rows[index][key] = value;
		setSE();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;
		if (key.includes('escalation_model')) {
			if (severance_tax[stateKey].subItems.escalation_model == null) {
				// handle old model
				severance_tax[stateKey].subItems['escalation_model'] = defaultEscalationModel;
			}
			severance_tax[stateKey].subItems.escalation_model.subItems.row_view.headers[key] = value;
		} else {
			severance_tax[stateKey].subItems.row_view.headers[key] = value;
			severance_tax[stateKey].subItems.row_view.rows.forEach((r) => {
				if (fullMenuItem.Default || fullMenuItem.Default === 0) {
					r[key] = fullMenuItem.Default;
				} else if (fullMenuItem.staticValue) {
					r[key] = fullMenuItem.staticValue;
				} else {
					r[key] = '';
				}
			});
		}
		if (value.value === 'entire_well_life') {
			severance_tax[stateKey].subItems.row_view.rows = [severance_tax[stateKey].subItems.row_view.rows[0]];
		}
		setSE();
	};

	const handleSpecialRowHeaderChange = (properties) => {
		const { value, key, defaultModels } = properties;
		if (value.value === 'custom') {
			severance_tax[key] = value;
			setSE();
		} else {
			const stateSevTax = clone(defaultModels[value.value].severance_tax);
			const stateAdTax = clone(defaultModels[value.value].ad_valorem_tax);
			setSeveranceTax(stateSevTax, 'severance_tax');
			setSeveranceTax(stateAdTax, 'ad_valorem_tax');
		}
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = severance_tax[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
		setSE();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = severance_tax[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
		setSE();
	};

	const handleRowNumberRangeRateChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = severance_tax[stateKey].subItems.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
		setSE();
	};

	const addRow = (stateKey) => {
		const row_view = severance_tax[stateKey].subItems.row_view;
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
		setSE();
	};

	const deleteRow = (stateKey) => {
		severance_tax[stateKey].subItems.row_view.rows.pop();
		const new_rows = severance_tax[stateKey].subItems.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setSE();
	};

	const getAddDeleteItems = (check, inline, data) => {
		const btnInfo = inlineBtnInfo[inline];
		const addDisabled = !check.showAdd || !check[btnInfo.check].add;
		const delDisabled = !check.showDel || !check[btnInfo.check].delete;

		const { row, col } = btnInfo;

		const btns = [
			<IconButton disabled={addDisabled} key={`${inline}-add-row`} onClick={() => addRow(inline)} color='primary'>
				{faPlus}
			</IconButton>,
			<IconButton
				disabled={delDisabled}
				key={`${inline}-del-row`}
				onClick={() => deleteRow(inline)}
				color='warning'
			>
				{faMinus}
			</IconButton>,
		];

		data[row][col].rowBtns = btns;
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const data = genData({
		fieldsObj: fields,
		state: severance_tax,
		setSeveranceTax,
		handleChange,
		handleSpecialRowHeaderChange,
		handlers,
		defaultModels: state_models,
	});

	const check = checkAddDeleteRow(severance_tax);

	if (check.showBtn) {
		getAddDeleteItems(check, 'oil', data);
		getAddDeleteItems(check, 'gas', data);
		getAddDeleteItems(check, 'ngl', data);
		getAddDeleteItems(check, 'drip_condensate', data);
	}

	return (
		data && (
			<>
				<div id='cost-model-detail-inputs' className='state_sheet sub-model-detail-sheet'>
					<Header>
						<h2 className='md-text'>State</h2>
						<InfoTooltipWrapper tooltipTitle={description} fontSize='18px' />
					</Header>
					<ReactDataSheet
						className='on-hover-paper-2 data-sheet-paper'
						data={data.slice(0, 1)}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.state_sheet}
						onSelect={(sel) => onSelect('state_sheet', sel)}
					/>
				</div>
				<div id='cost-model-detail-inputs' className='severance_tax_sheet sub-model-detail-sheet'>
					<div className='cost-model-detail-header-row'>
						<h2 className='md-text reversion-header'>Severance Tax</h2>
					</div>
					<ReactDataSheet
						data={data.slice(1)}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.severance_tax_sheet}
						className='on-hover-paper-2 data-sheet-paper'
						onSelect={(sel) => onSelect('severance_tax_sheet', sel)}
					/>
				</div>
			</>
		)
	);
}
