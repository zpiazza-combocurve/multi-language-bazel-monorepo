import { useContext } from 'react';

import { SelectList } from '@/components';
import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { useCurrentProject } from '@/projects/api';

import { FiltersContext } from './shared';

function ChooseProjectDialog({
	visible,
	onHide,
	resolve,
	selectedProject,
}: DialogProps<Inpt.Project> & { selectedProject: Inpt.Project }) {
	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Choose Project</DialogTitle>
			<DialogContent>
				<SelectList
					withAsyncSearch
					value={selectedProject}
					onChange={(newProject) => newProject && resolve(newProject)}
					getKey='_id'
					listItems={async (search = '') => {
						const projects = await getApi('/projects', { limit: 500, sort: 'name', search });
						return (projects?.items ?? []).map((project) => ({
							primaryText: project.name,
							value: project,
						}));
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

/** @deprecated Use `ProjectNameFilter` instead */
export default function ProjectIdFilter({ name = 'selectedProject' }) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;
	const { project } = useCurrentProject();

	const filteredProjectName = filters[name]?.name ?? '';

	const [dialog, chooseProject] = useDialog(ChooseProjectDialog);

	return (
		<>
			<TextField
				label='Project'
				value={filteredProjectName}
				onClick={async () => {
					const newProject = await chooseProject({ selectedProject: filters[name] });
					if (newProject) {
						setFilters({ [name]: newProject });
					}
				}}
				fullWidth
			/>
			{project && (
				<CheckboxField
					checked={!!filteredProjectName}
					onChange={() => setFilters({ [name]: filteredProjectName ? '' : project })}
					disabled={!project}
					label={filteredProjectName ? 'Clear Project Filter' : 'Filter By Current Project'}
				/>
			)}
			{dialog}
		</>
	);
}
