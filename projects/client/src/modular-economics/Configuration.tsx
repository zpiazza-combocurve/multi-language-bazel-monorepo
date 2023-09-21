import { useMutation, useQuery } from 'react-query';

import { confirmationAlert } from '@/helpers/alerts';
import { queryClient } from '@/helpers/query-cache';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';

import { ConfigurationButton } from './ConfigurationButton';

export const Configuration = ({ projectId, wellId, scenarioId, configurationToSave, onApplyConfiguration }) => {
	const { data: configurations } = useQuery(['modular-economics', 'configurations', projectId], () =>
		getApi(`/scenarios/modular/configurations/${projectId}`)
	);

	const saveConfigurationMutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ configuration }: any) => {
			return postApi(`/scenarios/modular/configurations/${projectId}`, { configuration });
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['modular-economics']);
			},
		}
	);

	const applyConfigurationMutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ configurationId }: any) => {
			return putApi(`/scenarios/modular/configurations/${scenarioId}/${wellId}/${configurationId}`);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['modular-economics']);
			},
		}
	);

	const deleteConfigurationMutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ configurationId }: any) => {
			return deleteApi(`/scenarios/modular/configurations/${configurationId}`);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['modular-economics']);
			},
		}
	);

	const handleSaveConfiguration = async (configurationName) => {
		await saveConfigurationMutation.mutateAsync({
			configuration: { name: configurationName, configuration: configurationToSave },
		});
	};

	const handleDeleteConfiguration = async (configuration) => {
		await deleteConfigurationMutation.mutateAsync({ configurationId: configuration._id });
	};

	const handleApplyConfiguration = async (configuration) => {
		await applyConfigurationMutation.mutateAsync({ configurationId: configuration._id });
		confirmationAlert(`${configuration.name} applied`);
		onApplyConfiguration(configuration);
	};

	return (
		<ConfigurationButton
			configurations={configurations ?? []}
			onSaveConfiguration={handleSaveConfiguration}
			onDeleteConfiguration={handleDeleteConfiguration}
			onApplyConfiguration={handleApplyConfiguration}
		/>
	);
};
