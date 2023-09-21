import { useAbility } from '@casl/react';
import { faTrashRestore } from '@fortawesome/pro-regular-svg-icons';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import { useCallback } from 'react';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { alerts } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { toLocalDate, toLocalDateTime } from '@/helpers/dates';
import { useDialog } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import ModuleList from '@/module-list/ModuleList';

import { RestoreDialog } from './RestoreDialog';

const api = {
	fetchArchivedProjects({
		search = '',
		sort = 'lastArchivedAt',
		sortDir = -1,
		page = 0,
		createdBy = '',
		wellsMin = '',
		wellsMax = '',
		dateMin = '',
		dateMax = '',
	} = {}) {
		return getApi(
			'/archive/archived-projects',
			_.pickBy({
				search,
				sort,
				sortDir,
				page,
				wellsMin,
				wellsMax,
				createdBy,
				dateMin,
				dateMax,
			})
		);
	},
	restoreArchivedProject(archivedProjectId) {
		return postApi(`/archive/restore/${archivedProjectId}`);
	},
};

export function ArchivingModuleList() {
	const [restoreDialog, selectArchiveToRestore] = useDialog(RestoreDialog);

	const restoreItem = useCallback(
		/** @param {import('./types').ArchivedProjectItem} item */
		async (item) => {
			const { _id: projectId, name } = item;

			const selected =
				item.allVersionsCount === 1 ? item.lastVersion : await selectArchiveToRestore({ projectId });

			if (!selected) {
				return;
			}

			const confirmed = await alerts.confirm({
				title: `Do you want to restore this project?`,
				children: (
					<Typography>
						{name}-{selected.versionName}
					</Typography>
				),
				confirmText: 'Restore',
				confirmButtonProps: getTaggingProp('project', 'restoreProject'),
			});

			if (!confirmed) {
				return;
			}

			try {
				await api.restoreArchivedProject(selected._id);
			} catch (err) {
				genericErrorAlert(err);
			}
		},
		[selectArchiveToRestore]
	);

	const ability = useAbility(AbilityContext);
	const canRestore = useCallback(
		(item) => ability.can(ACTIONS.Create, subject(SUBJECTS.Projects, { _id: item._id })),
		[ability]
	);

	const itemActionBtns = useCallback(
		/** @param {import('./types').ArchivedProjectItem} item */
		(item) => [
			{
				icon: faTrashRestore,
				disabled: !canRestore(item),
				label: !canRestore(item) ? PERMISSIONS_TOOLTIP_MESSAGE : 'Restore Project',
				onClick: () => restoreItem(item),
			},
		],
		[restoreItem, canRestore]
	);

	const moduleList = ModuleList.useModuleList(api.fetchArchivedProjects, {
		search: '',
		sort: 'lastArchivedAt',
		dateMin: '',
		dateMax: '',
	});

	return (
		<>
			{restoreDialog}
			<ModuleList
				moduleList={moduleList}
				itemActionBtns={itemActionBtns}
				itemDetails={[
					ModuleList.Fields.name,
					ModuleList.Fields.createdBy,
					ModuleList.Fields.createdAt,
					{
						key: 'lastArchivedAt',
						label: 'Last Archived At',
						value: (item) => toLocalDate(item.lastArchivedAt),
						title: (item) => toLocalDateTime(item.lastArchivedAt),
						sort: true,
					},
					ModuleList.Fields.wells,
					ModuleList.Fields.scenarios,
					{
						key: 'allVersionsCount',
						label: 'Version',
						value: (item) => item.allVersionsCount,
						sort: true,
						type: 'number',
					},
				]}
				filters={
					<>
						<ModuleList.Filters.Title />
						<ModuleList.Filters.NameFilter />
						<ModuleList.Filters.CreatedRangeFilter />
						<ModuleList.Filters.CreatedByFilter />
					</>
				}
			/>
		</>
	);
}
