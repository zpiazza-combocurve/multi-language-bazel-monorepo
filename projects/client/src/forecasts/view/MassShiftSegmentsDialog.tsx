import { convertDateToIdxFloor } from '@combocurve/forecast/helpers';
import { SegmentParent } from '@combocurve/forecast/models';
import { FormikContext, useFormik } from 'formik';
import produce from 'immer';
import _ from 'lodash';
import { useEffect } from 'react';

import { getValidateFn } from '@/components/shared';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider } from '@/components/v2';
import {
	AutoComplete,
	CheckboxField,
	DatePicker,
	SimpleSelectField,
	SwitchField,
	TextField,
} from '@/components/v2/formik-fields';
import { phases as PHASES } from '@/helpers/zing';
import { ADJUSTMENT_TYPE_MAP } from '@/inpt-shared/constants';
import { SectionAIO } from '@/layouts/Section';

const REFERENCE_OPTIONS = [
	{ label: 'First Prod Date', value: 'first_prod_date' },
	{ label: 'Daily First Prod Date', value: 'first_prod_date_daily' },
	{ label: 'Daily First Prod Date by Oil', value: 'first_prod_date_daily_oil' },
	{ label: 'Daily First Prod Date by Gas', value: 'first_prod_date_daily_gas' },
	{ label: 'Daily First Prod Date by Water', value: 'first_prod_date_daily_water' },
	{ label: 'Monthly First Prod Date', value: 'first_prod_date_monthly' },
	{ label: 'Monthly First Prod Date by Oil', value: 'first_prod_date_monthly_oil' },
	{ label: 'Monthly First Prod Date by Gas', value: 'first_prod_date_monthly_gas' },
	{ label: 'Monthly First Prod Date by Water', value: 'first_prod_date_monthly_water' },
	{ label: 'Daily Last Prod Date', value: 'last_prod_date_daily' },
	{ label: 'Monthly Last Prod Date', value: 'last_prod_date_monthly' },
	{ label: 'First Segment Start Date', value: 'first_segment_start' },
	{ label: 'First Segment End Date', value: 'first_segment_end' },
	{ label: 'Last Segment Start Date', value: 'last_segment_start' },
	{ label: 'Last Segment End Date', value: 'last_segment_end' },
	{ label: 'Fixed Date', value: 'fixed_date' },
];

const UNIT_OPTIONS = [
	{ label: 'Day', value: 'day' },
	{ label: 'Month', value: 'month' },
	{ label: 'Year', value: 'year' },
];

const RATE_BOUNDARY_OPTIONS = [
	{ label: 'Fixed Rate', value: 'fixed_rate' },
	{ label: 'Peak Rate', value: 'peak_rate' },
];

const RATE_BOUNDARY_FIELD_LABELS = {
	peak_rate: '% of peak rate',
	fixed_rate: 'BBL/D & MCF/D',
};

const RATE_BOUNDARY_DEFAULT_VALUES = {
	peak_rate: 200,
	fixed_rate: 1e9,
};

