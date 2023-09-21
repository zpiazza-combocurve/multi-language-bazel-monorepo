import { useAnalytics } from './useAnalytics';

export const EVENTS: Record<string, Record<string, string>> = {
	scenario: {
		run: 'Run Scenario',
		importEmissions: 'Scenario Import Emissions',
	},
	forecast: {
		form: 'Forecast Form',
		diagnostic: 'Forecast Diagnostic Settings Form',
		run: 'Forecast Run Form',
		importForecast: 'Import Forecast Parameters',
	},
	dataImport: {
		form: 'Data Import Form',
		startAriesImport: 'Start ARIES Import',
	},
	csvExport: {
		form: 'CSV Export Dialog',
		tour: 'Custom CSV Editor Tour',
	},
	typeCurve: {
		fitRun: 'Type Curve Fit Run',
		saveFit: 'Type Curve Fit Save',
	},
};

type EVENT = keyof typeof EVENTS;

export const useTrackAnalytics = <T extends EVENT>() => {
	const analytics = useAnalytics();

	const track = (eventName: keyof (typeof EVENTS)[T], properties, options?, callback?) => {
		analytics.track(eventName, properties, options, callback);
	};

	return track;
};
