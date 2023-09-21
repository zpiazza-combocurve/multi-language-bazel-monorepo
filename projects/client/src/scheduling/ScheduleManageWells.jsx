import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { usePermissions } from '@/access-policies/usePermissions';
import { confirmRemoveWells, createConfirmAddWells, genericErrorAlert, useDoggo, warningAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';
import { useCurrentProject } from '@/projects/api';
import { showWellFilter } from '@/well-filter/well-filter';

import { invalidateSchedule } from './shared';

export function ScheduleManageWells({ scheduleId, scheduleQuery }) {
	const { project } = useCurrentProject();
	const { data: schedule } = scheduleQuery;

	const wells = schedule?.wells;

	const reload = useCallback(() => invalidateSchedule(scheduleId), [scheduleId]);

	const { isLoading: adding, mutateAsync: addWells } = useMutation(async (wellIds) => {
		const { collections } = await postApi(`/schedules/${scheduleId}/addWells`, { wellIds });
		const hasWellCollections = collections && collections.length;
		if (hasWellCollections) {
			warningAlert(
				`${collections.length} well ${
					collections.length > 1 ? 'collections were' : 'collection was'
				} not added to the schedule.`
			);
		}
		reload();
	});

	const { isLoading: removing, mutateAsync: removeWells } = useMutation(async (wellIds) => {
		await postApi(`/schedules/${scheduleId}/removeWells`, { wellIds });
		reload();
	});

	const filterWells = showWellFilter;

	const handleAdd = useCallback(
		async (existingWells) => {
			if (!schedule) {
				return;
			}

			try {
				const filtered = await filterWells({
					wells: project.wells,
					type: 'add',
					existingWells,
					confirm: createConfirmAddWells('schedule'),
				});

				if (filtered) {
					await addWells(filtered);
				}
			} catch (error) {
				genericErrorAlert(error);
			}
		},
		[addWells, filterWells, project.wells, schedule]
	);

	const handleRemove = useCallback(
		async (selectedWells) => {
			try {
				const selected = selectedWells;

				if (!(await confirmRemoveWells(selected.length, 'schedule'))) {
					return;
				}

				await removeWells(selected);
			} catch (error) {
				genericErrorAlert(error);
			}
		},
		[removeWells]
	);

	useDoggo(adding, 'Adding Wells...');
	useDoggo(removing, 'Removing Wells...');

	const { canUpdate: canUpdateSchedule } = usePermissions(SUBJECTS.Schedules, schedule.project._id);

	return (
		<WellsPageWithSingleWellViewDialog
			wellIds={wells}
			addWellsProps={{
				onAdd: handleAdd,
				disabled: !canUpdateSchedule && PERMISSIONS_TOOLTIP_MESSAGE,
				restButtonProps: { tooltipTitle: 'Add wells to the scheduling' },
			}}
			removeWellsProps={{
				onRemove: handleRemove,
				disabled: (selectedWells) =>
					(!canUpdateSchedule && PERMISSIONS_TOOLTIP_MESSAGE) || !selectedWells.length,
				getTooltipTitle: (selectedWells) =>
					`Remove ${pluralize(selectedWells.length, 'well', 'wells')} from scheduling`,
			}}
			padded
		/>
	);
}
