import { moduleUrls } from '@/routes/generate-routes';

type AssumptionType =
	| 'reserves_category'
	| 'general_options'
	| 'dates'
	| 'ownership_reversion'
	| 'capex'
	| 'pricing'
	| 'differentials'
	| 'stream_properties'
	| 'expenses'
	| 'production_taxes'
	| 'production_vs_fit'
	| 'risking'
	| 'depreciation'
	| 'escalation'
	| 'emission';

export const assumptionRoutes = {
	assumptions: 'econ-models',
	assumption: moduleUrls('econ-models', (assumptionKey: AssumptionType) => ({
		model: (modelId, options = {}) =>
			`?a=${assumptionKey}&m=${modelId}${Object.keys(options)
				.filter((currentOption) => options[currentOption])
				.reduce((acum, opt) => acum + `&${opt}=${options[opt]}`, '')}`,
	})),
} as const;
