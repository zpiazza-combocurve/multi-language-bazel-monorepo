import { subject } from '@casl/ability';
import { noop } from 'lodash';
import { useEffect, useState } from 'react';

import { useAbilityRules } from '@/access-policies/AbilityProvider';
import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { Box, Divider, SwitchField, alerts } from '@/components/v2';
import CreateWellsDialog from '@/create-wells/CreateWellsDialog';
import {
	confirmationAlert,
	createConfirmAddWells,
	createConfirmRemoveWells,
	customErrorAlert,
	genericErrorAlert,
	withDoggo,
	withLoadingBar,
} from '@/helpers/alerts';
import { DialogHandler, VisibleDialogHandler, useDialog } from '@/helpers/dialog';
import { Hook } from '@/helpers/hooks';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import {
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace, pluralize } from '@/helpers/text';
import { PROJECT_WELLS_LIMIT } from '@/inpt-shared/project/shared';
import { useCollisionReportNotificationCallback } from '@/manage-wells/WellsPage/well-identifiers/ChangeIdentifiersMenu';
import { validateScopeToProject } from '@/manage-wells/WellsPage/well-identifiers/editWellIdentifierApi';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import { Notification, NotificationType, TaskStatus } from '@/notifications/notification';
import { UserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useProject } from '@/projects/api';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';
import { URLS } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

import CopyDialog from '../../module-list/ModuleList/components/CopyDialog';
import DeleteModelsDialog from './DeleteModelsDialog';

