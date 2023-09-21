import { useState } from 'react';
import { useQuery } from 'react-query';

import { Placeholder, SelectList } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';

import { ScenarioEconRun } from './types';

/**
 * Key to use instead of a combo if the scenarios is too old and doesn't have any combo, in this case it will be asumed
 * it has a single combo named 'Default', but will not actually send anything to the server
 */
export const NO_COMBO_KEY = '__no_combo' as const;
type Combo = Required<ScenarioEconRun['outputParams']>['combos'][0];

export function SelectEconRunDialog({
	resolve,
	visible,
	onHide,
}: {
	resolve: (result: { econRun: ScenarioEconRun; combo: Combo | typeof NO_COMBO_KEY } | null) => void;
	onHide: () => void;
	visible: boolean;
}) {
	const { user, project } = useAlfa();

	const econRunListQuery = useQuery(
		['econ-runs', user._id, { completed: true, project: project?._id }],
		() =>
			getApi('/economics/getUserRuns', { status: 'complete', project: project?._id }) as Promise<
				ScenarioEconRun[]
			>
	);

	const [selectedEconRun, setSelectedEconRun] = useState<null | ScenarioEconRun>(null);
	const [selectedCombo, setSelectedCombo] = useState<null | Combo | typeof NO_COMBO_KEY>(null);
	const state = !selectedEconRun ? ('select-econ-run' as const) : ('select-combo' as const);

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>
				{state === 'select-econ-run' && 'Select Econ Run'}
				{state === 'select-combo' && 'Select Combo'}
			</DialogTitle>
			<DialogContent>
				<Placeholder
					loading={econRunListQuery.isLoading}
					empty={econRunListQuery.data?.length === 0}
					text='There are not successful economics runs'
				>
					{state === 'select-econ-run' && (
						<SelectList
							value={selectedEconRun}
							onChange={setSelectedEconRun}
							listItems={econRunListQuery.data?.map((econRun) => ({
								key: econRun._id,
								value: econRun,
								primaryText: econRun?.scenario?.name ?? 'N/A',
								secondaryText: `${pluralize(
									econRun.outputParams.combos?.length ?? 1,
									'Combo',
									'Combos'
								)}`,
							}))}
						/>
					)}
					{state === 'select-combo' && (
						<SelectList
							value={selectedCombo}
							onChange={setSelectedCombo}
							listItems={
								selectedEconRun?.outputParams.combos?.map((combo) => ({
									key: combo.name,
									value: combo,
									primaryText: combo.name,
								})) ?? [{ key: NO_COMBO_KEY, value: NO_COMBO_KEY, primaryText: 'Default' }]
							}
						/>
					)}
				</Placeholder>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						setSelectedCombo(null);
						setSelectedEconRun(null);
						onHide();
					}}
				>
					Cancel
				</Button>
				<Button
					color='primary'
					variant='contained'
					disabled={!selectedEconRun || !selectedCombo}
					onClick={() => {
						setSelectedCombo(null);
						setSelectedEconRun(null);
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						resolve({ econRun: selectedEconRun!, combo: selectedCombo! });
					}}
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
