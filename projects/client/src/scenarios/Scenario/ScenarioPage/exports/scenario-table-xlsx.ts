import _ from 'lodash';

import { getWellHeaderTypes, getWellHeaders } from '@/helpers/headers';
import { postApi } from '@/helpers/routing';
import { addDateTime } from '@/helpers/timestamp';
import { formatValueForExcel } from '@/helpers/utilities';
import { exportXLSX, getColumnTypesForWellHeaders } from '@/helpers/xlsx';
import { AssumptionKey } from '@/inpt-shared/constants';
import { asyncSeries } from '@/inpt-shared/helpers/async';

const BATCH_SIZE = 500;

export async function generateXlsx({
	assumptionKeysList,
	scenario,
	wellHeaders,
	tableHeaders,
	assumptionNamesByKey,
	updateProgress,
}) {
	const wellIds: Inpt.ObjectId<'well'> = scenario.filtered || scenario.wells;

	const columnKeys = _.uniq([
		'well_name',
		...tableHeaders,
		...assumptionKeysList,
		AssumptionKey.forecast,
		AssumptionKey.schedule,
		AssumptionKey.forecastPSeries,
	]);

	const names = {
		...assumptionNamesByKey,
		...getWellHeaders(),
		well_name: 'Well',
		[AssumptionKey.forecast]: 'Forecast',
		[AssumptionKey.schedule]: 'Schedule',
		[AssumptionKey.forecastPSeries]: 'P-Series',
		[AssumptionKey.depreciation]: 'Depreciation',
		[AssumptionKey.escalation]: 'Escalation',
	};

	const columnLabels = columnKeys.map((cur) => names?.[cur] ?? cur);

	const batches = _.chunk(wellIds, BATCH_SIZE);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const csvRows: any[] = [];

	const headers = getWellHeaderTypes();

	await asyncSeries(batches, async (batch, batchIndex) => {
		const rows = await postApi(`/scenarios/${scenario._id}/scenarioTableXlsx`, {
			wellHeaders,
			assumptionKeys: assumptionNamesByKey,
			tableHeaders: ['well_name'].concat(tableHeaders).join(' '),
			wells: batch,
		});

		updateProgress(Number((((batchIndex + 1) / batches.length) * 100).toFixed(2)));

		const mappedRows = rows.map((row) => {
			return Object.keys(row).reduce((acc, cur) => {
				acc[names[cur]] = formatValueForExcel(row[cur], headers?.[cur]?.type, headers?.[cur]?.kind);
				return acc;
			}, {});
		});

		csvRows.push(...mappedRows);
	});

	const columns = getColumnTypesForWellHeaders();

	exportXLSX({
		fileName: `${addDateTime(scenario.name)}.xlsx`,
		sheets: [
			{
				data: csvRows,
				name: `${wellIds.length} Wells`,
				header: columnLabels,
				config: { columns },
			},
		],
	});
	updateProgress(null);
}
