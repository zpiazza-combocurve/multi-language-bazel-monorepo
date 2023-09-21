import _ from 'lodash';
import { memo, useMemo } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Divider, RHFForm } from '@/components/v2';
import { phases } from '@/helpers/zing';

import { FormContent, FormFooter, RHFFormStyles } from '../shared/formLayout';
import NormalizationPhaseForm from './NormalizationPhaseForm';

const NormalizationForm = ({
	form,
	handleAdjustType,
	handleSubmit,
	isEdited,
	normalizationSelection,
	performingAction,
	phaseTypes,
	resetData,
	saveNormalization,
	recalculatingMultipliers,
	...formProps
}) => {
	const {
		formState: { isSubmitting, errors },
		handleSubmit: formSubmit,
		watch,
	} = form;

	const [oilEnabled, gasEnabled, waterEnabled, oilNormType, gasNormType, waterNormType] = watch([
		'phases.oil',
		'phases.gas',
		'phases.water',
		'oil.type',
		'gas.type',
		'water.type',
	]);

	const hasPhaseErrors =
		(oilEnabled && !_.isEmpty(errors['oil'])) ||
		(gasEnabled && !_.isEmpty(errors['gas'])) ||
		(waterEnabled && !_.isEmpty(errors['water']));

	const disabledRunMessage = useMemo(() => {
		if (performingAction) {
			return 'Cannot run while performing an action';
		}
		if (!(oilEnabled || gasEnabled || waterEnabled)) {
			return 'No phases selected';
		}
		if (isSubmitting) {
			return 'Generating normalization';
		}
		if (hasPhaseErrors) {
			return 'Please correct the errors on the form';
		}
		if (
			(oilEnabled && oilNormType === 'no_normalization') ||
			(gasEnabled && gasNormType === 'no_normalization') ||
			(waterEnabled && waterNormType === 'no_normalization')
		) {
			return 'Cannot normalize on a phase without a Normalization Type selected';
		}
		if (recalculatingMultipliers) {
			return recalculatingMultipliers;
		}
		return false;
	}, [
		hasPhaseErrors,
		gasEnabled,
		gasNormType,
		isSubmitting,
		oilEnabled,
		oilNormType,
		performingAction,
		recalculatingMultipliers,
		waterEnabled,
		waterNormType,
	]);

	return (
		<RHFForm css={RHFFormStyles} form={form} onSubmit={handleSubmit}>
			<FormContent>
				{_.map(phases, ({ value: phase }) => (
					<NormalizationPhaseForm
						key={`normalization-phase-form__${phase}`}
						form={form}
						handleAdjustType={handleAdjustType}
						phase={phase}
						phaseType={phaseTypes[phase]}
						selection={normalizationSelection[phase]}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						{...(formProps as any)}
					/>
				))}
			</FormContent>

			<Divider />

			<FormFooter>
				<Button disabled={!isEdited || performingAction} onClick={resetData} size='small'>
					Reset
				</Button>

				<Button
					color='secondary'
					disabled={!isEdited || performingAction || recalculatingMultipliers}
					onClick={saveNormalization}
					size='small'
					{...getTaggingProp('typeCurve', 'saveNormalization')}
				>
					Save
				</Button>

				<Button
					color='secondary'
					disabled={disabledRunMessage}
					onClick={formSubmit(handleSubmit)}
					size='small'
					variant='contained'
					{...getTaggingProp('typeCurve', 'normalize')}
				>
					Normalize
				</Button>
			</FormFooter>
		</RHFForm>
	);
};

export default memo(NormalizationForm);
