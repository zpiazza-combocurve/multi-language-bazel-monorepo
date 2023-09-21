import produce from 'immer';
import { clone } from 'lodash-es';

import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/ownership_reversion.json';

import EconModel from '../EconModel';
import { GenerateHeaderState, createEconFunction } from '../gen-data';
import { Ownership, getDefaultReversion } from './ownership';

const TABLE_KEYS = [
	'own_select_sheet',
	'initial_ownership_sheet',
	'first_reversion_sheet',
	'second_reversion_sheet',
	'third_reversion_sheet',
	'fourth_reversion_sheet',
	'fifth_reversion_sheet',
	'sixth_reversion_sheet',
	'seventh_reversion_sheet',
	'eighth_reversion_sheet',
	'ninth_reversion_sheet',
	'tenth_reversion_sheet',
];

export default function OwnershipRevision(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.ownershipReversion}
			assumptionName='Ownership and Reversion'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			initialOmitSection={{ income_tax: true }}
			className='ownership_reversion'
			tablesContainerClassName='flowing'
			prepareBody={({ body, fields: fieldsObj }) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce(body, (draft: any) => {
					draft.options.ownership.segment = { label: 'Initial', value: 'initial_ownership' };

					const reversionKeyList = [
						'first_reversion',
						'second_reversion',
						'third_reversion',
						'fourth_reversion',
						'fifth_reversion',
						'sixth_reversion',
						'seventh_reversion',
						'eighth_reversion',
						'ninth_reversion',
						'tenth_reversion',
					];

					const balanceRelianceList = fieldsObj.ownership.first_reversion.subItems.balance.reliance.criteria;
					const npiRelianceList =
						fieldsObj.ownership.first_reversion.subItems.include_net_profit_interest.reliance.criteria;

					const balanceDefault = fieldsObj.ownership.first_reversion.subItems.balance.Default;
					const deductNpiDefault =
						fieldsObj.ownership.first_reversion.subItems.include_net_profit_interest.Default;

					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					const prev_rows_criteria = [] as any[];

					for (let i = 0; i < reversionKeyList.length; i++) {
						const revKey = reversionKeyList[i];
						if (!draft.options.ownership[revKey]) {
							draft.options.ownership[revKey] = getDefaultReversion();
						}

						if (
							!balanceRelianceList.includes(
								draft.options.ownership[revKey].subItems.criteria.criteria.value
							)
						) {
							draft.options.ownership[revKey].subItems.balance = balanceDefault;
						}
						if (
							!npiRelianceList.includes(draft.options.ownership[revKey].subItems.criteria.criteria.value)
						) {
							draft.options.ownership[revKey].subItems.include_net_profit_interest = deductNpiDefault;
						}
						if (draft.options.ownership[revKey].subItems.criteria.criteria.value === 'no_reversion') {
							draft.options.ownership[revKey] = {
								// eslint-disable-next-line new-cap -- TODO eslint fix later
								...GenerateHeaderState(fieldsObj, 'ownership')[revKey],
							};
						} else if (prev_rows_criteria.includes('no_reversion')) {
							throw new Error(
								'Check Rversion! A reversion can be used only when all previous reversions have been used.'
							);
						}
						prev_rows_criteria.push(draft.options.ownership[revKey].subItems.criteria.criteria.value);

						if (draft.options.ownership[revKey].subItems.reversion_tied_to) {
							// save criteria-select as nested structure under the field key
							draft.options.ownership[revKey].subItems.reversion_tied_to.criteriaHeader = true;
						}
					}

					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(fieldsObj));
				})
			}
		>
			{({ options: { ownership }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{ownership && (
						<Ownership
							selected={selected}
							onSelect={onSelect}
							ownership={ownership}
							fields={fields.ownership}
							setOwnership={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
