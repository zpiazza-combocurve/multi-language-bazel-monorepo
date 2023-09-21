import { DeepPartial } from '@/networks/carbon/types';

import { CSVExportTemplateBase, SuggestedTemplates } from './types';

function getSuggestedTemplates({
	oneLiner = [],
	'cashflow-csv': byWell = [],
	'cashflow-agg-csv': agg = [],
}: DeepPartial<{
	oneLiner: CSVExportTemplateBase[];
	'cashflow-csv': CSVExportTemplateBase[];
	'cashflow-agg-csv': CSVExportTemplateBase[];
}> = {}): SuggestedTemplates {
	return {
		oneLiner: oneLiner.map((t) => ({
			columns: [],
			cashflowOptions: null,
			...t,
			type: 'oneLiner',
		})),
		'cashflow-csv': byWell.map((t) => ({
			columns: [],
			cashflowOptions: {},
			...t,
			type: 'cashflow-csv',
		})),
		'cashflow-agg-csv': agg.map((t) => ({
			columns: [],
			cashflowOptions: {},
			...t,
			type: 'cashflow-agg-csv',
		})),
	} as unknown as SuggestedTemplates;
}

export const SUGGESTED_TEMPLATES: SuggestedTemplates = getSuggestedTemplates({
	oneLiner: [{ name: 'Core Headers' }, { name: 'All Headers' }, { name: 'Scenario Table Headers' }],
	'cashflow-csv': [
		{
			name: 'By Well',
			cashflowOptions: {
				hybridOptions: {
					months: null,
					yearType: null as unknown as 'fiscal',
				},
				timePeriods: null,
				type: 'monthly',
			},
		},
		{ name: 'Scenario Table Headers' },
	],

	'cashflow-agg-csv': [
		{
			name: 'Aggregate Monthly',
			cashflowOptions: {
				hybridOptions: {
					months: null,
					yearType: null as unknown as 'fiscal',
				},
				timePeriods: null,
				type: 'monthly',
			},
		},
		{
			name: 'Aggregate Yearly',
			cashflowOptions: {
				hybridOptions: {
					months: null,
					yearType: null as unknown as 'fiscal',
				},
				timePeriods: null,
				type: 'yearly',
			},
		},
	],
});
