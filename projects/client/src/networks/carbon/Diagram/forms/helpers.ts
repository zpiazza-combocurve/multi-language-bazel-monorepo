import { add as addDate, format as formatDate, set as setDate, sub as subDate } from 'date-fns';
import { useMemo } from 'react';

import { useCustomWellHeaderNames } from '@/company/CustomColumnsRename/well-headers';
import { parseKnownDateFormats } from '@/helpers/dates';

import { TIME_SERIES_INPUT_STANDARDS } from './shared';

export const getNextMonth = (date: string | Date, format?: string) => {
	const parsedDate = date instanceof Date ? date : parseKnownDateFormats(date);
	const result = parsedDate ? addDate(parsedDate, { months: 1 }) : setDate(new Date(Date.now()), { date: 1 });
	return formatDate(result, format ?? TIME_SERIES_INPUT_STANDARDS.output_date_format);
};

export const getPreviousMonth = (date: string | Date, format?: string) => {
	const parsedDate = date instanceof Date ? date : parseKnownDateFormats(date);
	const result = parsedDate ? subDate(parsedDate, { months: 1 }) : setDate(new Date(Date.now()), { date: 1 });
	return formatDate(result, format ?? TIME_SERIES_INPUT_STANDARDS.output_date_format);
};

export const getPreviousDay = (date: string | Date, format?: string) => {
	const parsedDate = date instanceof Date ? date : parseKnownDateFormats(date);
	const result = parsedDate ? subDate(parsedDate, { days: 1 }) : new Date(Date.now());
	return formatDate(result, format ?? TIME_SERIES_INPUT_STANDARDS.output_date_format);
};

export function useCustomDateHeaders() {
	const headerData = useCustomWellHeaderNames();
	const customDateHeaders = useMemo<Record<string, string>>(
		() =>
			headerData.columns.date.fields.reduce(
				(prev, cur) => ({
					...prev,
					[cur]: headerData.columnNames[cur],
				}),
				{}
			),
		[headerData]
	);

	return customDateHeaders;
}
