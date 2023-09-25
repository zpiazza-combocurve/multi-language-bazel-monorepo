import { AzureClientAuth } from './azure-client';

describe('powerbi/auth', () => {
	// NOTE: Would be good to also test token caching in the future
	test('getToken()', async () => {
		const auth = new AzureClientAuth('foo', 'bar', 'baz');
		const token = await auth.getToken();
		expect(typeof token).toEqual('string');
	});
});
