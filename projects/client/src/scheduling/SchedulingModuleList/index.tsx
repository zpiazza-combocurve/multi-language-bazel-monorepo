import { useNavigate } from 'react-router-dom';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions, { buildPermissions } from '@/access-policies/usePermissions';
import { confirmationAlert, withDoggo } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, getApi, postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FilterResult } from '@/module-list/types';
import { NotificationType } from '@/notifications/notification';
import { useCurrentProject } from '@/projects/api';
import { copySchedule } from '@/scheduling/SchedulingSettings';
import { URLS } from '@/urls';

import ScheduleCreateDialog from './ScheduleCreateDialog';

type ScheduleItem = Pick<Inpt.Schedule, '_id' | 'name' | 'method' | 'createdAt'> & {
	createdBy: Inpt.User;
	project: Assign<Inpt.Project, { createdBy: Inpt.User }>;
	wellsLength: number;
};

export function SchedulingMod() {
	const { project } = useCurrentProject();

	const navigate = useNavigate();

	const workMe = async (item: ScheduleItem) => {
		navigate(URLS.project(item.project._id).schedule(item._id).view);
	};

	const [createDialog, showCreateDialog] = useDialog(ScheduleCreateDialog);

	const { runFilters, selection, moduleListProps } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		selectedProject: project,
		search: '',
		sort: 'createdAt',
		sortDir: -1,
		tags: [],
	});

	const { ability, canCreate: canCreateSchedule } = usePermissions(SUBJECTS.Schedules, project?._id);

	return (
		<>
			{createDialog}
			<ModuleList
				{...moduleListProps}
				feat='Schedule'
				useTags='schedule'
				fetch={(body) => getApi('/schedules', body) as Promise<FilterResult<ScheduleItem>>}
				onCreate={async () => {
					const data = await showCreateDialog();
					if (data) {
						const schedule = await withDoggo(postApi('/schedules', { ...data, projectId: project?._id }));
						navigate(URLS.project(schedule.project).schedule(schedule._id).view);
					}
				}}
				canCreate={canCreateSchedule && !!project}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
						<Filters.TagsFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							buildPermissions(ability, SUBJECTS.Schedules, item?.project?._id).canUpdate,
						onRename: (value, item) => postApi(`/schedules/${item._id}`, { name: value }),
					},
					Fields.createdBy,
					Fields.createdAt,
					{ label: 'Method', key: 'method', value: ({ method }) => method },
					Fields.project,
					Fields.wells,
					Fields.tags,
				]}
				copyNotification={NotificationType.COPY_SCHEDULE}
				onCopy={(item) => copySchedule(item)}
				canCopy={(item) => buildPermissions(ability, SUBJECTS.Schedules, item?.project?._id).canCreate}
				onDelete={(item) => deleteApi(`/schedules/${item._id}`)}
				canDelete={(item) => buildPermissions(ability, SUBJECTS.Schedules, item?.project?._id).canDelete}
				workMe={workMe}
				selectionActions={
					<MassDeleteButton
						disabled={selection?.selectedSet?.size === 0}
						feat='Schedule'
						feats='Schedules'
						length={selection?.selectedSet?.size}
						requireName
						onDelete={async () => {
							const ids = [...(selection?.selectedSet || [])];
							const deleted = await postApi('/schedules/mass-delete', {
								ids,
							});
							if (ids.length !== deleted) {
								confirmationAlert(`${deleted} out of ${ids.length} schedules deleted`);
							} else {
								confirmationAlert(`${pluralize(ids.length, 'schedule', 'schedules')} deleted`);
							}
						}}
						refresh={runFilters}
					/>
				}
			/>
		</>
	);
}

export default SchedulingMod;