// TODO don't use alfa for the project, check with @davidpa9708
type ProjectSettingsProps = { setProjAlfa: (project) => void; project: Inpt.Project };

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, setProjAlfa }) => {
	const { wells } = project;

	const [name, setName] = useState(project.name);
	const [enforceCompanySettings, setEnforceCompanySettings] = useState(false);
	const [companyConfiguration, setCompanyConfiguration] = useState<{ _id?: string }>();
	const [copyProjectNotificationCallback, setCopyProjectNotificationCallback] = useState<
		(notification: Notification) => void
	>(() => noop);

	/** Fetches company configuration settings and see if project is enforcing them */
	const initialize = async () => {
		const [config, companyConfiguration] = await Promise.all([
			getApi(`/company-forecast-settings/enforce/${project._id}`),
			getApi('/company-forecast-settings'),
		]);
		setEnforceCompanySettings(!!config?.companyForecastSetting);
		setCompanyConfiguration(companyConfiguration);
	};

	useEffect(() => {
		initialize();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const addWells = async (wells) => {
		const totalWells = new Set([...project.wells, ...wells]).size;
		if (totalWells > PROJECT_WELLS_LIMIT) {
			const diff = PROJECT_WELLS_LIMIT - project.wells.length;
			const additionalWells = diff < 0 ? 0 : diff;
			customErrorAlert(`Can only add up to ${additionalWells} additional wells`, 'Try again with fewer wells');
			return;
		}

		const resp = await withDoggo(putApi(`/projects/${project._id}/addWells`, { ids: wells }), 'Adding Wells...');
		const diff = resp.project.wells.length - project.wells.length;

		setProjAlfa({ ...project, wells: resp.project.wells });
		const pluralWells = pluralize(diff, 'New Well', 'New Wells');
		confirmationAlert(`${pluralWells} Added`);
	};

	const removeWells = async (wells) => {
		const removalItems = [
			{
				value: 'wells',
				label: 'Project Wells',
				desc: 'DELETES any project specific well. Imported, copied and created wells',
			},
			{ value: 'scenario', label: 'Scenario', desc: 'removes wells from all Scenarios in this project' },
			{ value: 'type-curve', label: 'Type Curve', desc: 'removes wells from all Type Curves in this project' },
			{
				value: 'forecast',
				label: 'Forecast',
				desc: 'removes wells from all Forecasts in this project, along with its forecast data',
			},
			{
				value: 'scheduling',
				label: 'Scheduling',
				desc: 'removes wells from all Schedules in this project, along with its schedule data',
			},
			{
				value: 'assumptions',
				label: 'Econ Models',
				desc: 'removes all unique Econ Models made for these wells in this project',
			},
		];

		const confirm = await alerts.confirm({
			title: 'Remove Wells',
			confirmText: 'Remove',
			confirmColor: 'error',
			helperText: `Are you sure you want to remove ${wells.length} wells from this project?`,
			children: removalItems.map((item) => (
				<div key={item.value}>
					<h5>{item.label}</h5>
					<ul>
						<li>{item.desc}</li>
					</ul>
				</div>
			)),
		});

		if (!confirm) {
			return false;
		}

		const resp = await withDoggo(
			putApi(`/projects/${project._id}/removeWells`, { ids: wells }),
			'Removing Wells...'
		);
		const { forecastsRunning, error, msg, project: proj } = resp;

		if (forecastsRunning) {
			return customErrorAlert(error.split('.')[0], error.split('.')[1]);
		}

		setProjAlfa({ ...project, wells: proj.wells });
		confirmationAlert(msg);
	};

	const showFilter = async (type: 'add' | 'remove') => {
		let wellsToFilter;
		let existingWellsForFilter;
		let filterConfirm;

		if (type === 'remove') {
			wellsToFilter = wells;
			existingWellsForFilter = undefined;
			filterConfirm = createConfirmRemoveWells('project');
		}
		if (type === 'add') {
			wellsToFilter = 'ALL_WELLS';
			existingWellsForFilter = wells;
			filterConfirm = createConfirmAddWells('project');
		}

		const filt = await showWellFilter({
			totalWellsText: 'Total Wells',
			wells: wellsToFilter,
			existingWells: existingWellsForFilter,
			type,
			confirm: filterConfirm,
			limit: type === 'add' ? PROJECT_WELLS_LIMIT : undefined,
		});

		if (!filt) return;

		if (type === 'add') {
			addWells(filt);
		}
		if (type === 'remove') {
			removeWells(filt);
		}
	};

	const handleSaveName = async () => {
		await withLoadingBar(postApi(`/projects/${project._id}/changeName`, { name }));
		setProjAlfa({ ...project, name });
		confirmationAlert('Project Name Saved');
	};

	const copyProject = async (invalidateRules, copyOptions: { scopeCompanyWellsToProject?: boolean } = {}) => {
		if (copyOptions.scopeCompanyWellsToProject) {
			validateScopeToProject({
				operationType: 'scopeToProject',
				projectId: project._id,
				project: project?._id,
				path: URLS.project(project._id).settings,
			});
		} else {
			try {
				await postApi(`/projects/${project._id}/copy`, copyOptions);

				setCopyProjectNotificationCallback((notification) => {
					if (notification.status === TaskStatus.COMPLETED) {
						invalidateRules();
					}
				});
			} catch (err) {
				genericErrorAlert(err, 'Error occurred during copy');
			}
		}
	};

	const handleChangeEnforce = (ev) => {
		setEnforceCompanySettings(ev.target.checked);
		withLoadingBar(
			putApi(`/company-forecast-settings/enforce/${project._id}`, {
				companyForecastSetting: ev.target.checked ? companyConfiguration?._id : null,
			})
		);
	};

	return (
		<>
			<CollisionReportNotificationCallback />
			<SettingsContainer>
				<UserNotificationCallback
					type={NotificationType.COPY_PROJECT}
					callback={copyProjectNotificationCallback}
				/>

				<SettingsInfoContainer>
					<SettingsTextField
						id='project-name'
						label='Project Name'
						onChange={(e) => setName(e)}
						value={name}
					/>
					<SettingsTextField id='project-wells' disabled value={wells.length} label='Wells In Project' />
					<SettingsTagsList feat='project' featId={project._id} />
				</SettingsInfoContainer>

				<Can do={ACTIONS.Update} on={subject(SUBJECTS.Projects, { _id: project._id })} passThrough>
					{(canUpdateProject) => (
						<>
							{project.name !== name && (
								<>
									<SettingsButton
										label='Save Name'
										disabled={name === '' || !hasNonWhitespace(name) || !canUpdateProject}
										tooltipLabel={!canUpdateProject ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
										primary
										onClick={handleSaveName}
										info={[`From - ${project.name}`, `To - ${name}`]}
									/>
									<Divider className='divider' />
								</>
							)}
							<SettingsButton
								label='Add Wells'
								disabled={!canUpdateProject}
								tooltipLabel={!canUpdateProject ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
								primary
								onClick={() => showFilter('add')}
								info={[
									'Add available wells to this project',
									'Added wells will be available to all invited users in this project ',
								]}
							/>
							<DialogHandler dialog={CreateWellsDialog}>
								{(openCreateWellsDialog) => (
									<SettingsButton
										label='Create Wells'
										disabled={!canUpdateProject}
										tooltipLabel={!canUpdateProject ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
										secondary
										onClick={() => openCreateWellsDialog({ projectId: project?._id })}
										info={[
											'Create Generic Wells',
											'Wells created will only be available to this project',
											'Created wells will be available to all invited users in this project',
										]}
									/>
								)}
							</DialogHandler>
							<SettingsButton
								warning
								label='Remove Wells'
								disabled={!canUpdateProject}
								tooltipLabel={!canUpdateProject ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
								onClick={() => showFilter('remove')}
								info={[
									'Remove wells from this project',
									'Removed wells will be removed from all project modules, scenarios, forecasts, type curves etc.',
									'Wells that are visible only to this project will be deleted upon removal',
								]}
							/>
						</>
					)}
				</Can>

				<Divider className='divider' />

				<Can do={ACTIONS.Create} on={subject(SUBJECTS.Projects, { _id: null })} passThrough>
					{(allowed) => (
						<Hook hook={useAbilityRules}>
							{({ invalidateRules }) => (
								// TODO: Fix types
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
								<VisibleDialogHandler dialog={CopyDialog as any}>
									{(openCopyDialog) => (
										<SettingsButton
											primary
											disabled={!allowed}
											tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
											onClick={() =>
												openCopyDialog({
													feat: 'Project',
													name: project.name,
													additionalParagraphs: [
														'Files related to economics will not be copied.',
													],
													onCopy: async (options) => copyProject(invalidateRules, options),
												})
											}
											label='Copy Project'
											info={[
												'Copies project and all of its contents',
												'Project specific wells and its production data, if any, will also be copied',
												'Economic files will not be copied',
											]}
											{...getTaggingProp('project', 'copy')}
										/>
									)}
								</VisibleDialogHandler>
							)}
						</Hook>
					)}
				</Can>

				<Divider className='divider' />

				<Can do={ACTIONS.Delete} on={subject(SUBJECTS.Assumptions, { project: project._id })} passThrough>
					{(allowed) => (
						<Hook hook={useDialog} props={[DeleteDialog]}>
							{(confirmDeleteDialogProps) => {
								const [confirmDeleteModelsDialog, promptConfirmDeleteModelsDialog] =
									// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
									confirmDeleteDialogProps as any;

								return (
									<>
										{confirmDeleteModelsDialog}
										{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
										<DialogHandler dialog={DeleteModelsDialog as any}>
											{(openDeleteModelsDialog) => (
												<SettingsButton
													label='Delete Models'
													disabled={!allowed}
													tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
													warning
													onClick={async () => {
														const options = await openDeleteModelsDialog({
															projectId: project._id,
														});

														if (options) {
															promptConfirmDeleteModelsDialog({
																onDelete: async () => {
																	try {
																		await postApi(
																			`/projects/${project._id}/delete-models`,
																			options
																		);
																	} catch (err) {
																		genericErrorAlert(err);
																	}
																},
																awaitAction: false,
																feat: `Models`,
																title: 'Delete Selected Project Models?',
																requireName: true,
															});
														}
													}}
													info={[
														'Mass Delete Models',
														'Mass Delete Unassigned Models',
														'Mass Delete Unique Models',
														'Mass Delete Unique Unassigned Models',
													]}
												/>
											)}
										</DialogHandler>
									</>
								);
							}}
						</Hook>
					)}
				</Can>

				<Can do={ACTIONS.Delete} on={subject(SUBJECTS.Projects, { _id: project._id })} passThrough>
					{(allowed) => (
						<Hook hook={useProject} props={[project._id]}>
							{({ reload }) => (
								<SettingsDeleteButton
									feat='Project'
									redirectTo='/projects'
									tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
									disabled={!allowed}
									onDelete={async () => {
										await deleteApi(`/projects/${project._id}`);
										reload();
										setProjAlfa(null);
									}}
									name={project.name}
									info={['Deletes project and all of its contents']}
									requireName
								/>
							)}
						</Hook>
					)}
				</Can>
				<Can do={ACTIONS.Update} on={subject(SUBJECTS.Projects, { _id: project._id })} passThrough>
					{(allowed) => (
						<AssignTagsSettingsButton
							tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							disabled={!allowed}
							feat='project'
							featId={project._id}
						/>
					)}
				</Can>
				<Can
					do={ACTIONS.Enforce}
					on={subject(SUBJECTS.CompanyForecastSettings, { project: project._id })}
					passThrough
				>
					{(allowed) => (
						<>
							<Divider className='divider' />
							<Box mt={1} ml='5rem'>
								<SwitchField
									label='Enforce Company Level Settings'
									checked={enforceCompanySettings}
									onChange={handleChangeEnforce}
									disabled={!companyConfiguration || !allowed}
								/>
							</Box>
						</>
					)}
				</Can>
			</SettingsContainer>
		</>
	);
};

function CollisionReportNotificationCallback() {
	useCollisionReportNotificationCallback();
	return null;
}

export default ProjectSettings;
