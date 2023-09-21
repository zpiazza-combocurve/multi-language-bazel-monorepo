import { Field, Formik } from 'formik';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormikFields,
	Radio,
	RadioGroup,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export const FilterByPSeriesDialog = ({
	visible,
	onHide,
	resolve,
}: DialogProps<{
	type: string;
	percentile: number[];
}>) => {
	return (
		<Formik initialValues={{ type: 'best', percentile: [0, 100] }} onSubmit={(values) => resolve(values)}>
			{({ values, handleSubmit }) => (
				<Dialog onClose={onHide} open={visible} maxWidth='sm' fullWidth>
					<DialogTitle>Filter P-Series</DialogTitle>
					<DialogContent>
						<FormControl fullWidth>
							<Field name='type' as={RadioGroup}>
								<FormControlLabel value='best' control={<Radio />} label='Best' />
								<FormControlLabel value='percentile' control={<Radio />} label='Percentile' />
							</Field>
						</FormControl>
						{values.type === 'percentile' && (
							<FormikFields.NumberRangeField name='percentile' min={0} max={100} dif={1} required />
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={onHide}>Cancel</Button>
						<Button color='primary' onClick={() => handleSubmit()}>
							Apply
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	);
};

export default FilterByPSeriesDialog;
