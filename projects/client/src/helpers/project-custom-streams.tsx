import { useQuery } from 'react-query';

import { genericErrorAlert } from './alerts';

export interface ProjectCustomStream {
	_id?: Inpt.ObjectId<'project-custom-stream'> | string;
	name: string; // unique internal identifier within the project
	label: string; // name entered/displayed by/for a user
	unit: string; // units label entered/displayed by/for a user
	color: string; // HEX color entered/displayed by/for a user
}

/** @note this should be what we have in the collection `project-custom-streams` */
export interface ProjectCustomStreamsConfiguration {
	project: Inpt.ObjectId<'project'> | string;
	streams: ProjectCustomStream[];
}

/** @note this should be what we have in the collection `project-custom-streams-data` */
export interface ProjectCustomStreamsData {
	_id: Inpt.ObjectId<'project-custom-streams-data'> | string;
	well: Inpt.ObjectId<'well'> | string;
	customStreams: Record<string, unknown>;
}

export const CUSTOM_STREAM_COLORS = [
	'#d188dd',
	'#6c8ee5',
	'#d8316a',
	'#887a92',
	'#753ed4',
	'#812a2c',
	'#6462d5',
	'#d9c0a8',
	'#d54b98',
	'#2f4e5f',
	'#cd808e',
	'#d75a5e',
	'#371b20',
	'#529184',
	'#54436a',
	'#6f4b3f',
	'#32163c',
	'#e77c3b',
	'#304328',
	'#cc48cd',
];

// this will be deleted when API will be implemented
const missingEndpoint = () => {
	genericErrorAlert(
		{ name: 'NotImplementedError', expected: true, message: `Sorry, I'm not implemented yet :(` },
		'Not so fast...'
	);
	return Promise.resolve();
};

export const getProjectCustomStreamsQueryKey = (projectId: Inpt.ObjectId<'project'> | string) => [
	'project-custom-streams',
	projectId,
];

export function getProjectCustomStreams(
	projectId: Inpt.ObjectId<'project'> | string
): Promise<ProjectCustomStreamsConfiguration | undefined> {
	//TODO: change when endpoint will be added
	return Promise.resolve({
		project: projectId,
		streams: [],
	});
	//return getApi(`/project-custom-streams/${projectId}`);
}

/** Will return the project custom streams document with no processing at all */
export function useProjectCustomStreamsQuery(projectId: Inpt.ObjectId<'project'> | string) {
	return useQuery(getProjectCustomStreamsQueryKey(projectId), () => getProjectCustomStreams(projectId), {
		enabled: !!projectId,
	});
}

export function deleteProjectCustomStreams(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	projectId: Inpt.ObjectId<'project'> | string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	streams: string[]
): Promise<void> {
	return missingEndpoint();
	//return postApi(`/project-custom-streams/${projectId}/delete`, { streams });
}

export function updateProjectCustomStreamsConfiguration(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	projectId: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	data: { newStreams: ProjectCustomStream[]; modifiedStreams: Record<string, Partial<ProjectCustomStream>> }
) {
	return missingEndpoint();
	// return postApi(`/project-custom-streams/${projectId}/update`, data);
}
