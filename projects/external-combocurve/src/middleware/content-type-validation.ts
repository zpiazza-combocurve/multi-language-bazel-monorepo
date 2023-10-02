import { NextFunction, Request, RequestHandler, Response } from 'express';
import { isEmpty } from 'lodash';

import { InvalidContentTypeError } from '@src/helpers/validation';

export const HTTP_WRITE_METHODS = ['POST', 'PUT', 'PATCH'];

const hasBody = (req: Request): boolean => {
	return !isEmpty(req.body) || (!!req.headers['content-length'] && +req.headers['content-length'] > 0);
};

export const contentTypeValidation = (allowContentTypes: string[] = ['application/json']): RequestHandler => {
	return async function contentTypeValidation(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (HTTP_WRITE_METHODS.includes(req.method.toUpperCase()) && hasBody(req) && !req.is(allowContentTypes)) {
			throw new InvalidContentTypeError(`The request Content-Type must be ${allowContentTypes}`);
		}

		next();
	};
};
