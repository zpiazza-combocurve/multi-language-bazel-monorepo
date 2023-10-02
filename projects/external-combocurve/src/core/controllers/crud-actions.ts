import { BAD_REQUEST, NOT_FOUND, OK } from 'http-status-codes';
import { Request, Response } from 'express';
import { Model } from 'mongoose';

import { getPaginationData, getPaginationDataWithTotal, getPaginationHeaders } from '@src/api/v1/pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '@src/api/v1/multi-status';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';

import { CommandRequest, DeleteRequest } from '../requests/base';
import { PaginatedRequest, QueryRequest } from '../requests/mongo';
import { RequestStructure } from '../binder/request-structure';

import { bindRequest } from './bind';
import { RouteContext } from './base';

function getMongoModel<TCollection>(collectionName: string, requestStructure: RequestStructure): Model<TCollection> {
	const context = requestStructure.getV1Context();

	for (const value of Object.values(context.models)) {
		const model = value as Model<TCollection>;

		if (model.collection.name === collectionName) {
			return value;
		}
	}

	throw new Error(`There is no collection ${collectionName} mapped`);
}

export async function headCount<TCollection, TRequest extends PaginatedRequest<TCollection, unknown>>(
	requestFactory: new () => TRequest,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	const { model, context, structure } = bindRequest<TRequest>(requestFactory, req, res, ctx);

	if (model.errors.length === 0) {
		const filter = model.filter(context);
		const collection = getMongoModel<TCollection>(model.collectionName, structure);

		const baseQuery = collection.find(filter);
		const countQuery = Object.keys(filter).length ? baseQuery.countDocuments() : baseQuery.estimatedDocumentCount();

		const count = await countQuery;

		const urlData = getUrlData(req);
		const paginationData = getPaginationDataWithTotal(urlData, model.skip, model.take, count);

		res.set(getPaginationHeaders(paginationData)).end();
		return;
	}

	res.status(BAD_REQUEST).json(model.getErrorsResponse());
}

export async function getMany<TCollection, TRequest extends PaginatedRequest<TCollection, unknown>>(
	requestFactory: new () => TRequest,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	const { model, context, structure } = bindRequest<TRequest>(requestFactory, req, res, ctx);

	if (model.errors.length === 0 && (await model.validate(context))) {
		const collection = getMongoModel<TCollection>(model.collectionName, structure);

		let query = collection
			.find(model.filter(context), model.projection(context))
			.skip(model.skip)
			.limit(model.take + 1);

		const sort = model.sort(context);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (sort && Object.keys(sort as any).length > 0) {
			query = query.sort(sort);
		}

		const items = await query;
		const output = items.slice(0, model.take).map((m) => model.parseDoc(m));

		const urlData = getUrlData(req);
		const paginationData = getPaginationData(urlData, model.skip, model.take, items.length > model.take);

		res.set(getPaginationHeaders(paginationData)).json(output);
		return;
	}

	res.status(BAD_REQUEST).json(model.getErrorsResponse());
}

export async function getOne<TCollection, TRequest extends QueryRequest<TCollection, unknown>>(
	requestFactory: new () => TRequest,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	const { model, context, structure } = bindRequest<TRequest>(requestFactory, req, res, ctx);

	if (model.errors.length === 0 && (await model.validate(context))) {
		const collection = getMongoModel<TCollection>(model.collectionName, structure);
		const item = await collection.findOne(model.filter(context), model.projection(context));

		if (item !== null) {
			const output = model.parseDoc(item);
			res.status(OK).json(output);
			return;
		}

		res.status(NOT_FOUND).end();
		return;
	}

	res.status(BAD_REQUEST).json(model.getErrorsResponse());
}

export async function upsertMany<TRequest extends CommandRequest<IMultiStatusResponse>>(
	requestFactory: new () => TRequest,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	const { model, context } = bindRequest<TRequest>(requestFactory, req, res, ctx);

	if (await model.validate(context)) {
		const output = await model.handle(context);
		if (output) {
			const errorsResponse = getResponseFromErrors(model.getErrorsResponse());
			const finalResponse = withCounts(mergeResponses(errorsResponse, output));

			res.status(model.statusCode).json(finalResponse);
		}
	} else {
		res.status(BAD_REQUEST).json(model.getErrorsResponse());
		return;
	}

	res.end();
}

export async function deleteHandler<TRequest extends DeleteRequest>(
	requestFactory: new () => TRequest,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	const { model, context } = bindRequest<TRequest>(requestFactory, req, res, ctx);

	if (model.errors.length === 0 && (await model.validate(context))) {
		const deleteCount = await model.handle(context);
		if (deleteCount !== undefined) {
			res.status(model.statusCode).set(getDeleteHeaders(deleteCount));
		}
	} else {
		res.status(BAD_REQUEST).json(model.getErrorsResponse()).end();
		return;
	}

	res.end();
}
