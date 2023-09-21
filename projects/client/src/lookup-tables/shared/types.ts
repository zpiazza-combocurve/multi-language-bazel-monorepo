export type LookupTableRule = {
	conditions: {
		[key: string]: {
			low?: string;
			high?: string;
			value?: boolean;
		};
	};
	assignments: {
		[key: string]: string;
	};
};

export type StandardLookupTableCell = {
	columnKey: string;
	key: string;
	value: string;
	operator: string;
	showWarning: boolean;
	options: object[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dataEditor: () => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	valueViewer: () => any;
};

export type StandardLookupTableRow = StandardLookupTableCell[];

export type StandardLookupTableGrid = StandardLookupTableRow[];

export type StandardLookupTableColumnHeaders = {
	key: string;
	name: string;
	type: string;
	validValues: string[];
	tooltip?: string;
};
