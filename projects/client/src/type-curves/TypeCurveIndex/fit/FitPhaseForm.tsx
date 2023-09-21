import _ from 'lodash-es';
import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Divider, InfoTooltipWrapper, SwitchField } from '@/components/v2';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { CustomSelectField } from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';

import { PhaseFormCollapse, PhaseFormContainer, PhaseHeader } from '../shared/formLayout';
import { Align, CalculatedBackgroundDataType, SinglePhaseData } from '../types';
import AddSeriesFields from './AddSeriesFIelds';
import BuildupFields from './BuildupFields';
import ModelFields from './ModelFields';
import { useTypeCurveFit } from './TypeCurveFit';
import { TC_MODELS } from './helpers';

function FitPhaseForm({
	align,
	backgroundData,
	basePath: basePathIn,
	basePhase,
	eurPercentile,
	form,
	handleModelChange,
	isProximity = false,
	percentileFit,
	phase,
	phaseData,
	phaseRepWells,
	setEurPercentile,
	togglePhase,
}: Pick<
	ReturnType<typeof useTypeCurveFit>,
	'eurPercentile' | 'handleModelChange' | 'percentileFit' | 'setEurPercentile' | 'togglePhase'
> & {
	align?: Align;
	backgroundData: CalculatedBackgroundDataType | null;
	basePath?: string;
	basePhase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	form: UseFormReturn<any>;
	isProximity?: boolean;
	phase: Phase;
	phaseData: SinglePhaseData | null;
	phaseRepWells: Array<string>;
}) {
	const [open, setOpen] = useState<boolean>(true);

	const basePath = basePathIn ?? phase;

	const { watch } = form;

	const [phaseType, tcModel] = watch([`${basePath}.phaseType`, `${basePath}.TC_model`]);
	const hasRepWells = phaseRepWells.length > 0;
	const enabledPhase = watch(`phases.${phase}`) && hasRepWells;

	const availableModels = useMemo(() => {
		// Temporarily added because Proximity shouldn't have the Flat + M Arps model
		const excludedModels = isProximity ? ['flat_arps_modified'] : [];
		return TC_MODELS?.[phaseType].filter((x) => !excludedModels.includes(x?.value)) ?? [];
	}, [isProximity, phaseType]);

	return (
		<ForecastToolbarTheme>
			<PhaseHeader
				disabled={!hasRepWells && 'No valid representative wells'}
				label={`${_.capitalize(phase)} (${_.capitalize(phaseType)})`}
				open={open}
				phase={phase}
				toggleOpen={() => setOpen((u) => !u)}
				togglePhase={togglePhase}
			/>

			<PhaseFormCollapse in={open && enabledPhase}>
				<PhaseFormContainer>
					<InfoTooltipWrapper
						placeIconAfter
						tooltipTitle={
							(!percentileFit && 'Run type curve to enable') ||
							(phaseType === 'ratio' && 'Disabled for ratio curves')
						}
					>
						<SwitchField
							checked={eurPercentile[phase]}
							disabled={!percentileFit || phaseType === 'ratio'}
							label='Match Analog Well Set EUR'
							onChange={(e) => setEurPercentile(phase, e.target.checked)}
						/>
					</InfoTooltipWrapper>

					<CustomSelectField
						fullWidth
						label='Multi-Segment Fit Type'
						menuItems={availableModels}
						name={`${basePath}.TC_model`}
						onChange={(value) => handleModelChange(phase, value)}
					/>

					<ModelFields
						basePath={basePathIn}
						basePhase={basePhase}
						hasRepWells={hasRepWells}
						phase={phase}
						phaseType={phaseType}
						tcModel={tcModel}
					/>

					{phaseType === 'rate' && tcModel !== 'flat_arps_modified' && (
						<>
							<Divider />
							<BuildupFields basePath={basePathIn} hasRepWells={hasRepWells} phase={phase} />
						</>
					)}

					<Divider />

					<AddSeriesFields
						align={align}
						backgroundData={backgroundData}
						hasRepWells={hasRepWells}
						phase={phase}
						phaseData={phaseData}
						phaseType={phaseType}
					/>
				</PhaseFormContainer>
			</PhaseFormCollapse>
		</ForecastToolbarTheme>
	);
}

export default FitPhaseForm;
