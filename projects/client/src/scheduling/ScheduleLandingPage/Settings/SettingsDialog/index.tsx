import { faExclamationTriangle, faStar, faTrashAlt } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useContext, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Placeholder } from '@/components';
import { useHotkey } from '@/components/hooks';
import { Autocomplete, Button, Icon, IconButton, Paper, RHFTextField, Typography } from '@/components/v2';
import { confirmationAlert, genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { getCurrentTheme } from '@/helpers/theme';
import { RunScheduleForm } from '@/inpt-shared/scheduling/shared';
import CacheContext from '@/scheduling/ScheduleCacheContext';

import { GenericDialog } from '../../components/GenericDialog/GenericDialog';
import { VerticalScrollbar } from '../../components/Scrollbar';
import { useScheduleSettings } from '../../hooks/useScheduleSettings';
import { SAVE_CONFIGURATION_SHORTCUT } from '../../shared/hotkeys';
import { prepareValues } from '../shared/helpers';
import { scheduleSaveAsDialog } from './SaveAsDialog';
import { Divider, SettingButton, SettingList, Subtitle } from './styles';

type ScheduleSettingsDialog = {
	visible: boolean;
	onHide: () => void;
	projectId: Inpt.ObjectId;
	scheduleId: Inpt.ObjectId;
	settingId?: Inpt.ObjectId;
	reload: (refetchSetting?: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	methods: UseFormReturn<RunScheduleForm, any>;
	isDraft: boolean;
	disabledMessage?: string;
};

export const SettingsDialog = ({
	visible,
	onHide,
	projectId,
	scheduleId,
	settingId,
	reload,
	methods,
	disabledMessage,
	isDraft,
}: ScheduleSettingsDialog) => {
	const theme = getCurrentTheme();

	const [currentSettingId, setCurrentSettingId] = useState(settingId);

	const {
		settingsByProjectData,
		projectsData,

		loading,

		selectSetting,
		saveSetting,
		createSetting,
		deleteSetting,

		setGetSettingsVariables,
		refetchSettingsByProject,
	} = useScheduleSettings({
		currentSettingId,
		projectId,
		scheduleId,
	});

	const findProject = _.find(projectsData, { _id: projectId });

	const [selectedProject, setSelectedProject] = useState(null);

	const { control, handleSubmit: withFormValues, getValues } = methods;
	const name = getValues('name');

	const { clearCache } = useContext(CacheContext);

	const handleSelect = async (settingIdToSelect, refetchSetting = true) => {
		try {
			await selectSetting(settingIdToSelect);
			confirmationAlert('Setting selected successfully!');
			setCurrentSettingId(settingIdToSelect);
			reload(refetchSetting);
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const handleDelete = async (settingIdToDelete) => {
		try {
			await deleteSetting(settingIdToDelete);
			confirmationAlert('Setting deleted successfully!');
			if (settingIdToDelete === currentSettingId) {
				setCurrentSettingId(undefined);
				reload();
			}
			await refetchSettingsByProject();
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const handleSave = withFormValues(async () => {
		onHide();
		try {
			const formValues = getValues();
			if (currentSettingId) {
				await saveSetting(prepareValues(formValues, projectId));
				confirmationAlert('Setting saved successfully!');
				handleSelect(currentSettingId);
			} else {
				const newSettingId = await createSetting(prepareValues(formValues, projectId));
				setCurrentSettingId(newSettingId);
				confirmationAlert('Setting created successfully!');
				await handleSelect(newSettingId, false);
				clearCache();
			}

			await refetchSettingsByProject();
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	const debouncedSaveConfig = useDebounce(() => {
		if (disabledMessage) {
			warningAlert(disabledMessage);
			return;
		}
		handleSave();
	}, 500);

	useHotkey(SAVE_CONFIGURATION_SHORTCUT, 'all', (e) => {
		e.preventDefault();
		if (e.repeat) return;
		debouncedSaveConfig();
	});

	const handleSaveAs = withFormValues(async (formValues) => {
		onHide();
		try {
			const createValues = await scheduleSaveAsDialog({ values: formValues });
			if (!createValues) {
				return;
			}
			const newSettingId = await createSetting(prepareValues({ ...createValues }, projectId));
			setCurrentSettingId(newSettingId);
			confirmationAlert('Setting created successfully!');
			handleSelect(newSettingId, false);
			await refetchSettingsByProject();
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	return (
		<GenericDialog
			title='Configurations'
			visible={visible}
			onHide={onHide}
			maxWidth='xs'
			actions={
				<>
					<Button
						variant='text'
						color='secondary'
						onClick={onHide}
						css={`
							margin-right: auto;
						`}
					>
						Cancel
					</Button>
					<Button variant='text' color='secondary' onClick={handleSaveAs} disabled={disabledMessage}>
						Save As
					</Button>
					<Button
						variant='contained'
						color='secondary'
						onClick={handleSave}
						disabled={disabledMessage}
						style={{ color: theme.background }}
					>
						Save
					</Button>
				</>
			}
		>
			{isDraft && (
				<Paper
					css={`
						display: flex;
						flex-direction: row;
						justify-content: flex-start;
						align-items: center;
						padding: 12px;

						height: 60px;

						background: ${({ theme }) => theme.palette.background.opaque};
						border-radius: 4px;
						margin-bottom: 24px;
						gap: 8px;
					`}
				>
					<Icon
						fontSize='small'
						css={`
							color: ${({ theme }) => theme.palette.warning.main};
						`}
					>
						{faExclamationTriangle}
					</Icon>
					<Typography variant='body2'>Save the {name} to update the latest changes</Typography>
				</Paper>
			)}

			<RHFTextField
				control={control}
				variant='outlined'
				color='secondary'
				size='small'
				name='name'
				label='Configuration Name'
				placeholder='Name'
				required
				fullWidth
			/>

			<Divider />

			<Subtitle>Schedule Configurations</Subtitle>

			<Autocomplete
				variant='outlined'
				color='secondary'
				disableClearable
				InputProps={{ color: 'secondary' }}
				InputLabelProps={{ color: 'secondary' }}
				label='Search Project'
				options={projectsData ?? []}
				getOptionLabel={({ name }) => name}
				value={selectedProject ? selectedProject : findProject}
				onChange={async (_, project) => {
					setGetSettingsVariables({ projectId: project?._id });
					setSelectedProject(project);
				}}
				blurOnSelect
			/>

			<Divider />

			<div
				css={`
					height: 19rem;
					${VerticalScrollbar}
				`}
			>
				<Placeholder loading={loading}>
					<SettingList>
						{settingsByProjectData
							?.sort((setting) => (setting._id === currentSettingId ? -1 : 1))
							.map(({ _id: settingByProjectId, name }) => (
								<SettingButton
									key={settingByProjectId}
									onClick={() => {
										handleSelect(settingByProjectId, Boolean(currentSettingId));
									}}
									selected={settingByProjectId === currentSettingId}
									isDraft={isDraft}
								>
									<span>{name}</span>
									<div>
										<IconButton
											onClick={(event) => {
												event.stopPropagation();
											}}
											size='small'
											aria-label='Star setting'
											css={`
												display: none;
											`}
										>
											{faStar}
										</IconButton>
										<IconButton
											onClick={(event) => {
												event.stopPropagation();
												handleDelete(settingByProjectId);
											}}
											size='small'
											aria-label='Delete setting'
										>
											{faTrashAlt}
										</IconButton>
									</div>
								</SettingButton>
							))}
					</SettingList>
				</Placeholder>
			</div>
		</GenericDialog>
	);
};
