import { LightFilterWellsResponseModel } from './types';

export const MAX_AMOUNT_OF_VALUES = 50000; // more than this won't necessarily break, but it will be too slow

// MongoDB's actual limit is 32764, but depending on how many wells you start with, 10000 can already cause a timeout
export const CHARACTER_WARNING_LIMIT = 10000;
export const CHARACTER_ABSOLUTE_LIMIT = 30000;

export const DEFAULT_FILTER_SETTINGS = {
	selectedHeaders: ['well_name'],
	selectedProjectHeaders: [],
};

export const DEFAULT_VIS1_HEADERS = ['well_type', 'type_curve_area', 'current_operator_alias', 'primary_product'];

export const SPECIAL_HEADERS = { scope: 'Scope', wells_collection: 'Wells Collection' };
export const SPECIAL_HEADER_TYPES = {
	scope: {
		type: 'boolean',
		options: [
			{ label: 'Project', value: true },
			{ label: 'Company', value: false },
		],
		neverNull: true,
	},
	wells_collection: {
		type: 'boolean',
		options: [
			{ label: 'Yes', value: true },
			{ label: 'No', value: false },
		],
		neverNull: true,
	},
};

export const getInitialFilters = (wells: Inpt.ObjectId<'well'> | string[] | 'ALL_WELLS' | undefined) =>
	Array.isArray(wells)
		? [
				{
					_id: 0,
					name: 'Initial wells',
					excludeAll: true,
					include: wells.length ? wells : undefined,
				},
		  ]
		: [];

export const INITIAL_FILTER_RESULT: LightFilterWellsResponseModel = {
	viewPage: [],
	headers: ['well_name'],
	byHeadersQuery: [],
	totalCount: 0,
	startIndex: 0,
	newWellsCount: 0,
};

export const getModuleNewTotalCount = ({ type, existingWells, newWellsCount }) => {
	if (type === 'remove') {
		return existingWells - newWellsCount;
	}
	if (type === 'add') {
		return existingWells + newWellsCount;
	}
	return 0;
};

export function getInitialHeaderState(type, options, neverNull) {
	const base = { type };
	const baseValue = { showNull: neverNull ? undefined : true, neverNull };

	switch (type) {
		case 'number':
		case 'integer':
		case 'date':
		case 'percent':
			return { ...base, value: { ...baseValue, start: '', end: '', exclude: false } };
		case 'multi-checkbox':
			return { ...base, value: { ...baseValue, values: new Set(), options, exclude: false } };
		case 'multi-select':
			return { ...base, value: { ...baseValue, values: new Set(), value: '', collapsed: true, exclude: false } };
		case 'boolean':
			return { ...base, value: { ...baseValue, value: 'both' } };
		default:
			return { ...base, value: { ...baseValue, value: '', exact: false, exclude: false } };
	}
}

export function getHeaderState(types) {
	const headerState = {};
	Object.keys(types).forEach((t) => {
		const { type, options, neverNull } = types[t];
		headerState[t] = getInitialHeaderState(type, options, neverNull);
	});
	return headerState;
}

export function initHeaderState(types) {
	const headerState = getHeaderState(types);
	return { headerState };
}
