import { ExcelCell, ExcelStyle } from 'ag-grid-community';

export const cell: (text: string, styleId?: string) => ExcelCell = (text: string, styleId?: string) => {
	return {
		styleId,
		data: {
			type: /^\d+$/.test(text) ? 'Number' : 'String',
			value: String(text),
		},
	};
};

export const defaultExcelStyles = (): ExcelStyle[] => {
	return [
		{
			id: 'header',
			interior: {
				color: '#aaaaaa',
				pattern: 'Solid',
			},
		},
		{
			id: 'body',
			interior: {
				color: '#dddddd',
				pattern: 'Solid',
			},
		},
	];
};
