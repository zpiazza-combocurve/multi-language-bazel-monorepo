import merge from 'deepmerge';

import { IOpenApiOperation, IOpenApiParameter, IOpenApiResponses } from '@lib/express-openapi-ts/openapi-2';
import { ILoadedResource } from '../resource';
import { IOpenApiSchema } from '../../openapi-2';

function mapValues<K extends string, T, U>(obj: Record<K, T>, iteratee: (v: T, k: K, i: number) => U): Record<K, U> {
	if (obj === null) {
		return {} as Record<K, U>;
	}
	return Object.keys(obj).reduce(
		(accumulator, key: K, index) => ({
			...accumulator,
			[key]: iteratee(obj[key], key, index),
		}),
		{} as Record<K, U>,
	);
}

export interface ISpecMerger {
	mergeResource(existing: ILoadedResource, generated: ILoadedResource): ILoadedResource;
}

const mergeParameters = (generated: IOpenApiParameter[] | undefined, existing: IOpenApiParameter[] | undefined) => {
	if (!generated) {
		return existing;
	}
	if (!existing) {
		return generated;
	}
	const parameterMap = [...existing, ...generated].reduce(
		(accumulator: Record<string, IOpenApiParameter>, parameter: IOpenApiParameter) => {
			const { name, $ref } = parameter;
			return {
				...accumulator,
				[name || $ref]: parameter,
			};
		},
		{},
	);

	return Object.keys(parameterMap).map((key) => parameterMap[key]);
};

const mergeResponses = (generated: IOpenApiResponses, existing: IOpenApiResponses) => merge({ ...existing }, generated);

const KEEP_OPERATION_FIELDS = ['x-google-quota', 'operationId'];

const mergeBaseOperations = (generated: IOpenApiOperation, existing: IOpenApiResponses) => {
	return {
		...existing,
		...generated,
	};
};

const mergeOperations = (generated, existing) =>
	mapValues(generated, (generatedOperation: IOpenApiOperation, key) => {
		const existingOperation: IOpenApiOperation | undefined = existing?.[key];

		const parameters = mergeParameters(generatedOperation.parameters, existingOperation?.parameters);
		const responses = mergeResponses(generatedOperation.responses, existingOperation?.responses);

		let merged = {
			...existingOperation,
			...generatedOperation,
			parameters,
			responses,
		};

		KEEP_OPERATION_FIELDS.forEach((field) => {
			if (existingOperation?.[field]) {
				merged[field] = existingOperation[field];
			}
		});

		return merged;
	});

const KEEP_SCHEMA_FIELDS = ['description', 'example'];

const mergeSchemas = (generated: IOpenApiSchema, existing: IOpenApiSchema | undefined): IOpenApiSchema => {
	if (!existing) {
		return generated;
	}

	let result = { ...generated };

	KEEP_SCHEMA_FIELDS.forEach((field) => {
		if (existing[field] && !generated[field]) {
			result[field] = existing[field];
		}
	});

	if (generated.type === 'object' && generated.properties) {
		result.properties = mapValues(generated.properties, (generated, key) =>
			mergeSchemas(generated, existing.properties[key]),
		);
	}

	if (generated.type === 'array' && generated.items) {
		result.items = mergeSchemas(generated.items, existing.items);
	}

	return result;
};

export class SpecMerger implements ISpecMerger {
	protected mergePaths(existing: ILoadedResource, generated: ILoadedResource): ILoadedResource {
		const { paths: existingPaths } = existing;
		const { paths: generatedPaths } = generated;

		const paths = mapValues(generatedPaths, (generated, key) => mergeOperations(generated, existingPaths?.[key]));
		return { ...generated, paths };
	}

	protected mergeDefinitions(existing: ILoadedResource, generated: ILoadedResource): ILoadedResource {
		const { definitions: existingDefinitions } = existing;
		const { definitions: generatedDefinitions } = generated;

		const definitions =
			generatedDefinitions &&
			mapValues(generatedDefinitions, (generated, key) => mergeSchemas(generated, existingDefinitions?.[key]));
		return { ...generated, definitions };
	}

	mergeResource(existing: ILoadedResource, generated: ILoadedResource): ILoadedResource {
		const resource = this.mergePaths(existing, generated);
		return this.mergeDefinitions(existing, resource);
	}
}
