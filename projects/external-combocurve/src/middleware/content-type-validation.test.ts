import { Request, Response } from 'express';

import { InvalidContentTypeError } from '@src/helpers/validation';

import { contentTypeValidation, HTTP_WRITE_METHODS } from './content-type-validation';

import { mockExpress } from '@test/express-mocks';

let req: Request;
let res: Response;

describe('middleware/content-type-validation', () => {
	beforeEach(() => {
		({ req, res } = mockExpress());
	});

	test('contentTypeValidation runs correctly', async () => {
		const middleware = contentTypeValidation();

		const next = jest.fn(async (error) => {
			expect(error).toBeFalsy();
		});

		// Check get and head methods
		req.method = 'GET';
		req.headers['content-type'] = 'application/json';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		req.method = 'HEAD';
		req.headers['content-type'] = 'application/json';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		// check content type doesn't matter on GET and head
		req.method = 'GET';
		req.headers['content-type'] = 'invalid-content-type';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		req.method = 'HEAD';
		req.headers['content-type'] = 'invalid-content-type';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		// Check http create methods
		req.method = 'POST';
		req.headers['content-type'] = 'application/json';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		req.method = 'PUT';
		req.headers['content-type'] = 'application/json';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();

		req.method = 'PATCH';
		req.headers['content-type'] = 'application/json';
		await middleware(req, res, next);
		expect(next).toHaveBeenCalled();
	});

	test('contentTypeValidation throws validation error', async () => {
		const middleware = contentTypeValidation();

		const next = jest.fn();

		for (const method of HTTP_WRITE_METHODS) {
			req.method = method;
			req.headers['content-type'] = 'text/plain';
			await expect(middleware(req, res, next)).rejects.toThrow(InvalidContentTypeError);

			req.method = method;
			req.headers['content-type'] = undefined;
			await expect(middleware(req, res, next)).rejects.toThrow(InvalidContentTypeError);

			req.method = method;
			req.headers['content-type'] = 'invalid-content-type';
			await expect(middleware(req, res, next)).rejects.toThrow(InvalidContentTypeError);
		}
	});
});
