import _ from 'lodash';
import { useCallback } from 'react';

import { ConfigurationDialog } from '@/components/v2/misc';
import { useDialog } from '@/helpers/dialog';

import { useDefaultGroupConfiguration, useGroupConfigurations } from './group-configurations/api';
import { GroupConfiguration } from './group-configurations/types';

/**
 * @example
 * 	import { useGroupConfigurationDialog } from './useGroupConfigurationDialog';
 *
 * 	const [groupConfigurationDialog, showGroupConfigurationDialog] = useGroupConfigurationDialog();
 *
 * 	return (
 * 		<>
 * 			{groupConfigurationDialog}
 * 			<Button
 * 				onClick={() => {
 * 					const newConfiguration = await showGroupConfigurationDialog({
 * 						groupConfiguration: currentConfiguration,
 * 					});
 * 				}}
 * 			>
 * 				Show Dialog
 * 			</Button>
 * 		</>
 * 	);
 */

export function useGroupConfigurationDialog() {
	const {
		configurations,
		handleCreateConfiguration,
		handleDeleteConfiguration,
		handleUpdateConfiguration,
		isLoadingConfigurations,
	} = useGroupConfigurations();

	const { defaultConfiguration, isLoadingDefaultConfiguration, setDefaultConfiguration } =
		useDefaultGroupConfiguration();

	const isDefaultConfiguration = useCallback(
		(configuration: GroupConfiguration) => defaultConfiguration?._id === configuration._id,
		[defaultConfiguration]
	);

	const [dialog, showConfigurationDialog] = useDialog(ConfigurationDialog, {
		setDefaultConfiguration,
		configurations,
		deleteConfiguration: handleDeleteConfiguration,
		isDefaultConfiguration,
	});

	// showConfigurationDialog wrapper, will use group configuration methods
	const showDialog = (props: { groupConfiguration: GroupConfiguration }) => {
		const groupConfiguration = _.omit(props.groupConfiguration, '_id');

		return showConfigurationDialog({
			defaultName: groupConfiguration?.name,
			createConfiguration: (name) => {
				handleCreateConfiguration({ ...groupConfiguration, name });
			},
			updateConfiguration: (selectedConfiguration: GroupConfiguration) => {
				handleUpdateConfiguration({
					...groupConfiguration,
					_id: selectedConfiguration._id,
				});
			},
		});
	};

	// do not show until loaded configs and defaults
	const groupDialog = isLoadingConfigurations || isLoadingDefaultConfiguration ? null : dialog;

	return [groupDialog, showDialog] as const;
}
