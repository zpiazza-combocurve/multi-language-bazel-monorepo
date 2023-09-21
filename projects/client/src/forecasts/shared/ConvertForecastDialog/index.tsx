import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField, Stack } from '@/components/v2';

export interface Values {
	name: string;
}

const ConvertForecastSchema = yup.object().shape({
	name: yup.string().required(),
});
const ConvertForecastDialog = ({ resolve, onHide, visible, title, initialName }) => {
	const initialValues: Values = {
		name: initialName || '',
	};

	const {
		control,
		formState: { isValid, isSubmitted },
		handleSubmit: withFormValues,
	} = useForm({
		defaultValues: initialValues,
		mode: 'all',
		resolver: yupResolver(ConvertForecastSchema),
	});
	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='md'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					<RHFTextField control={control} label='Converted Forecast Name' name='name' required fullWidth />
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' disabled={isSubmitted && !isValid} onClick={handleSubmit}>
					Convert
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default ConvertForecastDialog;
