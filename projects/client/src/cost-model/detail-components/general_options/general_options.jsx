import produce from 'immer';

import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/general_options.json';

import { clone } from '../../../helpers/utilities';
import EconModel from '../EconModel';
import { createEconFunction } from '../gen-data';
import { BoeConversion } from './boe_conversion';
import { DiscountTable } from './discount_table';
import { IncomeTax } from './income_tax';
import { MainOptions } from './main_options';
import { ReportingUnits } from './reporting_units';

const TABLE_KEYS = [
	'main_options_sheet',
	'discount_table_sheet',
	'income_tax_sheet',
	'reporting_units_sheet',
	'boe_conversion_sheet',
];

export default function GeneralOptions(props) {
	return (
		<EconModel
			{...props}
			assumptionKey={AssumptionKey.generalOptions}
			assumptionName='General Options'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='general-options'
			tablesContainerClassName='flowing'
			prepareBody={({ body, fields }) =>
				produce(body, (draft) => {
					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(fields));

					if (draft.options.main_options.reporting_period.value === 'calendar') {
						draft.options.main_options.fiscal = { label: '', value: '' };
						draft.econ_function.main_options.fiscal = '';
					}
				})
			}
		>
			{({
				options: { main_options, discount_table, reporting_units, boe_conversion, income_tax },
				fields,
				handleOptionChange,
				selected,
				onSelect,
				toggleSection,
			}) => (
				<>
					{main_options && (
						<MainOptions
							onSelect={onSelect}
							selected={selected}
							main_options={main_options}
							fields={fields.main_options}
							setMainOptions={handleOptionChange}
							setOmitSection={toggleSection}
						/>
					)}
					{main_options && main_options.income_tax.value === 'yes' && income_tax && (
						<IncomeTax
							onSelect={onSelect}
							selected={selected}
							income_tax={income_tax}
							fields={fields.income_tax}
							setIncomeTax={handleOptionChange}
							omitSection={toggleSection}
						/>
					)}
					{discount_table && (
						<DiscountTable
							onSelect={onSelect}
							selected={selected}
							discount_table={discount_table}
							fields={fields.discount_table}
							setDiscountTable={handleOptionChange}
						/>
					)}
					{reporting_units && (
						<ReportingUnits
							onSelect={onSelect}
							selected={selected}
							reporting_units={reporting_units}
							fields={fields.reporting_units}
							setReportingUnits={handleOptionChange}
						/>
					)}
					{boe_conversion && (
						<BoeConversion
							onSelect={onSelect}
							selected={selected}
							boe_conversion={boe_conversion}
							fields={fields.boe_conversion}
							setBoeConversion={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
