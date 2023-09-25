// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { PBIRequestError } = require('./errors');

describe('powerbi/errors', () => {
	test('PBIRequestError', () => {
		const error = new PBIRequestError({
			method: 'POST',
			url: 'http://localhost:8080',
			status: 502,
			response: 'Service unavailable',
			pbiErrorInfo: 'SomePBIError',
		});

		expect(error.name).toEqual('PBIRequestError');
		expect(error.retry).toEqual(true);
		expect(error.details).toMatchObject({
			method: 'POST',
			url: 'http://localhost:8080',
			status: 502,
			response: 'Service unavailable',
			pbiErrorInfo: 'SomePBIError',
		});
	});
});
