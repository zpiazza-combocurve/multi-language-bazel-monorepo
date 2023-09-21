import { Token, getTokenByType } from './tokens';
import { TOKEN_TESTS } from './tokens.fixtures.test';

describe('Token', () => {
	test.each(TOKEN_TESTS.validTokenInitialization)(
		'$expectedResult.toString token is initialized correctly',
		({ startIndex, endIndex, tokenType, expectedResult, value }) => {
			const token = new Token({
				startIndex,
				tokenType,
				endIndex,
				value,
			});
			expect(token.toString()).toEqual(expectedResult.toString);
			expect(token.toSymbol()).toEqual(expectedResult.toSymbol);
		}
	);

	test.each(TOKEN_TESTS.invalidTokenInitialization)(
		'<$startIndex-$endIndex;$tokenType;$value> token should throw "$expectedResult.message"',
		({ startIndex, endIndex, tokenType, value, expectedResult }) => {
			expect(() => {
				// eslint-disable-next-line no-new
				new Token({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					startIndex,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					endIndex,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					tokenType,
					value,
				});
			}).toThrow(expectedResult);
		}
	);

	test.each(TOKEN_TESTS.isValidFunction)(
		`Token(<$startIndex-$endIndex;$tokenType;$value>).isValid() returns $expectedResult`,
		({ startIndex, endIndex, tokenType, value, expectedResult }) => {
			const token = getTokenByType(tokenType, {
				startIndex,
				endIndex,
				tokenType,
				value,
			});
			expect(token.isValid()).toEqual(expectedResult);
		}
	);
});
