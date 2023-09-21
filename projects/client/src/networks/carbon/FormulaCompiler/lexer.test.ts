import { Lexer } from './lexer';
import { LEXER_TESTS } from './lexer.fixtures.test';

describe('Lexer', () => {
	test.each(LEXER_TESTS.correctOutput)('$input should return $expectedResult', ({ input, expectedResult }) => {
		const tokens = new Lexer(input).generateTokens().map((token) => token.toSymbol());
		expect(tokens).toEqual(expectedResult);
	});
	test.each(LEXER_TESTS.errorOutput)('$input should throw $expectedResult.message', ({ input, expectedResult }) => {
		expect(() => new Lexer(input).generateTokens()).toThrow(expectedResult);
	});
});
