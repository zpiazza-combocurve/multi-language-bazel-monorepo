import _ from 'lodash-es';

import { getTaggingProp } from '@/analytics/tagging';
import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { Button, Divider, RHFForm } from '@/components/v2';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { phases } from '@/helpers/zing';

import { FormContent, FormFooter, RHFFormStyles } from '../shared/formLayout';
import { Align, CalculatedBackgroundDataType, PhaseData } from '../types';
import FitPhaseForm from './FitPhaseForm';
import { useTypeCurveFit } from './TypeCurveFit';
import { TC_MODELS } from './helpers';

function AutoFit({
	align,
	basePhase,
	calculatedBackgroundData,
	eurPercentile,
	form,
	formError,
	handleModelChange,
	handleSubmit: _handleSubmit,
	percentileFit,
	phaseData,
	phaseRepWells,
	resetTcFits,
	saveAutoFitTypeCurve,
	saving,
	setEurPercentile,
	tempFitActive,
	togglePhase,
}: Pick<
	ReturnType<typeof useTypeCurveFit>,
	| 'eurPercentile'
	| 'form'
	| 'formError'
	| 'handleModelChange'
	| 'handleSubmit'
	| 'percentileFit'
	| 'saveAutoFitTypeCurve'
	| 'saving'
	| 'setEurPercentile'
	| 'tempFitActive'
	| 'togglePhase'
> & {
	align?: Align;
	basePhase: Phase;
	calculatedBackgroundData: Record<Phase, CalculatedBackgroundDataType | null>;
	phaseData: PhaseData;
	phaseRepWells: Record<Phase, Array<string>>;
	resetTcFits: () => void;
}) {
	const track = useTrackAnalytics();

	const handleSubmit = async () => {
		const formValues = form.getValues();

		const analyticsData = phases.reduce((acc, { value }) => {
			if (formValues?.phases?.[value]) {
				const multiSegmentFitTypeValue = formValues?.[value]?.TC_model;

				if (multiSegmentFitTypeValue) {
					const multiSegmentFitTypeLabel = TC_MODELS[formValues[value].phaseType].find(
						(model) => model.value === multiSegmentFitTypeValue
					)?.label;
					acc[value] = {
						multiSegmentFitType: {
							value: multiSegmentFitTypeValue,
							label: multiSegmentFitTypeLabel ?? multiSegmentFitTypeValue,
						},
					};
				}
			}

			return acc;
		}, {} as Record<string, unknown>);

		track(EVENTS.typeCurve.fitRun, analyticsData);
		await _handleSubmit();
	};

	const disabledResetAndSave = saving || !tempFitActive;
	const disabledRun = saving || !!formError;

	return (
		<RHFForm css={RHFFormStyles} form={form}>
			<FormContent>
				{_.map(phases, ({ value: phase }) => (
					<FitPhaseForm
						key={`fit-phase-form__${phase}`}
						align={align}
						backgroundData={calculatedBackgroundData[phase]}
						basePhase={basePhase}
						eurPercentile={eurPercentile}
						form={form}
						handleModelChange={handleModelChange}
						percentileFit={percentileFit}
						phase={phase}
						phaseData={phaseData[phase]}
						phaseRepWells={phaseRepWells[phase]}
						setEurPercentile={setEurPercentile}
						togglePhase={togglePhase}
					/>
				))}
			</FormContent>

			<Divider />

			<FormFooter>
				<Button disabled={disabledResetAndSave} onClick={resetTcFits} size='small'>
					Reset
				</Button>

				<Button
					disabled={disabledResetAndSave}
					color='secondary'
					onClick={() => saveAutoFitTypeCurve()}
					size='small'
					{...getTaggingProp('typeCurve', 'saveFit')}
				>
					Save
				</Button>

				<Button
					color='secondary'
					disabled={disabledRun}
					onClick={handleSubmit}
					size='small'
					variant='contained'
					{...getTaggingProp('typeCurve', 'runFit')}
				>
					Run
				</Button>
			</FormFooter>
		</RHFForm>
	);
}

export default AutoFit;
