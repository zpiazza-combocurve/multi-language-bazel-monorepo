import produce from 'immer';

import { clone } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/dates.json';

import EconModel from '../EconModel';
import { createEconFunction } from '../gen-data';
import { CutOff } from './cut_off';
import { DatesSetting } from './dates_setting';

const TABLE_KEYS = ['dates_setting_sheet', 'cut_off_sheet'];

export default function Dates(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.dates}
			assumptionName='Dates'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='general-options'
			prepareBody={({ body, fields }) =>
				produce(body, (draft) => {
					draft.options.dates_setting.as_of_date.criteriaHeader = true;
					draft.options.dates_setting.discount_date.criteriaHeader = true;
					if (draft.options.cut_off.min_cut_off) {
						draft.options.cut_off.min_cut_off.criteriaHeader = true;
					}
					if (draft.options.dates_setting.fpd_source_hierarchy) {
						const fpd_source_hierarchy = draft.options.dates_setting.fpd_source_hierarchy.subItems;

						// save criteria select as nested structure under the field key
						fpd_source_hierarchy.first_fpd_source.criteriaHeader = true;
						fpd_source_hierarchy.second_fpd_source.criteriaHeader = true;
						fpd_source_hierarchy.third_fpd_source.criteriaHeader = true;
						fpd_source_hierarchy.fourth_fpd_source.criteriaHeader = true;
					}
					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(fields));
				})
			}
		>
			{({ options: { dates_setting, cut_off }, fields, handleOptionChange, selected, onSelect }) => (
				<>
					{dates_setting && (
						<DatesSetting
							onSelect={onSelect}
							selected={selected}
							dates_setting={dates_setting}
							fields={fields.dates_setting}
							setDatesSetting={handleOptionChange}
						/>
					)}
					{cut_off && (
						<CutOff
							onSelect={onSelect}
							selected={selected}
							cut_off={cut_off}
							fields={fields.cut_off}
							setCutOff={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
