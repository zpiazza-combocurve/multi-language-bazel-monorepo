import { ComponentType } from 'react';
import { UseQueryOptions, useQuery } from 'react-query';

import { DEFAULT_QUERY_OPTIONS, queryClient } from './query-cache';
import { getApi, postApi } from './routing';
import { arrayToRecord, createMap } from './utilities';

interface BaseHeaderType {
	type: 'string' | 'number' | 'integer' | 'percent' | 'boolean' | 'date' | 'multi-select' | 'multi-checkbox';
	primary?: boolean;
	visualization?: boolean;
}

interface StringHeaderType extends BaseHeaderType {
	type: 'string';
	static: boolean;
}

interface NumberHeaderType extends BaseHeaderType {
	type: 'number';
	min?: number;
	max?: number;
	digits?: number;
}

interface IntegerHeaderType extends BaseHeaderType {
	type: 'integer';
}

interface PercentHeaderType extends BaseHeaderType {
	type: 'percent';
}

interface BooleanHeaderType extends BaseHeaderType {
	type: 'boolean';
}

interface DateHeaderType extends BaseHeaderType {
	type: 'date';
	kind?: 'date' | 'timestamp';
}

interface MultiSelectHeaderType extends BaseHeaderType {
	type: 'multi-select';
	options?: Array<{ label: string; value: string }>;
}

interface MultiCheckboxHeaderType extends BaseHeaderType {
	type: 'multi-checkbox';
	options?: Array<{ label: string; value: string }>;
}

type HeaderType =
	| StringHeaderType
	| NumberHeaderType
	| IntegerHeaderType
	| PercentHeaderType
	| BooleanHeaderType
	| DateHeaderType
	| MultiSelectHeaderType
	| MultiCheckboxHeaderType;

export interface ProjectCustomHeader {
	_id?: string;
	name: string; // unique internal identifier within the project
	label: string; // name entered/displayed by/for a user
	headerType: HeaderType;
}

/** @note this should be what we have in the collection `project-custom-headers` */
export interface ProjectCustomHeadersConfiguration {
	project: string;
	headers: ProjectCustomHeader[];
}

/** @note this should be what we have in the collection `project-custom-headers-data` */
export interface ProjectCustomHeadersData {
	_id: string;
	well: string;
	customHeaders: Record<string, unknown>;
}

/** Get label information from project custom headers, similar to display templates well_headers */
export const getProjectHeaders = (projectHeadersDocument?: { headers?: ProjectCustomHeader[] }) =>
	arrayToRecord(projectHeadersDocument?.headers ?? [], 'name', 'label') as Record<string, string>;

/** Sets default values if missing */
const getFullHeaderType = ({ type, ...rest }) => ({ type, kind: 'date', ...rest });

/** Get type information from project custom headers, similar to display templates wells/well_header_types */
export const getProjectHeadersTypes = (projectHeadersDocument?: { headers?: ProjectCustomHeader[] }) =>
	arrayToRecord(projectHeadersDocument?.headers ?? [], 'name', ({ headerType }) => ({
		...getFullHeaderType(headerType),
		projectHeader: true,
	})) as Record<string, { type: string; projectHeader: true }>;

/** @returns The custom headers data in a similar structure to the wells collection */
export const getProjectHeadersDataMap = (projectHeadersData: ProjectCustomHeadersData[]): Map<string, object> =>
	createMap(projectHeadersData, 'well', ({ well, customHeaders }) => ({
		_id: well,
		...customHeaders,
	}));

export const getProjectCustomHeadersQueryKey = (projectId: Inpt.ObjectId<'project'> | string | undefined) => [
	'project-custom-headers',
	projectId,
];

export function getProjectCustomHeaders(
	projectId: Inpt.ObjectId<'project'> | string
): Promise<ProjectCustomHeadersConfiguration | undefined> {
	return getApi(`/project-custom-headers/${projectId}`);
}

/** Will return the project custom headers document with no processing at all */
export function useProjectCustomHeadersQuery<T = ProjectCustomHeadersConfiguration | undefined>(
	projectId: Inpt.ObjectId<'project'> | string | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: UseQueryOptions<ProjectCustomHeadersConfiguration | undefined, any, T, any>
) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return useQuery(getProjectCustomHeadersQueryKey(projectId), () => getProjectCustomHeaders(projectId!), {
		...options,
		enabled: !!((options?.enabled ?? true) && projectId),
	});
}

