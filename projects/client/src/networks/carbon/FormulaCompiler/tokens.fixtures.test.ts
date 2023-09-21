import { ValueError } from './helpers';
import { TokenType } from './tokens';

export const TOKEN_TESTS = {
	validTokenInitialization: [
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.PLUS,
			expectedResult: {
				toString: '<0-1;PLUS;null>',
				toSymbol: '+',
			},
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MINUS,
			expectedResult: {
				toString: '<0-1;MINUS;null>',
				toSymbol: '-',
			},
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MULTIPLY,
			expectedResult: {
				toString: '<0-1;MULTIPLY;null>',
				toSymbol: '*',
			},
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.DIVIDE,
			expectedResult: {
				toString: '<0-1;DIVIDE;null>',
				toSymbol: '/',
			},
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.LPAREN,
			expectedResult: {
				toString: '<0-1;LPAREN;null>',
				toSymbol: '(',
			},
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.RPAREN,
			expectedResult: {
				toString: '<0-1;RPAREN;null>',
				toSymbol: ')',
			},
		},
		{
			startIndex: 0,
			endIndex: 5,
			tokenType: TokenType.NUMBER,
			value: '12.32',
			expectedResult: {
				toString: '<0-5;NUMBER;12.32>',
				toSymbol: '12.32',
			},
		},
		{
			startIndex: 0,
			endIndex: 3,
			tokenType: TokenType.STREAM,
			value: 'Oil',
			expectedResult: {
				toString: '<0-3;STREAM;Oil>',
				toSymbol: 'Oil',
			},
		},
		{
			startIndex: 0,
			endIndex: 4,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: '@FPD',
			expectedResult: {
				toString: '<0-4;FUNCTION_HANDLE;@FPD>',
				toSymbol: '@FPD',
			},
		},
	],
	invalidTokenInitialization: [
		{
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			expectedResult: TypeError('Invalid input type!'),
			startIndex: '0',
			endIndex: 1,
			tokenType: TokenType.PLUS,
		},
		{
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			expectedResult: TypeError('Invalid input type!'),
			startIndex: 0,
			endIndex: '1',
			tokenType: TokenType.PLUS,
		},
		{
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			expectedResult: TypeError('Invalid input type!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: 'plus',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: PLUS!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.PLUS,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: MINUS!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MINUS,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: MULTIPLY!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MULTIPLY,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: DIVIDE!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.DIVIDE,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: LPAREN!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.LPAREN,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Value input must be null for token: RPAREN!'),
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.RPAREN,
			value: 'random_value',
		},
		{
			expectedResult: new ValueError('Difference between start_index and end_index must be 1 for token: PLUS!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.PLUS,
		},
		{
			expectedResult: new ValueError('Difference between start_index and end_index must be 1 for token: MINUS!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.MINUS,
		},
		{
			expectedResult: new ValueError(
				'Difference between start_index and end_index must be 1 for token: MULTIPLY!'
			),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.MULTIPLY,
		},
		{
			expectedResult: new ValueError('Difference between start_index and end_index must be 1 for token: DIVIDE!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.DIVIDE,
		},
		{
			expectedResult: new ValueError('Difference between start_index and end_index must be 1 for token: LPAREN!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.LPAREN,
		},
		{
			expectedResult: new ValueError('Difference between start_index and end_index must be 1 for token: RPAREN!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.RPAREN,
		},
		{
			expectedResult: new ValueError('Length of value input does not match end_index - start_index!'),
			startIndex: 3,
			endIndex: 7,
			tokenType: TokenType.NUMBER,
			value: '12.34',
		},
		{
			expectedResult: new ValueError('Length of value input does not match end_index - start_index!'),
			startIndex: 0,
			endIndex: 4,
			tokenType: TokenType.NUMBER,
			value: '12.',
		},
		{
			expectedResult: new ValueError('Length of value input does not match end_index - start_index!'),
			startIndex: 0,
			endIndex: 2,
			tokenType: TokenType.STREAM,
			value: 'Gas',
		},
		{
			expectedResult: new ValueError('Length of value input does not match end_index - start_index!'),
			startIndex: 6,
			endIndex: 7,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: '@FPD',
		},
	],
	isValidFunction: [
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.PLUS,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MINUS,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.MULTIPLY,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.DIVIDE,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.LPAREN,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 1,
			tokenType: TokenType.RPAREN,
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 5,
			tokenType: TokenType.NUMBER,
			value: '12.32',
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 8,
			tokenType: TokenType.NUMBER,
			value: '12.32.32',
			expectedResult: false,
		},
		{
			startIndex: 0,
			endIndex: 3,
			tokenType: TokenType.STREAM,
			value: 'Oil',
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 3,
			tokenType: TokenType.STREAM,
			value: 'Gas',
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 5,
			tokenType: TokenType.STREAM,
			value: 'Water',
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 4,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: '@FPD',
			expectedResult: true,
		},
		{
			startIndex: 0,
			endIndex: 4,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: '@Fpd',
			expectedResult: '@Fpd function is not available',
		},
		{
			startIndex: 3,
			endIndex: 8,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: '@FDQ1',
			expectedResult: '@FDQ1 function is not available',
		},
	],
};
