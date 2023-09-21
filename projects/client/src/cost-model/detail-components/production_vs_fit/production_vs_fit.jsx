import produce from 'immer';

import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/production_vs_fit.json';

import { clone } from '../../../helpers/utilities';
import EconModel from '../EconModel';
import { createEconFunction } from '../gen-data';
import { ProductionVsFitModel } from './production_vs_fit_model';

const TABLE_KEYS = ['production_vs_fit_sheet'];

export default function ProductionVsFit(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.productionVsFit}
			assumptionName='Actual or Forecast'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='production_vs_fit'
			prepareBody={({ body, fields }) =>
				produce(body, (draft) => {
					const subItems = draft.options.production_vs_fit_model.replace_actual.subItems;
					Object.keys(subItems).forEach((key) => {
						subItems[key].criteriaHeader = true;
					});
					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(fields));
				})
			}
		>
			{({ options: { production_vs_fit_model }, fields, handleOptionChange, selected, onSelect }) => (
				// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
				<>
					{production_vs_fit_model && (
						<ProductionVsFitModel
							onSelect={onSelect}
							selected={selected}
							production_vs_fit_model={production_vs_fit_model}
							fields={fields.production_vs_fit_model}
							setProductionVsFitModel={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