export function useRawProjectHeaders(projectId: string | undefined) {
	const { isLoading, isSuccess, data } = useProjectCustomHeadersQuery(projectId);

	const hasProjectHeaders = isSuccess && !!data?.headers?.length;

	return { isLoading, isSuccess, hasProjectHeaders, projectHeaders: data };
}

export function extractProjectCustomHeadersInfo(projectHeaders: ProjectCustomHeadersConfiguration | undefined) {
	if (!projectHeaders) {
		return { projectHeaders: {}, projectHeadersTypes: {}, hasProjectHeaders: false };
	}
	return {
		projectHeaders: getProjectHeaders(projectHeaders),
		projectHeadersTypes: getProjectHeadersTypes(projectHeaders),
		hasProjectHeaders: true,
	};
}

/** Will return the project custom headers in a similar format to the wellHeaders and will provide types */
export function useProjectHeadersQuery(
	projectId: Inpt.ObjectId<'project'> | string | undefined,
	additionalOptions?: UseQueryOptions<
		ProjectCustomHeadersConfiguration | undefined,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		any,
		ReturnType<typeof extractProjectCustomHeadersInfo>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		any
	>
) {
	return useProjectCustomHeadersQuery(projectId, {
		...additionalOptions,
		select: (projectHeaders) => extractProjectCustomHeadersInfo(projectHeaders),
	});
}

export function prefetchProjectHeadersQuery(projectId: string) {
	return queryClient.prefetchQuery(
		getProjectCustomHeadersQueryKey(projectId),
		() => getProjectCustomHeaders(projectId),
		DEFAULT_QUERY_OPTIONS
	);
}

export interface RawProjectHeadersProps {
	loadingProjectHeaders: boolean;
	projectHeadersLoaded: boolean;
	hasProjectHeaders: boolean;
	projectHeaders?: ProjectCustomHeadersConfiguration;
}

export function withRawProjectHeaders<P extends { project?; altProject? }>(
	Component: ComponentType<P & RawProjectHeadersProps>
) {
	return function WrappedComponent({ project, altProject, ...rest }: P) {
		const actualProject = altProject === undefined ? project : altProject;

		const { isLoading, isSuccess, hasProjectHeaders, projectHeaders } = useRawProjectHeaders(actualProject?._id);

		const newProps = {
			project,
			altProject,
			...rest,
			loadingProjectHeaders: isLoading,
			projectHeadersLoaded: isSuccess,
			hasProjectHeaders,
			projectHeaders,
		} as P & RawProjectHeadersProps;

		return <Component {...newProps} />;
	};
}

export function getProjectCustomHeadersData(projectId: string, wellIds: string[]): Promise<ProjectCustomHeadersData[]> {
	return postApi(`/project-custom-headers/${projectId}/getData`, { wells: wellIds });
}

export function useProjectHeadersDataMap(
	projectId: string | undefined,
	wellIds: string[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	additionalOptions?: UseQueryOptions<ProjectCustomHeadersData[], any, Map<string, object>, any>
) {
	return useQuery(
		['project-custom-headers-data', projectId, wellIds],
		() => getProjectCustomHeadersData(projectId as string, wellIds),
		{ select: getProjectHeadersDataMap, enabled: !!projectId, ...additionalOptions }
	);
}

export function prefetchProjectHeadersDataMap(projectId: string, wellIds: string[]) {
	return queryClient.prefetchQuery(
		['project-custom-headers-data', projectId, wellIds],
		() => getProjectCustomHeadersData(projectId, wellIds),
		DEFAULT_QUERY_OPTIONS
	);
}

export function deleteProjectCustomHeaders(projectId: string, headersNames: string[]): Promise<void> {
	return postApi(`/project-custom-headers/${projectId}/deleteHeaders`, { headers: headersNames });
}

export function updateProjectCustomHeadersConfiguration(
	projectId: string,
	data: { newHeaders: ProjectCustomHeader[]; modifiedHeaders: Record<string, Partial<ProjectCustomHeader>> }
) {
	return postApi(`/project-custom-headers/${projectId}/updateHeadersConfiguration`, data);
}

export function updateProjectCustomHeadersData(projectId: string, data: Partial<ProjectCustomHeadersData>[]) {
	return postApi(`/project-custom-headers/${projectId}/setData`, { data });
}
