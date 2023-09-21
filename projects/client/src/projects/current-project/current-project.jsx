import { ModuleNavigation } from '@/helpers/Navigation';
import { FeatureIcons } from '@/helpers/features';
import { usePagePath } from '@/helpers/routing';
import WithNotFound from '@/not-found/WithNotFound';
import { useCurrentProject } from '@/projects/api';

import { projectRoutes } from '../routes';
import { ManageWells } from './ManageWells';
import { ProjectAccess } from './ProjectAccess';
import ProjectSettings from './ProjectSettings';
import Summaries from './Summaries';
import ShareableCodes from './shareable-codes/ShareableCodes';

function CurrentProject() {
	const { project, updateProject } = useCurrentProject();
	const { pageTabPath } = usePagePath(projectRoutes.project(project?._id).root);

	return (
		<WithNotFound noData={!project}>
			<ModuleNavigation
				default={pageTabPath('summaries')}
				pages={[
					{
						path: pageTabPath('settings'),
						icon: FeatureIcons.settings,
						label: 'Settings',
						render: (props) => <ProjectSettings {...props} />,
					},
					{
						path: pageTabPath('manage-wells'),
						icon: FeatureIcons.wells,
						label: 'Project Wells',
						render: (props) => <ManageWells {...props} />,
					},
					{
						path: pageTabPath('summaries'),
						icon: FeatureIcons.summary,
						label: 'Summaries',
						tooltipLabel: 'Project Overview',
						render: (props) => <Summaries {...props} />,
					},
					{
						path: pageTabPath('access'),
						icon: FeatureIcons.access,
						label: 'Access',
						tooltipLabel: 'Edit Project Access',
						render: (props) => <ProjectAccess {...props} />,
					},
					{
						path: pageTabPath('sharing'),
						icon: FeatureIcons.shareableCodes,
						label: 'Sharing',
						tooltipLabel: 'Sharing',
						render: (props) => <ShareableCodes {...props} />,
					},
				]}
				sharedProps={{
					wellIds: project?.wells || [],
					setProjAlfa: updateProject,
					project,
				}}
			/>
		</WithNotFound>
	);
}

export default CurrentProject;
