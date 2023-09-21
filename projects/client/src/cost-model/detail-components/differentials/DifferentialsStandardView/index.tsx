import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import EconModel from '@/cost-model/detail-components/EconModel';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';

import { DifferentialModel } from './DifferentialsModel';

const TABLE_KEYS = [
	'differentials_phase_sheet',
	'differentials_oil_sheet',
	'differentials_gas_sheet',
	'differentials_ngl_sheet',
	'differentials_drip_condensate_sheet',
];

export default function Differentials(props) {
	const { project } = useAlfa();
	const dtQuery = useQuery(['differentials-display-template'], () =>
		getApi(`/cost-model/getExtendedTemplate/${project?._id}/differentials`)
	);

	if (dtQuery.isLoading) {
		return <Placeholder loading text='Preparing differentials module' />;
	}

	const {
		template: { fields: templateFields },
	} = dtQuery.data;

	return (
		<EconModel
			{...props}
			header='Differentials'
			assumptionKey={AssumptionKey.differentials}
			assumptionName='Differentials'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='differentials'
			tablesContainerClassName='flowing'
		>
			{({ options: { differentials }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{differentials && (
						<DifferentialModel
							onSelect={onSelect}
							selected={selected}
							differentials={differentials}
							fields={fields.differentials}
							setDifferentials={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
