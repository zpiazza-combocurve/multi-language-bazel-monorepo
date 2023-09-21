import React, { createContext, useCallback, useMemo } from 'react';

import { useMergedState } from '@/components/hooks';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';

import { Configuration } from './configurations';

type ConfigurationContextType = {
	activeConfig?: Configuration;
	configurationDialog: JSX.Element;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setToSaveConfiguration: (config: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	showConfigDialog: (newConfig: any, isValidConfig?: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	currentConfigState: Record<string, any>;
};

type ConfigurationProviderProps = {
	configurationKey: string;
	configurationTitle?: string;
	children: React.ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
const ConfigurationContext = createContext<ConfigurationContextType>(undefined!);

// this is to help multiple pieces of a module adjust the same configuration
const ConfigurationProvider = (props: ConfigurationProviderProps) => {
	const { configurationKey, configurationTitle = '', children } = props;

	const [toSaveConfiguration, _setToSaveConfiguration] = useMergedState({});

	const {
		activeConfig,
		showConfigDialog: _showConfigDialog,
		dialog,
	} = useConfigurationDialog({
		key: configurationKey,
		title: configurationTitle,
	});

	const setToSaveConfiguration = useCallback((config) => _setToSaveConfiguration(config), [_setToSaveConfiguration]);

	const showConfigDialog = useCallback(
		(config) => _showConfigDialog(config ?? toSaveConfiguration),
		[_showConfigDialog, toSaveConfiguration]
	);

	const contextObj = useMemo(
		() => ({
			activeConfig,
			configurationDialog: dialog,
			setToSaveConfiguration,
			showConfigDialog,
			currentConfigState: toSaveConfiguration, // Sometimes we need to see what's in the config without updating.
		}),
		[activeConfig, dialog, setToSaveConfiguration, showConfigDialog, toSaveConfiguration]
	);

	return <ConfigurationContext.Provider value={contextObj}>{children}</ConfigurationContext.Provider>;
};

export default ConfigurationProvider;
export { ConfigurationContext };
