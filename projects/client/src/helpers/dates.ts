import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { isValid, parse } from 'date-fns';
import _ from 'lodash';

// Checks that the argument is a date but not Invalid Date
export const isValidDate = (date): date is Date => _.isDate(date) && !Number.isNaN(date.getTime());

export const toLocalDate = (date: string | Date | null | undefined, defaultValue = 'N/A') => {
	if (date === undefined || date === null) {
		return defaultValue;
	}

	const parsedDate = typeof date === 'string' ? new Date(date) : date;
	return isValidDate(parsedDate) ? parsedDate.toLocaleDateString() : defaultValue;
};

export const toLocalDateTime = (date: string | Date | null | undefined, defaultValue = 'N/A') => {
	if (date === undefined || date === null) {
		return defaultValue;
	}

	const parsedDate = typeof date === 'string' ? new Date(date) : date;
	return isValidDate(parsedDate) ? parsedDate.toLocaleString() : defaultValue;
};

export const formatIdxDate = (idx) => toLocalDate(convertIdxToDate(idx));

export const DEFAULT_DATE_FORMAT = 'MM/dd/yyyy'; // 03/__/2022
export const SUPPORTED_DATE_PARSE_FORMATS = [
	"yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
	'MM/dd/yy', // 03/__/22
	DEFAULT_DATE_FORMAT,
	'MM-dd-yyyy', // 03-__-2022

	'yyyy-MM-dd', // 2022-03-01
	'yyyy/MM/dd', // 2022/03/01

	'MM-dd-yyyy', // 03-__-2022

	'MMMM/yy', // March/22
	'MMMM-yy', // March-22
	'MMM/yy', // Mar/22
	'MMM-yy', // Mar-22
	'MM/yy', // 03/22
	'MM-yy', // 03-22
	'M/yy', // 3/22
	'M-yy', // 3-22

	'MMMM/yyyy', // March/2022
	'MMMM-yyyy', // March-2022
	'MMM/yyyy', // Mar/2022
	'MMM-yyyy', // Mar-2022
	'MM/yyyy', // 03/2022
	'MM-yyyy', // 03-2022
	'M/yyyy', // 3/2022
	'M-yyyy', // 3-2022

	'MMyyyy', // 032022
];

// https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
export const parseMultipleFormats = (date: string, formats: string[]) => {
	for (const format of formats) {
		const result = parse(date, format, new Date());

		if (isValid(result)) {
			return result;
		}
	}

	return null;
};

// alias to above
export function parseKnownDateFormats(date: string) {
	return parseMultipleFormats(date, SUPPORTED_DATE_PARSE_FORMATS);
}
