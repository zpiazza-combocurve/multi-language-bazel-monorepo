/* eslint-disable no-param-reassign */
import { faCalculator, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import produce from 'immer';
import _ from 'lodash';
import { Component } from 'react';

import ReactDataSheet from '@/components/InptDataSheet';
import { IconButton } from '@/components/v2';

import { SheetItemSpoof } from '../../../helpers/sheetItems';
import { clone } from '../../../helpers/utilities';
import { dataRenderer, genData, valueRenderer } from '../gen-data';

const nameToKey = {
	WI: 'working_interest',
	NRI: 'net_revenue_interest',
	'Lease NRI': 'lease_net_revenue_interest',
};

const defaultReversionTiedTo = {
	criteria: {
		label: 'As Of',
		value: 'as_of',
		staticValue: '',
		fieldType: 'static',
		fieldName: 'As Of',
	},
	value: '',
};

const resersionKeys = {
	initial_ownership: 'Initial',
	first_reversion: '1st Rev',
	second_reversion: '2nd Rev',
	third_reversion: '3rd Rev',
	fourth_reversion: '4th Rev',
	fifth_reversion: '5th Rev',
	sixth_reversion: '6th Rev',
	seventh_reversion: '7th Rev',
	eighth_reversion: '8th Rev',
	ninth_reversion: '9th Rev',
	tenth_reversion: '10th Rev',
};

export const getDefaultReversion = () => {
	// hanlde old models that don't have selected reversion
	return {
		subItems: {
			criteria: {
				criteria: {
					required: false,
					label: 'No Reversion',
					value: 'no_reversion',
					fieldType: 'static',
					staticValue: '',
				},
				value: '',
			},
			reversion_tied_to: defaultReversionTiedTo,
			balance: {
				label: 'Gross',
				value: 'gross',
			},
			include_net_profit_interest: {
				label: 'Yes',
				value: 'yes',
			},
			working_interest: '',
			original_ownership: {
				subItems: {
					net_revenue_interest: '',
					lease_net_revenue_interest: '',
				},
			},
			phase: {
				label: 'Oil',
				value: 'oil_ownership',
			},
			oil_ownership: {
				subItems: {
					net_revenue_interest: '',
					lease_net_revenue_interest: '',
				},
			},
			gas_ownership: {
				subItems: {
					net_revenue_interest: '',
					lease_net_revenue_interest: '',
				},
			},
			ngl_ownership: {
				subItems: {
					net_revenue_interest: '',
					lease_net_revenue_interest: '',
				},
			},
			drip_condensate_ownership: {
				subItems: {
					net_revenue_interest: '',
					lease_net_revenue_interest: '',
				},
			},
			empty_header: '',
			net_profit_interest: '',
		},
	};
};

const roundFloat = (value, digit = 8) => _.round(value, digit);

const addExtraBtn = ({ data, ownership, segmentKey, setOwnership }) => {
	const oneOwn = ownership[segmentKey].subItems;
	const {
		working_interest,
		original_ownership: {
			subItems: { lease_net_revenue_interest, net_revenue_interest },
		},
	} = oneOwn;

	const doCalc = (key) => {
		if (key === 'working_interest' && lease_net_revenue_interest) {
			const calculated_value = roundFloat((net_revenue_interest * 100) / lease_net_revenue_interest);
			setOwnership(
				produce(ownership, (draft) => {
					draft[segmentKey].subItems[key] = calculated_value;
				}),
				'ownership'
			);
		}

		if (key === 'net_revenue_interest') {
			const calculated_value = roundFloat((working_interest * lease_net_revenue_interest) / 100);
			setOwnership(
				produce(ownership, (draft) => {
					draft[segmentKey].subItems.original_ownership.subItems[key] = calculated_value;
				}),
				'ownership'
			);
		}

		if (key === 'lease_net_revenue_interest' && working_interest) {
			const calculated_value = roundFloat((net_revenue_interest * 100) / working_interest);
			setOwnership(
				produce(ownership, (draft) => {
					draft[segmentKey].subItems.original_ownership.subItems[key] = calculated_value;
				}),
				'ownership'
			);
		}
	};

	// add calculator button
	data.forEach((row, row_idx) => {
		row.forEach((col, col_idx) => {
			if (col.extraButton) {
				const filedKey = nameToKey[col.value];
				if (filedKey) {
					const btn = (
						<IconButton onClick={() => doCalc(filedKey)} size='sm'>
							{faCalculator}
						</IconButton>
					);
					data[row_idx][col_idx].extraButton = btn;
				}
			}
		});
	});
};

export class Ownership extends Component {
	state = {
		popBool: false,
	};

	setOwn = () => {
		const { setOwnership, ownership } = this.props;
		setOwnership(ownership, 'ownership');
	};

	handleChange = (properties) => {
		const { value, key, isSelect, fullMenuItem } = properties;
		const { ownership } = this.props;

		if (isSelect) {
			ownership[key] = fullMenuItem;
		} else {
			ownership[key] = value;
		}

		this.setOwn();
	};

	handleSubChange = (properties) => {
		const { value, key, subKey, keyList, isSelect, fullMenuItem } = properties;
		const { ownership } = this.props;

		if (keyList.length === 2) {
			if (isSelect) {
				ownership[key].subItems[subKey] = fullMenuItem;
			} else {
				ownership[key].subItems[subKey] = value;
			}
		} else if (keyList.length === 3) {
			if (isSelect) {
				ownership[keyList[0]].subItems[keyList[1]].subItems[keyList[2]] = fullMenuItem;
			} else {
				ownership[keyList[0]].subItems[keyList[1]].subItems[keyList[2]] = value;
			}
		}
		this.setOwn();
	};

	handleCriteriaChange = (properties) => {
		const { value, key, subKey, isSelect, fullMenuItem } = properties;
		const { ownership } = this.props;

		if (!ownership[key].subItems[subKey]) {
			// handle old model that doesn't have the reversion_tied_to field
			ownership[key].subItems[subKey] = defaultReversionTiedTo;
		}

		if (isSelect) {
			ownership[key].subItems[subKey].value = fullMenuItem;
		} else {
			ownership[key].subItems[subKey].value = value;
		}
		this.setOwn();
	};

	criteriaSelect = (properties) => {
		const { value, key, fullMenuItem, subKey } = properties;
		const { ownership } = this.props;

		if (!ownership[key]) {
			ownership[key] = getDefaultReversion();
		}

		// handle old model that doesn't have the reversion_tied_to field
		if (!ownership[key].subItems[subKey]) {
			ownership[key].subItems[subKey] = defaultReversionTiedTo;
		}
		const oneOwnRev = ownership[key].subItems[subKey];

		oneOwnRev.criteria = fullMenuItem || value;
		oneOwnRev.value = '';
	};

	reversionCriteriaSelect = (properties) => {
		const { key, subKey } = properties;
		const { ownership } = this.props;

		const prev_own_map = {
			first_reversion: 'initial_ownership',
			second_reversion: 'first_reversion',
			third_reversion: 'second_reversion',
			fourth_reversion: 'third_reversion',
			fifth_reversion: 'fourth_reversion',
			sixth_reversion: 'fifth_reversion',
			seventh_reversion: 'sixth_reversion',
			eighth_reversion: 'seventh_reversion',
			ninth_reversion: 'eighth_reversion',
			tenth_reversion: 'ninth_reversion',
		};

		if (!ownership[key]) {
			ownership[key] = getDefaultReversion();
		}

		const oneOwnRev = ownership[key].subItems[subKey];

		const prev_criteria = oneOwnRev.criteria.value;

		this.criteriaSelect(properties);

		if (prev_criteria === 'no_reversion' && ownership[prev_own_map[key]]) {
			// when turn on a reversion: set default ownership same as previous ownership
			const prev_own = ownership[prev_own_map[key]];
			const fill_in_keys = [
				'original_ownership',
				'oil_ownership',
				'gas_ownership',
				'ngl_ownership',
				'drip_condensate_ownership',
			];
			if (ownership[key].subItems.working_interest === '') {
				ownership[key].subItems.working_interest = prev_own.subItems.working_interest;
			}
			fill_in_keys.forEach((fKey) => {
				if (ownership[key].subItems[fKey].subItems.net_revenue_interest === '') {
					ownership[key].subItems[fKey].subItems.net_revenue_interest =
						prev_own.subItems[fKey].subItems.net_revenue_interest;
				}
				if (ownership[key].subItems[fKey].subItems.lease_net_revenue_interest === '') {
					ownership[key].subItems[fKey].subItems.lease_net_revenue_interest =
						prev_own.subItems[fKey].subItems.lease_net_revenue_interest;
				}
			});
			if (
				ownership[key].subItems.net_profit_interest === '' ||
				ownership[key].subItems.net_profit_interest === 0
			) {
				ownership[key].subItems.net_profit_interest = prev_own.subItems.net_profit_interest;
			}
		}
	};

	handleCriteriaSelect = (properties) => {
		const { subKey } = properties;

		if (subKey === 'criteria') {
			this.reversionCriteriaSelect(properties);
		} else {
			this.criteriaSelect(properties);
		}

		this.setOwn();
	};

	renderSheet = (allData, key, add_title) => {
		let data = [];
		const { selected, onSelect } = this.props;

		data = allData[key].slice(1);
		// for reversion tie to field, add empty field when only 1 column in row to make it has 2 cells in the row
		// when length is 2, no reversion is selected, no need check for add empty cell
		if (data.length > 2) {
			data.forEach((r) => {
				if (r.length === 1) {
					r.push({
						readOnly: true,
						value: '',
					});
				}
			});
		}

		if (add_title) {
			// when reversions not pop up, ignore the header row
			const titleData = [
				{
					className: 'read-only full-width-cell',
					colSpan: 2,
					originalValue: add_title,
					readOnly: false,
					value: add_title,
					dataEditor: SheetItemSpoof,
				},
			];
			data.unshift(titleData);
		}

		const selector = `${key}_sheet`;

		return (
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected[selector]}
				onSelect={(sel) => onSelect(selector, sel)}
				className={classNames(selector, 'on-hover-paper-2 data-sheet-paper')}
			/>
		);
	};

	changePopBool = () => {
		this.setState((state) => ({
			popBool: !state.popBool,
		}));
	};

	render() {
		const { fields, ownership, onSelect, selected, setOwnership } = this.props;
		const handlers = {
			subItems: this.handleSubChange,
			criteria: this.handleCriteriaChange,
			'criteria-select': this.handleCriteriaSelect,
		};

		const allData = {};

		fields.segment.menuItems.forEach((item) => {
			const thisOwn = clone(ownership);
			thisOwn.segment = item;

			if (!thisOwn[item.value]) {
				thisOwn[item.value] = getDefaultReversion();
			}

			const oneData = genData({
				fieldsObj: fields,
				state: thisOwn,
				handleChange: this.handleChange,
				handlers,
				addHeader: false,
			});

			addExtraBtn({ data: oneData, ownership: thisOwn, segmentKey: item.value, setOwnership });

			allData[item.value] = oneData;
		});

		const { popBool } = this.state;

		return (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<h2 className='md-text'>Ownership and Reversion</h2>
				<div className='price-data-sheets own_select_sheet phase-cat-selects'>
					<ReactDataSheet
						dataRenderer={dataRenderer}
						valueRenderer={valueRenderer}
						selected={selected.own_select_sheet}
						data={[allData[ownership.segment.value][0]]}
						onSelect={(sel) => onSelect('own_select_sheet', sel)}
						className='on-hover-paper-2 data-sheet-paper var-exp'
					/>
					<IconButton
						color='primary'
						key='expand-reversion'
						onClick={() => {
							this.changePopBool();
						}}
						tooltipTitle='Expand Reversion'
						tooltipPlacement='top'
						css={`
							height: 45px;
						`}
					>
						{faPlus}
					</IconButton>
				</div>
				<div className='price-data-sheets main-expense-options'>
					{!popBool && (
						<div className='ownership-table-container'>
							{this.renderSheet(allData, ownership.segment.value, false)}
						</div>
					)}
					{popBool &&
						Object.entries(resersionKeys).map(([value, label]) => {
							return (
								<div className='ownership-table-container' key={value}>
									{this.renderSheet(allData, value, label)}
								</div>
							);
						})}
				</div>
			</div>
		);
	}
}
