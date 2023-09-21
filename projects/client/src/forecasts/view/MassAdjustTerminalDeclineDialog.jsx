/* eslint react/jsx-key: warn */
import { FormikContext, useFormik } from 'formik';
import { cloneDeep } from 'lodash-es';
import { useMutation } from 'react-query';

import { getValidateFn } from '@/components/shared';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { CheckboxField, TextField } from '@/components/v2/formik-fields';
import { confirmationAlert, useLoadingBar } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { phases } from '@/helpers/zing';
import { SectionAIO } from '@/layouts/Section';

export function MassAdjustTerminalDeclineDialog({ forecastId, wells, resolve, onHide, visible }) {
	const { isLoading: submitting, mutateAsync: handleSubmit } = useMutation(async (values) => {
		const body = {
			formValues: cloneDeep(values),
			wells,
			forecastId,
		};
		body.formValues.targetDeffSw /= 100;
		// if a task is created/dialog should close so user can see notification alerts

		try {
			const { message, taskCreated } = await putApi(`/forecast/${forecastId}/mass-adjust-terminal-decline`, body);

			if (!taskCreated) {
				confirmationAlert(message);
			}

			resolve(!taskCreated);
		} catch (err) {
			throw Error(err);
		}
	});
	useLoadingBar(submitting);

	const initialValues = {
		phases: { oil: true, gas: true, water: true },
		targetDeffSw: 8,
	};
	const formikBundle = useFormik({ initialValues, onSubmit: handleSubmit });

	const { isSubmitting, submitForm, isValid } = formikBundle;
	return (
		<FormikContext.Provider value={formikBundle}>
			<Dialog onClose={onHide} open={visible} fullWidth>
				<DialogTitle>Mass Adjust Terminal Decline</DialogTitle>
				<DialogContent>
					<SectionAIO
						header={
							<div
								css={`
									display: flex;
									align-items: center;
									justify-content: space-between;
								`}
							>
								Phases:
								{phases.map(({ value, label }) => (
									// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
									<CheckboxField name={`phases.${value}`} label={label} />
								))}
							</div>
						}
					>
						<TextField
							name='targetDeffSw'
							label='D Sw-Eff-Sec (%)'
							type='number'
							validate={getValidateFn({ required: true, min: 1, max: 99, type: 'number' })}
						/>
					</SectionAIO>
				</DialogContent>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button
						disabled={wells.length < 1 || isSubmitting || !isValid /* || errSet.size > 0 */}
						onClick={submitForm}
						color='primary'
					>
						{`Run (${wells.length})`}
					</Button>
				</DialogActions>
			</Dialog>
		</FormikContext.Provider>
	);
}
