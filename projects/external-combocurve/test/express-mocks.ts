import MockExpressRequest, { IMockExpressRequestOptions } from 'mock-express-request';
import MockExpressResponse, { IMockExpressResponseOptions } from 'mock-express-response';
import { Request, Response } from 'express';

export interface IMockExpressReturn {
	req: Request;
	res: Response;
}

export function mockExpress(
	reqOptions?: IMockExpressRequestOptions,
	resOptions?: IMockExpressResponseOptions,
): IMockExpressReturn {
	const req = new MockExpressRequest(reqOptions);
	const res = new MockExpressResponse({ ...resOptions, request: req });

	res.locals = {};

	return { req, res };
}
