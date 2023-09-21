import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useContext } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { css } from 'styled-components';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { ButtonItem, MenuButton, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import {
	confirmationAlert,
	createConfirmAddWells,
	customErrorAlert,
	genericErrorAlert,
	useDoggo,
} from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi, postApi, putApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { WELL_COPY_LIMIT } from '@/inpt-shared/constants';
import { PROJECT_WELLS_LIMIT } from '@/inpt-shared/project/shared';
import ChangeIdentifiersMenu, {
	useChangeIdentifiersMenuCallbacks,
} from '@/manage-wells/WellsPage/well-identifiers/ChangeIdentifiersMenu';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { showWellFilter } from '@/well-filter/well-filter';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';

import { NO_COMBO_KEY, SelectEconRunDialog } from './ManageWells/SelectEconRunDialog';
import { WellSpacingDialog } from './ManageWells/WellSpacingDialog';
import api from './api';
import { useCopyWells } from './useCopyWells';

const DELETE_POINTS = [
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
	{
		value: 'carbon',
		label: 'Carbon',
		desc: 'removes wells from all Networks in this project',
	},
];

const ECON_RUN_ONE_LINER_HEADERS = [
	'WI Oil',
	'NRI Oil',
	'Before Income Tax Cash Flow',
	'First Discount Cash Flow',
	'Econ First Prod Date',
	'Undisc ROI',
	'IRR',
	'Payout Duration',
	'Oil Break Even',
	'Gas Break Even',
	'Oil Shrunk EUR',
	'Gas Shrunk EUR',
	'NGL EUR',
];

const ECON_RUN_RESERVES_CATEGORY_HEADERS = ['PRMS Reserves Category', 'PRMS Reserves Sub Category'];

const tooltipListStyle = css`
	font-size: 0.875rem;
	margin: 0.5rem 0;
`;

const tooltipListTitleStyle = css`
	font-size: 1rem;
`;

// TODO: Refactor this
function Operations({ addingWells, removingWells, getWellIds, selection }) {
	const { project, updateProject } = useCurrentProject();
	const [selectEconRunDialog, selectEconRun] = useDialog(SelectEconRunDialog);
	const [wellSpacingDialog, showWellSpacingDialog] = useDialog(WellSpacingDialog);
	const queryClient = useQueryClient();
	const { invalidate: invalidateWellsCollection } = useWellsCollectionsQuery(project?._id, !!project);

	const { isWellSpacingEnabled } = useLDFeatureFlags();

	const ability = useContext(AbilityContext);

	const canUpdateProject = ability.can(ACTIONS.Update, subject(SUBJECTS.Projects, { _id: project._id }));
	const canCreateProjectWells = ability.can(ACTIONS.Create, subject(SUBJECTS.ProjectWells, { project: project._id }));

	const { operationInProgress, collisionsDialog } = useChangeIdentifiersMenuCallbacks();

	const wellOperationCompletedNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				queryClient.invalidateQueries(['well-headers']);
			}
		},
		[queryClient]
	);

	useUserNotificationCallback(NotificationType.WELL_CALCS, wellOperationCompletedNotificationCallback);
	useUserNotificationCallback(NotificationType.WELL_SPACING_CALCS, wellOperationCompletedNotificationCallback);
	useUserNotificationCallback(NotificationType.ECON_WELL_CALCS, wellOperationCompletedNotificationCallback);
	useUserNotificationCallback(NotificationType.REMOVE_LEADING_ZEROS, wellOperationCompletedNotificationCallback);

	const runCalcs = async ({ wells }) => {
		try {
			await api.runWellCalcs({ wells });
		} catch (err) {
			genericErrorAlert(err, 'Failed to start calculations');
		}
	};

	const runWellSpacing = async ({ wellIds, distanceType, zoneType, epsgNumber, allWellIds }) => {
		try {
			await api.runWellSpacing({ wellIds, distanceType, zoneType, epsgNumber, allWellIds });
		} catch (err) {
			genericErrorAlert(err, 'Failed to start well spacing calculations');
		}
	};

	const handleRunCalcs = async () => {
		try {
			const wells = [...selection.selectedSet];

			const confirmed = await alerts.confirm({
				title: 'Run Well Calcs',
				children: `Run well calculations for ${wells.length} wells`,
			});

			if (confirmed) {
				await runCalcs({ wells });
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleRunWellSpacing = async ({ distanceType, zoneType, epsgNumber }) => {
		try {
			const wellIds = [...selection.selectedSet];
			const allWellIds = await getWellIds();

			await runWellSpacing({ wellIds, distanceType, zoneType, epsgNumber, allWellIds });
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleValidateWellSpacing = async ({ distanceType, zoneType }) => {
		try {
			const wellIds = [...selection.selectedSet];
			const allWellIds = await getWellIds();

			const validationResult = await api.validateWellSpacing({ wellIds, distanceType, zoneType, allWellIds });
			return validationResult;
		} catch (error) {
			genericErrorAlert(error, 'Failed to validate well spacing data');
		}
	};

	const copyWellsCallback = useCallback(
		async (notificationUpdate) => {
			if (notificationUpdate.status === TaskStatus.COMPLETED) {
				const wellIds = await getApi(`/projects/getProjectWellIds/${project._id}`);
				const newProject = { ...project, wells: wellIds };
				invalidateWellsCollection();
				updateProject(newProject);
			}
		},
		[project, updateProject, invalidateWellsCollection]
	);
	useUserNotificationCallback(NotificationType.COPY_WELLS, copyWellsCallback);

	const { handleCopyWells } = useCopyWells({ projectId: project._id });

	const applyEconRun = async ({ econRunId, wellIds, comboName }) => {
		try {
			await postApi('/well-calcs/runEconWellCalcs', { econRunId, wellIds, comboName });
		} catch (err) {
			genericErrorAlert(err, 'Failed to start apply econ run');
		}
	};

	const handleApplyEconRun = async () => {
		const wells = [...selection.selectedSet];
		const result = await selectEconRun();
		if (!result) {
			return;
		}
		const { econRun, combo } = result;
		applyEconRun({
			econRunId: econRun._id,
			wellIds: wells,
			comboName: combo === NO_COMBO_KEY ? undefined : combo.name,
		});
	};

	const removeLeadingZeros = async ({ wells }) => {
		try {
			await postApi('/well/remove-leading-zeros', { wellIds: wells });
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const handleRemoveLeadingZeros = async () => {
		const wells = [...selection.selectedSet];

		const confirmed = await alerts.confirm({
			title: 'Remove Leading Zeros',
			children: `Remove leading zeros from production data for ${wells.length} wells`,
			confirmText: 'Remove',
			confirmColor: 'error',
		});

		if (confirmed) {
			removeLeadingZeros({
				wells,
			});
		}
	};

	const onRunWellSpacing = async () => {
		await showWellSpacingDialog({
			onSubmit: handleRunWellSpacing,
			onValidate: handleValidateWellSpacing,
		});
	};

	const updating = addingWells || removingWells;

	const applyRunTooltip = (
		<>
			<div>Calculate econ headers based on chosen scenario and combo.</div>
			<div css={tooltipListTitleStyle}>Econ Run One Liner Headers: </div>
			<ul css={tooltipListStyle}>
				{ECON_RUN_ONE_LINER_HEADERS.map((header, i) => (
					<li key={`${header}-${i}`}>{header}</li>
				))}
			</ul>
			<div css={tooltipListTitleStyle}>Econ Run Reserves Category Headers: </div>
			<ul css={tooltipListStyle}>
				{ECON_RUN_RESERVES_CATEGORY_HEADERS.map((header, i) => (
					<li key={`${header}-${i}`}>{header}</li>
				))}
			</ul>
		</>
	);

	const handleCopy = () => {
		handleCopyWells({ wellIds: [...selection.selectedSet] });
	};

	return (
		<>
			{collisionsDialog}
			{selectEconRunDialog}
			{isWellSpacingEnabled && wellSpacingDialog}
			<MenuButton
				css='text-transform: unset;'
				label='Operations'
				endIcon={faChevronDown}
				list
				disabled={!selection.selectedSet.size}
			>
				<ButtonItem
					onClick={(!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) || handleCopy}
					tooltipTitle='Make copy of selected items. It keeps same chosen ID but different INPT ID'
					disabled={
						(!canCreateProjectWells && PERMISSIONS_TOOLTIP_MESSAGE) ||
						selection.selectedSet.size === 0 ||
						updating ||
						(selection.selectedSet.size > WELL_COPY_LIMIT && `Can only copy up to ${WELL_COPY_LIMIT} wells`)
					}
					label='Copy'
				/>
				<ButtonItem
					onClick={handleRunCalcs}
					disabled={
						(!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) ||
						selection.selectedSet.size === 0 ||
						updating
					}
					tooltipTitle='Calculate headers directly related to production data. e.g. Cum Oil, Months produced...'
					label='Run Calcs'
				/>
				<ButtonItem
					onClick={handleApplyEconRun}
					disabled={
						(!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) ||
						selection.selectedSet.size === 0 ||
						updating
					}
					tooltipTitle={applyRunTooltip}
					label='Apply Econ Run'
				/>
				<ButtonItem
					onClick={handleRemoveLeadingZeros}
					disabled={
						(!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) ||
						selection.selectedSet.size === 0 ||
						updating
					}
					tooltipTitle='Remove monthly and daily production data of selected wells prior to first non-zero production date'
					label='Remove Leading Zeros'
				/>
				<ChangeIdentifiersMenu
					operationInProgress={operationInProgress}
					selection={selection}
					scope
					dataSource
					chosenId
				/>
				{isWellSpacingEnabled && (
					<ButtonItem
						onClick={onRunWellSpacing}
						disabled={
							(!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) ||
							selection.selectedSet.size === 0 ||
							updating
						}
						tooltipTitle='Calculate and populate well spacing data into well headers'
						label='Run Well Spacing'
					/>
				)}
			</MenuButton>
		</>
	);
}

export function ManageWells({ wellIds }) {
	const { project, updateProject } = useCurrentProject();
	const filterWells = showWellFilter;
	const ability = useContext(AbilityContext);

	const canUpdateProject = ability.can(ACTIONS.Update, subject(SUBJECTS.Projects, { _id: project._id }));
	const canCreateProjectWells = ability.can(ACTIONS.Create, subject(SUBJECTS.ProjectWells, { project: project._id }));
	const { data: wellsCollections } = useWellsCollectionsQuery(project._id, true);

	const removeCollectionFromSelectedList = (selectedList, collectionList = []) => {
		return selectedList.filter((selected) => !collectionList.some((collection) => collection._id === selected));
	};

	const { isLoading: addingWells, mutateAsync: addWells } = useMutation(async (wells) => {
		const resp = await putApi(`/projects/${project._id}/addWells`, { ids: wells });
		const diff = resp.project.wells.length - project.wells.length;
		const newProject = { ...project, wells: resp.project.wells };
		updateProject(newProject);
		const pluralWells = pluralize(diff, 'New Well', 'New Wells');
		confirmationAlert(`${pluralWells} Added`);
	});

	const handleAdd = async (existingWells) => {
		try {
			const wells = await filterWells({
				wells: 'ALL_WELLS',
				type: 'add',
				limit: PROJECT_WELLS_LIMIT,
				existingWells,
				confirm: createConfirmAddWells('project'),
			});

			if (wells) {
				await addWells(wells);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const { isLoading: removingWells, mutateAsync: removeWells } = useMutation(
		async (selected) => {
			const wells = removeCollectionFromSelectedList(selected, wellsCollections);
			const resp = await putApi(`/projects/${project._id}/removeWells`, { ids: wells });
			const { forecastsRunning, error, msg, project: proj } = resp;

			if (forecastsRunning) {
				customErrorAlert(error.split('.')[0], error.split('.')[1]);
				return;
			}

			const newProject = { ...project, wells: proj.wells };
			updateProject(newProject);
			confirmationAlert(msg);
		},
		[updateProject, project, wellsCollections]
	);

	const handleRemove = async (selectedWells) => {
		try {
			const confirmed = await alerts.confirm({
				title: `Are you sure you want to remove ${selectedWells.length} wells from this project?`,
				children: (
					<>
						{DELETE_POINTS.map((point) => {
							return (
								<div key={point.value}>
									{point.label}
									<ul>
										<li>{point.desc}</li>
									</ul>
								</div>
							);
						})}
					</>
				),
				confirmText: 'Remove',
				confirmColor: 'error',
			});

			if (confirmed) {
				await removeWells(selectedWells);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	useDoggo(addingWells, 'Adding Wells...');
	useDoggo(removingWells, 'Removing Wells...');

	return (
		<WellsPageWithSingleWellViewDialog
			padded
			wellIds={wellIds}
			addWellsProps={{
				onAdd: handleAdd,
				disabled: !canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE,
				restButtonProps: { tooltipTitle: 'Add wells to the project' },
			}}
			createWellsProps={{
				disabled: !canCreateProjectWells && PERMISSIONS_TOOLTIP_MESSAGE,
				restButtonProps: { tooltipTitle: 'Create new wells' },
			}}
			removeWellsProps={{
				onRemove: handleRemove,
				disabled: (selectedWells) => {
					const numOfWells = removeCollectionFromSelectedList(selectedWells, wellsCollections).length;
					return (!canUpdateProject && PERMISSIONS_TOOLTIP_MESSAGE) || !numOfWells;
				},
				getTooltipTitle: (selectedWells) => {
					const numOfWells = removeCollectionFromSelectedList(selectedWells, wellsCollections).length;
					return `Remove ${pluralize(numOfWells, 'well', 'wells')} from project`;
				},
			}}
			operations={Operations}
			operationsProps={{ addingWells, removingWells }}
			wellsCollectionsProps={{ projectId: project?._id }}
			manageWellsCollections
			addRemoveWellsCollectionWells
		/>
	);
}
