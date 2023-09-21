import _ from 'lodash-es';
import { useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { DropBoxFileInput, SelectList } from '@/components';
import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, alerts } from '@/components/v2';
import { ProjectForecastItem } from '@/forecasts/types';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { sanitizeFile } from '@/helpers/fileHelper';
import { downloadFile, postApi, uploadFile } from '@/helpers/routing';
import { fullNameAndLocalDate } from '@/helpers/user';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { useCurrentProject } from '@/projects/api';

import { useProjectForecastIndex } from './api';

const Container = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(calc(50% - 0.5rem), 1fr));
	gap: 1rem;
`;

export function ImportFromCSVDialog({ visible, onHide, runFilters }) {
	const { project } = useCurrentProject();
	const [file, setFile] = useState<File | null | undefined>(null);
	const forecastsQuery = useProjectForecastIndex(project?._id);
	const [selectedForecast, setForecast] = useState<ProjectForecastItem | null>(null);

	const [identifier, setIdentifier] = useState(DEFAULT_IDENTIFIER);

	const isInvalid = !file;
	const { isLoading: isSubmitting, mutateAsync: submitForm } = useMutation(async () => {
		if (!file) {
			return;
		}
		const sanitizedFile = sanitizeFile(file);
		const fileDoc = await uploadFile(sanitizedFile, undefined, project?._id);
		const response:
			| { success: true; file_id?: string; has_error: boolean }
			| { success: false; error_message: string } = await postApi('/type-curve/import-fit-parameters', {
			projectId: project?._id,
			forecastId: selectedForecast?._id,
			fileId: fileDoc?._id,
			identifier,
		});
		if (response.success) {
			runFilters();
			confirmationAlert('Typecurves parameters successfully imported.');
			if (response.file_id) {
				if (
					await alerts.confirm(
						response.has_error
							? {
									title: 'Failed Importing Type Curve Fits',
									children: 'Download the error file to see the details.',
									confirmText: 'Download',
							  }
							: {
									title: 'Successfully Imported Type Curve Fits',
									children: 'Some wells have warnings. Download the file to see the details.',
									confirmText: 'Download',
							  }
					)
				) {
					await downloadFile(response.file_id);
				}
			}
			onHide();
		} else {
			failureAlert(response.error_message);
		}
	});

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='md'>
			<DialogTitle>Import Type Curve Parameters</DialogTitle>
			<DialogContent>
				<Container>
					<div>
						<ul>
							<li>Selected input well forecasts will be assigned to all newly generated type curves</li>
							<li>Existing type curves will not have their input forecast wells modified</li>
							<li>
								Updating forecast parameters will not automatically reassign type curves to output well
								forecasts
							</li>
							<li>Wells in the import file will be kept only when it is in the forecast</li>
							<li>
								If provide a list of wells, all representative wells and normalization multipliers will
								be reset to default.
							</li>
						</ul>
						<DropBoxFileInput
							label='Type Curve Imports'
							onChange={(files) => setFile(files?.[0])}
							disabled={isSubmitting}
							accept='.csv'
							fullWidth
						/>
						<WellIdentifierSelect value={identifier} onChange={setIdentifier} />
					</div>
					<SelectList
						label='Input Well Forecasts'
						value={selectedForecast}
						onChange={setForecast}
						listItems={forecastsQuery.data?.map((forecast) => ({
							key: forecast?._id,
							value: forecast,
							primaryText: _.truncate(forecast.name, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }),
							secondaryText: fullNameAndLocalDate(forecast.user, forecast.createdAt),
						}))}
					/>
				</Container>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' disabled={isSubmitting || isInvalid} onClick={() => submitForm()}>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
}
