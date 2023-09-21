export const BASE_ASSUMPTION_CRITERIA_MAPPINGS = {
	FLAT: { label: 'Flat', value: 'entire_well_life' },
	AS_OF: { label: 'As Of', value: 'offset_to_as_of_date' },
	DATES: { label: 'Dates', value: 'dates' },
};

export const getConstantKeyFromValue = (object, value) => {
	return Object.keys(object).find((key) => object[key] === value);
};
