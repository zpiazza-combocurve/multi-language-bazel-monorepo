import { memo } from 'react';

import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { phases } from '@/helpers/zing';
import { FitPhaseTypes } from '@/type-curves/TypeCurveIndex/types';

import { ButtonGroupSelect } from './ButtonGroupSelect';

export const PhaseSelectField = memo(
	({
		basePhase,
		compact = false,
		disabled = false,
		disabledPhases,
		onChange,
		phaseTypes = { oil: 'rate', gas: 'rate', water: 'rate' },
		value,
	}: {
		basePhase?: Phase;
		compact?: boolean;
		disabled?: boolean;
		disabledPhases?: Record<Phase, boolean | string>;
		onChange: (newPhase: Phase) => void;
		phaseTypes?: FitPhaseTypes;
		value: Phase;
	}) => {
		const phaseShortName = phases.reduce((acc, phase) => {
			acc[phase.value] = phase.short;
			return acc;
		}, {});

		return (
			<ButtonGroupSelect
				disabled={disabled}
				disabledOptions={disabledPhases}
				fullWidth={!compact}
				items={phases.map((phase) => ({
					...phase,
					label:
						basePhase && phaseTypes?.[phase.value] === 'ratio' && VALID_PHASES.includes(basePhase)
							? `${phase.short} / ${phaseShortName[basePhase]}`
							: phase.label,
				}))}
				onChange={onChange}
				value={value}
			/>
		);
	}
);
