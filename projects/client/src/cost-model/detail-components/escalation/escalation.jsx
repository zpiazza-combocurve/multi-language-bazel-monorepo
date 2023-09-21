import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/escalation.json';

import EconModel from '../EconModel';
import { EscalationModel } from './escalation_model';

const TABLE_KEYS = ['escalation_sheet'];

export default function Escalation(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.escalation}
			assumptionName='Escalation'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='escalation'
		>
			{({ options: { escalation_model }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{escalation_model && (
						<EscalationModel
							selected={selected}
							onSelect={onSelect}
							escalation_model={escalation_model}
							fields={fields.escalation_model}
							setEscalationModel={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
