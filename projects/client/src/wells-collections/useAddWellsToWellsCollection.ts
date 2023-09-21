import { useCallback, useMemo } from 'react';

import { Selection } from '@/components/hooks/useSelection';
import { useDialog } from '@/helpers/dialog';

import AddWellsToWellsCollectionDialog from './AddWellsToWellsCollectionDialog';
import { useWellsCollectionsQuery } from './queries';

export type AddWellsToWellsCollection = {
	add: (providedWellsToAdd?: Inpt.ObjectId<'well'>[]) => Promise<void>;
	disabled: boolean;
	addWellToCollectionDialog: JSX.Element | null;
};

const useAddWellsToWellsCollection = (
	projectId: Inpt.ObjectId<'project'> | undefined,
	selection: Selection<string>,
	enabled: boolean
): AddWellsToWellsCollection => {
	const { data } = useWellsCollectionsQuery(projectId, enabled);
	const [addWellToCollectionDialog, promptAddWellsToCollectionDialog] = useDialog(AddWellsToWellsCollectionDialog);

	const wellsToAdd = useMemo(() => {
		const wellsCollectionsIds = (data ?? []).map(({ _id }) => _id as string);

		return [...selection.selectedSet].filter(
			(_id) => !wellsCollectionsIds.includes(_id)
		) as Inpt.ObjectId<'well'>[];
	}, [data, selection]);

	const add = useCallback(
		async (providedWellsToAdd: Inpt.ObjectId<'well'>[] | undefined = undefined) => {
			await promptAddWellsToCollectionDialog({
				projectId,
				wells: providedWellsToAdd ?? wellsToAdd,
			});
		},
		[projectId, promptAddWellsToCollectionDialog, wellsToAdd]
	);

	return {
		add,
		disabled: !data || !data.length || !wellsToAdd.length,
		addWellToCollectionDialog,
	};
};

export default useAddWellsToWellsCollection;
