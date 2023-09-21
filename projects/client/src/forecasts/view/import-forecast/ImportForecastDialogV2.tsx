import { makeStyles } from '@material-ui/core/styles';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider } from '@/components/v2';
import { customErrorAlert, genericErrorAlert } from '@/helpers/alerts';
import { DialogLikeProps } from '@/helpers/dialog';
import { uploadFiles } from '@/helpers/files-upload';
import { postApi } from '@/helpers/routing';
import { useCurrentProject } from '@/projects/api';

import ImportForm, { FormValues } from './ImportForm';

// import ValidationPage from './ValidationPage';

const useStyles = makeStyles({
	dialogPaper: {
		minHeight: '680px',
		maxHeight: '90vh',
	},
});

const initialFormValues = {
	source: 'combocurve',
	resolution: 'monthly',
	wellIdentifier: 'inptID',
};

interface ImportForecastDialogV2Props {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecast: Record<string, any>;
}

const ImportForecastDialogV2 = ({
	forecast,
	onHide,
	resolve: _resolve,
	visible,
}: ImportForecastDialogV2Props & DialogLikeProps) => {
	const track = useTrackAnalytics();
	const { project } = useCurrentProject();
	const classes = useStyles();
	const [file, setFile] = useState<File | null | undefined>(null);
	const [extensionError, setExtensionError] = useState<string | null>(null);
	const { control, reset, watch } = useForm<FormValues>({
		defaultValues: initialFormValues,
	});
	const formValues = watch();

	const handleClose = () => {
		setFile(null);
		setExtensionError(null);
		reset();
		onHide?.();
	};

	const [activeStep] = useState(0);

	const startImport = () => {
		if (!file) {
			return;
		}

		track(EVENTS.forecast.importForecast, { source: formValues.source, forecastResolution: formValues.resolution });

		uploadFiles({
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			files: [file],
			removeOnComplete: true,
			onSuccess: async ({ saved }) => {
				const fileId = saved[0]._id;
				postApi(`/forecast/import-cc-forecast/${forecast._id}`, {
					fileId,
					forecastName: forecast.name,
					dataFreq: formValues.resolution,
					source: formValues.source,
					well_identifier: formValues.wellIdentifier,
				})
					.then(() => {
						handleClose();
					})
					.catch((error) => {
						genericErrorAlert(error);
					});
			},
			onFailure: async ({ message }) => {
				customErrorAlert(message);
				return false;
			},
			project: project?._id,
		});
	};

	const viewComponent = useMemo(() => {
		const views = [
			<ImportForm
				extensionError={extensionError}
				file={file}
				fileSource={formValues.source}
				key='form'
				control={control}
				setExtensionError={setExtensionError}
				setFile={setFile}
			/>,
			// <ValidationPage key='validation' />,
		];
		return views[activeStep];
	}, [activeStep, control, extensionError, file, formValues.source]);

	return (
		<Dialog classes={{ paper: classes.dialogPaper }} onClose={handleClose} open={Boolean(visible)} fullWidth>
			<DialogTitle>Import Forecast Parameters</DialogTitle>
			<DialogContent>
				<Divider />
				{viewComponent}
			</DialogContent>
			<DialogActions>
				<Button color='secondary' onClick={handleClose}>
					Cancel
				</Button>

				<Button
					color='secondary'
					//ts-expect-error
					disabled={!file || !!extensionError}
					onClick={startImport}
					variant='contained'
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default ImportForecastDialogV2;
