import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Merge from '@/module-list/Merge/Merge';
import { ModuleBasicInfo } from '@/module-list/Merge/models';
import { useScenario } from '@/scenarios/api';

import Assumptions from './MergeScenarios/Assumptions';
import useMergeScenarios from './MergeScenarios/useMergeScenarios';
import { MAX_NUMBER_OF_WELLS_IN_SCENARIO } from './constants';

const MergeScenarios = () => {
	const [overlap, setOverlap] = useState<string[]>([]);
	const [total, setTotal] = useState<string[]>([]);
	const { firstScenarioId, secondScenarioId } = useParams();
	const { scenario: firstScenario } = useScenario(firstScenarioId);
	const { scenario: secondScenario } = useScenario(secondScenarioId);
	const [sidebarItems, setSidebarItems] = useState<ModuleBasicInfo[]>([]);

	const {
		setName,
		sortScenarios,
		model: mergedModel,
		addQualifiers: addMergedQualifiers,
		updateQualifier: updateMergedQualifier,
		deleteQualifier: deleteMergedQualifier,
		reset,
		setUniqueAssumptions: setUniqueAssumptionsForMergedScenario,
		mergeScenarios,
		isMergeInProgress,
	} = useMergeScenarios(firstScenarioId as string, secondScenarioId as string);

	useEffect(() => {
		if (firstScenario && secondScenario) {
			setOverlap(firstScenario.wells.filter((wellId) => secondScenario.wells.includes(wellId)));
			setTotal([...new Set([...firstScenario.wells, ...secondScenario.wells])]);
			setSidebarItems([
				{
					id: firstScenario._id,
					name: firstScenario.name,
					wells: firstScenario.wells.length,
				},
				{
					id: secondScenario._id,
					name: secondScenario.name,
					wells: secondScenario.wells.length,
				},
			]);
		}
	}, [firstScenario, secondScenario]);

	return (
		<Merge
			items={sidebarItems}
			onNameChange={setName}
			maxNumberOfWellsInMerged={MAX_NUMBER_OF_WELLS_IN_SCENARIO}
			onSortModuleItems={sortScenarios}
			moduleName='Scenario'
			wellsCountLabel='Up to 25k Wells'
			overlap={overlap.length}
			total={total.length}
			titleDescription='Define scenarios hierarchical order for merging duplicate wells and qualifers'
			content={
				<Assumptions
					total={total.length}
					firstScenario={firstScenario}
					secondScenario={secondScenario}
					mergedModel={mergedModel}
					addMergedQualifiers={addMergedQualifiers}
					updateMergedQualifier={updateMergedQualifier}
					deleteMergedQualifier={deleteMergedQualifier}
					onReset={reset}
					setUniqueAssumptionsForMergedScenario={setUniqueAssumptionsForMergedScenario}
					mergeScenarios={mergeScenarios}
					isMergeInProgress={isMergeInProgress}
				/>
			}
		/>
	);
};

export default MergeScenarios;
