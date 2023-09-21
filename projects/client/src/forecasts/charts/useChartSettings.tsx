import _ from 'lodash-es';
import { useCallback, useEffect, useRef } from 'react';

import { useMergedState } from '@/components/hooks';

import { DEFAULT_FORECAST_MENU_VALUES } from '../shared';
import { AxisValue } from './components/AxisControlSelection';

export const xAxisTypes = [
	'cumsum_gas',
	'cumsum_oil',
	'cumsum_water',
	'mbt_filtered',
	'mbt',
	'probit_eur',
	'relativeTime',
	'time',
];

export type XAxisType = (typeof xAxisTypes)[number];

export interface ChartSettings {
	cumMax?: AxisValue;
	cumMin?: AxisValue;
	enableDailyOperations?: boolean;
	enableLegend?: boolean;
	enableMonthlyOperations?: boolean;
	enablePll?: boolean;
	fontSizeScale?: number;
	lineScatter?: boolean;
	numOfCharts?: number;
	proximityColorSeries?: boolean;
	showDailyRate?: boolean;
	unitResolution?: string;
	xAxis: XAxisType;
	xGuide?: boolean;
	xLogScale?: boolean;
	yearsBefore?: AxisValue;
	yearsPast?: AxisValue;
	yGuide?: boolean;
	yLogScale?: boolean;
	yMax?: AxisValue;
	yMaxPadding?: number;
	yMin?: AxisValue;
}

const getValidSettings = (chartSettingsDep) => {
	const ret = _.reduce(
		chartSettingsDep,
		(acc, value, key) => {
			if (value === undefined || value === null) {
				return acc;
			}
			acc[key] = value;
			return acc;
		},
		{}
	);
	return ret;
};

const useChartSettings = ({
	chartSettings: chartSettingsDep = { xAxis: 'time' },
	setChartSettings: setChartSettingsDep,
}: {
	chartSettings?: ChartSettings;
	setChartSettings?: (value) => void;
} = {}) => {
	// define chartSettings defaults here
	const [chartSettings, _setChartSettings] = useMergedState<ChartSettings>({
		cumMax: DEFAULT_FORECAST_MENU_VALUES.cumMax,
		cumMin: DEFAULT_FORECAST_MENU_VALUES.cumMin,
		enableDailyOperations: false,
		enableLegend: true,
		enableMonthlyOperations: false,
		enablePll: false,
		fontSizeScale: 1,
		lineScatter: true,
		numOfCharts: 4,
		proximityColorSeries: false,
		unitResolution: 'daily',
		xAxis: 'time',
		xGuide: true,
		xLogScale: false,
		yearsBefore: DEFAULT_FORECAST_MENU_VALUES.yearsBefore,
		yearsPast: DEFAULT_FORECAST_MENU_VALUES.yearsPast,
		yGuide: true,
		yLogScale: true,
		yMax: DEFAULT_FORECAST_MENU_VALUES.yMax,
		yMaxPadding: 10,
		yMin: DEFAULT_FORECAST_MENU_VALUES.yMin,
		...getValidSettings(chartSettingsDep),
	});

	const chartSettingsDepRef = useRef<ChartSettings>({ xAxis: 'time' });

	// set dependency is unlikely to change, consider changing to ref
	const setChartSettings = useCallback(
		(value) => (setChartSettingsDep ?? _setChartSettings)(getValidSettings(value)),
		[_setChartSettings, setChartSettingsDep]
	);

	// TODO: Test performance of this curried function
	const generateSetSetting = useCallback(
		(settingsKey) => (value) => setChartSettings({ [settingsKey]: value }),
		[setChartSettings]
	);

	// refresh on chartSettingsDep change
	useEffect(() => {
		const currentParentSettings = chartSettingsDepRef.current;
		if (currentParentSettings && typeof currentParentSettings === 'object') {
			const newSettings = Object.entries(currentParentSettings).reduce((curObj, [key, value]) => {
				const cur = { ...curObj };

				// check each key individually; only adjust keys that have changed
				if (value !== chartSettingsDep[key]) {
					cur[key] = chartSettingsDep[key];

					// HACK: use this for now to ensure that the value doesn't start at 0; will coordinate with Zing to make 0 work
					if (key === 'cumMin' && chartSettingsDep[key] === 0) {
						cur[key] = 0.1;
					}
				}

				return cur;
			}, {});
			const updateSettings = getValidSettings(newSettings);
			if (Object.keys(updateSettings).length) {
				_setChartSettings(updateSettings);
			}
		}

		chartSettingsDepRef.current = chartSettingsDep;
	}, [chartSettingsDep, _setChartSettings]);

	return {
		chartSettings,
		generateSetSetting,
		setChartSettings,
	};
};

export default useChartSettings;
