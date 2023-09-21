import produce from 'immer';
import { clone, omit } from 'lodash-es';
import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import { getApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/production_taxes.json';
import { useCurrentProject } from '@/projects/api';

import EconModel from '../EconModel';
import { createEconFunction } from '../gen-data';
import { AdValoremTax } from './ad_valorem_tax';
import { SeveranceTax } from './severance_tax';

const TABLE_KEYS = ['state_sheet', 'severance_tax_sheet', 'ad_valorem_tax_sheet'];

export default function ProductionTaxes(props) {
	const { project } = useCurrentProject();

	// the query used below only for get the list of escalation models, get from price model is HACK but works
	// this is going to change in double reversion production taxes. For now, it works
	const dtQuery = useQuery(['prod-tax-display-template'], () =>
		getApi(`/cost-model/getExtendedTemplate/${project?._id}/pricing`)
	);

	if (dtQuery.isLoading) {
		return <Placeholder loading text='Preparing production tax module' />;
	}

	if (dtQuery.status === 'success' && !dtQuery.isLoading && dtQuery.data.template.fields.price_model != null) {
		let esc_model_items = dtQuery.data.template.fields.price_model.oil.subItems.escalation_model.menuItems;
		for (let escalation_key of ['escalation_model_1', 'escalation_model_2']) {
			templateFields.ad_valorem_tax.escalation_model.subItems.row_view.columns[escalation_key].menuItems =
				esc_model_items;
		}

		for (let escalation_key of ['escalation_model_1', 'escalation_model_2']) {
			for (let phase of ['oil', 'gas', 'ngl', 'drip_condensate']) {
				let esc_model_items =
					dtQuery.data.template.fields.price_model[phase].subItems.escalation_model.menuItems;
				templateFields.severance_tax[phase].subItems.escalation_model.subItems.row_view.columns[
					escalation_key
				].menuItems = esc_model_items;
			}
		}
	}

	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.productionTaxes}
			assumptionName='Production Taxes'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			header='Production Taxes'
			className='production_taxes'
			prepareBody={({ body }) =>
				produce(body, (draft) => {
					draft.options = omit(draft.options, ['state_models']);
					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(draft.options));

					// special handle for escalation econ function
					if (draft.options.ad_valorem_tax.escalation_model?.subItems?.row_view.headers) {
						const adTaxEscHeaders = draft.options.ad_valorem_tax.escalation_model.subItems.row_view.headers;
						draft.econ_function.ad_valorem_tax.escalation_model = {
							escalation_model_1: adTaxEscHeaders.escalation_model_1.value,
							escalation_model_2: adTaxEscHeaders.escalation_model_2.value,
						};
					}

					['oil', 'gas', 'ngl', 'drip_condensate'].forEach((key) => {
						const phaseSevTaxEscHeaders =
							draft.options.severance_tax[key].subItems.escalation_model?.subItems?.row_view.headers;
						if (phaseSevTaxEscHeaders) {
							draft.econ_function.severance_tax[key].escalation_model = {
								escalation_model_1: phaseSevTaxEscHeaders.escalation_model_1.value,
								escalation_model_2: phaseSevTaxEscHeaders.escalation_model_2.value,
							};
						}
					});
				})
			}
		>
			{({ options: { ad_valorem_tax, severance_tax }, fields, handleOptionChange, selected, onSelect }) => (
				<>
					{severance_tax && (
						<SeveranceTax
							onSelect={onSelect}
							selected={selected}
							severance_tax={severance_tax}
							state_models={fields.state_models}
							fields={fields.severance_tax}
							setSeveranceTax={handleOptionChange}
						/>
					)}
					{ad_valorem_tax && (
						<AdValoremTax
							onSelect={onSelect}
							selected={selected}
							severance_tax={severance_tax}
							ad_valorem_tax={ad_valorem_tax}
							fields={fields.ad_valorem_tax}
							setAdValoremTax={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
