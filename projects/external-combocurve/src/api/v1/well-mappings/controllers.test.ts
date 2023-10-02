import { getWellMappings } from './controllers';

import { mockExpress } from '@test/express-mocks';

describe('v1/wells/controllers', () => {
	test('getWellMappings', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'wellMappings';

		res.locals = {
			service: {
				getWellMappings: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getWellMappings(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link: '<http://www.localhost.com/wellMappings?skip=0&take=1000>;rel="first"',
		});
		expect(res.json).toHaveBeenCalledWith([]);
	});
});
