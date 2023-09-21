import { useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { DropBoxFileInput, SelectList } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, alerts } from '@/components/v2';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { sanitizeFile } from '@/helpers/fileHelper';
import { downloadFile, postApi, uploadFile } from '@/helpers/routing';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { useCurrentProject } from '@/projects/api';

const Container = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(calc(50% - 0.5rem), 1fr));
	gap: 1rem;
`;

const ALLOWED_ASSUMPTIONS_ON_IMPORT = [
	AssumptionKey.ownershipReversion,
	AssumptionKey.reservesCategory,
	AssumptionKey.expenses,
	AssumptionKey.capex,
	AssumptionKey.streamProperties,
	AssumptionKey.pricing,
	AssumptionKey.differentials,
	AssumptionKey.dates,
	AssumptionKey.risking,
	AssumptionKey.productionTaxes,
	AssumptionKey.escalation,
	AssumptionKey.fluidModel,
	AssumptionKey.emission,
];

const getAssumptionOptions = () => {
	return Object.entries(ASSUMPTION_LABELS).reduce(
		(arr, [assumptionKey, assumptionName]) =>
			ALLOWED_ASSUMPTIONS_ON_IMPORT.includes(assumptionKey)
				? [
						...arr,
						{
							key: assumptionKey,
							value: assumptionKey,
							primaryText: assumptionName,
						},
				  ]
				: arr,
		[]
	);
};

// disableImport={(value) => SetState({ disableImportFromCSV: value })} // TODO why do we need this?
// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
export function ImportFromCSVDialog({ visible, close, onHide = close, disableImport = () => {}, runFilters }) {
	const [file, setFile] = useState(null);
	const [selectedAssumptionKey, setAssumptionKey] = useState(null);
	const isInvalid = !file || !selectedAssumptionKey;

	const { project } = useCurrentProject();

	const { isLoading: isSubmitting, mutateAsync: submitForm } = useMutation(async () => {
		if (!file || !selectedAssumptionKey) {
			return;
		}
		disableImport(true);
		onHide();
		const sanitizedFile = sanitizeFile(file);
		const fileDoc = await uploadFile(sanitizedFile, undefined, project?._id);
		const response = await postApi('/cost-model/modelsImport', {
			projectId: project._id,
			assumptionKey: selectedAssumptionKey,
			fileId: fileDoc?._id,
		});
		if (response.success) {
			confirmationAlert('Econ models successfully imported.');
			if (response.file_id) {
				if (
					await alerts.confirm({
						title: 'Error Importing Econ Models',
						children:
							'There are some errors associated with your import, do you want to download the list of errors?',
						confirmText: 'Download',
					})
				) {
					await downloadFile(response.file_id);
				}
			}
		} else {
			failureAlert(response.message);
		}
		runFilters();
		disableImport(false);
		setFile(null);
	});

	return (
		<Dialog maxWidth='sm' fullWidth onClose={onHide} open={visible}>
			<DialogTitle>Import Econ Models</DialogTitle>
			<DialogContent>
				<Container>
					<SelectList
						label='Select Econ Model'
						value={selectedAssumptionKey}
						onChange={setAssumptionKey}
						listItems={getAssumptionOptions}
					/>
					<div>
						<DropBoxFileInput
							label='Econ Model Imports'
							onChange={(files) => setFile(files?.[0])}
							disabled={isSubmitting}
							accept='.csv'
							fullWidth
						/>
					</div>
				</Container>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onHide();
						setFile(null);
					}}
				>
					Cancel
				</Button>
				<Button color='primary' disabled={isSubmitting || isInvalid} onClick={submitForm}>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
}
