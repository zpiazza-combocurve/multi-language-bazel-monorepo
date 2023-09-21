import { FormikContext, useFormik } from 'formik';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { FormikCheckbox } from '@/components';
import { useCallbackRef } from '@/components/hooks';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { confirmationAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { phases } from '@/helpers/zing';

const FormLabel = styled.span`
	font-size: 1rem;
`;

const FieldContainer = styled.section`
	align-items: center;
	display: flex;
	justify-content: space-between;
	width: 100%;
`;

const ResetWellForecastDialog = ({ forecastId, onHide, resolve, wellIds, ...dialogProps }) => {
	const { mutateAsync: onSubmit } = useMutation(async (values) => {
		try {
			const body = {
				phases: Object.entries(values.phases).reduce((arr, [phase, phaseValue]) => {
					if (phaseValue) {
						return [...arr, phase];
					}
					return arr;
				}, []),
				wellIds,
			};

			const { taskCreated } = await withLoadingBar(putApi(`/forecast/${forecastId}/reset-well-forecasts`, body));
			if (!taskCreated) {
				confirmationAlert('Successfully Reset Wells');
			}
			resolve(!taskCreated);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const validate = useCallbackRef((values) => {
		const { phases: inputPhases } = values;
		const validPhases = !!Object.values(inputPhases).filter(Boolean).length;

		const errors = {};
		if (!validPhases) {
			errors.phases = 'No phases selected';
		}

		return errors;
	});

	const formikBundle = useFormik({
		initialValues: { phases: { oil: true, gas: true, water: true } },
		onSubmit,
		validate,
	});

	const { isValid, isSubmitting, submitForm } = formikBundle;

	return (
		<FormikContext.Provider value={formikBundle}>
			<Dialog open={dialogProps.visible} focusOnMount={false} {...dialogProps}>
				<DialogTitle>Reset Well Forecasts</DialogTitle>
				<DialogContent>
					<FieldContainer>
						<FormLabel>Phases:</FormLabel>
						{phases.map(({ label, value: phase }) => (
							<FormikCheckbox
								id={`phase-checkbox-${phase}`}
								key={phase}
								label={label}
								name={`phases.${phase}`}
								plain
							/>
						))}
					</FieldContainer>
				</DialogContent>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button color='primary' disabled={!isValid || isSubmitting} onClick={submitForm}>
						Run ({wellIds?.length ?? 0})
					</Button>
				</DialogActions>
			</Dialog>
		</FormikContext.Provider>
	);
};

export default ResetWellForecastDialog;
