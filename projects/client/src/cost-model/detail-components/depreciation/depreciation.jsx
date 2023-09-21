import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/depreciation.json';

import EconModel from '../EconModel';
import { DepreciationModel } from './depreciation_model';

const TABLE_KEYS = ['depreciation_sheet'];

export default function Depreciation(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.depreciation}
			assumptionName='Depreciation'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='depreciation'
		>
			{({ options: { depreciation_model }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{depreciation_model && (
						<DepreciationModel
							selected={selected}
							onSelect={onSelect}
							fields={fields.depreciation_model}
							depreciation_model={depreciation_model}
							setDepreciationModel={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
