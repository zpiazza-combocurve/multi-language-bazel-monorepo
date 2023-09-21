import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { Component } from 'react';

import { InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton, InfoTooltipWrapper } from '@/components/v2';

import { defaultHandlePasteCells, parseValue } from '../copy-paste';
import { createNewRow, dataRenderer, genData, valueRenderer } from '../gen-data';
import prebuiltDepreciationModels from './prebuilt_models';

const description = (
	<>
		<div>
			Model Type: Chose to create a model for CAPEX items to either be Depreciated, Depleted or expensed.
			<br />
			<ul>
				<li>
					Expensed items such as same-zone workovers which are written off in the first year, can have no DD&A
					model applied or just a depreciation model with 100% in year 1
				</li>
				<li>
					Depreciated items such as Drilling can have separate schedules applied on the tangible or intangible
					portions as defined in the CAPEX model. Several built-in schedules can be populated and edited.
				</li>
				<li>
					Depleted items such as initial purchase price can be deducted against income for taxation by several
					methods
				</li>
			</ul>
		</div>
		<div>
			Depletion Model: Depleted items such as initial purchase price can be deducted against income for taxation
			by several methods and applied separately for the amounts located in tangible (for modeling purposes only
			since tangible items are never depleted) and intangible. Be mindful when 15% Percentage Depletion is
			selected in General Options as the greater of that or the applied method below will be used in CC
			calculations.
			<br />
			<ul>
				<li>
					UOP (Major Phase) - Units of Production which is the current monthly production of the major phase
					divided by EUR times the running balance of the basis.
				</li>
				<li>
					UOP (BOE) - Units of Production which is the current monthly production of the well using the BOE
					factor divided by EUR times the running balance of the basis.
				</li>
				<li>Deduct at Economic Limit - For items that can&#39;t be written off until plugging, sale, etc.</li>
				<li>No Depletion - Do not deduct any depletion for this particular item.</li>
				<li>Expense at FPD - Deduct 100% of the entire amount in the year the expenditure is made.</li>
			</ul>
		</div>
	</>
);

function checkAddDeleteRow(data, model) {
	const check = { add: false, delete: false, showBtn: false };
	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];
	if (len >= 2) {
		check.delete = true;
	}
	if ((lastRow.tan_factor || lastRow.tan_factor === 0) && (lastRow.year || lastRow.year === 0)) {
		if ((lastRow.tan_cumulative || lastRow.tan_cumulative === 0) && lastRow.tan_cumulative < 100) {
			check.add = true;
		}
	}
	if ((lastRow.factor || lastRow.factor === 0) && (lastRow.year || lastRow.year === 0)) {
		if ((lastRow.cumulative || lastRow.cumulative === 0) && lastRow.cumulative < 100) {
			check.add = true;
		}
	}
	if (check.add || check.delete) {
		check.showBtn = true;
	}
	if (model.depreciation_or_depletion.value === 'depletion') {
		check.showBtn = false;
	}

	return check;
}

export class DepreciationModel extends Component {
	setD = () => {
		const { depreciation_model, setDepreciationModel } = this.props;

		setDepreciationModel(depreciation_model, 'depreciation_model');
	};

	applyRowChange = ({ value, key, index, stateKey }) => {
		const { depreciation_model } = this.props;
		depreciation_model[stateKey].subItems.row_view.rows[index][key] = value;
	};

	handleRowChange = (props) => {
		this.checkBonusDepreciation();
		this.applyRowChange(props);
		this.setD();
	};

	checkBonusDepreciation = () => {
		const { depreciation_model } = this.props;

		if (!('tcja_bonus' in depreciation_model)) {
			depreciation_model.tcja_bonus = { label: 'No', value: 'no' };
		}
		if (!('bonus_depreciation' in depreciation_model)) {
			depreciation_model.bonus_depreciation = {};
			depreciation_model.bonus_depreciation.subItems = {};
			depreciation_model.bonus_depreciation.subItems.row_view = {};
			depreciation_model.bonus_depreciation.subItems.row_view.headers = {
				intangible_bonus_depreciation: '% Intangible Bonus Depreciation',
				tangible_bonus_depreciation: '% Tangible Bonus Depreciation',
			};
			depreciation_model.bonus_depreciation.subItems.row_view.rows = [
				{ intangible_bonus_depreciation: 0, tangible_bonus_depreciation: 5 },
			];
		}
	};

	handleChange = (properties) => {
		const { value, key } = properties;
		const { depreciation_model, setDepreciationModel } = this.props;
		if ((key !== 'tax_credit' && key !== 'tcja_bonus') || key === 'depreciation_or_depletion') {
			depreciation_model.tax_credit = 0;
			depreciation_model.prebuilt = { label: 'Custom', value: 'custom' };
			depreciation_model.depreciation.subItems.row_view.rows = [
				{
					year: 1,
					tan_factor: 0,
					tan_cumulative: 0,
					intan_factor: 0,
					intan_cumulative: 0,
				},
			];

			if (depreciation_model.depreciation_or_depletion.value === 'depreciation') {
				depreciation_model.tangible_depletion_model = {
					label: 'Unit Of Production (Major Phase)',
					value: 'unit_of_production_major',
					disabled: false,
				};

				depreciation_model.intangible_depletion_model = {
					label: 'Unit Of Production (Major Phase)',
					value: 'unit_of_production_major',
					disabled: false,
				};
			}
		}
		setDepreciationModel(
			produce(depreciation_model, (draft) => {
				draft[key] = value;
			}),
			'depreciation_model'
		);
	};

