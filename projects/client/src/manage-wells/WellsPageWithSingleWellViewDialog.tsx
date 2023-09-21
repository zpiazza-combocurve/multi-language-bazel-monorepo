import { useCallback, useMemo } from 'react';

import { useDialog } from '@/helpers/dialog';
import { useCurrentProject } from '@/projects/api';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';

import { WellsPage } from './WellsPage';
import { SingleWellViewDialog } from './shared/SingleWellViewDialog';
import { WellsPageBaseProps } from './shared/types';

const WellsPageWithSingleWellViewDialog = (props: WellsPageBaseProps) => {
	const { companyOnly, manageWellsCollections = false, addRemoveWellsCollectionWells = false } = props;
	const { project } = useCurrentProject();
	const [singleWellDialog, showSingleWellDialog] = useDialog(SingleWellViewDialog);

	const wellsCollectionsQuery = useWellsCollectionsQuery(
		project?._id,
		manageWellsCollections || addRemoveWellsCollectionWells
	);
	const wellCollectionsIdsSet = useMemo(
		() => new Set(wellsCollectionsQuery.data?.map(({ _id }) => _id.toString()) ?? []),
		[wellsCollectionsQuery.data]
	);

	const viewWell = useCallback(
		(wellId: string) => {
			showSingleWellDialog({
				wellId,
				context: companyOnly ? {} : { projectId: project?._id },
				isWellsCollection: wellCollectionsIdsSet.has(wellId),
			});
		},
		[companyOnly, project?._id, showSingleWellDialog, wellCollectionsIdsSet]
	);

	return (
		<>
			{singleWellDialog}
			<WellsPage {...props} viewWell={viewWell} />
		</>
	);
};

export default WellsPageWithSingleWellViewDialog;
