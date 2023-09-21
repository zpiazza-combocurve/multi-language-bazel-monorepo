import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/risking.json';

import EconModel from '../EconModel';
import { RiskingModel } from './risking_model';
import { ShutInModel } from './shut-in';

const TABLE_KEYS = [
	'risking_risk_prod_sheet',
	'risking_oil_sheet',
	'risking_gas_sheet',
	'risking_ngl_sheet',
	'risking_drip_condensate_sheet',
	'risking_water_sheet',
	'shutInSheet',
];

export default function Risking(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.risking}
			assumptionName='Risking'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='risking'
			tablesContainerClassName='flowing'
		>
			{({ options: { risking_model, shutIn }, fields, handleOptionChange, selected, onSelect }) => (
				<>
					{risking_model && (
						<RiskingModel
							onSelect={onSelect}
							selected={selected}
							risking_model={risking_model}
							fields={fields.risking_model}
							setRiskingModel={handleOptionChange}
						/>
					)}
					{shutIn && (
						<ShutInModel
							onSelect={onSelect}
							selected={selected}
							shutIn={shutIn}
							fields={fields.shutIn}
							setShutIn={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
