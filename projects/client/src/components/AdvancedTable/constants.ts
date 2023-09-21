export const ERROR_KEY = Symbol('error-key');

export const SCHEMA_DESCRIBE_KEY = Symbol('template-key');
export const ROW_ID_KEY = Symbol('row-id');
export const IS_NESTED_ROW_KEY = Symbol('is-nested-row');
export const TREE_DATA_KEY = Symbol('tree-data-key');
export const ECON_LIMIT = Symbol('Econ Limit');
export const INF_LIMIT = Symbol('Inf Limit');
export const INVALID_VALUE = Symbol('Invalid Value');
export const PERIOD_DATA_KEY = Symbol('period-data-key');
export const LOOKUP_BY_FIELDS_KEY = Symbol('lookup-by-fields');
export const TOOLTIP_MESSAGE_KEY = Symbol('tooltip-message');

export const OTHERS_COL_GROUP_ID = 'others';
export const DASHED_CELL_CLASS_NAME = 'dashed-cells';
export const INVALID_ROW_CLASS_NAME = 'invalid-row';
export const NESTED_ROW_CLASS_NAME = 'time-series-row';
export const MODIFIED_CELL_CLASS_NAME = 'modified-cells';
export const FOOTER_ROW_CLASS_NAME = 'footer-row';

export const DATE_FORMAT = 'MM/yyyy';

export const SUPPORTED_DATE_PARSE_FORMATS = [
	"yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
	'MM/dd/yy', // 03/__/22
	'MM/dd/yyyy', // 03/__/2022
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

export const LT_CELL_STRING_VALUE = 'LT';
export const LT_CELL_UNASSIGNED_STRING_VALUE = 'UNASSIGNED';
export const LT_CELL_PLACEHOLDER_VALUES = [LT_CELL_STRING_VALUE, LT_CELL_UNASSIGNED_STRING_VALUE];

export const CONTEXT_MENU_ITEMS_NAMES = {
	insertTimeSeriesItem: 'Insert time series below',
	deleteSelectedRowsItem: 'Remove selected rows',
	deleteSelectedRowsAndTimeSeriesItem: 'Remove selected rows including time series',
	toggleRowsItem: 'Expand/Collapse series',
	toggleOtherColumnsItem: 'Expand/Collapse "Other" columns',
	copyRowsItem: 'Copy Row(s) with time series',
};

export const DEFAULT_COLUMN_TYPES = {
	numericColumn: 'numericColumn',
};
