import { Request, Response } from 'express';

import { HttpMessageContext, NamingTypes } from '../common';
import { BindHandler } from '../binder/handler';
import { MetadaWrapper } from '../metadata/metada-wrapper';
import { RequestBase } from '../requests/base';
import { RequestStructure } from '../binder/request-structure';

import { RouteContext } from './base';

export type BindRequestResult<TRequest extends RequestBase> = {
	model: TRequest;
	context: HttpMessageContext;
	structure: RequestStructure;
};

export function bindRequest<TRequest extends RequestBase>(
	requestFactory: new () => TRequest,
	req: Request,
	res: Response,
	ctx: RouteContext,
): BindRequestResult<TRequest> {
	const model = new requestFactory();
	const namingConfig = ctx.namingConfig ?? NamingTypes.ExactlyEqual;

	const metadata = new MetadaWrapper(model);
	const requestStructure = new RequestStructure(req, res, metadata, namingConfig);
	const handler = new BindHandler<TRequest>(model, req, metadata, requestStructure, namingConfig);

	model.errors = [...handler.bind(), ...requestStructure.checkBasicStructure()];

	const context = {
		request: req,
		response: res,
		method: {
			httpMethod: ctx.method,
		},
	};

	return { model, context, structure: requestStructure };
}
