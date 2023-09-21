import { errorFromInfo, getErrorMessage, getErrorTitle } from './errors';

describe('helpers/errors', () => {
	test('getErrorMessage()', () => {
		expect(getErrorMessage('Failed to update')).toBe('Failed to update');
		expect(getErrorMessage(new Error('An error occurred'))).toBe('An error occurred');
		expect(getErrorMessage({ message: 'Invalid params' })).toBe('Invalid params');
		expect(getErrorMessage({})).toBe('');
	});

	test('getErrorTitle()', () => {
		expect(getErrorTitle('Failed to update')).toBe('Failed To Update');
		expect(getErrorTitle(new Error('An error occurred'))).toBe('Error');
		expect(getErrorTitle({ name: 'InvalidParams' })).toBe('Invalid Params');
		expect(getErrorTitle({})).toBe('');
	});
	test('errorFromInfo()', () => {
		const error = errorFromInfo({ name: 'InvalidParams', message: 'Some field is wrong', expected: true });
		expect(error instanceof Error).toBe(true);
		expect(error.name).toEqual('InvalidParams');
		expect(error.message).toEqual('Some field is wrong');
		expect(error.expected).toEqual(true);
	});
});
