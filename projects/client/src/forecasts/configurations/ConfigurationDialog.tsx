import { faCopy, faPencil, faStar, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { faStar as faStarFilled } from '@fortawesome/pro-solid-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { noop } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { useMergedState } from '@/components/hooks';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	TextField,
	Typography,
} from '@/components/v2';
import MultiSelectField from '@/components/v2/misc/MultiSelectField';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import {
	Configuration,
	useActiveConfiguration,
	useConfigurationActions,
} from '@/forecasts/configurations/configurations';
import { genericErrorAlert } from '@/helpers/alerts';
import { hasNonWhitespace } from '@/helpers/text';
import { filterSearch } from '@/helpers/utilities';

const ListItemActions = styled.section`
	column-gap: 0.5rem;
	display: flex;
`;

const MULTI_SELECT_CONFIGURATION_OPTIONS = [
	{ value: 'other_users', label: 'Other Users' },
	{ value: 'current_user', label: 'Current User' },
	{ value: 'admin_endorsed', label: 'Admin Endorsed' },
];

type ConfigurationManagementDialogProps = {
	activeConfig?: Configuration | null;
	activeConfigKey?: string;
	close: () => void;
	configKey?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	configs?: any;
	isValidConfig?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	newConfig?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	selectConfig: (config: any) => void;
	visible?: boolean;
	title?: string;
	enableSharedConfigs?: boolean;
};

