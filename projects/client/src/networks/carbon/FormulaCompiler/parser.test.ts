import { Lexer } from './lexer';
import { Parser } from './parser';
import { PARSER_TESTS } from './parser.fixtures.test';

describe('Parser', () => {
	test.each(PARSER_TESTS.toString.validCases)(
		'toString($input) returns "$expectedResult"',
		({ input, expectedResult }) => {
			const tokens = new Lexer(input).generateTokens();
			const parsed = new Parser(tokens).parse()?.toString();
			expect(parsed).toBe(expectedResult);
		}
	);
	test.each(PARSER_TESTS.toString.invalidCases)(
		'toString($input) throws "$expectedResult.message"',
		({ input, expectedResult }) => {
			const tokens = new Lexer(input).generateTokens();
			expect(() => new Parser(tokens).parse()).toThrow(expectedResult);
		}
	);
});
