import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Placeholder } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { Divider } from '@/components/v2';
import { confirmationAlert, createConfirmAddWells, createConfirmRemoveWells, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { toLocalDate } from '@/helpers/dates';
import { useDialog } from '@/helpers/dialog';
import { Hook } from '@/helpers/hooks';
import { deleteApi, postApi } from '@/helpers/routing';
import {
	SettingsButton,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { Layout } from '@/layouts/Layout';
import { CopyDialog } from '@/module-list/ModuleList/components';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';
import { URLS } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

import { invalidateSchedule } from './shared';

export function copySchedule({ _id }) {
	return postApi(`/schedules/${_id}/copy`);
}

export function ScheduleSettings({ scheduleId, scheduleQuery }) {
	const schedule = scheduleQuery.data;
	const filterWells = showWellFilter;
	const [name, setName] = useDerivedState(schedule?.name);

	const { project } = useAlfa();

	// actions/helpers
	const { mutateAsync: addWells } = useMutation(async (wellIds) => {
		await postApi(`/schedules/${scheduleId}/addWells`, { wellIds });
		invalidateSchedule(scheduleId);
	});
	const { mutateAsync: removeWells } = useMutation(async (wellIds) => {
		await postApi(`/schedules/${scheduleId}/removeWells`, { wellIds });
		invalidateSchedule(scheduleId);
	});
	// callbacks
	const { isLoading: savingName, mutateAsync: handleSaveName } = useMutation(async () => {
		await postApi(`/schedules/${scheduleId}`, { name });
		invalidateSchedule(scheduleId);
	});

	const { isLoading: addingWells, mutateAsync: handleAddWells } = useMutation(async () => {
		if (!schedule) {
			return;
		}
		const filteredWells = await filterWells({
			wells: project.wells,
			existingWells: schedule.wells,
			isFiltered: false,
			type: 'add',
			confirm: createConfirmAddWells('schedule'),
		});
		if (filteredWells !== null) {
			await addWells(filteredWells);
			confirmationAlert('Schedule wells added successfully');
		}
	});

	const { isLoading: removingWells, mutateAsync: handleRemoveWells } = useMutation(async () => {
		if (!schedule) {
			return;
		}
		const filteredWells = await filterWells({
			wells: schedule.wells,
			isFiltered: false,
			type: 'remove',
			confirm: createConfirmRemoveWells('schedule'),
		});
		if (filteredWells !== null) {
			await removeWells(filteredWells);
			confirmationAlert('Schedule wells removed successfully');
		}
	});

	const handleScheduleCopy = () => copySchedule(schedule);

	useLoadingBar(addingWells || removingWells || savingName);

	const {
		canUpdate: canUpdateSchedule,
		canCreate: canCreateSchedule,
		canDelete: canDeleteSchedule,
	} = usePermissions(SUBJECTS.Schedules, project._id);

	if (!schedule) {
		return <Placeholder main loading loadingText='Loading Schedule Settings' />;
	}

	return (
		<Layout clean>
			<div
				css={`
					width: 100%;
					padding: 1rem;
				`}
			>
				<SettingsInfoContainer>
					<SettingsTextField label='Schedule Name' value={name} onChange={(newName) => setName(newName)} />
					<SettingsTextField
						disabled
						label='Created By'
						value={fullNameAndLocalDate(schedule.createdBy, schedule.createdAt)}
					/>
					<SettingsTextField disabled label='Last Updated' value={toLocalDate(schedule.updatedAt)} />
					<SettingsTextField disabled label='Wells In Schedule' value={schedule?.wells?.length} />
					<SettingsTextField disabled label='Setting Name' value={schedule?.setting?.name} />

					<SettingsTagsList feat='schedule' featId={schedule._id} />
				</SettingsInfoContainer>

				{schedule.name !== name && (
					<>
						<SettingsButton
							primary
							onClick={handleSaveName}
							label='Save Name'
							tooltipLabel={!canUpdateSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							disabled={savingName || !hasNonWhitespace(name) || !canUpdateSchedule}
							info={[`From — ${schedule.name}`, `To — ${name}`]}
						/>
						<Divider />
					</>
				)}

				<SettingsButton
					primary
					onClick={handleAddWells}
					tooltipLabel={!canUpdateSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
					disabled={!canUpdateSchedule}
					label='Add Wells'
					info={[
						'Add available wells to this schedule',
						'Added wells will be available to any user viewing this schedule',
					]}
				/>

				<SettingsButton
					warning
					onClick={handleRemoveWells}
					label='Remove Wells'
					tooltipLabel={!canUpdateSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
					disabled={!canUpdateSchedule}
					info={['Remove wells from this schedule']}
				/>

				<AssignTagsSettingsButton
					tooltipLabel={!canUpdateSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
					disabled={!canUpdateSchedule}
					feat='schedule'
					featId={schedule._id}
				/>

				<Divider />

				<Hook hook={useDialog} props={[CopyDialog]}>
					{([dialog, promptDialog]) => (
						<>
							{dialog}
							<SettingsButton
								primary
								disabled={!canCreateSchedule}
								tooltipLabel={!canCreateSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
								onClick={() =>
									promptDialog({
										feat: 'Schedule',
										name: schedule.name,
										onCopy: handleScheduleCopy,
									})
								}
								label='Copy Schedule'
								info={['Copies schedule. Does not copy the schedule settings']}
							/>
						</>
					)}
				</Hook>

				<SettingsDeleteButton
					feat='Schedule'
					disabled={!canDeleteSchedule}
					tooltipLabel={!canDeleteSchedule ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
					onDelete={() => deleteApi(`/schedules/${schedule._id}`)}
					name={name}
					redirectTo={URLS.project(project._id).schedules}
					info={['Deletes schedule and all of its contents']}
				/>
			</div>
		</Layout>
	);
}