	applyRowHeaderChange = (properties) => {
		const { key, fullMenuItem } = properties;
		const { depreciation_model } = this.props;

		depreciation_model[key] = fullMenuItem;

		if (fullMenuItem.value === 'custom') {
			while (depreciation_model.depreciation.subItems.row_view.rows.length !== 1) {
				this.handleDeleteRow();
			}
			depreciation_model.depreciation.subItems.row_view.rows[0].tan_factor = 0;
			depreciation_model.depreciation.subItems.row_view.rows[0].intan_factor = 0;
		}

		const model = prebuiltDepreciationModels.prebuiltDepreciationModels[fullMenuItem.value];

		if (fullMenuItem.value !== 'custom') {
			if (model.length < depreciation_model.depreciation.subItems.row_view.rows.length) {
				while (model.length < depreciation_model.depreciation.subItems.row_view.rows.length) {
					this.handleDeleteRow();
				}
			}

			if (model.length > depreciation_model.depreciation.subItems.row_view.rows.length) {
				while (model.length > depreciation_model.depreciation.subItems.row_view.rows.length) {
					this.handleAddRow();
				}
			}

			for (let i = 0; i < model.length; i++) {
				depreciation_model.depreciation.subItems.row_view.rows[i]['tan_factor'] = model[i];
				depreciation_model.depreciation.subItems.row_view.rows[i]['intan_factor'] = model[i];
			}
		}

		this.setD();
	};

	handleRowHeaderChange = (properties) => {
		this.applyRowHeaderChange(properties);
		this.setD();
	};

	applyAddRow = () => {
		const { fields, depreciation_model } = this.props;

		const stateKey = depreciation_model.depreciation_or_depletion.value;
		const columnFields = fields[stateKey].subItems.row_view.columns;
		const row = depreciation_model[stateKey].subItems.row_view.rows[0];
		const newRow = createNewRow(row, columnFields);
		depreciation_model[stateKey].subItems.row_view.rows.push(newRow);
	};

	handleAddRow = () => {
		this.applyAddRow();
		this.setD();
	};
	applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		if (meta.index || meta.index === 0) {
			this.applyRowChange({ ...meta, value });
		}
	};

	handlePasteCells = (changes, additions) => {
		defaultHandlePasteCells({
			additions,
			changes,
			addRow: this.applyAddRow,
			changeCell: this.applyChangeCell,
		});

		this.setD();
	};

	handleDeleteRow = () => {
		const { depreciation_model } = this.props;

		const stateKey = depreciation_model.depreciation_or_depletion.value;
		depreciation_model[stateKey].subItems.row_view.rows.pop();
		this.setD();
	};

	getAddDeleteItems = (check) => {
		return [
			<IconButton
				key='add-rev'
				disabled={!check.add}
				tooltipPlacement='top'
				tooltipTitle='Add Row'
				onClick={this.handleAddRow}
				color='primary'
			>
				{faPlus}
			</IconButton>,
			<IconButton
				key='del-rev'
				tooltipPlacement='top'
				disabled={!check.delete}
				tooltipTitle='Delete Row'
				onClick={this.handleDeleteRow}
				color='error'
			>
				{faMinus}
			</IconButton>,
		];
	};

	render() {
		const { depreciation_model, fields, selected, onSelect } = this.props;
		const handlers = {
			row: this.handleRowChange,
			rowHeader: this.handleRowHeaderChange,
		};
		const data = genData({
			fieldsObj: fields,
			state: depreciation_model,
			handlers,
			handleChange: this.handleChange,
		});

		// only check the selected model: depreciation or depletion
		const check = checkAddDeleteRow(depreciation_model['depreciation'].subItems, depreciation_model);

		if (!data.length) {
			return null;
		}

		const isDepreciation = depreciation_model.depreciation_or_depletion.value === 'depreciation';

		const renderDepreciation = () => (
			<>
				<div className='price-data-sheets phase-cat-selects'>
					<ReactDataSheet
						data={data.slice(0, 3)}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.prebuilt_sheet}
						className='on-hover-paper-2 data-sheet-paper dda-prebuild'
						onSelect={(sel) => onSelect('prebuilt_sheet', sel)}
					/>
				</div>
				<div>
					<h3>Bonus Depreciation</h3>
					<ReactDataSheet
						data={data.slice(3, 6)}
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						className='on-hover-paper-2 dda-prebuild'
					/>
				</div>
				<div>
					<h3>Depreciation</h3>
					<InptDataSheet
						data={data.slice(6)}
						onSelect={onSelect}
						selKey='depreciation_sheet'
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						onPasteCells={this.handlePasteCells}
						selected={selected.depreciation_sheet}
						className='on-hover-paper-2 data-sheet-paper'
					/>
					<div id='add-delete-row'>{check.showBtn && this.getAddDeleteItems(check)}</div>
				</div>
			</>
		);

		const renderDepletion = () => (
			<div>
				<b>
					If 15% depletion is enabled on general options, then only the greater depletion method will be
					deducted
				</b>
				<br />
				<br />
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.prebuilt_sheet}
					className='on-hover-paper-2 data-sheet-paper'
					onSelect={(sel) => onSelect('depletion_sheet', sel)}
				/>
				<div id='add-delete-row'>{check.showBtn && this.getAddDeleteItems(check)}</div>
			</div>
		);

		return (
			<div>
				<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
					<Header>
						<h2 className='md-text'>DD&A (Depreciation, Depletion & Amortization)</h2>
						<InfoTooltipWrapper tooltipTitle={description} fontSize='16px' />
					</Header>
					{isDepreciation && renderDepreciation()}
					{!isDepreciation && renderDepletion()}
				</div>
			</div>
		);
	}
}
