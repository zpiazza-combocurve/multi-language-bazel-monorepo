import { useAbility } from '@casl/react';
import { useMutation, useQuery } from 'react-query';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { Button } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import { useCurrentProject } from '@/projects/api';

import NewLayerDialog from './NewLayerDialog';

interface ShapefileData {
	file: Inpt.ObjectId<'file'>;
	name: string;
	description: string;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
	scope: string;
	tileset: string;
}

const NewLayer = ({ currentLayers }) => {
	const { project } = useCurrentProject();
	const { data: projectsData } = useQuery(['projects'], () => getApi('/projects/withName', { limit: 100000 }));
	const projects = projectsData?.items ?? (project ? [project] : []);

	const ability = useAbility(AbilityContext);
	const projectsAllowed = projects.filter(({ _id }) =>
		ability.can(ACTIONS.Create, subject(SUBJECTS.ProjectShapefiles, { _id: null, projectIds: [_id] }))
	);
	const canCreateShapefile = ability.can(ACTIONS.Create, SUBJECTS.CompanyShapefiles) || projectsAllowed.length > 0;

	const [newLayerDialog, promptNewLayerDialog] = useDialog(NewLayerDialog, {
		currentLayers,
		projects: projectsAllowed,
	});

	const uploadFileMutation = useMutation((shapefileData: ShapefileData) => postApi('/shapefiles/', shapefileData));
	useLoadingBar(uploadFileMutation.isLoading);

	const openNewLayerDialog = async () => {
		const results = await promptNewLayerDialog();

		if (!results) {
			return;
		}

		const { file, name, description, color, projectIds, scope } = results;

		const sanitizedFileName = file.name.replace(/[^\w-]|_/g, '-').substr(0, 7);

		const tileset = `devadmin.${
			sanitizedFileName !== '' ? `${sanitizedFileName}${new Date().getUTCMilliseconds().toString()}` : 'newLayer'
		}`;

		await uploadFileMutation.mutateAsync({
			file: file._id as Inpt.ObjectId<'file'>,
			name,
			description,
			color,
			projectIds,
			scope,
			tileset,
		});
	};

	return (
		<>
			<Button
				onClick={openNewLayerDialog}
				color='primary'
				disabled={!canCreateShapefile && PERMISSIONS_TOOLTIP_MESSAGE}
			>
				Add Layer
			</Button>
			{newLayerDialog}
		</>
	);
};

export default NewLayer;
