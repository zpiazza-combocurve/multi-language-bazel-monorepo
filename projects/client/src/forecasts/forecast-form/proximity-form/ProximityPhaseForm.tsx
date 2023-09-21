import _ from 'lodash';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { PhaseFormCollapse, PhaseHeader } from '@/type-curves/TypeCurveIndex/shared/formLayout';

import { FormPhase } from '../automatic-form/types';
import FitFields from './FitFields';
import NormalizationFields from './NormalizationFields';
import { UseProximityForecastReturn } from './useProximityForecast';

const ProximityPhaseFormBase = ({
	handlePhaseTypeChange,
	phase,
}: Pick<UseProximityForecastReturn, 'handlePhaseTypeChange'> & { phase: FormPhase }) => {
	return (
		<section
			css={`
				display: flex;
				flex-direction: column;
				flex: 1 1 0;
				row-gap: 0.5rem;
			`}
		>
			<NormalizationFields phase={phase} />
			<FitFields handlePhaseTypeChange={handlePhaseTypeChange} phase={phase} />
		</section>
	);
};

const ProximityPhaseForm = ({
	handlePhaseTypeChange,
	phase,
}: Pick<UseProximityForecastReturn, 'handlePhaseTypeChange'> & { phase: FormPhase }) => {
	const [open, setOpen] = useState(false);
	const { watch } = useFormContext();
	const formPhases = watch('phases');

	if (phase === 'shared') {
		return <ProximityPhaseFormBase handlePhaseTypeChange={handlePhaseTypeChange} phase={phase} />;
	}

	return (
		<>
			<PhaseHeader label={_.capitalize(phase)} phase={phase} open={open} toggleOpen={() => setOpen((u) => !u)} />

			<PhaseFormCollapse in={formPhases[phase] && open}>
				<section css='padding-left: 0.75rem;'>
					<ProximityPhaseFormBase handlePhaseTypeChange={handlePhaseTypeChange} phase={phase} />
				</section>
			</PhaseFormCollapse>
		</>
	);
};

export default ProximityPhaseForm;
