import { Placeholder } from '@/components';
import { WellsPage } from '@/manage-wells/WellsPage';

import { useWellsCollectionQuery } from './queries';

interface WellsCollectionWellsProps {
	wellsCollectionId: Inpt.ObjectId<'wells-collection'>;
}

const WellsCollectionWells = (props: WellsCollectionWellsProps) => {
	const { wellsCollectionId } = props;

	const { data, isLoading } = useWellsCollectionQuery(wellsCollectionId, true);
	const { wells_collection_items: wells, project } = data ?? {
		wells_collection_items: [] as Inpt.ObjectId<'well'>[],
	};

	if (isLoading) {
		return <Placeholder text='Loading Wells...' />;
	}

	return <WellsPage wellIds={wells} isWellsCollectionWells padded companyOnly={!project} />;
};

export default WellsCollectionWells;
