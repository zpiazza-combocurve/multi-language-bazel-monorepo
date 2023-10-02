/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-explicit-any */

import { FilterQuery } from 'mongoose';

import { fromQuery } from '../metadata/metadata';
import { HttpMessageContext } from '../common';

import { RequestBase } from './base';

export abstract class QueryRequest<TCollection, TResponse> extends RequestBase {
	public collectionName: string;

	constructor(collectionName: string) {
		super();
		this.collectionName = collectionName;
	}

	abstract filter(input: HttpMessageContext): FilterQuery<TCollection>;

	public projection(input: HttpMessageContext): unknown {
		return {};
	}

	public sort(input: HttpMessageContext): unknown {
		return {};
	}

	public parseDoc(item: TCollection): TResponse {
		return item as unknown as TResponse;
	}
}

export abstract class PaginatedRequest<TCollection, TResponse> extends QueryRequest<TCollection, TResponse> {
	public maxPageSize = 100;

	@fromQuery({ isOptional: true, expects: 'take' })
	take: number;

	@fromQuery({ isOptional: true, expects: 'skip' })
	skip: number;

	@fromQuery({ isOptional: true, expects: 'string' })
	cursor?: string;

	constructor(collectionName: string, take: number, skip = 0) {
		super(collectionName);

		this.take = take;
		this.skip = skip;
	}
}
