import _ from 'lodash';

import { forecastSeries } from '@/helpers/zing';

const pSeries = forecastSeries.map(({ value }) => value);

const isValidPDict = (pDict) => {
	const pKeys = Object.keys(pDict);
	return _.every(pSeries, (key) => pKeys.includes(key));
};

const isValidConfig = (config) => {
	const requiredKeys = ['align', 'normalize', 'resolution'];
	const configKeys = _.keys(config);
	return _.every(
		requiredKeys,
		(key) => configKeys.includes(key) && !_.isUndefined(config[key]) && !_.isNull(config[key])
	);
};

const DEFAULT_TOGGLE_STATES = {
	align: 'align',
	normalize: false,
	resolution: 'monthly',
};

const getInitToggleState = ({
	activeConfig,
	curValue,
	defaultConfig,
	key,
	savedFit,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfig?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	curValue?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	defaultConfig?: any;
	key: 'align' | 'normalize' | 'resolution';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	savedFit?: any;
}) => {
	if (_.keys(activeConfig)?.length) {
		return isValidConfig(activeConfig) ? activeConfig[key] : curValue;
	}

	const savedFitValue = savedFit?.oil?.[key] ?? savedFit?.gas?.[key] ?? savedFit?.water?.[key];
	return savedFitValue ?? (isValidConfig(defaultConfig) ? defaultConfig[key] : DEFAULT_TOGGLE_STATES[key]);
};

export { getInitToggleState, isValidPDict };
