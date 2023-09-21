import _ from 'lodash';
import * as yup from 'yup';

export const INPUT_CONTAINS_ERRORS_MESSAGE = 'Input contains errors.';

export const textFieldCSS = `
.MuiOutlinedInput-input {
	padding: 10.5px 14px;
}
.MuiInputLabel-outlined {
	transform: translate(14px, 12px) scale(1);

	&.MuiInputLabel-shrink {
		transform: translate(14px, -6px) scale(0.75);
	}
}
`;

export const multiSelectCSS = `
width: 395px;
.MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"] .MuiAutocomplete-input {
    padding: 1.5px 5px;
}
.MuiInputLabel-outlined {
	transform: translate(14px, 12px) scale(1);

	&.MuiInputLabel-shrink {
		transform: translate(14px, -6px) scale(0.75);
	}
}
`;

export const EXCLUDE_HEADERS = [
	'well_name',
	'inptID',
	'dataPool',
	'dataSource',
	'api14',
	'generic',
	'copied',
	'chosenID',
	'chosenKeyID',
	// Calculated headers that should not be input by user
	'first_proppant_per_fluid',
	'refrac_prop_weight', // input for import but calculated for manual create
	'refrac_fluid_volume', // input for import but calculated for manual create
	'refrac_proppant_per_fluid',
	'total_additive_volume',
	'total_cluster_count',
	'total_fluid_volume',
	'total_prop_weight',
	'total_proppant_per_fluid',

	'first_prop_weight',
	'first_fluid_volume',

	'total_fluid_per_perforated_interval',
	'total_proppant_per_perforated_interval',
	'total_stage_count',
	'has_daily',
	'has_monthly',
	'first_prod_date_daily_calc',
	'first_prod_date_monthly_calc',
	'importType',
	'importDate',
	'mostRecentImportDesc',
	'cum_boe',
	'cum_oil',
	'cum_gas',
	'cum_gor',
	'cum_water',
	'cum_mmcfge',
	'cum_boe_per_perforated_interval',
	'cum_gas_per_perforated_interval',
	'cum_oil_per_perforated_interval',
	'cum_water_per_perforated_interval',
	'cum_mmcfge_per_perforated_interval',
	'first_12_boe',
	'first_12_boe_per_perforated_interval',
	'first_12_gas',
	'first_12_gas_per_perforated_interval',
	'first_12_gor',
	'first_12_oil',
	'first_12_oil_per_perforated_interval',
	'first_12_water',
	'first_12_water_per_perforated_interval',
	'first_12_mmcfge',
	'first_12_mmcfge_per_perforated_interval',
	'first_6_boe',
	'first_6_boe_per_perforated_interval',
	'first_6_gas',
	'first_6_gas_per_perforated_interval',
	'first_6_gor',
	'first_6_mmcfge',
	'first_6_mmcfge_per_perforated_interval',
	'first_6_oil',
	'first_6_oil_per_perforated_interval',
	'first_6_water',
	'first_6_water_per_perforated_interval',
	'last_12_boe',
	'last_12_boe_per_perforated_interval',
	'last_12_gas',
	'last_12_gas_per_perforated_interval',
	'last_12_gor',
	'last_12_mmcfge',
	'last_12_mmcfge_per_perforated_interval',
	'last_12_oil',
	'last_12_oil_per_perforated_interval',
	'last_12_water',
	'last_12_water_per_perforated_interval',
	'last_month_boe',
	'last_month_boe_per_perforated_interval',
	'last_month_gas',
	'last_month_gas_per_perforated_interval',
	'last_month_gor',
	'last_month_mmcfge',
	'last_month_mmcfge_per_perforated_interval',
	'last_month_oil',
	'last_month_oil_per_perforated_interval',
	'last_month_water',
	'last_month_water_per_perforated_interval',
	'month_produced',
	'combo_name',
	'econ_run_date',
	'wi_oil',
	'nri_oil',
	'before_income_tax_cash_flow',
	'first_discount_cash_flow',
	'econ_first_production_date',
	'undiscounted_roi',
	'irr',
	'payout_duration',
	'oil_breakeven',
	'gas_breakeven',
	'oil_shrunk_eur',
	'gas_shrunk_eur',
	'ngl_shrunk_eur',
	'oil_shrunk_eur_over_pll',
	'gas_shrunk_eur_over_pll',
	'ngl_shrunk_eur_over_pll',
	'prms_reserves_category',
	'prms_reserves_sub_category',
];

function getNumberSchema({
	min,
	max,
	required,
	label,
}: {
	min?: number;
	max?: number;
	required?: boolean;
	label: string;
}) {
	let numberSchema = yup.number();

	if (required) {
		numberSchema = numberSchema.required();
	}

	if (!_.isNil(min)) {
		numberSchema = numberSchema.min(min);
	}

	if (!_.isNil(max)) {
		numberSchema = numberSchema.max(max);
	}

	numberSchema = numberSchema.label(label);
	return numberSchema;
}

function getStringSchema({ required, label }: { required?: boolean; label: string }) {
	const schema = yup.string().label(label);
	if (required) {
		return schema.required();
	}
	return schema;
}

export function getHeaderYupSchema(
	headersDict: Record<string, { type: string; label: string; min?: number; max?: number }>,
	header: string,
	required: boolean
) {
	const headerInfo = headersDict[header];

	switch (headerInfo.type) {
		case 'number':
			return getNumberSchema({
				min: headerInfo.min,
				max: headerInfo.max,
				required,
				label: headersDict[header].label,
			});
		default:
			return getStringSchema({ label: headersDict[header].label, required });
	}
}
