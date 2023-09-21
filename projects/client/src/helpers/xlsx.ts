import _ from 'lodash';
import XLSX, { WorkSheet } from 'xlsx';

import { getWellHeaderTypes, getWellHeaders } from '@/helpers/headers';
import { formatBoolean, formatDate } from '@/helpers/utilities';

interface ColumnOptions {
	width?: number;
	type: 'date' | 'number' | 'boolean' | 'string';
}

interface SheetConfig {
	columns?: {
		[columnName: string]: ColumnOptions;
	};
}

export interface Sheet {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: Record<string, any>[];
	header: string[];
	config?: SheetConfig;
}

interface ArraySheet {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: any[][];
}

export function formatSheetValue(value: unknown, type?: string) {
	if (value === true || value === false) {
		return formatBoolean(value);
	}

	if (_.isDate(value) || type === 'date') {
		return formatDate(value);
	}

	return value;
}

export const getXLSXColumnType = (type) => {
	const typeMap = {
		number: 'number',
		date: 'date',
	};

	const defaultType = 'string';

	return typeMap?.[type] ?? defaultType;
};

export const getColumnTypesForWellHeaders = () => {
	const headers = getWellHeaders();
	const types = getWellHeaderTypes();

	return Object.keys(headers).reduce((acc, cur) => {
		const label = headers?.[cur] ?? cur;
		acc[label] = { type: getXLSXColumnType(types[cur].type) };
		return acc;
	}, {});
};

const formatSheet = (sheet: WorkSheet, headers: string[], config?: SheetConfig) => {
	if (!sheet['!ref']) {
		return;
	}

	const range = XLSX.utils.decode_range(sheet['!ref']);

	// Skip header row
	for (let row = 1; row <= range.e.r; row += 1) {
		for (let column = 0; column <= range.e.c; column += 1) {
			const cellAddress = { c: column, r: row };
			const cellRef = XLSX.utils.encode_cell(cellAddress);

			const header = headers[column];
			const type = config?.columns?.[header]?.type;

			// if cell exists and it's not empty and there's a type for the column
			if (sheet[cellRef] && sheet[cellRef].v && type) {
				sheet[cellRef].t = getXLSXColumnType(type)[0]; // s,b,n,d
			}
		}
	}
};

/**
 * Inputs react-data-grid rows and columns and will return xlsx sheet
 *
 * @see exportXLSX
 */
export function tableToSheet({
	rows,
	columns,
	name = 'Table',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rows: Record<string, any>[];
	columns: { key: string; name: string; type?: string }[];
	name?: string;
}): Sheet {
	const keyColumnMap = _.keyBy(columns, 'key');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data = rows.map((row): any =>
		_.transform(
			row,
			(acc, value, key) => {
				if (keyColumnMap[key]) {
					const { name: colName, type } = keyColumnMap[key] ?? {};
					acc[colName] = formatSheetValue(value, type);
				}
			},
			{}
		)
	);
	const header = columns.map(({ name: columnName }) => columnName);
	return { data, header, name };
}

/**
 * @example
 * 	exportXLSX({
 * 		fileName: 'wells-download.xlsx',
 * 		sheets: [
 * 			{
 * 				// name of the sheet with the data inside the excel file
 * 				name: 'sheet 1',
 * 				// data for the rows of the excel file, each index in the data array is a row in the file, key of the object should match the header name
 * 				data: [
 * 					{ colA: 'hi', colB: 'hey' },
 * 					{ colA: 'bye', colB: 'cya' },
 * 				],
 * 				// array of strings that define the headers at the top of the file
 * 				header: ['colA', 'colB'],
 * 			},
 * 		],
 * 	});
 *
 * @see https://github.com/SheetJS/js-xlsx
 */
export const exportXLSX = (props: { fileName: string; sheets: Sheet[] }) => {
	const { sheets, fileName } = props;

	const excel = XLSX.utils.book_new();

	sheets.forEach((sheet) => {
		const { data, header, name, config } = sheet;
		const xlsxSheet = XLSX.utils.json_to_sheet(data, { header });
		if (config) {
			formatSheet(xlsxSheet, header, config);
		}
		XLSX.utils.book_append_sheet(excel, xlsxSheet, name);
	});

	XLSX.writeFile(excel, fileName);
};

export const exportXLSXArray = (fileName: string, sheets: ArraySheet[]) => {
	const excel = XLSX.utils.book_new();

	sheets.forEach((sheet) => {
		const { data, name } = sheet;
		const xlsxSheet = XLSX.utils.aoa_to_sheet(data);
		XLSX.utils.book_append_sheet(excel, xlsxSheet, name);
	});

	XLSX.writeFile(excel, fileName);
};
