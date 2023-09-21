import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InputAdornment,
	RHFNumberField,
	RHFRadioGroupField,
	RHFTextField,
	Stack,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export interface MapExportOptions {
	fileType: 'pdf' | 'jpeg';
	mapTitle: string;
	mapDescription: string;
	horizontalResolution: number;
	ppi: number;
}

const mapExportOptionsSchema = yup.object().shape({
	fileType: yup.string().required('Please select a file type'),
	mapTitle: yup.string().max(70, 'Cannot be longer than ${max} characters'),
	mapDescription: yup.string().max(100, 'Cannot be longer than ${max} characters'),
	horizontalResolution: yup
		.number()
		.transform((value) => (isNaN(value) ? undefined : value))
		.when('fileType', {
			is: 'jpeg',
			then: (schema) =>
				schema
					.required('Please enter a horizontal resolution')
					.min(240, 'Cannot be less than ${min}')
					.max(3840, 'Cannot be more than ${max}'),
		}),
	ppi: yup
		.number()
		.transform((value) => (isNaN(value) ? undefined : value))
		.when('fileType', {
			is: 'pdf',
			then: (schema) =>
				schema
					.required('Please enter a PPI')
					.min(72, 'Cannot be less than ${min}')
					.max(600, 'Cannot be more than ${max}'),
		}),
});

export function ExportMapDialog({ visible, onHide, resolve }: DialogProps<MapExportOptions>) {
	const initialValues: MapExportOptions = {
		fileType: 'pdf',
		mapTitle: '',
		mapDescription: '',
		horizontalResolution: 1080,
		ppi: 300,
	};

	const {
		control,
		handleSubmit: withFormValues,
		watch,
	} = useForm({ defaultValues: initialValues, resolver: yupResolver(mapExportOptionsSchema) });
	const fileType = watch('fileType');

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='xs'>
			<DialogTitle>Export Map View</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					<RHFRadioGroupField
						control={control}
						options={[
							{ label: 'PDF', value: 'pdf' },
							{ label: 'JPEG', value: 'jpeg' },
						]}
						label='File Type'
						name='fileType'
						row
					/>

					<RHFTextField control={control} label='Map Title' name='mapTitle' fullWidth />

					<RHFTextField control={control} label='Map Description' name='mapDescription' fullWidth />

					{fileType === 'jpeg' && (
						<RHFNumberField
							control={control}
							label='Horizontal Resolution'
							name='horizontalResolution'
							fullWidth
							InputProps={{ endAdornment: <InputAdornment position='end'>pixels</InputAdornment> }}
						/>
					)}

					{fileType === 'pdf' && (
						<RHFNumberField
							control={control}
							label='PPI'
							name='ppi'
							fullWidth
							InputProps={{ endAdornment: <InputAdornment position='end'>ppi</InputAdornment> }}
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={handleSubmit}>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
}
