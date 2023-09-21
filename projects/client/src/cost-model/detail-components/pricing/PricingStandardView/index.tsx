import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import EconModel from '@/cost-model/detail-components/EconModel';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';

import { Breakeven } from './Breakeven';
import { PriceModel } from './PriceModel';

const TABLE_KEYS = [
	'price_phase_sheet',
	'price_oil_sheet',
	'price_gas_sheet',
	'price_ngl_sheet',
	'price_drip_condensate_sheet',
	'breakeven_sheet',
];

export default function Pricing(props) {
	const { project } = useAlfa();
	const dtQuery = useQuery(['pricing-display-template'], () =>
		getApi(`/cost-model/getExtendedTemplate/${project?._id}/pricing`)
	);

	if (dtQuery.isLoading) {
		return <Placeholder loading text='Preparing pricing module' />;
	}

	const {
		template: { fields: templateFields },
	} = dtQuery.data;

	return (
		<EconModel
			{...props}
			header='Pricing'
			assumptionKey={AssumptionKey.pricing}
			assumptionName='Pricing'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='pricing'
			tablesContainerClassName='flowing'
		>
			{({ options: { price_model, breakeven }, fields, handleOptionChange, selected, onSelect }) => (
				<>
					{price_model && (
						<PriceModel
							onSelect={onSelect}
							selected={selected}
							price_model={price_model}
							fields={fields.price_model}
							setPriceModel={handleOptionChange}
						/>
					)}
					{breakeven && (
						<Breakeven
							onSelect={onSelect}
							selected={selected}
							breakeven={breakeven}
							fields={fields.breakeven}
							setBreakevent={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
