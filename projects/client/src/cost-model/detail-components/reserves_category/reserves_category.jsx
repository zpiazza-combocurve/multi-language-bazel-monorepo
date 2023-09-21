/* eslint-disable no-param-reassign */
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/reserves_category.json';

import EconModel from '../EconModel';
import { ReservesCategoryModel } from './reserves_category_model';

const TABLE_KEYS = ['reserves_category_sheet'];

export default function ReservesCategory(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.reservesCategory}
			assumptionName='Reserves Category'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='reserves_category'
		>
			{({ options: { reserves_category }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{reserves_category && (
						<ReservesCategoryModel
							selected={selected}
							onSelect={onSelect}
							reserves_category={reserves_category}
							fields={fields.reserves_category}
							setReservesCategoryModel={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
