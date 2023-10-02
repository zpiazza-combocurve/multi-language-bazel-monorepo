import {
	IOpenApiOperation,
	IOpenApiParameter,
	IOpenApiPath,
	IOpenApiSchema,
} from '../lib/express-openapi-ts/openapi-2';
import { GoogleRateLimitManagement } from '../lib/express-openapi-ts/openapi-google-extensions';
import { sortKeys } from '../lib/express-openapi-ts/spec/helpers/keys-order';

import { populateResponseExampleFromDef, removeNoUsedGoogleProperties } from './config.maps';
import config from './config';

const PAGINATION_PARAMETERS = ['skip', 'take', 'cursor'];

const CURSOR_PAGINATION_PARAMETERS = ['take', 'cursor'];

const SKIP_TAKE_PAGINATION_PARAMETERS = ['take', 'skip'];

const mapDefinition = (def: IOpenApiSchema): IOpenApiSchema => {
	if (def['x-no-client']) {
		return undefined;
	}
	if (def.type === 'object') {
		return {
			...def,
			properties:
				def.properties &&
				Object.keys(def.properties).reduce(
					(acc, key) => ({
						...acc,
						[key]: {
							...(['object', 'array'].includes(def.properties[key].type)
								? mapDefinition(def.properties[key])
								: def.properties[key]),
							'x-nullable': def.required === undefined || !def.required.includes(key) ? true : undefined,
						},
					}),
					{},
				),
		};
	} else if (def.type == 'array' && def.items && ['object', 'array'].includes(def.items.type)) {
		return {
			...def,
			items: mapDefinition(def.items),
		};
	}

	return def;
};

const metricBoolMap = {
	'read-request-rate': 'isRead',
	'write-request-rate': 'isWrite',
};

const mapOperation = (operation: IOpenApiOperation, definitions: Record<string, IOpenApiSchema>) => {
	if (operation['x-no-client']) {
		return undefined;
	}
	const { description, ...operationNoGoogleProperties } = removeNoUsedGoogleProperties(operation);

	const operationMapped = {
		...operationNoGoogleProperties,
		summary: operationNoGoogleProperties.summary || description,
		operationId: operationNoGoogleProperties.operationId.replace('-v1-', '-'),
	};

	const operationWithResponseExamples = populateResponseExampleFromDef(operationMapped, definitions);

	return sortKeys(operationWithResponseExamples);
};

export default {
	...config,
	definitionMap: (def: IOpenApiSchema): IOpenApiSchema => mapDefinition(def),
	pathMap: (path: IOpenApiPath, definitions: Record<string, IOpenApiSchema>): IOpenApiPath => {
		const result = {
			...path,
			delete: path.delete && mapOperation(path.delete, definitions),
			get: path.get && mapOperation(path.get, definitions),
			head: path.head && mapOperation(path.head, definitions),
			patch: path.patch && mapOperation(path.patch, definitions),
			post: path.post && mapOperation(path.post, definitions),
			put: path.put && mapOperation(path.put, definitions),
		};
		return Object.values(result).some((a) => a !== undefined) ? result : undefined;
	},
	extensionMap: (extension: unknown, key: string): unknown => {
		if (key === 'x-google-management') {
			const rateLimit = extension as GoogleRateLimitManagement;

			const newLimits = rateLimit.quota.limits
				.filter((limit) => limit.metric in metricBoolMap)
				.map((limit) => ({ ...limit, [metricBoolMap[limit.metric]]: true }));

			return {
				...rateLimit,
				quota: {
					...rateLimit.quota,
					limits: [...newLimits],
				},
			};
		}

		return extension;
	},
	parameterMap: (parameter: IOpenApiParameter): IOpenApiParameter => {
		const withPagination = PAGINATION_PARAMETERS.includes(parameter.name)
			? { ...parameter, 'x-pagination': true }
			: { ...parameter };
		const withCursorPagination = CURSOR_PAGINATION_PARAMETERS.includes(parameter.name)
			? { ...withPagination, 'x-cursor-pagination': true }
			: withPagination;
		return SKIP_TAKE_PAGINATION_PARAMETERS.includes(parameter.name)
			? { ...withCursorPagination, 'x-skip-take-pagination': true }
			: withCursorPagination;
	},
	outputFile: 'openapi-spec-client.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-client.yaml'],
};
