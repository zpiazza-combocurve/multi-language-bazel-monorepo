import { IOpenApiOperation, IOpenApiPath, IOpenApiSchema } from '../lib/express-openapi-ts/openapi-2';
import { sortKeys } from '../lib/express-openapi-ts/spec/helpers/keys-order';

import {
	populateResponseExampleFromDef,
	removeClientGenerationProperty,
	removeNoUsedGoogleProperties,
} from './config.maps';
import config from './config';

const mapOperation = (operation: IOpenApiOperation, definitions: Record<string, IOpenApiSchema>) => {
	if (operation['x-no-doc']) {
		return undefined;
	}

	const operationNoGoogleProperties = removeNoUsedGoogleProperties(operation);
	const operationNoClientProperties = removeClientGenerationProperty(operationNoGoogleProperties);

	const operationMapped = {
		...operationNoClientProperties,
		operationId: operationNoClientProperties.operationId.replace('-v1-', '-'),
	};

	const operationWithResponseExamples = populateResponseExampleFromDef(operationMapped, definitions);

	return sortKeys(operationWithResponseExamples);
};

export default {
	...config,
	pathMap: (path: IOpenApiPath, definitions: Record<string, IOpenApiSchema>): IOpenApiPath | undefined => {
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
	outputFile: 'openapi-spec-doc.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-doc.yaml'],
};
