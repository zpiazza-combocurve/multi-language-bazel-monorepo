import _ from 'lodash';
import { useCallback, useState } from 'react';

import { getApi } from '@/helpers/routing';

export const DT_QUERY_BASE = 'display-template';

export type ListType = 'unique' | 'project';

export type Assumption = Assign<Inpt.Assumption, { createdBy: Inpt.User }>;

const emptySelection = (tableKeys: string[] = []) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	_.transform<string, Record<string, any>>(
		tableKeys ?? [],
		(acc, value) => {
			acc[value] = null;
		},
		{}
	);

export function useTableSelection(tableKeys: string[]) {
	const [selected, setSelected] = useState(() => emptySelection(tableKeys));

	const onSelect = useCallback(
		(key, sel) => {
			setSelected({ ...emptySelection(tableKeys), [key]: sel });
		},
		[tableKeys]
	);

	return { selected, onSelect };
}

export async function getModelsList({
	assumptionKey,
	project,
	listType,
	search: unsanitizedSearch,
	wellAssignment,
	initialModelId,
	startAt = 0,
	limit,
	omitSelectedModel = false,
}: {
	assumptionKey: string;
	listType: ListType;
	wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild;
	search?: string;
	initialModelId?: string;
	startAt?: number;
	limit?: number;
	project?: Assign<Inpt.Project, { createdBy: Inpt.User }>;
	omitSelectedModel?: boolean;
}) {
	const search = unsanitizedSearch?.trim() ?? '';

	const models = await getApi(
		`/cost-model/searchModels`,
		_.pickBy(
			{
				unique: listType === 'unique' && !!wellAssignment?.well?._id,
				project: project?._id,
				assumptionKey,
				selectedModelId: initialModelId,
				omitSelectedModel,
				search: search?.trim() ?? '',
				skip: startAt,
				limit,
				well: wellAssignment?.well?._id,
			},
			(value) => value != null
		)
	);

	return models ?? [];
}

export async function getModelsCount({
	assumptionKey,
	listType,
	search: unsanitizedSearch,
	wellAssignment,
	project,
}: {
	assumptionKey: string;
	listType: ListType;
	wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild;
	search?: string;
	project?: Assign<Inpt.Project, { createdBy: Inpt.User }>;
}) {
	const search = unsanitizedSearch?.trim() ?? '';

	const count = await getApi(
		`/cost-model/searchModels/totalCount`,
		_.pickBy(
			{
				unique: listType === 'unique' && !!wellAssignment?.well?._id,
				listType,
				search,
				project: project?._id,
				assumptionKey,
			},
			(value) => value !== undefined
		)
	);

	return count;
}
