import { useCallback, useMemo } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { alerts } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { pluralize } from '@/inpt-shared/helpers/text-utils';
import { getAgGridNodeIdInfo } from '@/manage-wells/WellsPage/TableView/CollectionTable/shared';

import { useRemoveWellsFromWellsCollectionMutation } from './mutations';
import { useWellsCollectionsQuery } from './queries';
import { RemoveWellsFromWellsCollectionsMutationVariables } from './types';

export type RemoveWellsFromWellsCollections = {
	remove: (provided?: RemoveWellsFromWellsCollectionsMutationVariables) => Promise<void>;
	removing: boolean;
	disabled: boolean;
};

const useRemoveWellsFromWellsCollections = (
	projectId: Inpt.ObjectId<'project'> | undefined,
	nodeIdsSelection: Selection<string>,
	enabled: boolean
): RemoveWellsFromWellsCollections => {
	const { data, invalidate } = useWellsCollectionsQuery(projectId, enabled);

	const wellsCollectionsQueryDataIdsSet = useMemo(() => new Set((data ?? []).map(({ _id }) => _id)), [data]);

	const { mutateAsync, isLoading } = useRemoveWellsFromWellsCollectionMutation({
		onSuccess: (_, variables) => {
			const entries = Object.entries(variables);
			const collectionsCount = entries.length;
			const wellsCount = new Set(entries.flatMap(([, value]) => value)).size;

			confirmationAlert(
				`${pluralize(wellsCount, 'well', 'wells')} removed from ${pluralize(
					collectionsCount,
					'wells collection',
					'wells collections'
				)}!`
			);

			invalidate();
		},
	});

	const variables = useMemo((): RemoveWellsFromWellsCollectionsMutationVariables => {
		const removeWellsPreliminaryData = (data ?? []).reduce((acc, curr) => {
			acc[curr._id] = new Set<string>();
			return acc;
		}, {} as Record<string, Set<string>>);

		[...nodeIdsSelection.selectedSet].forEach((nodeId) => {
			const nodeIdInfo = getAgGridNodeIdInfo(nodeId, wellsCollectionsQueryDataIdsSet);

			if (nodeIdInfo.wellId) {
				if (nodeIdInfo.wellsCollectionId) {
					removeWellsPreliminaryData[nodeIdInfo.wellsCollectionId]?.add(nodeIdInfo.wellId);
				} else {
					Object.keys(removeWellsPreliminaryData).forEach((wellsCollectionId) =>
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						removeWellsPreliminaryData[wellsCollectionId]?.add(nodeIdInfo.wellId!)
					);
				}
			}
		});

		const removeWellsFinalData = Object.entries(removeWellsPreliminaryData).reduce(
			(acc, [wellsCollectionId, set]) => {
				if (set.size > 0) {
					acc[wellsCollectionId] = [...set] as Inpt.ObjectId<'well'>[];
				}
				return acc;
			},
			{} as Record<string, Inpt.ObjectId<'well'>[]>
		);

		return removeWellsFinalData;
	}, [data, nodeIdsSelection.selectedSet, wellsCollectionsQueryDataIdsSet]);

	const remove = useCallback(
		async (provided: RemoveWellsFromWellsCollectionsMutationVariables | undefined = undefined) => {
			const entries = Object.entries(provided ?? variables);
			const collectionsCount = entries.length;
			const wellsCount = new Set(entries.flatMap(([, value]) => value)).size;

			const confirmed = await alerts.confirm({
				children: `Are you sure you want to remove ${pluralize(wellsCount, 'well', 'wells')} from ${pluralize(
					collectionsCount,
					'wells collection',
					'wells collections'
				)}?`,
				confirmText: 'Yes',
				cancelText: 'No',
			});

			if (confirmed) {
				await mutateAsync(provided ?? variables);
			}
		},
		[mutateAsync, variables]
	);

	return {
		remove,
		removing: isLoading,
		disabled: !Object.keys(variables).length,
	};
};

export default useRemoveWellsFromWellsCollections;
