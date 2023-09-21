import { faTrashAlt, faUserCog } from '@fortawesome/pro-regular-svg-icons';

import { SetNameDialog } from '@/components';
import { ButtonItem, Divider, IconButton, MenuButton } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';

import ManageConfigurationsDialog from './ConfigurationDialog';

export const ConfigurationButton = ({
	configurations,
	onSaveConfiguration,
	onApplyConfiguration,
	onDeleteConfiguration,
}) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [manageConfigurationsDialog, promptManageConfigurationsDialog] = useDialog(ManageConfigurationsDialog, {
		configurations,
		onDelete: onDeleteConfiguration,
	});
	const [saveTemplateDialog, promptSaveTemplateDialog] = useDialog(SetNameDialog);

	const handleSaveConfiguration = async () => {
		const name = await promptSaveTemplateDialog({ label: 'Configuration' });

		if (name) {
			confirmationAlert(`Configuration "${name}" successfully saved!`);
			onSaveConfiguration(name);
		}
	};

	return (
		<>
			<MenuButton hideMenuOnClick label={<IconButton size='small'>{faUserCog}</IconButton>}>
				{[
					{
						primaryText: 'Save Current Configuration',
						onClick: handleSaveConfiguration,
					},
					{ primaryText: 'Manage Configurations', onClick: () => promptManageConfigurationsDialog() },
					{ divider: true },
					...(configurations?.length
						? configurations.map((configuration) => ({
								primaryText: configuration.name,
								onClick: () => onApplyConfiguration(configuration),
								children: onDeleteConfiguration && (
									<IconButton
										onClick={(e) => {
											e.stopPropagation();
											onDeleteConfiguration(configuration);
										}}
									>
										{faTrashAlt}
									</IconButton>
								),
						  }))
						: [{ primaryText: 'No Saved Configurations', disabled: true }]),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				].map(({ divider, disabled, children, onClick, primaryText }: any, i) =>
					divider ? (
						<Divider key={i.toString()} />
					) : (
						<ButtonItem
							label={primaryText}
							secondaryAction={children}
							key={primaryText}
							onClick={onClick}
							disabled={disabled}
						/>
					)
				)}
			</MenuButton>
			{manageConfigurationsDialog}
			{saveTemplateDialog}
		</>
	);
};
