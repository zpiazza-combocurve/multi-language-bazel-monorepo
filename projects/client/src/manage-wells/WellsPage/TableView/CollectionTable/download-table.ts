import _ from 'lodash';

import { getWellHeaderTypes } from '@/helpers/headers';
import { getProjectCustomHeadersData, getProjectHeadersDataMap } from '@/helpers/project-custom-headers';
import { createMap, formatValueForExcel } from '@/helpers/utilities';
import { exportXLSX, tableToSheet } from '@/helpers/xlsx';
import { getWellsHeaders, getWellsProduction, productionDataToTableFormat } from '@/manage-wells/shared/utils';

import { PRODUCTION_HEADER_TYPES } from './shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const createMapById = (data): Map<string, Record<string, any>> => createMap(data, '_id');

async function fetchWells(
	wellIds: string[],
	collection: 'headers' | 'monthly' | 'daily',
	{ projectId }: { projectId?: string }
) {
	const [headersMap, productionMap, customHeadersMap] = await Promise.all([
		getWellsHeaders(wellIds).then(createMapById),
		collection !== 'headers'
			? getWellsProduction(wellIds, collection).then(createMapById)
			: Promise.resolve(new Map()),
		projectId && collection === 'headers'
			? getProjectCustomHeadersData(projectId, wellIds).then(getProjectHeadersDataMap)
			: Promise.resolve(new Map()),
	]);
	return wellIds.map((id) => ({ ...productionMap.get(id), ...headersMap.get(id), ...customHeadersMap.get(id) }));
}

export async function downloadTable({
	fileName,
	wellIds,
	columns,
	resolution,
	projectId,
	types = getWellHeaderTypes(),
}: {
	fileName: string;
	wellIds: string[];
	columns: { key: string; name: string }[];
	resolution?: 'monthly' | 'daily' | undefined;
	projectId?: string;
	types?: Record<string, { type: string }>;
}) {
	const wellsData = await fetchWells(wellIds, resolution ?? 'headers', {
		projectId,
	});

	const flattenData = (
		resolution
			? wellsData
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					.flatMap((wellData) => productionDataToTableFormat(wellData as any, true, formatValueForExcel))
					.filter(Boolean)
			: wellsData
	) as Record<
		string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		any
	>[];

	const headers = {
		...types,
		project: { type: 'scope' },
		...PRODUCTION_HEADER_TYPES,
	};

	const formattedData = flattenData.map((data) =>
		_.mapValues(data, (value, key) => formatValueForExcel(value, headers?.[key]?.type, headers?.[key]?.kind))
	);

	const sheet = tableToSheet({ name: 'Wells', columns, rows: formattedData });

	const mappedColumns = _.keyBy(columns, 'key');

	sheet.config = {
		columns: Object.fromEntries(
			Object.entries(mappedColumns).map(([key, { name }]) => [name, { type: headers?.[key]?.type }])
		),
	};

	return exportXLSX({ sheets: [sheet], fileName });
}
