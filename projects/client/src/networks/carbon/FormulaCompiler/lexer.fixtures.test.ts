export const LEXER_TESTS = {
	correctOutput: [
		{
			input: 'Gas + 2',
			expectedResult: ['Gas', '+', '2'],
		},
		{
			input: '@FPD(123)',
			expectedResult: ['@FPD', '(', '123', ')'],
		},
		{
			input: '(Gas + 2) * 3 + @FPD(123)',
			expectedResult: ['(', 'Gas', '+', '2', ')', '*', '3', '+', '@FPD', '(', '123', ')'],
		},
		{
			input: '2 + 1',
			expectedResult: ['2', '+', '1'],
		},
		{
			input: '2 - 1',
			expectedResult: ['2', '-', '1'],
		},
		{
			input: '2 * 1',
			expectedResult: ['2', '*', '1'],
		},
		{
			input: '2 / 1',
			expectedResult: ['2', '/', '1'],
		},
		{
			input: 'Gas + 1',
			expectedResult: ['Gas', '+', '1'],
		},
		{
			input: 'Gas - 1',
			expectedResult: ['Gas', '-', '1'],
		},
		{
			input: 'Gas * 1',
			expectedResult: ['Gas', '*', '1'],
		},
		{
			input: 'Gas / 1',
			expectedResult: ['Gas', '/', '1'],
		},
		{
			input: '1 + Gas',
			expectedResult: ['1', '+', 'Gas'],
		},
		{
			input: '1 - Gas',
			expectedResult: ['1', '-', 'Gas'],
		},
		{
			input: '1 * Gas',
			expectedResult: ['1', '*', 'Gas'],
		},
		{
			input: '1 / Gas',
			expectedResult: ['1', '/', 'Gas'],
		},
	],
	errorOutput: [
		{
			input: '%',
			expectedResult: new SyntaxError(`Invalid character: %`),
		},
	],
};
