import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { confirmationAlert, withDoggo } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { PROJECT_WELLS_LIMIT } from '@/inpt-shared/project/shared';
import { URLS } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

import { getConfirmationMessage } from '../helpers/i18n/helpers';

export default function NewProjectDialog({ visible, onHide, resolve }: DialogProps) {
	const navigate = useNavigate();
	const [wells, setWells] = useState([]);
	const [projectName, setProjectName] = useState('');

	const addWells = async () => {
		const wellsToAdd = await showWellFilter({
			type: 'add',
			totalWellsText: 'Total Wells',
			wells: 'ALL_WELLS',
			limit: PROJECT_WELLS_LIMIT,
			zIndex: 2000,
			altProject: null,
		});
		if (wellsToAdd) {
			setWells(wellsToAdd);
		}
	};

	const onCreate = async () => {
		const newProject = await withDoggo(postApi('/projects', { name: projectName, wells }));

		await withDoggo(getApi(`/projects/workProject/${newProject._id}`));

		confirmationAlert(
			getConfirmationMessage('project', 'create', 'complete', {
				projectName,
			})
		);

		resolve(true);
		navigate(URLS.project(newProject._id).summaries);
	};

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Create Project</DialogTitle>
			<DialogContent>
				<TextField
					label='Project Name'
					value={projectName}
					onChange={(ev) => setProjectName(ev.target.value)}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button onClick={addWells} color='primary'>
					Add Wells ({wells.length})
				</Button>
				<Button
					onClick={onCreate}
					color='primary'
					variant='contained'
					disabled={!projectName || !hasNonWhitespace(projectName)}
					{...getTaggingProp('project', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}