export const MassShiftSegmentsDialog = ({ wells, resolve, onHide, visible, adjustmentType }) => {
	const initialValues = {
		reference: { label: 'First Prod Date', value: 'first_prod_date' },
		referenceDate: new Date(),
		offset: 0,
		unit: 'day',
		phases: { oil: true, gas: true, water: true },
		boundaries: {
			rate: {
				apply: false,
				boundaryType: 'fixed_rate',
				boundary: new SegmentParent().numericLarge,
			},
		},
	};

	const formikBundle = useFormik({
		initialValues,
		onSubmit: async (body) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const output: Record<string, any> = _.cloneDeep(body);
			if (output.reference.value === 'fixed_date') {
				output.fixedDateIdx = convertDateToIdxFloor(output.referenceDate);
			}
			resolve(output);
		},
		initialTouched: { boundaries: { rate: { boundary: true } } },
	});

	const { values, isSubmitting, submitForm, setValues, isValid: formIsValid } = formikBundle;

	// When the boundary type is adjusted, make sure the default value is changed.
	useEffect(() => {
		const newValues = produce((draft) => {
			draft['boundaries']['rate']['boundary'] = RATE_BOUNDARY_DEFAULT_VALUES[values.boundaries.rate.boundaryType];
		});
		setValues(newValues);
	}, [setValues, values.boundaries.rate.boundaryType]);

	return (
		<FormikContext.Provider value={formikBundle}>
			<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
				<DialogTitle>{ADJUSTMENT_TYPE_MAP[adjustmentType]}</DialogTitle>

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
								{PHASES.map(({ label, value }) => (
									<CheckboxField key={value} name={`phases.${value}`} label={label} />
								))}
							</div>
						}
					>
						<div
							css={`
								display: flex;
								flex-direction: column;
								margin-top: 1rem;
							`}
						>
							<div
								css={`
									align-items: center;
									column-gap: 0.5rem;
									display: flex;
									margin-bottom: 1.5rem;
									width: 100%;
								`}
							>
								<AutoComplete
									css='flex: 2 1 0;'
									disableClearable
									getOptionLabel={(x) => x?.label ?? ''}
									label='Reference'
									name='reference'
									options={REFERENCE_OPTIONS}
									variant='outlined'
									{...{ renderInput: (params) => <TextField {...params} /> }}
								/>

								<TextField
									css='flex: 1 1 0;'
									label='Offset'
									name='offset'
									type='number'
									variant='outlined'
								/>

								<SimpleSelectField
									css='flex: 1 1 0;'
									label='Unit'
									menuItems={UNIT_OPTIONS}
									name='unit'
									variant='outlined'
								/>
							</div>

							{values.reference.value === 'fixed_date' && (
								<div css='width: 47%;margin-bottom: 1rem;'>
									<DatePicker fullWidth label='Input Date' name='referenceDate' variant='outlined' />
								</div>
							)}
							<span css='font-size: .9rem; margin-bottom:  1rem'>
								{` Negative offset will ${
									adjustmentType === 'shift' ? 'shift' : 're-calculate'
								} back in time and a positive offset will
								${adjustmentType === 'shift' ? 'shift' : 're-calculate'} forward in time.`}
							</span>
							<Divider />

							{adjustmentType === 'backcast' && (
								<Box display='flex' flexDirection='column'>
									<SwitchField
										css='margin: 1rem 0 .5rem 0'
										label='Rate Upper Limit'
										name='boundaries.rate.apply'
										size='small'
									/>
									<div css='display: flex; justify-content: space-between;margin: .5rem 0'>
										<SimpleSelectField
											css='width: 47%'
											disabled={!values.boundaries.rate.apply}
											menuItems={RATE_BOUNDARY_OPTIONS}
											name='boundaries.rate.boundaryType'
											variant='outlined'
										/>

										<TextField
											blurOnEnter
											css='width: 47%'
											disabled={!values.boundaries.rate.apply}
											label={RATE_BOUNDARY_FIELD_LABELS[values.boundaries.rate.boundaryType]}
											name='boundaries.rate.boundary'
											type='number'
											validate={getValidateFn({
												min: 0,
												max: 1e9,
												required: values.boundaries.rate.apply,
												type: 'number',
											})}
											variant='outlined'
										/>
									</div>

									<span css='margin: .5rem 0'>
										Changing this setting will re-calculate the q Start to the reference date and
										will stop at the rate limit if this condition is met before the reference date.
										For ratio phases, the boundary is only considered for the rate of the ratio
										phase, not the ratio itself.
									</span>
								</Box>
							)}
						</div>
					</SectionAIO>
				</DialogContent>

				<DialogActions>
					<Button onClick={onHide} size='small'>
						Cancel
					</Button>
					<Button
						color='secondary'
						disabled={
							!formIsValid ||
							(!wells?.length && 'Need at least one well') ||
							(isSubmitting && 'Running') ||
							(!Object.values(values.phases).some((v) => v) && 'Please select at least one phase') ||
							(!Number.isFinite(values.offset) && 'Please provide a valid offset')
						}
						onClick={submitForm}
						size='small'
						variant='contained'
					>
						{`Run (${wells.length})`}
					</Button>
				</DialogActions>
			</Dialog>
		</FormikContext.Provider>
	);
};
