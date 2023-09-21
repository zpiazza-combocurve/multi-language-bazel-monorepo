import { CardsLayout } from '@/layouts/CardsLayout';

import CollectionTable from './TableView/CollectionTable';
import { COLLECTIONS } from './TableView/CollectionTable/shared';

interface TableViewProps {
	className?: string;
	manageWellsCollections?: boolean;
	addRemoveWellsCollectionWells?: boolean;
	isWellsCollectionWells?: boolean;
}

export function TableView({
	className,
	manageWellsCollections = false,
	addRemoveWellsCollectionWells = false,
	isWellsCollectionWells = false,
}: TableViewProps) {
	return (
		<CardsLayout padding={0} className={className} forceMaximized={isWellsCollectionWells}>
			<CollectionTable
				defaultCollection='headers'
				collections={[COLLECTIONS.headers]}
				manageWellsCollections={manageWellsCollections}
				addRemoveWellsCollectionWells={addRemoveWellsCollectionWells}
				isWellsCollectionWells={isWellsCollectionWells}
			/>
			{!isWellsCollectionWells && (
				<CollectionTable
					defaultCollection='monthly'
					collections={[COLLECTIONS.monthly, COLLECTIONS.daily, COLLECTIONS.directionalSurvey]}
					separate
				/>
			)}
		</CardsLayout>
	);
}
