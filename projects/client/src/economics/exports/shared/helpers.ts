import {
	ADDITIONAL_ECON_COLUMNS_AGG_CF,
	ADDITIONAL_ECON_COLUMNS_BY_WELL,
	ADDITIONAL_ECON_COLUMNS_ONE_LINER,
	CUMULATIVE_ECON_COLUMNS,
} from '@/economics/Economics/shared/constants';
import { fields as economicsColumns } from '@/inpt-shared/display-templates/general/economics_columns.json';

import { ColumnsByReportTypeArgs, outputColumnType } from './types';

export const getOutputColumnsByType = (type: outputColumnType) => {
	const filteredKeys = Object.keys(economicsColumns).filter((key) => economicsColumns[key]?.options?.[type]);
	return Object.fromEntries(filteredKeys.map((key) => [key, economicsColumns[key].label]));
};

export const getColumnsByReportType = ({ reportType }: Partial<ColumnsByReportTypeArgs>) => {
	switch (reportType) {
		case 'cashflow-csv':
			return {
				...ADDITIONAL_ECON_COLUMNS_BY_WELL,
				...getOutputColumnsByType('monthly'),
				...CUMULATIVE_ECON_COLUMNS,
			};
		case 'cashflow-agg-csv': {
			// still use `monthly` to get econ columns from schema, the aggregate actually means for cum columns
			return {
				...ADDITIONAL_ECON_COLUMNS_AGG_CF,
				...getOutputColumnsByType('monthly'),
				...CUMULATIVE_ECON_COLUMNS,
			};
		}
		case 'oneLiner':
		default:
			return {
				...ADDITIONAL_ECON_COLUMNS_ONE_LINER,
				...getOutputColumnsByType('one_liner'),
			};
	}
};
