import { Request, RequestHandler, Response, Router } from 'express';
import { BAD_REQUEST } from 'http-status-codes';

import config from '@src/config';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';

import { CommandRequest, DeleteRequest } from '../requests/base';
import { PaginatedRequest, QueryRequest } from '../requests/mongo';
import { NamingTypes } from '../common';

import { deleteHandler, getMany, getOne, headCount, upsertMany } from './crud-actions';
import { bindRequest } from './bind';
import { specGenerator } from './specs';

export type RouteMetadata = {
	description: string;
};

export type RouteRequest = {
	route: string;
	method: 'get' | 'post' | 'put' | 'delete' | 'head';
	handler: RequestHandler;
	requestSample: unknown;
	metadata?: RouteMetadata;
	notGenerateSpecs?: boolean;
};

export type RouteContext = {
	metadata?: RouteMetadata;
	method: 'get' | 'post' | 'put' | 'delete' | 'head';
	namingConfig?: NamingTypes;
};

export class Controller {
	public Routes: RouteRequest[] = [];

	constructor(forceNotSpec?: boolean) {
		const notSpec = forceNotSpec ?? false;

		if (config && config.genSpecs && notSpec === false) {
			this.registerSpecGenerator();
		}
	}

	/**
	 * Create the router with all mapped routes
	 * @returns the express route object
	 */
	public routes(mergeParams = true): Router {
		const router = Router({ mergeParams });

		this.Routes.forEach((route) => {
			router[route.method](route.route, route.handler);
		});

		return router;
	}

	protected registerCount<TCollection, TRequest extends PaginatedRequest<TCollection, unknown>>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'head',
			handler: (req: Request, res: Response) => headCount(requestFactory, { metadata, method: 'head' }, req, res),
			requestSample: new requestFactory(),
		});

		this.Routes.push({
			metadata,
			route: route + '/count',
			method: 'get',
			handler: (req: Request, res: Response) => headCount(requestFactory, { metadata, method: 'get' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	protected registerGetMany<TCollection, TRequest extends PaginatedRequest<TCollection, unknown>>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'get',
			handler: (req: Request, res: Response) => getMany(requestFactory, { metadata, method: 'get' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	protected registerGetOne<TCollection, TRequest extends QueryRequest<TCollection, unknown>>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'get',
			handler: (req: Request, res: Response) => getOne(requestFactory, { metadata, method: 'get' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected registerUpdateMany<TInput, TRequest extends CommandRequest<IMultiStatusResponse>>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'put',
			handler: (req: Request, res: Response) => upsertMany(requestFactory, { metadata, method: 'put' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected registerInsertMany<TInput, TRequest extends CommandRequest<IMultiStatusResponse>>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'post',
			handler: (req: Request, res: Response) =>
				upsertMany(requestFactory, { metadata, method: 'post' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	protected registerDelete<TRequest extends DeleteRequest>(
		route: string,
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: 'delete',
			handler: (req: Request, res: Response) =>
				deleteHandler(requestFactory, { metadata, method: 'delete' }, req, res),
			requestSample: new requestFactory(),
		});
	}

	protected registerNoPayloadRequest<TOutput, TRequest extends CommandRequest<TOutput>>(
		route: string,
		method: 'head' | 'get' | 'delete',
		requestFactory: new () => TRequest,
		metadata?: RouteMetadata,
	): void {
		this.Routes.push({
			metadata,
			route: route,
			method: method,
			handler: (req: Request, res: Response) =>
				this.NoPayloadEndpoint(requestFactory, { metadata, method }, req, res),
			requestSample: new requestFactory(),
		});
	}

	private async NoPayloadEndpoint<TOutput, TRequest extends CommandRequest<TOutput>>(
		requestFactory: new () => TRequest,
		ctx: RouteContext,
		req: Request,
		res: Response,
	): Promise<void> {
		const { model, context } = bindRequest<TRequest>(requestFactory, req, res, ctx);

		if (model.errors.length === 0 && (await model.validate(context))) {
			const output = await model.handle(context);
			if (output !== undefined) {
				res.status(model.statusCode).json(output);
			}
		} else {
			res.status(BAD_REQUEST).json(model.getErrorsResponse());
			return;
		}

		res.end();
	}

	protected registerSpecGenerator(metadata?: RouteMetadata): void {
		this.Routes.push({
			metadata,
			route: '/spec',
			method: 'get',
			handler: (req: Request, res: Response) => specGenerator(this, { metadata, method: 'delete' }, req, res),
			requestSample: {},
			notGenerateSpecs: true,
		});
	}
}
