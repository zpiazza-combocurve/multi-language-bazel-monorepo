/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { useMemo } from 'react';

import { Button, Divider, RHFForm } from '@/components/v2';
import { FormContent, FormFooter, RHFFormStyles } from '@/type-curves/TypeCurveIndex/shared/formLayout';

import ProximityNormPhaseForm from './ProximityNormPhaseForm';

function NormalizationForm({ form, handleNormalize, performingAction, phase, selection, ...formProps }) {
	const {
		formState: { errors },
		watch,
	} = form;

	const normalizationType = watch(`${phase}.eur.type`);

	const disabledRunMessage = useMemo(() => {
		if (performingAction) {
			return 'Cannot run while performing an action';
		}
		if (!_.isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		if (normalizationType === 'no_normalization') {
			return 'Cannot normalize on a phase without a Normalization Type selected';
		}

		return false;
	}, [errors, normalizationType, performingAction]);

	return (
		<RHFForm css={RHFFormStyles} form={form} onSubmit={() => _.noop()}>
			<FormContent>
				<ProximityNormPhaseForm form={form} phase={phase} selection={selection} {...(formProps as any)} />
			</FormContent>

			<Divider />

			<FormFooter>
				<Button
					color='secondary'
					disabled={disabledRunMessage}
					onClick={handleNormalize}
					size='small'
					variant='contained'
				>
					Normalize
				</Button>
			</FormFooter>
		</RHFForm>
	);
}

export default NormalizationForm;
