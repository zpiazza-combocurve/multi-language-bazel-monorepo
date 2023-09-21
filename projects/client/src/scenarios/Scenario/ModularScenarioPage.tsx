import _ from 'lodash';
import { useMemo } from 'react';

import { AssumptionKey } from '@/inpt-shared/constants';
import { CARBON_RELATED_ASSUMPTION_KEYS, allAssumptionKeys } from '@/scenarios/shared';

import { ScenarioPageContainer } from './ScenarioPage';
import { allHeaderKeys } from './ScenarioPage/index';

export function ModularScenarioPage({ scenarioId, wellId, headerSelection }) {
	const wellIds = useMemo(() => [wellId], [wellId]);
	const headers = useMemo(
		() => [
			..._.filter(allAssumptionKeys as AssumptionKey[], (v) => !CARBON_RELATED_ASSUMPTION_KEYS.includes(v)),
			...allHeaderKeys,
		],
		[]
	);
	return (
		<ScenarioPageContainer
			scenarioId={scenarioId}
			wellIds={wellIds}
			headers={headers}
			isModularScenario
			showCount={false}
			showSelection={false}
			showToolbar={false}
			headerSelection={headerSelection}
		/>
	);
}
