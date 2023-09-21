import produce from 'immer';
import _ from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { useCallbackRef } from '@/components/hooks';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { deleteApi, postApi, putApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';

export const CONFIG_QUERY_KEY = 'forecast-configurations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type Configuration = Record<string, any>;

export interface UserConfiguration {
	configurations: Record<string, Configuration>;
	defaultConfiguration: string | null;
}

export function useUserConfigurations() {
	const { configurations: userConfigurations } = useAlfa(['configurations']);
	assert(userConfigurations, 'Expected user configurations to be in context');
	return userConfigurations;
}

export function useConfigurationActions(configTypeKey?: string) {
	const userConfigurations = useUserConfigurations();
	const { set } = useAlfa(['set']);

	const getKey = useCallbackRef((configTypeKeyIn) => {
		const key = configTypeKey ?? configTypeKeyIn;
		assert(key, 'Invalid configuration key');
		return key;
	});

	const setStoreConfiguration = useCallback(
		(configTypeKeyIn: string, newConfigs: UserConfiguration) => {
			const key = getKey(configTypeKeyIn);
			set(
				'configurations',
				produce(userConfigurations, (draft) => {
					draft[key] = newConfigs;
				})
			);
		},
		[getKey, set, userConfigurations]
	);

	const { mutateAsync: createConfiguration, isLoading: creatingConfiguration } = useMutation(
		async ({
			configTypeKeyIn,
			configuration,
			name,
			isAdmin,
		}: {
			configTypeKeyIn?: string;
			configuration: Configuration;
			name: string;
			isAdmin?: boolean;
		}) => {
			try {
				const key = getKey(configTypeKeyIn);
				const body = {
					configBody: configuration,
					configName: name,
					isAdmin,
					defaultConfig: !(
						userConfigurations?.[key]?.configurations &&
						Object.values(userConfigurations[key].configurations).length
					),
				};

				const { configs: newConfigs } = await postApi(`/forecast/create-configuration/${key}`, body);
				confirmationAlert('Configuration Successfully Created');
				setStoreConfiguration(key, newConfigs);
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	);

	const { mutateAsync: updateConfiguration, isLoading: updatingConfiguration } = useMutation(
		async ({
			configTypeKeyIn,
			configuration,
			keyName,
		}: {
			configTypeKeyIn?: string;
			configuration: Configuration;
			keyName: string;
		}) => {
			const key = getKey(configTypeKeyIn);
			const body = {
				configBody: configuration,
			};

			const newConfigs = await putApi(`/forecast/update-configuration/${key}/${keyName}`, body);
			confirmationAlert('Configuration Successfully Updated');
			setStoreConfiguration(key, newConfigs);
		}
	);

	const { mutateAsync: setDefaultConfiguration, isLoading: settingDefaultConfiguration } = useMutation(
		async ({ configTypeKeyIn, keyName }: { configTypeKeyIn?: string; keyName: string }) => {
			const key = getKey(configTypeKeyIn);
			const newConfigs = await putApi(`/forecast/set-default-configuration/${key}/${keyName}`);
			confirmationAlert('Configuration Set As Default');
			setStoreConfiguration(key, newConfigs);
		}
	);

	const { mutateAsync: deleteConfiguration, isLoading: deletingConfiguration } = useMutation(
		async ({ configTypeKeyIn, keyName }: { configTypeKeyIn?: string; keyName: string }) => {
			const key = getKey(configTypeKeyIn);
			const newConfigs = await deleteApi(`/forecast/delete-configuration/${key}/${keyName}`);
			confirmationAlert('Configuration Successfully Deleted');
			setStoreConfiguration(key, newConfigs);
		}
	);

	const isLoading =
		creatingConfiguration || updatingConfiguration || settingDefaultConfiguration || deletingConfiguration;

	return {
		createConfiguration,
		deleteConfiguration,
		isLoading,
		setDefaultConfiguration,
		setStoreConfiguration,
		updateConfiguration,
	};
}

export function useActiveConfiguration(configTypeKey: string) {
	const userConfigurations = useUserConfigurations();

	// @todo: migrate over the db entries with the key
	const typeConfiguration = useMemo(
		() =>
			produce(userConfigurations?.[configTypeKey] ?? {}, (draft) => {
				draft.configurations = _.mapValues(draft.configurations, (config, configKey) => ({
					...config,
					_key: configKey,
				}));
			}),
		[configTypeKey, userConfigurations]
	);

	const {
		configurations,
		defaultConfiguration: defaultConfigKey,
	}: { configurations: Record<string, Configuration>; defaultConfiguration: string | null } = typeConfiguration;

	const [activeConfig, setActiveConfig] = useState(defaultConfigKey ? configurations[defaultConfigKey] : null);

	const {
		createConfiguration,
		deleteConfiguration,
		isLoading,
		setDefaultConfiguration,
		setStoreConfiguration,
		updateConfiguration,
	} = useConfigurationActions(configTypeKey);

	const setDefaultAsActive = useCallbackRef(() => {
		const { defaultConfiguration, configurations: curConfigurations } = typeConfiguration;
		if (defaultConfiguration) {
			const newDefault = curConfigurations?.[defaultConfiguration];
			if (!_.isEqual(activeConfig, newDefault)) {
				setActiveConfig(newDefault);
			}
		}
	});

	useEffect(() => {
		setDefaultAsActive();
	}, [configTypeKey, setDefaultAsActive]);

	return {
		activeConfig,
		createConfiguration,
		deleteConfiguration,
		isLoading,
		setActiveConfig,
		setDefaultConfiguration,
		setStoreConfiguration,
		typeConfiguration,
		updateConfiguration,
	};
}
