// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { getAuthHeaders } = require('./auth');

describe('powerbi/auth', () => {
	test('getAuthHeaders()', async () => {
		const headers = await getAuthHeaders();
		expect(headers.Authorization).toEqual(expect.stringMatching('Bearer '));
	});
});
