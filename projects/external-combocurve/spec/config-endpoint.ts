import { IOpenApiOperation, IOpenApiPath, IOpenApiSchema } from '../lib/express-openapi-ts/openapi-2';
import { getModelDefinitionName } from '../lib/express-openapi-ts/spec/helpers/definition-name';
import { sortKeys } from '../lib/express-openapi-ts/spec/helpers/keys-order';

import config from './config';
import { removeClientGenerationProperty } from './config.maps';

const replaceArrayBodyWithObject = (
	operation: IOpenApiOperation,
	definitions: Record<string, IOpenApiSchema>,
): IOpenApiOperation => ({
	...operation,
	parameters: operation.parameters.map((parameter) => {
		if (parameter.in !== 'body' || !parameter?.schema?.$ref) {
			return parameter;
		}

		const def = definitions[getModelDefinitionName(parameter.schema.$ref)];

		if (def.type !== 'array') {
			return parameter;
		}

		return {
			...parameter,
			schema: {
				...parameter.schema,
				$ref: def.items.$ref,
			},
		};
	}),
});

const mapOperation = (operation: IOpenApiOperation, definitions: Record<string, IOpenApiSchema>) => {
	// Cloud Endpoint Issue https://issuetracker.google.com/issues/67419090
	const operationWithoutArrayBody = replaceArrayBodyWithObject(operation, definitions);
	const operationNoClientProperties = removeClientGenerationProperty(operationWithoutArrayBody);

	return sortKeys(operationNoClientProperties);
};

export default {
	...config,
	pathMap: (path: IOpenApiPath, definitions: Record<string, IOpenApiSchema>): IOpenApiPath => {
		return {
			...path,
			delete: path.delete && mapOperation(path.delete, definitions),
			get: path.get && mapOperation(path.get, definitions),
			head: path.head && mapOperation(path.head, definitions),
			patch: path.patch && mapOperation(path.patch, definitions),
			post: path.post && mapOperation(path.post, definitions),
			put: path.put && mapOperation(path.put, definitions),
		};
	},
	specBaseFiles: [...config.specBaseFiles],
};
