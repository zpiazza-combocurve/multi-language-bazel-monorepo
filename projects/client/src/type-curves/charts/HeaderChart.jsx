import { convertDateToMilli } from '@combocurve/forecast/helpers';

import { TC_EXCLUDE_HEADERS } from '../TypeCurveView/TypeCurveWellTable';
import { getHeadersKeyByType } from './shared';

const EUR = ['oil_eur', 'gas_eur', 'water_eur'];
const EUR_PLL = ['oil_eur/pll', 'gas_eur/pll', 'water_eur/pll'];
const EUR_PHASE = {
	oil_eur: 'oil',
	gas_eur: 'gas',
	water_eur: 'water',
	'oil_eur/pll': 'oil',
	'gas_eur/pll': 'gas',
	'water_eur/pll': 'water',
};

export const HEADERS = [
	...[...getHeadersKeyByType('number'), ...getHeadersKeyByType('integer')].filter(
		(key) => !TC_EXCLUDE_HEADERS.includes(key)
	),
	// eur
	...EUR,
	...EUR_PLL,
];

export const DATE_HEADERS = getHeadersKeyByType('date');
export const CATEGORICAL_HEADERS = [...getHeadersKeyByType('multi-select'), ...getHeadersKeyByType('string')];

export const getInput = (v) => v;

export const getHeaderValue = ({ wellId, header, convert, headersMap, eurMap }) => {
	const headers = headersMap?.get(wellId);
	const eurData = eurMap?.get(wellId);
	if (!headers || !eurData) {
		return null;
	}

	if (EUR.includes(header)) {
		const p = EUR_PHASE[header];
		const eur = eurData.eur[p];
		return convert(eur);
	}
	if (EUR_PLL.includes(header)) {
		if (!headers.perf_lateral_length) {
			return null;
		}
		const p = EUR_PHASE[header];
		const eur = eurData.eur[p];
		return convert(eur / headers.perf_lateral_length);
	}
	return DATE_HEADERS.includes(header) ? convertDateToMilli(headers[header]) : headers[header];
};
