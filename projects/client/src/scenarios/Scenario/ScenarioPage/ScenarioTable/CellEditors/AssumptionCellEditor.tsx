import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { getModelsList } from '@/cost-model/detail-components/shared';
import { getApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { useCurrentProjectId } from '@/projects/routes';
import { FreeSoloCellEditor } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/FreeSoloCellEditor';
import { ValueFormatter } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/shared';

const CHOOSE_MODEL = 'Choose Model';
const REMOVE_ASSIGNMENT = 'Remove Assignment';
const NOT_MODELS = [CHOOSE_MODEL, REMOVE_ASSIGNMENT];

const SEPARATOR = 'SEPARATOR';

function filterByName(items, search) {
	return items.filter(({ name }) => (name as string).match(search));
}

const PSERIES_OPTIONS = [
	{ _id: 'best', name: 'best' },
	{ _id: 'P10', name: 'P10' },
	{ _id: 'P50', name: 'P50' },
	{ _id: 'P90', name: 'P90' },
];

function useModels(assumptionKey, search, wellAssignment, initialModelId) {
	const wellId = wellAssignment.well;
	const projectId = useCurrentProjectId();
	const getItems = async () => {
		if (assumptionKey === AssumptionKey.forecast) return filterByName(wellAssignment.forecasts, search);
		if (assumptionKey === AssumptionKey.schedule) {
			return filterByName(await getApi('/schedules/getWellSchedules', { projectId, wellId }), search);
		}
		if (assumptionKey === AssumptionKey.forecastPSeries) return filterByName(PSERIES_OPTIONS, search);
		return getModelsList({
			assumptionKey,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			project: { _id: projectId } as any,
			listType: 'project',
			search,
			wellAssignment: { ...wellAssignment, well: { _id: wellId } },
			initialModelId,
			omitSelectedModel: true,
		});
	};
	const { data: modelsList } = useQuery<[]>(
		[
			'econ-model',
			'models-list',
			{ projectId, assumptionKey, wellId, listType: 'project', initialModelId, search },
		],
		getItems,
		{ keepPreviousData: true, placeholderData: [] }
	);

	return modelsList;
}

function useUniqueModels(assumptionKey, search, wellAssignment, initialModelId) {
	const wellId = wellAssignment.well;
	const projectId = useCurrentProjectId();
	const getItems = async () => {
		if ([AssumptionKey.forecast, AssumptionKey.schedule, AssumptionKey.forecastPSeries].includes(assumptionKey))
			return [];
		return getModelsList({
			assumptionKey,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			project: { _id: projectId } as any,
			listType: 'unique',
			search,
			wellAssignment: { ...wellAssignment, well: { _id: wellId } },
			initialModelId,
			omitSelectedModel: true,
		});
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { data: modelsList } = useQuery<any[]>(
		['econ-model', 'models-list', { projectId, assumptionKey, wellId, listType: 'unique', initialModelId, search }],
		getItems,
		{ keepPreviousData: true, placeholderData: [] }
	);

	return modelsList;
}

export const AssumptionCellEditor = forwardRef((props: ICellEditorParams, ref: ForwardedRef<ICellEditor>) => {
	const [search, setSearch] = useState('');

	const assumptionKey = props.column.getColId();
	const initialModelId = props.value?.model?._id;
	const isGroupCase = props.data.isGroupCase;

	const { lookupTables, tcLookupTables } = props.context;

	const modelsList = useModels(assumptionKey, search, props.data, initialModelId);
	const uniqueModelsList = useUniqueModels(assumptionKey, search, props.data, initialModelId);
	const filteredLookups = useMemo(() => filterByName(lookupTables, search), [lookupTables, search]);

	const filteredTcLookups = useMemo(
		() => filterByName(assumptionKey === AssumptionKey.forecast ? tcLookupTables : [], search),
		[tcLookupTables, search, assumptionKey]
	);

	assert(modelsList);
	assert(uniqueModelsList);

	const items = useMemo(
		() => [
			...modelsList.map((model) => ({ model })),
			...uniqueModelsList.map((model) => ({ model })),
			...filteredLookups.map((lookup) => ({ lookup })),
			...filteredTcLookups.map((tcLookup) => ({ tcLookup })),
		],
		[modelsList, uniqueModelsList, filteredLookups, filteredTcLookups]
	);

	return (
		<FreeSoloCellEditor
			ref={ref}
			{...props}
			parseValue={(value) => {
				if (NOT_MODELS.includes(value)) return value;
				const item = items.find((v) => v[Object.keys(v)[0]].name === value) ?? value;
				if (!!item.model && assumptionKey === AssumptionKey.forecastPSeries) return { model: item.model.name };
				return item;
			}}
			value={props?.value}
			options={[
				CHOOSE_MODEL,
				REMOVE_ASSIGNMENT,
				...(items?.length && !isGroupCase ? [SEPARATOR] : []),
				...(isGroupCase ? [] : items),
			]}
			formatValue={(value) => {
				return value[Object.keys(value)[0]]?.name ?? value ?? '';
			}}
			onChange={setSearch}
			getOptionDisabled={(value) => {
				if (value === 'SEPARATOR') return true;
				return false;
			}}
			renderOption={(value) => {
				if (value === 'SEPARATOR')
					return (
						<div
							css={`
								border-top: 1px solid black;
								width: calc(100% + 2rem);
								margin: 0 -1rem;
							`}
						/>
					);
				const type = Object.keys(value)[0];
				const name = value?.[type]?.name;
				if (!type || !name) return value;
				return <ValueFormatter value={value} type='assumption' />;
			}}
		/>
	);
});
