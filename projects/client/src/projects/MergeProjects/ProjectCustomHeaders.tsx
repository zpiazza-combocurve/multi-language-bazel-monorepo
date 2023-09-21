import { useCallback } from 'react';

import { Button, List, Typography } from '@/components/v2';
import { ProjectCustomHeader as PCHModel } from '@/helpers/project-custom-headers';
import { pluralize } from '@/helpers/text';

import ProjectCustomHeader from './ProjectCustomHeader';
import { getMergedCustomHeaderPartUniqueKey } from './helpers';
import styles from './merge-projects.module.scss';
import { ProjectToMergeModel } from './models';

const ProjectCustomHeaders = ({
	project,
	onAddMergedCustomHeaders,
	usedInMergeHeaders,
	headerKeysToHighlight,
}: {
	project: ProjectToMergeModel;
	onAddMergedCustomHeaders: (projectId: string, header: PCHModel | null) => void;
	usedInMergeHeaders: { key: string; color: string }[];
	headerKeysToHighlight: string[];
}) => {
	const addHeader = useCallback(
		(header: PCHModel | null) => {
			onAddMergedCustomHeaders(project.project._id, header);
		},
		[onAddMergedCustomHeaders, project]
	);

	const headers = project.customHeaders.map((h) => {
		const key = getMergedCustomHeaderPartUniqueKey(project.project._id, h.name);
		const used = usedInMergeHeaders.find((uq) => uq.key === key);

		const highlighted = headerKeysToHighlight.indexOf(key) > -1;

		return {
			used: !!used,
			node: (
				<ProjectCustomHeader
					key={h._id}
					data={h}
					projectId={project.project._id}
					projectName={project.project.name}
					onAddHeader={addHeader}
					used={!!used}
					color={used?.color}
					highlighted={highlighted}
				/>
			),
		};
	});

	const allUsed = !headers.find((h) => !h.used);

	return (
		<>
			<div className={styles['header-header']}>
				<Typography css='font-weight: bold; font-size: 14px;'>
					{project.project.name} ({pluralize(project.customHeaders.length, 'header', 'headers')})
				</Typography>
				<Button disabled={allUsed} onClick={() => addHeader(null)}>
					Bring All
				</Button>
			</div>
			<List>{headers.map((q) => q.node)}</List>
		</>
	);
};

export default ProjectCustomHeaders;
