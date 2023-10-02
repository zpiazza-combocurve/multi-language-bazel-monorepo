import { IOpenApiOperation, IOpenApiSchema } from '../lib/express-openapi-ts/openapi-2';
import { getModelDefinitionName } from '../lib/express-openapi-ts/spec/helpers/definition-name';

const googlePropertiesUsed = ['x-google-quota'];

const removeNoUsedGoogleProperties = (operation: IOpenApiOperation): IOpenApiOperation => {
	return Object.keys(operation)
		.filter((x) => !x.startsWith('x-google-') || googlePropertiesUsed.includes(x))
		.reduce(
			(acc, key) => ({
				...acc,
				[key]: operation[key],
			}),
			{} as IOpenApiOperation,
		);
};

const removeClientGenerationProperty = (operation: IOpenApiOperation): IOpenApiOperation => {
	return Object.keys(operation)
		.filter((key) => key !== 'x-client-generation')
		.reduce(
			(acc, key) => ({
				...acc,
				[key]: operation[key],
			}),
			{} as IOpenApiOperation,
		);
};

const populateResponseExampleFromDef = (
	operation: IOpenApiOperation,
	definitions: Record<string, IOpenApiSchema>,
): IOpenApiOperation => {
	if (!operation.produces || !operation.produces.includes('application/json')) {
		return operation;
	}

	const responsesWithExamplesFromDef = Object.keys(operation.responses).reduce(
		(acc, key) => ({
			...acc,
			[key]: {
				...operation.responses[key],
				examples:
					!operation.responses[key].examples?.['application/json'] &&
					operation.responses[key].schema?.$ref &&
					definitions[getModelDefinitionName(operation.responses[key].schema.$ref)].example
						? {
								...(operation.responses[key].examples || {}),
								['application/json']:
									definitions[getModelDefinitionName(operation.responses[key].schema.$ref)].example,
						  }
						: operation.responses[key].examples,
			},
		}),
		{},
	);

	return {
		...operation,
		responses: responsesWithExamplesFromDef,
	};
};

export { populateResponseExampleFromDef, removeClientGenerationProperty, removeNoUsedGoogleProperties };