const ConfigurationDialog = ({
	activeConfig = undefined,
	activeConfigKey: activeConfigKey_ = undefined,
	close,
	configKey = 'deterministicGridChart',
	configs,
	isValidConfig = true,
	newConfig,
	selectConfig,
	title,
	enableSharedConfigs,
	visible = false,
}: ConfigurationManagementDialogProps) => {
	const { isSharedUserConfigurationsEnabled } = useLDFeatureFlags();
	const [nameInput, setNameInput] = useState('');
	const [search, setSearch] = useState('');
	const [multiSelectValue, setMultiSelectValue] = useState(['current_user']);
	const activeConfigKey = activeConfigKey_ ?? activeConfig?._key;

	const [endorse, setEndorse] = useState(false);

	const { createConfiguration, deleteConfiguration, isLoading, setDefaultConfiguration, updateConfiguration } =
		useConfigurationActions(configKey);

	const onClose = () => {
		setNameInput('');
		close();
	};

	let createConfigTooltip = '';
	if (!isValidConfig) {
		createConfigTooltip = 'Configuration invalid, cannot save';
	} else if (!nameInput?.length) {
		createConfigTooltip = 'Name required';
	}

	const configurations = useMemo(
		() =>
			filterSearch(
				configs.configurations,
				search,
				(config) => `${config.name} ${config.userName}` // Match both name and user
			),
		[search, configs]
	);

	return (
		<Dialog fullWidth maxWidth='sm' open={visible}>
			<DialogTitle>{title}</DialogTitle>

			<DialogContent
				css={`
					height: 50vh;
					width: 100%;
					display: flex;
					flex-direction: column;
				`}
			>
				<TextField
					fullWidth
					label='New Configuration Name'
					onChange={(ev) => setNameInput(ev.target.value)}
					placeholder='Type In New Configuration Name'
					type='text'
					variant='outlined'
					value={nameInput}
				/>

				{enableSharedConfigs && isSharedUserConfigurationsEnabled && (
					<>
						<div
							css={`
								display: flex;
								align-items: center;
								justify-content: space-between;
								margin: 10px 0;
							`}
						>
							<Typography>Configurations</Typography>
							<MultiSelectField
								value={multiSelectValue}
								menuItems={MULTI_SELECT_CONFIGURATION_OPTIONS}
								variant='outlined'
								label='Created By'
								css={`
									margin-left: 100px;
								`}
								onChange={(v) => {
									setMultiSelectValue(v);
								}}
								fullWidth
							/>
						</div>
						<Divider />
						<TextField
							fullWidth
							label='Search Configuration Name or User'
							onChange={(ev) => setSearch(ev.target.value)}
							placeholder='Search Configuration Name or User'
							type='text'
							variant='outlined'
							value={search}
						/>
						<Divider />
					</>
				)}

				{configurations && (
					<List
						css={`
							overflow-y: auto;
						`}
					>
						{_.map(configurations, (configValue, keyName) => (
							<ListItem
								key={keyName}
								button
								css='padding: 1rem 0.5rem;'
								onClick={() => selectConfig(configValue)}
								selected={activeConfigKey === keyName}
							>
								{isSharedUserConfigurationsEnabled ? (
									<ListItemText
										primary={_.truncate(configValue.name, { length: 33 })}
										secondary={`${configValue.userName} ${configValue.isAdmin ? ' | Admin' : ''}`}
									/>
								) : (
									<ListItemText primary={_.truncate(configValue.name, { length: 33 })} />
								)}

								<ListItemSecondaryAction>
									<ListItemActions>
										<Divider css='width: 2px;' flexItem orientation='vertical' />
										{isSharedUserConfigurationsEnabled && (
											<IconButton disabled={isLoading} tooltipTitle='Copy'>
												{faCopy}
											</IconButton>
										)}
										{((isSharedUserConfigurationsEnabled && configValue?.own) ||
											!isSharedUserConfigurationsEnabled) && (
											<>
												<IconButton
													color='primary'
													disabled={!isValidConfig || isLoading}
													onClick={() =>
														updateConfiguration({ configuration: newConfig, keyName })
													}
													tooltipTitle={
														isValidConfig
															? 'Update'
															: 'Invalid configuration, cannot update'
													}
												>
													{faPencil}
												</IconButton>

												<IconButton
													color='secondary'
													disabled={isLoading}
													onClick={() => setDefaultConfiguration({ keyName })}
													tooltipTitle='Set Default'
												>
													{keyName === configs.defaultConfiguration ? faStarFilled : faStar}
												</IconButton>

												<IconButton
													color='warning'
													disabled={isLoading}
													onClick={() => deleteConfiguration({ keyName })}
													tooltipTitle='Remove'
												>
													{faTimes}
												</IconButton>
											</>
										)}
									</ListItemActions>
								</ListItemSecondaryAction>
							</ListItem>
						))}
					</List>
				)}
			</DialogContent>

			<DialogActions>
				{enableSharedConfigs && isSharedUserConfigurationsEnabled && (
					<CheckboxField
						label='Endorse as Admin with Administrator Permissions'
						onChange={(ev) => setEndorse(ev.target.checked)}
					/>
				)}
				<Button onClick={onClose}>Close</Button>

				<Button
					color='secondary'
					disabled={!nameInput?.length || !isValidConfig || !hasNonWhitespace(nameInput) || isLoading}
					onClick={() => createConfiguration({ configuration: newConfig, name: nameInput, isAdmin: endorse })}
					tooltipTitle={createConfigTooltip}
					variant='contained'
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

type ActiveConfigState = {
	activeConfigKey?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfig?: Record<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfigValues?: Record<string, any> | Array<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	defaultConfigValues?: Record<string, any>;
};

/**
 * @example
 * 	const { activeConfig, showConfigDialog, dialog, loading } = useConfigurationDialog('deterministic-forecast');
 *
 * 	useEffect(() => {
 * 		if (loading) {
 * 			return;
 * 		}
 * 		setCurrentConfigValue(activeConfig); // can do mappping here
 * 	}, [activeConfig, loading]);
 *
 * 	return (
 * 		<>
 * 			<Button icon={faUser} onClick={() => showConfigDialog(currentConfigValue)} />
 * 			{dialog}
 * 		</>
 * 	);
 */
export function useConfigurationDialog({
	key,
	applyDefaultAsActive = true,
	title = '',
	handleOpen = noop,
	handleClose = noop,
	enableSharedConfigs = false,
}: {
	key: string;
	applyDefaultAsActive?: boolean;
	title?: string;
	handleOpen?: () => void;
	handleClose?: () => void;
	enableSharedConfigs?: boolean;
}) {
	const { typeConfiguration: configs, activeConfig: defaultActiveConfig } = useActiveConfiguration(key);
	const [{ activeConfigKey, activeConfig, activeConfigValues, defaultConfigValues }, setActive] =
		useState<ActiveConfigState>({
			activeConfigKey: '',
			activeConfig: {},
			activeConfigValues: {},
			defaultConfigValues: defaultActiveConfig?.configuration ?? {},
		});

	const hasInitRef = useRef(false);
	const keyRef = useRef<string | null>(null);

	useEffect(() => {
		const init = async () => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const curConfig = configs?.configurations?.[configs.defaultConfiguration!] ?? {};
			const isArray = Array.isArray(curConfig?.configuration);
			const toSet: ActiveConfigState = {
				defaultConfigValues: isArray
					? [...(curConfig?.configuration ?? [])]
					: {
							...curConfig?.configuration,
							name: curConfig?.name,
					  },
			};

			if (applyDefaultAsActive && configs?.defaultConfiguration) {
				toSet.activeConfigKey = configs.defaultConfiguration;
				toSet.activeConfig = curConfig ?? (isArray ? [] : {});
				toSet.activeConfigValues = isArray
					? [...(curConfig?.configuration ?? [])]
					: {
							...curConfig?.configuration,
							name: curConfig?.name,
					  };
			}
			setActive(toSet);
			hasInitRef.current = true;
			keyRef.current = key;
		};

		// only re-run effect if key has changed after initing
		if (!hasInitRef.current || key !== keyRef.current) {
			init().catch(genericErrorAlert);
		}
	}, [applyDefaultAsActive, configs, key]);

	const [dialogProps, setDialogProps] = useMergedState({});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const showConfigDialog = (newConfig: Record<string, any> | Array<any>, isValidConfig = true) => {
		handleOpen?.();
		setDialogProps({ newConfig, isValidConfig, visible: true });
	};

	const setActiveConfigKey = useCallback(
		(inputKey: string) =>
			setActive(
				produce((draft) => {
					draft.activeConfigKey = inputKey;
				})
			),
		[]
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const selectConfig = (config: Record<string, any>) => {
		const newConfig = configs?.configurations?.[config._key];
		const isArray = Array.isArray(newConfig?.configuration);
		const newConfigValues = isArray
			? [...(newConfig?.configuration ?? [])]
			: { ..._.cloneDeep(newConfig?.configuration), name: newConfig?.name };
		setActive({
			activeConfigKey: config._key,
			activeConfig: newConfig,
			activeConfigValues: newConfigValues,
		});
		// Assume that any already saved configuration is valid.
		setDialogProps({ generateConfigBody: () => newConfigValues, isValidConfig: true });
	};

	const dialog = (
		<ConfigurationDialog
			activeConfig={activeConfig}
			activeConfigKey={activeConfigKey}
			close={() => {
				handleClose?.();
				setDialogProps({ visible: false });
			}}
			configKey={key}
			configs={configs}
			selectConfig={selectConfig}
			title={title}
			enableSharedConfigs={enableSharedConfigs}
			{...dialogProps}
		/>
	);

	return {
		activeConfig: activeConfigValues,
		activeConfigKey,
		configs,
		defaultConfig: defaultConfigValues,
		dialog,
		selectConfig,
		setActiveConfigKey,
		showConfigDialog,
	};
}

export default ConfigurationDialog;
