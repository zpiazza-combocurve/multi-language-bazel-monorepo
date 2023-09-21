import { useCallback } from 'react';

import { Button, List, Typography } from '@/components/v2';
import { pluralize } from '@/helpers/text';

import Qualifier from './Qualifier';
import { getMergedQualifierPartUniqueKey } from './helpers';
import styles from './merge-scenarios.module.scss';

const Qualifiers = ({
	bringAllScenarioQualifiers,
	scenario,
	onAddQualifier,
	usedInMergeQualifiers,
	assumption,
	qualifierKeysToHighlight,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	bringAllScenarioQualifiers: (scenarioObj: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	scenario: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifier: (scenarioObj: any, qualifier: any) => void;
	usedInMergeQualifiers: { key: string; color: string }[];
	assumption: string;
	qualifierKeysToHighlight: string[];
}) => {
	const addQualifier = useCallback(
		(qualifier) => {
			onAddQualifier(scenario, qualifier);
		},
		[scenario, onAddQualifier]
	);

	const qualifiers = scenario.qualifiers.map((q) => {
		const key = getMergedQualifierPartUniqueKey(scenario._id, assumption, q.key);
		const used = usedInMergeQualifiers.find((uq) => uq.key === key);

		const highlighted = qualifierKeysToHighlight.indexOf(key) > -1;

		return {
			used: !!used,
			node: (
				<Qualifier
					key={q.key}
					assumption={assumption}
					qualifier={q}
					scenarioId={scenario._id}
					scenarioName={scenario.name}
					onAddQualifier={addQualifier}
					used={!!used}
					color={used?.color}
					highlighted={highlighted}
				/>
			),
		};
	});

	const allUsed = !qualifiers.find((q) => !q.used);

	return (
		<>
			<div className={styles['qualifiers-header']}>
				<Typography css='font-weight: bold; font-size: 14px;'>
					{scenario.name} ({pluralize(scenario.qualifiers.length, 'qualifier', 'qualifiers')})
				</Typography>
				<Button disabled={allUsed} onClick={() => bringAllScenarioQualifiers(scenario)}>
					Bring All
				</Button>
			</div>
			<List>{qualifiers.map((q) => q.node)}</List>
		</>
	);
};

export default Qualifiers;
