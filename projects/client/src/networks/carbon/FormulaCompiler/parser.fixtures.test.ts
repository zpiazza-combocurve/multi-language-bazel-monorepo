import { SyntaxError } from './helpers';

export const PARSER_TESTS = {
	toString: {
		validCases: [
			{
				input: '123',
				expectedResult: '[123]',
			},
			{
				input: 'oil',
				expectedResult: '[oil]',
			},
			{
				input: '@FPD(123)',
				expectedResult: '[@FPD([123])]',
			},
			{
				input: '+123',
				expectedResult: '[+[123]]',
			},
			{
				input: '-oil',
				expectedResult: '[-[oil]]',
			},
			{
				input: '+@FPD(123)',
				expectedResult: '[+[@FPD([123])]]',
			},
			{
				input: '-123',
				expectedResult: '[-[123]]',
			},
			{
				input: '-Oil',
				expectedResult: '[-[Oil]]',
			},
			{
				input: '-@FPD(123)',
				expectedResult: '[-[@FPD([123])]]',
			},
			{
				input: '1 + 2',
				expectedResult: '[[1]+[2]]',
			},
			{
				input: 'Oil + 1',
				expectedResult: '[[Oil]+[1]]',
			},
			{
				input: '1 + Oil',
				expectedResult: '[[1]+[Oil]]',
			},
			{
				input: 'Gas + Oil',
				expectedResult: '[[Gas]+[Oil]]',
			},
			{
				input: 'Gas + @FPD(123)',
				expectedResult: '[[Gas]+[@FPD([123])]]',
			},
			{
				input: '1 - 2',
				expectedResult: '[[1]-[2]]',
			},
			{
				input: 'Oil - 1',
				expectedResult: '[[Oil]-[1]]',
			},
			{
				input: '1 - Oil',
				expectedResult: '[[1]-[Oil]]',
			},
			{
				input: 'Gas - Oil',
				expectedResult: '[[Gas]-[Oil]]',
			},
			{
				input: 'Gas - @FPD(123)',
				expectedResult: '[[Gas]-[@FPD([123])]]',
			},
			{
				input: '1 * 2',
				expectedResult: '[[1]*[2]]',
			},
			{
				input: 'Oil * 1',
				expectedResult: '[[Oil]*[1]]',
			},
			{
				input: '1 * Oil',
				expectedResult: '[[1]*[Oil]]',
			},
			{
				input: 'Gas * Oil',
				expectedResult: '[[Gas]*[Oil]]',
			},
			{
				input: 'Gas * @FPD(123)',
				expectedResult: '[[Gas]*[@FPD([123])]]',
			},
			{
				input: '1 / 2',
				expectedResult: '[[1]/[2]]',
			},
			{
				input: 'Oil / 1',
				expectedResult: '[[Oil]/[1]]',
			},
			{
				input: '1 / Oil',
				expectedResult: '[[1]/[Oil]]',
			},
			{
				input: 'Gas / Oil',
				expectedResult: '[[Gas]/[Oil]]',
			},
			{
				input: 'Gas / @FPD(123)',
				expectedResult: '[[Gas]/[@FPD([123])]]',
			},
			{
				input: 'Oil / 2 + @FPD(123)',
				expectedResult: '[[[Oil]/[2]]+[@FPD([123])]]',
			},
			{
				input: '- (Oil * 2 + Gas / 3) / (Oil - @FPD(123))',
				expectedResult: '[[-[[[Oil]*[2]]+[[Gas]/[3]]]]/[[Oil]-[@FPD([123])]]]',
			},
		],
		invalidCases: [
			{
				input: '2++2',
				expectedResult: new SyntaxError(undefined),
			},
			{
				input: '2++2',
				expectedResult: new SyntaxError(),
			},
			{
				input: '2+-2',
				expectedResult: new SyntaxError(),
			},
			{
				input: '2--2',
				expectedResult: new SyntaxError(),
			},
			{
				input: '2+((32+2)+2',
				expectedResult: new SyntaxError(`Closing parenthesis not found`),
			},
			{
				input: '2+(43)+2)+2',
				expectedResult: new SyntaxError(`Opening parenthesis not found`),
			},
			{
				input: '2+@FPD22)',
				expectedResult: new SyntaxError(`Expected opening parenthesis`),
			},
			{
				input: '2+@FPD(22',
				expectedResult: new SyntaxError(`Expected closing parenthesis`),
			},
			{
				input: '2+@FPD()',
				expectedResult: new SyntaxError(`Function input not found`),
			},
		],
	},
};
