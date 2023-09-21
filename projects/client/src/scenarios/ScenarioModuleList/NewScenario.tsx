import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { confirmationAlert, customErrorAlert, genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { useCurrentProject } from '@/projects/api';
import { MAX_NUMBER_OF_WELLS_IN_SCENARIO } from '@/scenarios/constants';
import { URLS } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

type IProps = DialogProps;

const NewScenario: React.FC<IProps> = ({ onHide, visible }) => {
	const { project } = useCurrentProject();
	const { set } = useAlfa(['set']);
	const navigate = useNavigate();
	const [scenarioName, setScenarioName] = useState('');
	const [wells, setWells] = useState([]);

	const handleShowWellFilter = useCallback(async () => {
		const wells = await showWellFilter({
			isFiltered: false,
			totalWells: `${project?.wells?.length} wells in Project`,
			wells: project?.wells,
			type: 'add',
		});
		if (wells) {
			setWells(wells);
		}
	}, [project?.wells]);

	const onSave = useCallback(async () => {
		if (!project || !project._id) {
			customErrorAlert('Error', 'Must Select Project');
			return;
		}

		try {
			const newScenario = await withDoggo(
				postApi('/scenarios', {
					name: scenarioName,
					projectId: project._id,
					wells,
				}),
				'Creating Scenario...'
			);

			const newScenArray = project.scenarios;
			newScenArray.push(newScenario._id);
			const updatedProject = { ...project, scenarios: newScenArray };
			set({ project: updatedProject });
			confirmationAlert('Scenario Created');

			navigate(URLS.project(newScenario.project).scenario(newScenario._id).view);
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [navigate, project, scenarioName, set, wells]);

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Create Scenario</DialogTitle>
			<DialogContent>
				<TextField
					label='Scenario Name'
					type='text'
					value={scenarioName}
					onChange={(e) => setScenarioName(e.target.value)}
					fullWidth
				/>

				{wells.length > MAX_NUMBER_OF_WELLS_IN_SCENARIO && (
					<span className='error-container'>Max Number Of Wells Is 25,000</span>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={handleShowWellFilter}>{`Add Wells (${wells.length})`}</Button>
				<Button
					disabled={
						!scenarioName ||
						!hasNonWhitespace(scenarioName) ||
						wells.length > MAX_NUMBER_OF_WELLS_IN_SCENARIO
					}
					onClick={onSave}
					color='primary'
					{...getTaggingProp('scenario', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default NewScenario;
