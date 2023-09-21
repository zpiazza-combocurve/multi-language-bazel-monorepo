import produce from 'immer';
import { useCallback, useMemo, useState } from 'react';

import { Box } from '@/components/v2';
import SelectField from '@/components/v2/misc/SelectField';
import { phases } from '@/helpers/zing';

const useSortablePhases = () => {
	const [sortedPhases, _setSortedPhases] = useState(phases.map((phaseItem) => phaseItem.value));

	const setSortedPhases = useCallback(
		(value, idx) =>
			_setSortedPhases(
				produce((draft) => {
					const curPhase = draft[idx];
					const newPhaseIdx = draft.findIndex((phase) => phase === value);

					draft[idx] = value;
					draft[newPhaseIdx] = curPhase;
				})
			),
		[]
	);

	const sortablePhasesRender = useMemo(
		() => (
			<Box display='flex' width='100%'>
				{sortedPhases.map((curPhase, idx) => {
					return (
						<Box marginX='0.25rem' width='100%' key={sortedPhases[idx]}>
							<SelectField
								fullWidth
								label={`Phase ${idx + 1}`}
								menuItems={phases}
								onChange={(ev) => setSortedPhases(ev.target.value, idx)}
								value={curPhase}
								variant='outlined'
							/>
						</Box>
					);
				})}
			</Box>
		),
		[setSortedPhases, sortedPhases]
	);

	return { sortablePhasesRender, sortedPhases };
};

export default useSortablePhases;
