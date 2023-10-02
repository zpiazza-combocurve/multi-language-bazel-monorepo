import 'reflect-metadata';
import { Request, Response } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { ITenantCacheEntry } from '@src/middleware/tenant-cache';
import { ValidationError } from '@src/helpers/validation';

import { MetadaWrapper } from '../metadata/metada-wrapper';
import { NamingTypes } from '../common';

import { containsField } from './field-lookup';

/** Wrapper to express' request and its parts like query, params, body... */
export class RequestStructure {
	constructor(
		private request: Request,
		private response: Response,
		private metadata: MetadaWrapper,
		private namingConfig: NamingTypes,
	) {}

	private cachedTenant?: ITenantCacheEntry;
	public getTenantCache(): ITenantCacheEntry {
		if (!this.cachedTenant) {
			const { cachedTenant } = this.response.locals as { cachedTenant: ITenantCacheEntry };
			this.cachedTenant = cachedTenant;
		}

		return this.cachedTenant;
	}

	private context?: ApiContextV1;
	public getV1Context(): ApiContextV1 {
		if (!this.context) {
			this.context = this.getTenantCache().get('context') as ApiContextV1;
		}

		return this.context;
	}

	public checkBasicStructure(): ValidationError[] {
		return [
			...this.checkBodyStructure(),
			...this.checkUnknowInfoOnSource(
				this.request.query,
				this.metadata.queryFields.map((f) => f.name),
				'query',
			),
		];
	}

	private checkBodyStructure(): ValidationError[] {
		// When the field 'isBody' means the value is the body itself
		// So it will be handled as an object inside the binder
		// And each object is validated by the binder
		const bodyFields = this.metadata.bodyFields.filter((f) => !f.options.isBody).map((f) => f.name);

		if (Array.isArray(this.request.body) || bodyFields.length === 0) {
			return [];
		}

		return [...this.checkUnknowInfoOnSource(this.request.body, bodyFields, 'body')];
	}

	public *checkUnknowInfoOnSource(
		source: Record<string, unknown>,
		allowedFields: string[],
		location: string,
	): Generator<ValidationError> {
		for (const key of Object.keys(source)) {
			if (!containsField(allowedFields, key, this.namingConfig)) {
				yield new ValidationError(`Unrecognized field ${key}`, location, 'FieldNameError');
			}
		}
	}

	public getRequestSource(where: string, scopedSource: unknown): Record<string, unknown> {
		switch (where) {
			case 'body':
				return this.request.body;
			case 'query':
				return this.request.query;
			case 'params':
				return this.request.params;
			case 'services':
				return this.getV1Context() as unknown as Record<string, unknown>;
			case 'scope':
				return scopedSource as Record<string, unknown>;

			// Compositions don't have a value itselft
			// it's just a way to reuse some models with request binders
			case 'composition':
				return {};
			default:
				throw new Error(`Unknown source ${where}`);
		}
	}
}
