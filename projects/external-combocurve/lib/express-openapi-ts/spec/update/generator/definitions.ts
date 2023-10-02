import { IOpenApiSchema } from '@lib/express-openapi-ts/openapi-2';
import {
	ILoadedResource,
	IResourceSchemaField,
	ResourceDefinitions,
	ResourceSchema,
	WriteOptions,
	ReadOptions,
} from '../../resource';

const toSingular = (str: string) => {
	const clean = str.trim();
	if (clean.endsWith('s')) {
		return clean.slice(0, clean.length - 1);
	}
	return clean;
};

const toPascalCase = (str: string) => {
	const camelCase = str.replace(/[-_]([a-z])/g, (match, p1) => p1.toUpperCase());
	if (!camelCase) {
		return camelCase;
	}
	return camelCase[0].toUpperCase() + camelCase.slice(1);
};

const toModelDefinitionName = (collection: string) => `${toSingular(toPascalCase(collection))}`;

const toModelListDefinitionName = (collection: string) => `${toSingular(toPascalCase(collection))}List`;

const toInputDefinitionName = (collection: string) => `${toSingular(toPascalCase(collection))}Input`;

const toInputListDefinitionName = (collection: string) => `${toSingular(toPascalCase(collection))}InputList`;

const getCollection = (resourcePath: string) => {
	const parts = resourcePath.split('/');
	return parts[parts.length - 1];
};

const mapProperty = (field: IResourceSchemaField) => {
	const { format, items, maxLength, properties, type } = field;
	const property: IOpenApiSchema = {
		type,
	};
	if (format) {
		property.format = format;
	}
	if (items) {
		property.items = mapProperty(items);
	}
	if (maxLength) {
		property.maxLength = maxLength;
	}
	if (properties) {
		property.properties = Object.keys(properties).reduce(
			(accumulator, curr) => ({ ...accumulator, [curr]: mapProperty(properties[curr]) }),
			{},
		);
	}
	return property;
};

const compareLexicographically = (a: string, b: string) => {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};

const mapModelFields = (schema: ResourceSchema) =>
	Object.keys(schema)
		.sort(compareLexicographically)
		.filter((key) => schema[key].read)
		.reduce((accumulator, key) => ({ ...accumulator, [key]: mapProperty(schema[key]) }), {});

const mapModelInputFields = (schema: ResourceSchema) =>
	Object.keys(schema)
		.sort(compareLexicographically)
		.filter((key) => schema[key].write)
		.reduce((accumulator, key) => ({ ...accumulator, [key]: mapProperty(schema[key]) }), {});

const mapModelRequiredFields = (schema: ResourceSchema) =>
	Object.keys(schema)
		.sort(compareLexicographically)
		.filter((key) => schema[key].isRequired);

const createModelDefinition = (collection: string, schema: ResourceSchema) => {
	const requiredFields = mapModelRequiredFields(schema);
	const definition = {
		// preserve key order to avoid noisy diffs
		type: 'object',
		required: requiredFields.length > 0 ? requiredFields : undefined,
		properties: mapModelFields(schema),
	};
	const definitionName = toModelDefinitionName(collection);
	return [definitionName, definition] as [string, IOpenApiSchema];
};

const createModelListDefinition = (collection: string, readOptions?: ReadOptions) => {
	const modelDefinitionName = toModelDefinitionName(collection);
	const modelListDefinitionName = toModelListDefinitionName(collection);

	const definition: IOpenApiSchema = {
		type: 'array',
		items: {
			$ref: `#/definitions/${modelDefinitionName}`,
		},
	};

	if (readOptions?.recordLimit) {
		definition.maxItems = readOptions.recordLimit;
	}

	return [modelListDefinitionName, definition] as [string, IOpenApiSchema];
};

const createInputDefinition = (collection: string, schema: ResourceSchema) => {
	const definitionName = toInputDefinitionName(collection);
	const requiredFields = mapModelRequiredFields(schema);
	const definition = {
		// preserve key order to avoid noisy diffs
		type: 'object',
		required: requiredFields.length > 0 ? requiredFields : undefined,
		properties: mapModelInputFields(schema),
	};
	return [definitionName, definition] as [string, IOpenApiSchema];
};

const createInputListDefinition = (collection: string, writeOptions?: WriteOptions) => {
	const inputDefinitionName = toInputDefinitionName(collection);
	const inputListDefinitionName = toInputListDefinitionName(collection);

	const definition: IOpenApiSchema = {
		type: 'array',
		items: {
			$ref: `#/definitions/${inputDefinitionName}`,
		},
	};

	if (writeOptions?.recordLimit) {
		definition.maxItems = writeOptions.recordLimit;
	}

	return [inputListDefinitionName, definition] as [string, IOpenApiSchema];
};

export type GenerateDefinitionsFn = (existing: ILoadedResource, hasWrite: boolean) => ResourceDefinitions;

export const generateDefinitions: GenerateDefinitionsFn = (existing, hasWrite) => {
	const { definitionName, schema, uri, writeOptions, readOptions } = existing;

	const collection = definitionName || getCollection(uri);
	const definitions: ResourceDefinitions = [
		createModelDefinition(collection, schema),
		createModelListDefinition(collection, readOptions),
		...(hasWrite
			? [createInputDefinition(collection, schema), createInputListDefinition(collection, writeOptions)]
			: []),
	].reduce((accumulator, [definitionName, definition]) => ({ ...accumulator, [definitionName]: definition }), {});

	return definitions;
};
