import { useCallback, useMemo } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { confirmationAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { pluralize } from '@/inpt-shared/helpers/text-utils';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import { useProject } from '@/projects/api';

import { useRemoveWellsCollectionMutation } from './mutations';
import { useWellsCollectionsQuery } from './queries';

export type RemoveWellsFromWellsCollections = {
	remove: (wellCollectionId: Inpt.ObjectId<'wells-collection'>) => Promise<void>;
	removing: boolean;
	disabled: boolean;
	deleteDialog;
};

const DELETE_POINTS = [
	{ value: 'scenario', label: 'Scenario', desc: 'removes wells collection from all Scenarios in this project' },
	{
		value: 'forecast',
		label: 'Forecast',
		desc: 'removes wells collection from all Forecasts in this project, along with its forecast data',
	},
	{
		value: 'assumptions',
		label: 'Econ Models',
		desc: 'removes all unique Econ Models made for these wells collection in this project',
	},
];

const useRemoveWellsCollection = (
	projectId: Inpt.ObjectId<'project'> | undefined,
	selection: Selection<string>
): RemoveWellsFromWellsCollections => {
	const { reload: reloadProject } = useProject(projectId);
	const { data, invalidate } = useWellsCollectionsQuery(projectId, true);
	const [deleteWellsCollectionDialog, promptDeleteWellsCollectionDialog] = useDialog(DeleteDialog);

	const { mutateAsync, isLoading } = useRemoveWellsCollectionMutation({
		onSuccess: (_, variables) => {
			confirmationAlert(
				`Removed ${pluralize(variables.wellsCollectionIds.length, 'Wells Collection', 'Wells Collections')}!`
			);
			invalidate();
			reloadProject();
		},
	});

	const variables = useMemo((): Inpt.ObjectId<'wells-collection'>[] => {
		const wellsCollectionIds: Inpt.ObjectId<'wells-collection'>[] = [];

		data?.forEach(({ _id }) => {
			const toRemove = selection.isSelected(_id);

			if (toRemove) {
				wellsCollectionIds.push(_id);
			}
		});

		return wellsCollectionIds;
	}, [data, selection]);

	const remove = useCallback(async () => {
		const text = pluralize(variables.length, 'Wells Collection', 'Wells Collections');
		await promptDeleteWellsCollectionDialog({
			feat: text,
			valueToConfirm: `Delete ${text}`,
			requireName: true,
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
			onDelete: async () => {
				await mutateAsync({ wellsCollectionIds: variables });
			},
		});
	}, [mutateAsync, variables, promptDeleteWellsCollectionDialog]);

	return {
		remove,
		removing: isLoading,
		disabled: !variables.length,
		deleteDialog: deleteWellsCollectionDialog,
	};
};

export default useRemoveWellsCollection;
