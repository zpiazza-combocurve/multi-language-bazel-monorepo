import { convertIdxToDate } from '@combocurve/forecast/helpers';

import { unitTemplates } from '@/forecasts/shared';
import { makeUtc } from '@/helpers/date';
import { getApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { assert, formatValue } from '@/helpers/utilities';
import { phases } from '@/helpers/zing';
import { fields as wellHeadersTemplate } from '@/inpt-shared/display-templates/wells/well_headers.json';
import { getWellsProduction } from '@/manage-wells/shared/utils';

import { Sheet } from './xlsx';

const DEFAULT_FILL_VALUE = null;

const fetchWellHeaders = async (wellId: string) => getApi(`/well/getWell/${wellId}`);

/** Generates a valid header sheet */
const generateHeaderSheet = async (wellId: string, headersIn?: string[]): Promise<Sheet> => {
	const headers = headersIn ?? (await fetchWellHeaders(wellId));
	const sheet: Sheet = {
		header: ['Well Header', 'Header Value'],
		name: 'Well Headers',
		data: [],
	};

	sheet.data = Object.entries(headers).reduce((arr, [headerKey, headerValue]) => {
		// omit fields that can't be resolved to a user-readable header (e.g. _id)
		if (wellHeadersTemplate[headerKey]) {
			// TODO avoid spreading the accumulator on the reduce, possible performance issue
			return [
				...arr,
				{
					'Well Header': wellHeadersTemplate[headerKey],
					'Header Value': formatValue(headerValue),
				},
			];
		}
		return arr;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	}, [] as any[]) as any;

	return sheet;
};

/** Generates a valid production sheet */
const generateProductionSheet = async ({
	wellId,
	headers: headersIn,
	data,
	resolution,
}: {
	wellId: string;
	headers?: string[];
	data?;
	resolution?: 'monthly' | 'daily';
}) => {
	const isMonthly = resolution === 'monthly';

	// fetch values
	const headers = headersIn ?? (await fetchWellHeaders(wellId));
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const production = data?.[resolution!] ?? (await getWellsProduction([wellId], resolution!))[wellId];
	const units = isMonthly ? unitTemplates.monthlyUnitTemplate : unitTemplates.dailyUnitTemplate;

	const sheet = {
		header: [
			'Well Name',
			'INPT ID',
			'API 14',
			'Date',
			...phases.map(({ label, value }) => `${label} (${units[value]})`),
		],
		name: `${capitalize(resolution)} Production`,
		data: [],
	};

	if (production) {
		sheet.data = production.index.map((indexVal, indexIdx) => {
			const date = makeUtc(convertIdxToDate(indexVal + 1));
			assert(date);

			const year = date.getFullYear();
			const month = date.getMonth();
			const day = date.getDate();

			const datum = {
				'Well Name': headers.well_name,
				'INPT ID': headers.inptID,
				'API 14': headers.api14,
				Date: new Date(year, month, day),
			};

			phases.forEach(({ label, value }) => {
				const prodValue = production[value][indexIdx];
				datum[`${label} (${units[value]})`] = Number.isFinite(prodValue) ? prodValue : '';
			});

			return datum;
		});
	}

	return sheet;
};

export { DEFAULT_FILL_VALUE, fetchWellHeaders, generateHeaderSheet, generateProductionSheet };
