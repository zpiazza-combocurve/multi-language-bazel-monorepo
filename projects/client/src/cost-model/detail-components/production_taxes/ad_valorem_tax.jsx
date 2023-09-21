/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton, InfoTooltipWrapper } from '@/components/v2';

import { createNewRow, dataRenderer, valueRenderer } from '../gen-data';
import { genData, rowDateRangeChange, rowNumberRangeChange, rowNumberRangeRateChange } from '../helper';
import { PA_IF_DATA_H, PA_IF_DATA_V } from './PaImpactFeeTable';

const description = (
	<ul>
		<li>Ad Valorem Taxes are imposed as real property taxes by county/parish.</li>
		<li>
			PA Impact Fees are located here for modeling purposes. To pre-populate with the current PUC schedules for
			both horizontal and vertical wells, select PA IF from the state dropdown selection.
		</li>
	</ul>
);

const description_pa_if = (
	<ul>
		<li>
			Pennsylvania Impact Fees are imposed as $/year payment beginning the spud year of horizontal wells for the
			first 15-years. Vertical wells are 20% of the horizontal fee for the first 10-years. The schedule can be
			adjusted annually by the PUC according to CPI and depends on the average gas price for the preceding
			calendar year.
		</li>
		<li>
			For modeling simplicity, monthly gas prices from the pricing inputs (no differentials) are used to determine
			the fee column. If populated from the header or schedule, spud date is used to determine the years of
			service for the fee schedule but FPD can also be selected where appropriate.
		</li>
		<li>
			Use dropdown selections &quot;No&quot;, &quot;Shrunk&quot; and &quot;WI&quot;. The first and second do not
			apply and by statute, the leaseholder pays the landowner&apos;s portion.
		</li>
		<li>For further reading, see: https://www.act13-reporting.puc.pa.gov/Modules/Disbursements/FeeSchedule.aspx</li>
	</ul>
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

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };

	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];

	if (len >= 2) {
		check.delete = true;
	}

	if (
		lastRow.ad_valorem_tax ||
		lastRow.ad_valorem_tax === 0 ||
		lastRow.ad_valorem_tax_2 ||
		lastRow.ad_valorem_tax_2 === 0
	) {
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

const genDataWithPaif = ({ fields, severance_tax, ad_valorem_tax, handleChange, handlers }) => {
	const esc_models = fields.escalation_model.subItems.row_view.columns.escalation_model_1.menuItems;
	let escalationPermittedValues = esc_models.map((val) => val.value);
	for (let esc_model of ['escalation_model_1', 'escalation_model_2']) {
		if (ad_valorem_tax.escalation_model === undefined) {
			// old models
			continue;
		}
		if (ad_valorem_tax.escalation_model.subItems.row_view.headers[esc_model] !== undefined) {
			// not imported escalation models
			let esc_model_id = ad_valorem_tax.escalation_model.subItems.row_view.headers[esc_model].value;
			if (!escalationPermittedValues.includes(esc_model_id)) {
				ad_valorem_tax.escalation_model.subItems.row_view.headers[esc_model] =
					defaultEscalationModel.subItems.row_view.headers[esc_model];
			}
		}
	}

	let data = genData({ fieldsObj: fields, state: ad_valorem_tax, handleChange, handlers });
	let paifData = null;

	if (severance_tax?.state?.value === 'pennsylvania horizontal') {
		paifData = PA_IF_DATA_H;
		data = data.slice(0, 4); // get rid of row view
		data.forEach((r) => {
			r.pop(); // get rid of the last empty cell of each data row
		});
	} else if (severance_tax?.state?.value === 'pennsylvania vertical') {
		paifData = PA_IF_DATA_V;
		data = data.slice(0, 4); // get rid of row view
		data.forEach((r) => {
			r.pop(); // get rid of the last empty cell of each data row
		});
	} else {
		data = genData({ fieldsObj: fields, state: ad_valorem_tax, handleChange, handlers });
		data.splice(3, 1);
	}

	return { data, paifData };
};

export function AdValoremTax(props) {
	const { severance_tax, ad_valorem_tax, fields, setAdValoremTax, selected, onSelect } = props;

	const setAD = () => setAdValoremTax(ad_valorem_tax, 'ad_valorem_tax');

	const handleChange = (properties) => {
		const { value, key } = properties;
		ad_valorem_tax[key] = value;
		setAD();
	};

	const handleRowChange = (properties) => {
		const { value, key, index } = properties;

		ad_valorem_tax.row_view.rows[index][key] = value;
		setAD();
	};

	const handleRowHeaderChange = (properties) => {
		const { value, key, fullMenuItem } = properties;
		if (key.includes('escalation_model')) {
			if (ad_valorem_tax.escalation_model == null) {
				// handle old model
				ad_valorem_tax['escalation_model'] = defaultEscalationModel;
			}
			ad_valorem_tax.escalation_model.subItems.row_view.headers[key] = value;
		} else {
			ad_valorem_tax.row_view.headers[key] = value;
			ad_valorem_tax.row_view.rows.forEach((r) => {
				/* eslint-disable no-param-reassign */
				if (fullMenuItem.Default || fullMenuItem.Default === 0) {
					r[key] = fullMenuItem.Default;
				} else if (fullMenuItem.staticValue) {
					r[key] = fullMenuItem.staticValue;
				} else {
					r[key] = '';
				}
				/* eslint-enable no-param-reassign */
			});
		}
		if (value.value === 'entire_well_life') {
			ad_valorem_tax.row_view.rows = [ad_valorem_tax.row_view.rows[0]];
		}
		setAD();
	};

	const handleRowDateRangeChange = (properties) => {
		const { value, key, index } = properties;
		const rows = ad_valorem_tax.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
		setAD();
	};

	const handleRowNumberRangeChange = (properties) => {
		const { value, key, index } = properties;
		const rows = ad_valorem_tax.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
		setAD();
	};

	const handleRowNumberRangeRateChange = (properties) => {
		const { value, key, index } = properties;
		const rows = ad_valorem_tax.row_view.rows;
		rowNumberRangeRateChange({ rows, value, key, index });
		setAD();
	};

	const addRow = () => {
		const row_view = ad_valorem_tax.row_view;
		const columnFields = fields.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
		setAD();
	};

	const deleteRow = () => {
		ad_valorem_tax.row_view.rows.pop();
		const new_rows = ad_valorem_tax.row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setAD();
	};

	const getAddDeleteItems = (check) => {
		return [
			<IconButton
				key='add-rev'
				onClick={addRow}
				disabled={!check.add}
				tooltipPlacement='top'
				tooltipTitle='Add Row'
				color='primary'
			>
				{faPlus}
			</IconButton>,
			<IconButton
				key='del-rev'
				onClick={deleteRow}
				tooltipPlacement='top'
				disabled={!check.delete}
				tooltipTitle='Delete Row'
				color='warning'
			>
				{faMinus}
			</IconButton>,
		];
	};

	const handlers = {
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
		'number-range-rate': handleRowNumberRangeRateChange,
	};

	const { data, paifData } = genDataWithPaif({ fields, severance_tax, ad_valorem_tax, handleChange, handlers });
	let paifTableHeader = '';
	if (severance_tax?.state?.value === 'pennsylvania horizontal') {
		paifTableHeader = 'PA IF H Table 2021';
	} else if (severance_tax?.state?.value === 'pennsylvania vertical') {
		paifTableHeader = 'PA IF V Table 2021';
	}

	const check = checkAddDeleteRow(ad_valorem_tax);
	return (
		data && (
			<div id='cost-model-detail-inputs' className='ad_valorem_tax_sheet sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text reversion-header'>Ad Valorem Tax</h2>
					<InfoTooltipWrapper tooltipTitle={description} fontSize='18px' />
				</Header>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.ad_valorem_tax_sheet}
					className='on-hover-paper-2 data-sheet-paper table-layout'
					onSelect={(sel) => onSelect('ad_valorem_tax_sheet', sel)}
				/>
				<div id='add-delete-row'>{check.showBtn && !paifData && getAddDeleteItems(check)}</div>
				{paifData && (
					<div>
						<Header>
							<h2 className='md-text reversion-header'>{paifTableHeader}</h2>
							<InfoTooltipWrapper tooltipTitle={description_pa_if} fontSize='18px' />
						</Header>
						<ReactDataSheet
							data={paifData}
							dataRenderer={dataRenderer}
							valueRenderer={valueRenderer}
							selected={selected.pa_if_sheet}
							className='on-hover-paper-2 data-sheet-paper table-layout'
							onSelect={(sel) => onSelect('pa_if_sheet', sel)}
						/>
					</div>
				)}
			</div>
		)
	);
}
