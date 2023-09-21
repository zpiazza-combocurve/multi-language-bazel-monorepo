import {
	defaultHandlePasteCells,
	getDateRangeStart,
	getNumberRangeRateValue,
	getNumberRangeValue,
	getSelectValueProps,
	parseValue,
} from './copy-paste';

describe('getDateRangeStart', () => {
	test('should return the start date of a date range', () => {
		expect(getDateRangeStart('01/01/2018 - 01/01/2019')).toBe('01/01/2018');
		expect(getDateRangeStart('01/2018 - 01/2019')).toBe('01/01/2018');
		expect(getDateRangeStart('01/01/2018')).toBe('01/01/2018');
		expect(getDateRangeStart('01/2018')).toBe('01/01/2018');
		expect(getDateRangeStart('01/01/2018-01/01/2019')).toBe('01/01/2018');
	});
	test('should return empty string if no date range, null or no match', () => {
		expect(getDateRangeStart('')).toBe('');
		expect(getDateRangeStart('foo')).toBe('');
		expect(getDateRangeStart(null)).toBe('');
		expect(getDateRangeStart('123/123/12345')).toBe('');
	});
});

describe('getNumberRangeValue', () => {
	test('should return the number of a number range', () => {
		expect(getNumberRangeValue('1 - 10')).toBe(10);
		expect(getNumberRangeValue('1-10')).toBe(10);
		expect(getNumberRangeValue('1')).toBe(1);
		expect(getNumberRangeValue('2-27')).toBe(26);
		// The following case is not optimal - current regex allows you to input 123-foo, 123-123-123-123-132 and it will be valid
		expect(getNumberRangeValue('1 - Econ Limit')).toBe(1);
	});
	test('should return empty string if no number range, null or no match', () => {
		expect(getNumberRangeValue('')).toBe('');
		expect(getNumberRangeValue('foo')).toBe('');
		expect(getNumberRangeValue(null)).toBe('');
	});
});

describe('getNumberRangeRateValue', () => {
	test('should return the number of a number range rate', () => {
		expect(getNumberRangeRateValue('1 - 10')).toBe(1);
		expect(getNumberRangeRateValue('1-10')).toBe(1);
		expect(getNumberRangeRateValue('1')).toBe(1);
		expect(getNumberRangeRateValue('2-27')).toBe(2);
		// The following case is not optimal - current regex allows you to input 123-foo, 123-123-123-123-132 and it will be valid
		expect(getNumberRangeRateValue('1 - Econ Limit')).toBe(1);
	});
	test('should return empty string if no number range rate, null or no match', () => {
		expect(getNumberRangeRateValue('')).toBe('');
		expect(getNumberRangeRateValue('foo')).toBe('');
		expect(getNumberRangeRateValue(null)).toBe('');
	});
});

describe('parseValue', () => {
	test('should return the correctly parsed number', () => {
		expect(parseValue({ fieldType: 'date-range' }, '01/01/2018 - 01/01/2019')).toBe('01/01/2018');
		expect(parseValue({ fieldType: 'number-range' }, '1 - 10')).toBe(10);
		expect(parseValue({ fieldType: 'number-range-rate' }, '1 - 10')).toBe(1);
		expect(parseValue({ fieldType: 'number', valType: 'dollars' }, '$1')).toBe(1);
		expect(parseValue({ fieldType: 'number', valType: 'percent' }, '1%')).toBe(1);
		expect(parseValue({ fieldType: 'number', valType: 'foo' }, '1')).toBe(1);
		expect(parseValue({ fieldType: 'foo', valType: 'foo' }, 'foo')).toBe('foo');
	});
});

