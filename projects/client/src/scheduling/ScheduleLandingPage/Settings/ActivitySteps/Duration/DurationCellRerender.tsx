import { ICellRendererParams } from 'ag-grid-community';
import { useMemo } from 'react';

import { getItem } from '@/components/ContextMenu';
import CellRenderer from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/CellRenderers/CellRenderer';

export function DurationCellRerender(params: ICellRendererParams) {
	const {
		node: { data: step },
		context: { buildLookupTable, assignLookupTable, removeLookupTable, lookupTables },
	} = params;

	const items = useMemo(() => {
		return [
			getItem('Build Lookup Table', () => buildLookupTable(step)),
			lookupTables?.length && getItem('Assign Lookup Table', () => assignLookupTable(step)),
			step.stepDuration.useLookup && getItem('Remove Lookup Table', () => removeLookupTable(step)),
		];
	}, [buildLookupTable, step, assignLookupTable, removeLookupTable, lookupTables]);

	return (
		<div style={{ marginLeft: '0.5rem' }}>
			<CellRenderer {...params} items={items} />
		</div>
	);
}
