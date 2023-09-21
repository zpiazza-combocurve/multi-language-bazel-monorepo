import { withStyles } from '@material-ui/core';
import { Formik } from 'formik';
import { useCallback } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DatePicker, TextField } from '@/components/v2/formik-fields';
import { DialogProps } from '@/helpers/dialog';
import { labelWithUnit } from '@/helpers/text';
import { fields as units } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { fields as labels } from '@/inpt-shared/display-templates/wells/well_headers.json';
import { TypeCurveHeaders } from '@/type-curves/types';

import { safeDivide } from '../../../helpers/math';
import { requiredValidator } from '../../../helpers/validation';

const isRequired = requiredValidator('value');

const toDate = (date) => new Date(date);

const getFieldProps = (name) => ({
	name,
	id: name,
	label: labelWithUnit(labels[name], units[name]),
	placeholder: 'Enter Value',
	validate: isRequired,
});

function TypeCurveHeadersForm({ initialValues, onSubmit }) {
	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit}>
			{({ handleSubmit }) => {
				return (
					<form
						id='econ-tc-headers-form'
						onSubmit={handleSubmit}
						css={`
							& > * {
								margin: 0.25rem 0;
							}
						`}
					>
						{/*
							See: shared\schemas\type-curves.js
							If you add a field here make sure you add it to the schema too
						*/}
						<DatePicker fullWidth name='first_prod_date' format={toDate} />
						<TextField {...getFieldProps('perf_lateral_length')} fullWidth type='number' />
						<TextField {...getFieldProps('true_vertical_depth')} fullWidth type='number' />
						<TextField
							{...getFieldProps('total_proppant_per_perforated_interval')}
							fullWidth
							type='number'
						/>
					</form>
				);
			}}
		</Formik>
	);
}

const getInitialValues = (headers?: TypeCurveHeaders | null) => {
	const values = headers || ({} as TypeCurveHeaders);
	return {
		...values,
		first_prod_date: values.first_prod_date || new Date(),
		total_proppant_per_perforated_interval: safeDivide(
			values.total_prop_weight as number,
			values.perf_lateral_length
		),
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getSubmitHeaders = (values: Record<string, any>): TypeCurveHeaders => {
	const { total_proppant_per_perforated_interval, perf_lateral_length } = values;
	return {
		...values,
		total_prop_weight: total_proppant_per_perforated_interval * perf_lateral_length,
	} as TypeCurveHeaders;
};

const StyledDialog = withStyles({
	root: {
		'& .MuiPaper-root': {
			'overflow-y': 'unset',
		},
	},
})(Dialog);

export default function TypeCurveHeadersDialog({
	resolve,
	onHide,
	visible,
	headers,
}: DialogProps<TypeCurveHeaders> & { headers?: TypeCurveHeaders | null }) {
	const handleSubmit = useCallback((values) => resolve(getSubmitHeaders(values)), [resolve]);
	return (
		<StyledDialog onClose={onHide} open={visible} fullWidth maxWidth='xs'>
			<DialogTitle>Type Curve Headers</DialogTitle>
			<DialogContent>
				<TypeCurveHeadersForm initialValues={getInitialValues(headers)} onSubmit={handleSubmit} />
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' form='econ-tc-headers-form' type='submit'>
					Apply
				</Button>
			</DialogActions>
		</StyledDialog>
	);
}
