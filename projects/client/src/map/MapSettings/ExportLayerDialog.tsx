import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFRadioGroupField,
	RHFTextField,
	Stack,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

import { Layer, LayerExportFormat } from '../types';

interface ExportLayerValues {
	fileName: string;
	format: LayerExportFormat;
}
interface ExportLayerDialogValues extends ExportLayerValues {
	shapefileId: string;
}

const FORMATS = {
	geojson: 'GeoJSON',
	shapefile: 'Shapefile',
};

const ExportLayerSchema = yup.object().shape({
	fileName: yup
		.string()
		.required('Please enter a file name')
		.max(128, 'Cannot be longer than ${max} characters')
		.matches(/^[^\n\r#[\]*?/\\]+$/, 'Cannot contain special characters')
		.notOneOf(['.', '..'], 'Invalid file name'),
	format: yup.string().required('Please select a format').oneOf(Object.keys(FORMATS)),
});

const ExportLayerDialog = ({
	resolve,
	onHide,
	visible,
	layer,
}: DialogProps<ExportLayerDialogValues> & { layer: Layer }) => {
	const initialValues: ExportLayerValues = {
		fileName: '',
		format: 'geojson',
	};

	const {
		control,
		formState: { isValid, isSubmitted },
		handleSubmit: withFormValues,
	} = useForm({
		defaultValues: initialValues,
		mode: 'all',
		resolver: yupResolver(ExportLayerSchema),
	});

	const submit = withFormValues((values) => resolve({ shapefileId: layer._id, ...values }));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Export Layer</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					<RHFTextField control={control} label='File Name' name='fileName' required fullWidth />

					<RHFRadioGroupField
						control={control}
						options={Object.entries(FORMATS).map(([value, label]) => ({ value, label }))}
						label='Format'
						name='format'
						row
					/>
				</Stack>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' disabled={isSubmitted && !isValid} onClick={submit}>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ExportLayerDialog;
