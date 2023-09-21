import { formulaHasError } from './helpers';
import { TESTS } from './main.fixtures.test';
import { StreamInput } from './types';

describe('formulaHasError', () => {
	test.each(TESTS.validOutput)('"$params.formula" returns false', ({ params, expectedResult }) => {
		const result = formulaHasError(params.formula, params.inputs as StreamInput[]);

		expect(result).toBe(expectedResult);
	});
	test.each(TESTS.errorOutput)('"$params.formula" throws "$expectedResult.message"', ({ params, expectedResult }) => {
		const result = formulaHasError(params.formula, params.inputs as StreamInput[]);

		expect(typeof result === 'string' || typeof result === 'boolean' ? result : result.message).toBe(
			expectedResult
		);
	});
});
