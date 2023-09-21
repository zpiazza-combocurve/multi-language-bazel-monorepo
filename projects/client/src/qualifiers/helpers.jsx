import { AssumptionKey } from '@/inpt-shared/constants';

import { getAutoIncrementedName } from '../helpers/utilities';

const getQuarter = (date = new Date()) => Math.trunc(date.getMonth() / 3) + 1;

const createBase = (prefix, date = new Date()) => `${prefix}_${date.getFullYear()}_Q${getQuarter(date)}`;

const COLUMN_PREFIX = {
	[AssumptionKey.forecastPSeries]: 'PSER',
};

function generateDefaultName(column, qualifiers) {
	const prefix =
		COLUMN_PREFIX[column] ||
		column
			.replace(/[^a-zA-z0-9]/g, '')
			.toUpperCase()
			.substr(0, 4);
	const base = createBase(prefix);
	const existingNames = qualifiers.map(({ name }) => name);

	return getAutoIncrementedName(base, existingNames, '_');
}

export { generateDefaultName };