describe('defaultHandlePasteCells', () => {
	let mockChangeCell;
	let mockAddRow;

	beforeEach(() => {
		mockChangeCell = vi.fn();
		mockAddRow = vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should handle changes', () => {
		const changes = [
			{ cell: { meta: 'meta1' }, value: 'value1' },
			{ cell: { meta: 'meta2' }, value: 'value2' },
			{ cell: { meta: 'meta3' }, value: 'value3' },
		];
		const additions = [];
		const onlyFirstRow = false;

		defaultHandlePasteCells({ changes, additions, addRow: mockAddRow, changeCell: mockChangeCell, onlyFirstRow });

		expect(mockChangeCell).toHaveBeenCalledTimes(3);
		expect(mockChangeCell).toHaveBeenCalledWith('meta1', 'value1');
		expect(mockChangeCell).toHaveBeenCalledWith('meta2', 'value2');
		expect(mockChangeCell).toHaveBeenCalledWith('meta3', 'value3');
		expect(mockAddRow).not.toHaveBeenCalled();
	});

	test('should handle changes with onlyFirstRow flag', () => {
		const changes = [
			{ cell: { meta: 'meta1' }, value: 'value1' },
			{ cell: { meta: 'meta2' }, value: 'value2' },
			{ cell: { meta: 'meta3' }, value: 'value3' },
		];
		const additions = [];
		const onlyFirstRow = true;

		defaultHandlePasteCells({ changes, additions, addRow: mockAddRow, changeCell: mockChangeCell, onlyFirstRow });

		expect(mockChangeCell).toHaveBeenCalledTimes(1);
		expect(mockChangeCell).toHaveBeenCalledWith('meta1', 'value1');
		expect(mockAddRow).not.toHaveBeenCalled();
	});

	test('should handle insertions', () => {
		const changes = [
			{ cell: { meta: 'meta1' }, value: 'value1', row: 0, col: 0 },
			{ cell: { meta: 'meta2' }, value: 'value2', row: 1, col: 0 },
			{ cell: { meta: 'meta3' }, value: 'value3', row: 1, col: 1 },
			{ cell: { meta: 'meta4' }, value: 'value4', row: 2, col: 0 },
		];
		const additions = [
			{ value: 'newValue1', row: 3, col: 0 },
			{ value: 'newValue2', row: 4, col: 0 },
			{ value: 'newValue3', row: 4, col: 1 },
		];
		const onlyFirstRow = false;

		defaultHandlePasteCells({ changes, additions, addRow: mockAddRow, changeCell: mockChangeCell, onlyFirstRow });

		expect(mockChangeCell).toHaveBeenCalledTimes(4);
		expect(mockChangeCell.mock.calls[0]).toEqual(['meta1', 'value1']);
		expect(mockChangeCell.mock.calls[1]).toEqual(['meta2', 'value2']);
		expect(mockChangeCell.mock.calls[2]).toEqual(['meta3', 'value3']);
		expect(mockChangeCell.mock.calls[3]).toEqual(['meta4', 'value4']);
		expect(mockAddRow).toHaveBeenCalledTimes(0);
	});

	test('should handle insertions with onlyFirstRow flag', () => {
		const changes = [
			{ cell: { meta: 'meta1' }, value: 'value1', row: 0, col: 0 },
			{ cell: { meta: 'meta2' }, value: 'value2', row: 1, col: 0 },
			{ cell: { meta: 'meta3' }, value: 'value3', row: 1, col: 1 },
			{ cell: { meta: 'meta4' }, value: 'value4', row: 2, col: 0 },
		];
		const additions = [
			{ value: 'newValue1', row: 3, col: 0 },
			{ value: 'newValue2', row: 4, col: 0 },
			{ value: 'newValue3', row: 4, col: 1 },
		];
		const onlyFirstRow = true;

		defaultHandlePasteCells({ changes, additions, addRow: mockAddRow, changeCell: mockChangeCell, onlyFirstRow });

		expect(mockChangeCell).toHaveBeenCalledTimes(1);
		expect(mockChangeCell).toHaveBeenCalledWith('meta1', 'value1');
		expect(mockAddRow).not.toHaveBeenCalled();
	});
});

describe('getSelectValueProps', () => {
	test('should return select value props when fullMenuItems is provided', () => {
		const meta = {
			fullMenuItems: [
				{ value: '1', label: 'Option 1' },
				{ value: '2', label: 'Option 2' },
				{ value: '3', label: 'Option 3' },
			],
			menuItems: ['option1', 'option2', 'option3'],
		};
		const value = '2';

		const result = getSelectValueProps(meta, value);

		expect(result).toEqual({
			fullMenuItem: { value: '2', label: 'Option 2' },
			value: 'option2',
		});
	});

	test('should return null when value is not found in fullMenuItems', () => {
		const meta = {
			fullMenuItems: [
				{ value: '1', label: 'Option 1' },
				{ value: '2', label: 'Option 2' },
				{ value: '3', label: 'Option 3' },
			],
			menuItems: ['option1', 'option2', 'option3'],
		};
		const value = '4';

		const result = getSelectValueProps(meta, value);

		expect(result).toBeNull();
	});

	test('should return null when fullMenuItems is not provided', () => {
		const meta = {};
		const value = '2';

		const result = getSelectValueProps(meta, value);

		expect(result).toBeNull();
	});
});
