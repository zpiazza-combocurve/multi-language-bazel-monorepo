import { useContext, useMemo } from 'react';

import { WellsPageContext } from '@/manage-wells/shared/WellsPageContext';
import { useCurrentProject } from '@/projects/api';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';

import { DirectionalSurveyTable } from './CollectionTable/DirectionalSurveyTable';
import HeadersTable from './CollectionTable/HeadersTable';
import { ProductionTable } from './CollectionTable/ProductionTable';
import {
	COLLECTIONS,
	Collection,
	MAX_WELLS_SHOWING_PRODUCTION_DATA,
	useCollectionsSelect,
} from './CollectionTable/shared';

export interface CollectionTableProps {
	defaultCollection?: 'headers' | 'monthly' | 'daily';
	collections: Collection[];
	separate?: boolean;
	manageWellsCollections?: boolean;
	addRemoveWellsCollectionWells?: boolean;
	isWellsCollectionWells?: boolean;
}

const GRID_STORAGE_KEY = 'COLLECTION_TABLE_V2';

export default function CollectionTable({
	defaultCollection = 'headers',
	collections = [COLLECTIONS.headers, COLLECTIONS.monthly, COLLECTIONS.daily],
	separate = false,
	manageWellsCollections = false,
	addRemoveWellsCollectionWells = false,
	isWellsCollectionWells = false,
}: CollectionTableProps) {
	const {
		getWellIds,
		allWellCount: totalWells,
		selection,
		filters: extraFilters,
		companyOnly,
	} = useContext(WellsPageContext);

	const { project } = useCurrentProject();

	const [{ value: collectionValue, downloadLimit, initialHeaders }, select, setCollectionEdited] =
		useCollectionsSelect(collections, defaultCollection, separate);

	const shared = {
		companyOnly,
		extraFilters,
		getWellIds,
		initialHeaders,
		leftHeader: select,
		selection,
		wellsSelection: selection, // for the ProductionTable
		totalWells,
	};

	const allSelectedWells = useMemo(() => [...selection.selectedSet], [selection.selectedSet]);
	const productionWellIds = useMemo(
		() => [...selection.selectedSet].slice(0, MAX_WELLS_SHOWING_PRODUCTION_DATA),
		[selection.selectedSet]
	);

	const { data: wellsCollections } = useWellsCollectionsQuery(project?._id, !companyOnly);

	const wellsCollectionSelected = useMemo(() => {
		const wellsCollectionIds = (wellsCollections || []).map((collection) => collection._id.toString());

		return allSelectedWells.some((select) => wellsCollectionIds.indexOf(select) > -1);
	}, [allSelectedWells, wellsCollections]);

	if (([COLLECTIONS.headers.value, COLLECTIONS.customHeaders.value] as string[]).includes(collectionValue)) {
		return (
			<HeadersTable
				{...shared}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				resolution={collectionValue as any}
				downloadLimit={downloadLimit}
				manageWellsCollections={manageWellsCollections}
				addRemoveWellsCollectionWells={addRemoveWellsCollectionWells}
				isWellsCollectionWells={isWellsCollectionWells}
			/>
		);
	}

	if (collectionValue === 'monthly' || collectionValue === 'daily') {
		return (
			<ProductionTable
				{...shared}
				wellIds={productionWellIds}
				allWellIds={allSelectedWells}
				resolution={collectionValue}
				onEditedStateChanged={setCollectionEdited}
				isWellsCollectionWells={isWellsCollectionWells || wellsCollectionSelected}
				gridStorageKey={GRID_STORAGE_KEY}
			/>
		);
	}

	if (collectionValue === 'directionalSurvey') {
		return (
			<DirectionalSurveyTable
				{...shared}
				downloadLimit={downloadLimit}
				wellIds={productionWellIds}
				allWellIds={allSelectedWells}
			/>
		);
	}

	return null;
}
