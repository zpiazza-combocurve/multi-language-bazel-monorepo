import _ from 'lodash';
import { useMemo } from 'react';

import { getWellHeaders } from '@/helpers/headers';
import {
	fields as EUR_UNITS,
	normalization as NORMALIZATION_UNITS,
} from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as WELL_HEADER_UNITS } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { fields as WELL_HEADER_LABELS } from '@/inpt-shared/display-templates/wells/well_headers.json';
import { fields as WELL_HEADER_LABELS_SHORT } from '@/inpt-shared/display-templates/wells/well_headers_abbreviated.json';

import { TYPE_CURVES_WELL_INFO } from './data';

const types = {
	...TYPE_CURVES_WELL_INFO,
	...WELL_HEADER_TYPES,
};

const wellInfoKeys = _.mapValues(TYPE_CURVES_WELL_INFO, 'label');

/** @deprecated Probably no longer needed */
const EUR_LABELS = { eur: 'EUR', 'eur/pll': 'EUR/PLL' };

// This object was being unintentionally modified by a function that utilized it.
//   Object frozen to prevent unintentional modifications.
const units = Object.freeze({
	...WELL_HEADER_UNITS,
	...EUR_UNITS,
	...NORMALIZATION_UNITS,
});

const getUnabbreviatedHeaders = (): Record<string, string> => ({
	...WELL_HEADER_LABELS_SHORT,
	...WELL_HEADER_LABELS,
	...getWellHeaders(),
	...wellInfoKeys,
	...EUR_LABELS,
});

const getAbbreviatedHeaders = (): Record<string, string> => ({
	...WELL_HEADER_LABELS,
	...getWellHeaders(),
	...WELL_HEADER_LABELS_SHORT,
	...wellInfoKeys,
	...EUR_LABELS,
});

const getDiagnosticsHeaders = (): Record<string, string> => ({
	...WELL_HEADER_LABELS,
	...getWellHeaders(),
	...WELL_HEADER_LABELS_SHORT,
});

export const getAbbreviatedHeaderLabel = (key: string): string => getAbbreviatedHeaders()[key];

export const getHeaderLabel = (key: string): string => getUnabbreviatedHeaders()[key];

export const getHeaderUnit = (key: string): string => units[key];

const keys = Object.keys(getUnabbreviatedHeaders());

export function getHeaders({ abbreviated = true, diagnostics = false } = {}): {
	keys: string[];
	headers: Record<string, string>;
	units: Readonly<Record<string, string | never>>;
	getLabel: (key: string) => string;
	getUnit: (key: string) => string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	types: Record<string, any>;
} {
	let headers: Record<string, string>;
	if (diagnostics) {
		headers = getDiagnosticsHeaders();
	} else if (abbreviated) {
		headers = getAbbreviatedHeaders();
	} else {
		headers = getUnabbreviatedHeaders();
	}
	return {
		keys,
		headers,
		units,
		getLabel: abbreviated ? getAbbreviatedHeaderLabel : getHeaderLabel,
		getUnit: getHeaderUnit,
		types,
	};
}

export const useHeaders = ({ abbreviated = true, diagnostics = false } = {}) =>
	useMemo(() => getHeaders({ abbreviated, diagnostics }), [abbreviated, diagnostics]);
