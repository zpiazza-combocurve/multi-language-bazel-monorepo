import { QueryKey, useMutation, useQuery, useQueryClient } from 'react-query';

import { IdCounter } from '@/helpers/Counter';
import { confirmationAlert } from '@/helpers/alerts';

export const TemporaryConfigSymbol = Symbol('is-temporary-config');

interface Config {
	_id: string;
	[TemporaryConfigSymbol]?: boolean;
}

interface IConfigurationProps<T extends Config> {
	createConfiguration(c: Omit<T, '_id'>): Promise<T>;
	deleteConfiguration(c: T): Promise<unknown>;
	getConfigurations(): Promise<T[]>;
	getCreateAlertMessage?(c: T): string;
	getUpdateAlertMessage?(c: T): string;
	getDeleteAlertMessage?(c: T): string;
	queryKey: QueryKey;
	updateConfiguration(c: T): Promise<unknown>;
	invalidateQueries?(queryKey?: QueryKey): void;
}

const getNameOrNone = (n) => (n ? `: ${n}` : '');
// TODO: improve readability
// returns a function that generates message of the form `Updated Configuration: "Configuration Name"` or `Updated Configuration`
const getDefaultAlertMessageWithOptionalName = (action: string) => (c: { name?: string }) =>
	`${action} Configuration${getNameOrNone(c?.name)}`;
const defaultCreateAlertMessage = getDefaultAlertMessageWithOptionalName('Created');
const defaultUpdateAlertMessage = getDefaultAlertMessageWithOptionalName('Updated');
const defaultDeleteAlertMessage = getDefaultAlertMessageWithOptionalName('Deleted');

const counter = new IdCounter('__temporary-config');

export function useConfigurations<T extends Config>(
	props: IConfigurationProps<T>,
	queryOptions: { enabled?: boolean } = {}
) {
	const queryClient = useQueryClient();

	const {
		createConfiguration,
		deleteConfiguration,
		getConfigurations,
		getCreateAlertMessage = defaultCreateAlertMessage,
		getDeleteAlertMessage = defaultDeleteAlertMessage,
		getUpdateAlertMessage = defaultUpdateAlertMessage,
		queryKey,
		updateConfiguration,
		invalidateQueries = (k = queryKey) => {
			queryClient.invalidateQueries(k);
		},
	} = props;

	const {
		data: configurations,
		isLoading: isLoadingConfigurations,
		isFetching: isFetchingConfigurations,
	} = useQuery<T[]>(queryKey, getConfigurations, queryOptions);

	const { mutate: handleCreateConfiguration } = useMutation(createConfiguration, {
		onMutate: async (newConfiguration: Omit<T, '_id'>) => {
			await queryClient.cancelQueries(queryKey);
			const newConfig: T = {
				...newConfiguration,
				_id: counter.nextId(),
				[TemporaryConfigSymbol]: true,
			} as T;
			queryClient.setQueryData(queryKey, (previous?: T[]) => [...(previous ?? []), newConfig]);
		},
		onSuccess: (_data, configuration) => {
			confirmationAlert(getCreateAlertMessage(configuration as T));
		},
		onSettled: () => {
			invalidateQueries();
		},
	});

	const { mutate: handleUpdateConfiguration } = useMutation(updateConfiguration, {
		onMutate: async (newConfiguration) => {
			await queryClient.cancelQueries(queryKey);
			queryClient.setQueryData(
				queryKey,
				(previous?: T[]) =>
					previous?.map((config) => {
						if (config._id === newConfiguration._id) return newConfiguration;
						return config;
					}) ?? []
			);
		},
		onSuccess: (_data, configuration) => {
			confirmationAlert(getUpdateAlertMessage(configuration));
		},
		onSettled: () => {
			invalidateQueries();
		},
	});

	const { mutate: handleDeleteConfiguration } = useMutation(deleteConfiguration, {
		onMutate: async (configuration) => {
			await queryClient.cancelQueries(queryKey);
			queryClient.setQueryData(
				queryKey,
				(previous?: T[]) => previous?.filter((config) => config._id !== configuration._id) ?? []
			);
		},
		onSuccess: (_data, configuration) => {
			confirmationAlert(getDeleteAlertMessage(configuration));
		},
		onSettled: () => {
			invalidateQueries();
		},
	});

	const isCreatingConfiguration = (config: T) => config?.[TemporaryConfigSymbol];

	return {
		configurations,
		handleCreateConfiguration,
		handleDeleteConfiguration,
		handleUpdateConfiguration,
		isCreatingConfiguration,
		isFetchingConfigurations,
		isLoadingConfigurations,
	};
}

interface IDefaultConfigurationProps<T extends Config> {
	getDefaultConfiguration(): Promise<T>;
	queryKey: QueryKey;
	updateDefaultConfiguration(c: T | null): Promise<T | null>;
}

export function useDefaultConfiguration<T extends Config>(
	props: IDefaultConfigurationProps<T>,
	queryOptions: { enabled?: boolean } = {}
) {
	const { getDefaultConfiguration, queryKey, updateDefaultConfiguration } = props;
	const {
		data: defaultConfiguration,
		isLoading: isLoadingDefaultConfiguration,
		isFetching: isFetchingDefaultConfiguration,
		...rest
	} = useQuery<T>(queryKey, getDefaultConfiguration, queryOptions);

	const queryClient = useQueryClient();
	const { mutate: setDefaultConfiguration } = useMutation(updateDefaultConfiguration, {
		onMutate: async (newConfiguration: T | null) => {
			await queryClient.cancelQueries(queryKey);
			queryClient.setQueryData(queryKey, newConfiguration);
		},
		onSettled: () => {
			queryClient.invalidateQueries(queryKey);
		},
	});

	return {
		...rest,
		defaultConfiguration,
		isLoadingDefaultConfiguration,
		isFetchingDefaultConfiguration,
		setDefaultConfiguration,
	};
}
