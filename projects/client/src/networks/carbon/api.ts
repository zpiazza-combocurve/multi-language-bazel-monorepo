import type { NodeModel } from '@combocurve/types/client';
import { useQuery, useQueryClient } from 'react-query';

import { getEconModelById } from '@/cost-model/detail-components/api';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import type {
	CarbonExportCSVApiBody,
	CarbonExportCSVApiResponse,
	CarbonImportCSVApiBody,
	CarbonImportCSVApiResponse,
} from '@/inpt-shared/carbon';
import { FilterResult } from '@/module-list/types';
import { useCurrentProject } from '@/projects/api';

import {
	AnyEdge,
	AnyNode,
	FacilityModuleListItem,
	NetworkModel,
	NetworkModelFacility,
	NetworkModelModuleListItem,
	NodeModelModuleListItem,
} from './types';

/** @returns Created NetworkModel id */
export function createNetworkModel(body: { name: string; project: string; nodes?: AnyNode[]; edges?: AnyEdge[] }) {
	return postApi('/network-models', body) as Promise<NetworkModel>;
}

export function deleteNetworkModel(id: string) {
	return deleteApi(`/network-models/${id}`);
}

export function getNetworkModelById(networkModelId: string) {
	return getApi(`/network-models/${networkModelId}`) as Promise<NetworkModel>;
}

export function updateNetworkModel(networkModel: Omit<NetworkModel, 'name'>) {
	return putApi(`/network-models/${networkModel._id}`, networkModel) as Promise<void>;
}

export function changeNetworkName(networkModelId: string, name: string) {
	return putApi(`/network-models/${networkModelId}/changeName`, { name }) as Promise<void>;
}

export function getNetworkModelsModuleList(params: {
	search: string;
	page: number;
	limit: number;
	sort: string;
	sortDir: number;
	getAll: boolean;
}): Promise<FilterResult<NetworkModelModuleListItem>> {
	return getApi('/network-models', params);
}

// network model facilities api
export function createNetworkModelFacility(body: {
	name: string;
	project: string;
	nodes?: AnyNode[];
	edges?: AnyEdge[];
	inputs?: AnyEdge[];
	outputs?: AnyEdge[];
}) {
	return postApi('/network-models/facilities', body) as Promise<NetworkModel>;
}

export function getNetworkModelFacilitiesModuleList(params: {
	search: string;
	page: number;
	limit: number;
	sort: string;
	sortDir: number;
	getAll: boolean;
}): Promise<FilterResult<FacilityModuleListItem>> {
	return getApi('/network-models/facilities', params);
}

async function getNetworkModelFacilities(params: { projectId: string }): Promise<NetworkModelFacility[]> {
	return getApi('/network-models/facilities-nodes', params);
}

export function getNetworkModelFacilityById(networkModelFacilityId: string) {
	return getApi(`/network-models/facilities/${networkModelFacilityId}`) as Promise<NetworkModelFacility>;
}

export function updateFacility(facility: Omit<NetworkModelFacility, 'name'>) {
	return putApi(`/network-models/facilities/${facility._id}`, facility) as Promise<void>;
}

export function changeFacilityName(networkModelId: string, name: string) {
	return putApi(`/network-models/facilities/${networkModelId}/changeName`, { name }) as Promise<void>;
}

export function requestCarbonDemo() {
	return postApi<void>('/network-models/request-demo');
}

// queries

const NETWORK_MODEL_QUERY_BASE = ['network-model'];
const NETWORK_MODEL_FACILITY_QUERY_BASE = ['facility'];

const NETWORK_MODEL_FACILITY_QUERY_KEY_BASE = [...NETWORK_MODEL_QUERY_BASE, 'facilities'];

export const networkQuery = (networkModelId: string) => ({
	queryFn: () => getNetworkModelById(networkModelId),
	queryKey: [...NETWORK_MODEL_QUERY_BASE, { networkModelId }],
});

// facility
export function useNetworkModelFacilitiesQuery() {
	const { project } = useCurrentProject();
	const queryClient = useQueryClient();

	assert(project, 'expected project');

	return {
		...useQuery([...NETWORK_MODEL_FACILITY_QUERY_KEY_BASE, 'all-facilities'], () =>
			getNetworkModelFacilities({ projectId: project._id })
		),
		invalidate: () => queryClient.invalidateQueries([...NETWORK_MODEL_FACILITY_QUERY_KEY_BASE, 'all-facilities']),
	};
}

export const facilityQuery = (facilityId: string) => ({
	queryFn: () => getNetworkModelFacilityById(facilityId),
	queryKey: [...NETWORK_MODEL_FACILITY_QUERY_BASE, { facilityId }],
});

export function useNetworkModelFacilityQuery(networkModelFacilityId: string) {
	const queryClient = useQueryClient();
	const query = facilityQuery(networkModelFacilityId);
	return {
		...useQuery(query),
		invalidate: () => queryClient.invalidateQueries(query.queryKey),
	};
}

export function deleteFacility(id: string) {
	return deleteApi(`/network-models/facilities/${id}`);
}

// NodeModel
export async function createNodeModel(
	nodeModel: Pick<NodeModel, 'type' | 'name' | 'description' | 'params' | 'project'>
) {
	return postApi<{ _id: string } & Partial<NodeModel>>('/network-models/node-models', nodeModel);
}

export function getNodeModels(params: unknown) {
	return getApi<FilterResult<NodeModelModuleListItem>>('/network-models/node-models', params);
}

export function getNodeModelById(modelId: string) {
	return getApi<NodeModel>(`/network-models/node-models/${modelId}`);
}

export async function updateNodeModel(nodeModel: Partial<NodeModel> & Pick<NodeModel, '_id'>) {
	return putApi<NodeModel>(`/network-models/node-models/${nodeModel._id}`, nodeModel);
}

export async function renameNodeModel(nodeModel: Partial<NodeModel> & Pick<NodeModel, '_id'>) {
	// TODO: Remove this after fixing API validation issue
	const { _id } = nodeModel;
	const savedModel = await getNodeModelById(_id);
	return putApi<NodeModel>(`/network-models/node-models/${nodeModel._id}`, {
		...savedModel,
		nodeModel,
	});
}

export async function deleteNodeModel(modelId: string) {
	return deleteApi(`/network-models/node-models/${modelId}`);
}

// NodeModel queries
export const nodeModelsQuery = (params: object) => ({
	queryKey: ['node-models', params],
	queryFn: () => getNodeModels(params),
});

export const nodeModelQuery = (modelId: string) => ({
	queryKey: ['node-model', modelId],
	queryFn: () => getNodeModelById(modelId),
});

// Fluid models

const FLUID_MODEL_QUERY_BASE = ['fluid-model'];

export function useFluidModelQuery(id: string | null) {
	const queryClient = useQueryClient();

	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...useQuery([...FLUID_MODEL_QUERY_BASE, { id }], () => getEconModelById(id!), {
			enabled: !!id,
		}),
		invalidate: () => queryClient.invalidateQueries([...FLUID_MODEL_QUERY_BASE, { id }]),
	};
}

// import/export csv
export function importNetworkCSV(params: CarbonImportCSVApiBody) {
	return postApi<CarbonImportCSVApiResponse>('/network-models/import-csv', params);
}

export function exportNetworkCSV(params: CarbonExportCSVApiBody) {
	return postApi<CarbonExportCSVApiResponse>('/network-models/export-csv', params);
}
