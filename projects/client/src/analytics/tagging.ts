// https://help.fullstory.com/hc/en-us/articles/360052608053-Using-Element-Attributes-in-Search-Page-Analytics#h_01EM24SH8DS8D061075B9GXQAE
// https://support.gainsight.com/PX/Instrument_Your_Product/Advanced_Instrumentation#Use_Custom_Events_For_Instrumentation

import { AssumptionKey } from '@/inpt-shared/constants';

const TAGGING_ATTRIBUTE = 'data-tid';

const GENERIC_ASSUMPTION_TAGGING_KEYS = Object.values(AssumptionKey).reduce((acc, assumptionKey) => {
	acc[`use-${assumptionKey}-model`] = `scenario-use-${assumptionKey}-model`;
	acc[`add-${assumptionKey}-lookupRow`] = `${assumptionKey}-add-lookup-row`;
	acc[`saveStandard-${assumptionKey}-model`] = `${assumptionKey}-save-model-standard`;
	acc[`saveAsStandard-${assumptionKey}-model`] = `${assumptionKey}-save-as-model-standard`;
	acc[`saveAdvanced-${assumptionKey}-model`] = `${assumptionKey}-save-model-advanced`;
	acc[`saveAsAdvanced-${assumptionKey}-model`] = `${assumptionKey}-save-as-model-advanced`;
	acc[`deleteAdvanced-${assumptionKey}-model-rows`] = `${assumptionKey}-delete-advanced-rows`;
	return acc;
}, {} as Record<string, string>);

const DATA_IDS = {
	project: {
		create: 'create-project',
		restoreProject: 'restore-project',
		import: 'import-sc-project',
		copy: 'copy-project',
		archive: 'archive-project',
	},
	shareableCode: {
		create: 'create-sharecode',
	},
	wellSpacing: {
		run: 'well-spacing-calc',
	},
	general: {
		help: 'help-button',
		knowledgeBase: 'knowledge-base',
		dark: 'dark-theme',
		light: 'light-theme',
	},
	scenarioLookupTable: {
		create: 'create-scenario-lookup-table',
	},
	typeCurveLookupTable: {
		create: 'create-typecurve-lookup-table',
	},
	embeddedLookupTable: {
		create: 'create-embedded-lookup-table',
	},
	forecast: {
		create: 'create-forecast',
		run: 'run-forecast',
		diagnostic: 'run-diagnostic',
		proximity: 'run-proximity',
		exportAries: 'forecast-export-aries',
		exportPHDWin: 'forecast-export-phdwin',
		exportParameters: 'forecast-export-parameters',
		editingAutoForecast: 'editing-auto-forecast',
		editingSavingAutoForecast: 'editing-save-auto-forecast',
		editingRemove: 'editing-remove',
		editingFetchProximity: 'editing-fetch-proximity',
		editingNormalizeProximity: 'editing-normalize-proximity',
		editingProximityRunFit: 'editing-proximity-run-fit',
		editingProximityApplyFit: 'editing-proximity-apply-fit',
		editingProximityApplySaveFit: 'editing-proximity-apply-save-fit',
		exportMosaic: 'forecast-export-mosaic',
		importToProject: 'import-forecast-to-project',
		downloadDiagnostics: 'download-diagnostics',
		editingSaveManual: 'editing-save-manual-forecast',
		editingSaveTypeCurve: 'editing-save-type-curve-forecast',
	},
	dataImport: {
		standard: 'import-standard-create',
		aries: 'import-aries',
		phdwin: 'import-phdwin',
		ariesDataUpload: 'upload-aries',
		ariesApplyScenario: 'apply-scenario-aries-import',
		ariesApplySetup: 'apply-setup-aries-import',
		phdwinDataUpload: 'phdwin-upload',
		phdwinStartImport: 'phdwin-start-import',
		resetMapping: 'reset-mappings',
		mapSuggested: 'map-suggested',
		saveMappings: 'save-mappings',
		loadMappings: 'load-mappings',
		exportMappings: 'export-mappings',
		completeMappings: 'complete-mapping',
		downloadTemplateWellHeader: 'dl-template-wellheader',
		downloadTemplateMonthly: 'dl-template-monthly-proddata',
		downloadTemplateDaily: 'dl-template-daily-proddata',
		downloadTemplateDirectional: 'dl-template-directionalsurvey',
	},
	scenario: {
		create: 'create-scenario',
		run: 'run-scenario',
		advancedViewExpenses: 'advanced-view-expenses',
		advancedViewCapex: 'advanced-view-capex',
		oneLine: 'generate-one-line-summary',
		resCat: 'generate-res-cat-summary',
		carbon: 'generate-carbon-summary',
		applyCarbon: 'choose-carbon-network-apply',
		exportScenarioAries: 'export-scenario-aries',
		exportAssumptionsPhdwin: 'export-assumptions-phdwin',
		createIncrementals: 'create-incrementals',
		massImportAssumptions: 'mass-import-assumptions',
		massExportAssumptions: 'mass-export-assumptions',
		applyForecast: 'scenario-apply-forecast',
		applySchedule: 'scenario-apply-schedule',
		applyTCLookupTable: 'scenario-apply-tc-lookup-table',
		exportWellYearlyCashflow: 'scenario-export-well-yearly-cashflow',
		exportAggYearlyCashflow: 'scenario-export-agg-yearly-cashflow',
		exportWellCarbonReport: 'scenario-export-well-carbon',
	},
	econModel: {
		...GENERIC_ASSUMPTION_TAGGING_KEYS,
	},
	carbonNetwork: {
		module: 'modulelistpage-carbon-network',
		createNetwork: 'carbon-create-network',
		useFluidModel: 'carbon-use-fluid-model',
		applyWellNode: 'carbon-apply-well-node',
		saveNetwork: 'carbon-save-network',
		saveAsNetwork: 'carbon-saveas-network',
		createFacility: 'carbon-create-facility',
		saveAsFacility: 'carbon-saveas-facility',
		// NodeModel
		createNodeModel: 'carbon-create-node-model',
	},
	schedule: {
		create: 'create-schedule',
		runSchedule: 'run-schedule',
		addStep: 'scheduling-add-step',
		addResource: 'scheduling-add-resource',
		importPrioritization: 'scheduling-import-prioritization',
		exportGantt: 'scheduling-export-gantt-pdf',
		downloadOutput: 'scheduling-download-output',
	},
	typeCurve: {
		runFit: 'run-typecurve-fit',
		create: 'create-typecurve',
		normalize: 'normalize-typecurve',
		downloadTCWorkflow: 'typecurve-download-tc-workflow',
		saveNormalization: 'save-tc-normalization',
		exportTimeseries: 'tc-export-timeseries',
		saveFit: 'tc-save-fit',
		manualSave: 'tc-manual-save',
	},
	map: {
		addLayerUpload: 'add-map-layer-upload',
	},
};

type MODULES = keyof typeof DATA_IDS;

export const getTaggingValue = <T extends MODULES>(module: T, action: keyof (typeof DATA_IDS)[T]): string => {
	if (!DATA_IDS?.[module]?.[action]) {
		// eslint-disable-next-line no-console
		console.error(new Error(`Invalid ${module}-${action as string}`));

		return '';
	}

	return DATA_IDS[module][action as string];
};

export const getTaggingProp = <T extends MODULES>(
	module: T,
	action: keyof (typeof DATA_IDS)[T]
): Record<string, string> => {
	const value = getTaggingValue(module, action);

	return { [TAGGING_ATTRIBUTE]: value };
};
