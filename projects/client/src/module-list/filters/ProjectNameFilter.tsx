import { useContext } from 'react';

import { Box, CheckboxField, TextField } from '@/components/v2';
import { useCurrentProject } from '@/projects/api';

import { FiltersContext } from './shared';

export default function ProjectNameFilter({ name = 'project', exactMatchName = 'projectExactMatch' }) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;
	const { project } = useCurrentProject();

	const isFilteredByCurrentProject = project?.name === filters[name];

	return (
		<>
			<TextField
				label='Project Name'
				value={filters[name] ?? ''}
				onChange={(ev) => setFilters({ [name]: ev.target.value })}
				nativeOnChange
				fullWidth
			/>

			{project && (
				<Box display='block'>
					<CheckboxField
						checked={isFilteredByCurrentProject}
						onChange={() =>
							setFilters({
								[name]: isFilteredByCurrentProject ? '' : project?.name,
								[exactMatchName]: !isFilteredByCurrentProject,
							})
						}
						label={isFilteredByCurrentProject ? 'Clear Project Filter' : 'Filter By Current Project'}
					/>
				</Box>
			)}

			<Box display='block'>
				<CheckboxField
					checked={!!filters[exactMatchName]}
					onChange={(ev) => setFilters({ [exactMatchName]: ev.target.checked })}
					label='Match Exact Project Name'
				/>
			</Box>
		</>
	);
}
