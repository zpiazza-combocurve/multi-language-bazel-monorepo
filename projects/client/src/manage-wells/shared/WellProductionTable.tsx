import { useMemo } from 'react';

import { WithToolbar } from '@/components/Toolbar';
import { useSelection } from '@/components/hooks';
import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { generateHeaderSheet, generateProductionSheet } from '@/helpers/wellDownload';
import { exportXLSX } from '@/helpers/xlsx';

import { ProductionTable } from '../WellsPage/TableView/CollectionTable/ProductionTable';
import { COLLECTIONS, useCollectionsSelect } from '../WellsPage/TableView/CollectionTable/shared';
import { withProps } from './utils';

const Container = withProps(WithToolbar, {
	fullWidth: true,
	fullHeight: true,
	toolbarCss: 'flex-direction: column; align-items: flex-start;',
	rightCss: 'width: 100%; min-width: 315px',
});

interface WellProductionTableProps {
	wellId: string;
	isWellsCollection: boolean;
}

const GRID_STORAGE_KEY = 'WELL_PRODUCTION_TABLE_V2';

export default function WellProductionTable({ wellId, isWellsCollection }: WellProductionTableProps) {
	const [{ value: resolution, initialHeaders, storageKey }, select] = useCollectionsSelect(
		[COLLECTIONS.monthlySingle, COLLECTIONS.dailySingle],
		'monthly'
	);
	const wells = useMemo(() => [wellId], [wellId]);
	const wellsSelection = useSelection(wells, wells);

	const download = useCallbackRef(async () => {
		// generate header sheet
		const headerSheet = await generateHeaderSheet(wellId);

		// generate production sheets
		const monthlySheet = await generateProductionSheet({ resolution: 'monthly', wellId });
		const dailySheet = await generateProductionSheet({ resolution: 'daily', wellId });

		exportXLSX({
			fileName: `cc-well-${wellId}-${resolution}-production.xlsx`,
			sheets: [headerSheet, monthlySheet, dailySheet],
		});
	});

	return (
		<ProductionTable
			leftHeader={select}
			wellIds={wells}
			wellsSelection={wellsSelection}
			resolution={resolution as 'daily' | 'monthly'}
			CardContainer={Container}
			onDownloadTable={download}
			initialHeaders={initialHeaders}
			storageKey={storageKey}
			singleWellView
			gridStorageKey={GRID_STORAGE_KEY}
			isWellsCollectionWells={isWellsCollection}
		/>
	);
}
