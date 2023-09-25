import { PBIRequestError } from './errors';

describe('powerbi/errors', () => {
	test('PBIRequestError', () => {
		const error = new PBIRequestError({
			method: 'POST',
			pbiErrorInfo: 'SomePBIError',
			requestId: null,
			response: 'Service unavailable',
			status: 502,
			url: 'http://localhost:8080',
		});

		expect(error.name).toEqual('PBIRequestError');
		expect(error.details).toMatchObject({
			method: 'POST',
			pbiErrorInfo: 'SomePBIError',
			response: 'Service unavailable',
			status: 502,
			url: 'http://localhost:8080',
		});
	});
});
