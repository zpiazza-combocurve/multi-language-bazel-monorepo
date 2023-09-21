import { scopedSelectDialog } from '@/components';
import { deleteMappings } from '@/data-import/FileImport/api';
import { fullNameAndLocalDate } from '@/helpers/user';

import { deleteApi, getApi } from '../helpers/routing';

const CONFIG = {
	'data-import/mappings': {
		plural: 'mappings',
		onTrash: (mappingId) => deleteMappings(mappingId),
	},
	'scheduling/settings': {
		plural: 'settings',
		onTrash: (settingId) => {
			deleteApi(`/schedules/settings/${settingId}`);
		},
	},
	'econ-model': { plural: 'models' },
	'lookup-table-model': { plural: 'lookup tables' },
	'forecast-lookup-table-model': { plural: 'forecast lookup tables' },
};

function compareMatch(a, b, actual) {
	if (actual === undefined || actual === null) {
		return 0;
	}
	if (a === actual && b === actual) {
		return 0;
	}
	if (a === actual) {
		return -1;
	}
	if (b === actual) {
		return 1;
	}
	return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const EMPTY_ARRAY: any[] = [];

/**
 * Get list of choices for ScopedSelectDialog component
 *
 * @typedef Options
 * @property {'econ-model' | 'scheduling/settings' | 'data-import/mappings'} feature
 * @property {any} userId
 * @property {any} projectId Current project id
 * @property {any} [extra] Extra props
 * @property {any[]} [invalidTrashIds] List of valid ids for deletion used on scheduling settings
 * @param {Options} options Extra data to send
 */
export function getScopedSelectDialogChoices({
	feature,
	userId,
	projectId: ownProjectId,
	extra,
	invalidTrashIds = EMPTY_ARRAY,
}) {
	return [
		{
			title: 'Select Project',
			elements: async () => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const all: any[] = await getApi('/projects/getMyProjectsWithCount', {
					feature,
					...extra,
				});
				return all
					.sort(
						(a, b) =>
							compareMatch(a?.createdBy?._id, b?.createdBy?._id, userId) * 10 +
							compareMatch(a?._id, b?._id, ownProjectId)
					)
					.filter(({ [feature]: count }) => count > 0)
					.map(({ _id, name, createdBy, createdAt, [feature]: count }) => {
						return {
							primaryText: name,
							secondaryText: (
								<>
									<span>{fullNameAndLocalDate(createdBy, createdAt)}</span>{' '}
									<span>
										{count} {CONFIG[feature].plural}
									</span>
								</>
							),
							value: { projectId: _id, projectName: name },
							highlight: _id === ownProjectId,
							mine: createdBy?._id === userId,
						};
					});
			},
			checkboxes: [userId && { key: 'mine', text: 'Created by me' }].filter(Boolean),
		},
		{
			title: ({ projectName }) => `Project ${projectName} ${CONFIG[feature].plural}`,
			elements: async ({ projectId }) => {
				const docs = await getApi('/projects/getProjectFeature', { projectId, feature, ...extra });
				return docs.map(({ name, _id, user: docUserId }) => {
					let onTrash = CONFIG[feature].onTrash;
					if (feature === 'scheduling/settings') {
						onTrash = !invalidTrashIds.includes(_id) && CONFIG[feature].onTrash;
					}
					if (feature === 'data-import/mappings') {
						onTrash = userId === docUserId && CONFIG[feature].onTrash;
					}
					return {
						primaryText: name,
						value: _id,
						onTrash,
					};
				});
			},
		},
	];
}

/**
 * @deprecated Use useDialog instead
 * @todo Show how to use it with `useDialog`
 */
export function selectByProject(feature, { userId, projectId: ownProjectId, extra, cache }, dialogProps) {
	if (CONFIG[feature] === undefined) {
		throw new Error(`Feature '${feature}' not allowed`);
	}
	const invalidTrashIds = [];
	return scopedSelectDialog(
		getScopedSelectDialogChoices({ feature, userId, projectId: ownProjectId, extra, invalidTrashIds }),
		{ cache },
		dialogProps
	);
}
