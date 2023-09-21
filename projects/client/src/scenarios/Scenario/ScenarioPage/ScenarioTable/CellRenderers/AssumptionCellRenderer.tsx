import { ICellRendererParams } from 'ag-grid-community';
import { useMemo } from 'react';

import { getItem, getURLItem } from '@/components/ContextMenu';
import { ASSUMPTION_FOR_GROUPS, AssumptionKey } from '@/inpt-shared/constants';
import { useCurrentProjectRoutes } from '@/projects/routes';
import { NOT_ACCESSIBLE_FIELD } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/constants';
import { getAssumptionLabel } from '@/scenarios/shared';

import CellRenderer from './CellRenderer';

export function AssumptionCellRenderer(params: ICellRendererParams) {
	const {
		value: assumption,
		node: { data: assignment },
		column,
		context: {
			canUpdateScenario,
			chooseLookupTable,
			chooseTCLookupTable,
			chooseModel,
			openForecastPreview,
			removeAssignment,
		},
	} = params;
	const assumptionKey = column?.getColId();
	const assumptionName = getAssumptionLabel(assumptionKey);
	const type = Object.keys(assumption ?? {})?.[0];
	const isLookup = ['lookup', 'tcLookup'].includes(type);
	const model = assumption?.[type];
	const modelId = model?._id;

	const projectRoutes = useCurrentProjectRoutes();

	const items = useMemo(() => {
		return [
			getItem(`Choose ${assumptionName}`, () => chooseModel({ assumptionKey, assignment }), !canUpdateScenario),
			assumptionKey !== AssumptionKey.carbonNetwork && // disabled for network column until support is added
				assumptionKey !== AssumptionKey.emission && // disabled for network column until support is added
				getItem(
					'Choose Lookup Table',
					() => chooseLookupTable({ assumption, assumptionKey, assignment }),
					!canUpdateScenario
				),
			assumptionKey === AssumptionKey.forecast &&
				getItem(
					'Choose TC Lookup Table',
					() => chooseTCLookupTable({ assumption, assumptionKey, assignment }),
					!canUpdateScenario
				),
			getURLItem(
				'View Lookup Table',
				isLookup &&
					(type === 'tcLookup'
						? projectRoutes.forecastLookupTable(modelId).edit
						: projectRoutes.scenarioLookupTable(modelId).edit)
			),
			assumptionKey === AssumptionKey.forecast &&
				!isLookup &&
				modelId &&
				getItem('View Forecast', () => openForecastPreview(assignment)),
			assumptionKey === AssumptionKey.schedule &&
				!isLookup &&
				modelId &&
				getURLItem('View Schedule', projectRoutes.schedule(modelId).view),
			model &&
				getItem(
					'Remove Assignment',
					() => removeAssignment({ assumption, assumptionKey, assignment }),
					!canUpdateScenario
				),
		];
	}, [
		type,
		isLookup,
		modelId,
		openForecastPreview,
		projectRoutes,
		removeAssignment,
		assignment,
		assumption,
		assumptionKey,
		canUpdateScenario,
		assumptionName,
		chooseModel,
		chooseLookupTable,
		chooseTCLookupTable,
		model,
	]);

	const groupItems = useMemo(() => {
		if (!ASSUMPTION_FOR_GROUPS.includes(assumptionKey as AssumptionKey)) return NOT_ACCESSIBLE_FIELD;
		return [
			getItem(`Choose ${assumptionName}`, () => chooseModel({ assumptionKey, assignment }), !canUpdateScenario),
			model &&
				getItem(
					'Remove Assignment',
					() => removeAssignment({ assumption, assumptionKey, assignment }),
					!canUpdateScenario
				),
		];
	}, [
		assignment,
		assumption,
		assumptionKey,
		assumptionName,
		canUpdateScenario,
		chooseModel,
		model,
		removeAssignment,
	]);

	return <CellRenderer {...params} items={assignment.isGroupCase ? groupItems : items} />;
}
