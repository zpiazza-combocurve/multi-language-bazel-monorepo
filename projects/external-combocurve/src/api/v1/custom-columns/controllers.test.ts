import { CustomColumnHeaderNotFoundError } from './validation';
import { getCollectionCustomColumns } from './controllers';

import { mockExpress } from '@test/express-mocks';

describe('v1/custom-columns/controllers', () => {
	test('getCollectionCustomColumns runs correctly if valid option is passed', async () => {
		const { req, res } = mockExpress();

		req.params = { collection: 'wells' };
		res.locals = {
			service: {
				getCustomColumns: jest.fn(() => res),
			},
		};
		res.set = jest.fn(() => res);

		await getCollectionCustomColumns(req, res);

		expect(res.locals.service.getCustomColumns).toHaveBeenCalledWith('wells');
	});
	test('getCollectionCustomColumns throws error if collection is not valid', async () => {
		const { req, res } = mockExpress();

		req.params = { collection: 'invalid' };
		res.locals = {
			service: {
				getCustomColumns: jest.fn(() => res),
			},
		};
		res.set = jest.fn(() => res);
		await expect(getCollectionCustomColumns(req, res)).rejects.toThrow(CustomColumnHeaderNotFoundError);
		expect(res.locals.service.getCustomColumns).not.toHaveBeenCalled();
	});
});
