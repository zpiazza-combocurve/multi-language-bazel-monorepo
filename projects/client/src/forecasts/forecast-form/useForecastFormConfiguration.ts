import { useConfigurationDialog } from '../configurations/ConfigurationDialog';
import { Configuration } from '../configurations/configurations';
import { ForecastFormType, ForecastScopeObj } from './ForecastFormV2';
import { ForecastFormResolution } from './automatic-form/types';

type ForecastConfiguration = Configuration & {
	forecastScope?: ForecastScopeObj;
	forecastFormType?: ForecastFormType;
	name?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	proximitySettings?: Record<string, any>;
	resolution?: ForecastFormResolution;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	settings?: Record<string, any>;
};

const useForecastFormConfiguration = ({ forecastType = 'probabilistic' }) => {
	const isProbabilistic = forecastType === 'probabilistic';

	const configurationProps = useConfigurationDialog({
		key: isProbabilistic ? 'probabilisticForecastSettings' : 'deterministicForecastSettings',
		title: `${isProbabilistic ? 'Probabilistic' : 'Deterministic'} Forecast Configurations`,
		enableSharedConfigs: true,
	});

	const {
		activeConfig,
		activeConfigKey,
		configs,
		dialog: configDialog,
		selectConfig,
		showConfigDialog,
	}: Pick<
		ReturnType<typeof useConfigurationDialog>,
		'activeConfigKey' | 'configs' | 'dialog' | 'selectConfig' | 'showConfigDialog'
	> & {
		activeConfig?: ForecastConfiguration;
	} = configurationProps;

	return {
		activeConfigKey,
		activeConfigName: activeConfig?.name,
		activeForecastFormType: activeConfig?.forecastFormType,
		activeForecastScope: activeConfig?.forecastScope,
		activeResolution: activeConfig?.resolution ?? activeConfig?.settings?.shared?.resolution,
		automaticConfig: activeConfig?.settings,
		configDialog,
		configs,
		proximityConfig: activeConfig?.proximitySettings,
		selectConfig,
		showConfigDialog,
	};
};

type UseForecastFormConfigurationReturn = ReturnType<typeof useForecastFormConfiguration>;

export default useForecastFormConfiguration;
export { UseForecastFormConfigurationReturn };
