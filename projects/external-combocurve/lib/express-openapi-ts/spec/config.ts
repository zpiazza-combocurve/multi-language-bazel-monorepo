import { IOpenApiPath, IOpenApiParameter, IOpenApiSchema } from '../openapi-2';
import { ResourceSchema, ReadOptions, WriteOptions } from './resource';

export interface IResourceConfig {
	definitionName?: string;
	generateDefinitions: boolean;
	relativeDir?: string;
	schema: ResourceSchema;
	writeOptions?: WriteOptions;
	readOptions?: ReadOptions;
	generated: true;
	controller: unknown;
}

export interface ISpecConfig {
	definitionMap?: (def: IOpenApiSchema) => IOpenApiSchema;
	modulesBaseDir: string;
	outputFile?: string;
	pathMap?: (path: IOpenApiPath, definitions: Record<string, IOpenApiSchema>) => IOpenApiPath;
	extensionMap?: (extension: unknown, key: string) => unknown;
	parameterMap?: (parameter: IOpenApiParameter) => IOpenApiParameter;
	resources: {
		[uri: string]: IResourceConfig;
	};
	specBaseFiles: string[]; // relative to `specDir`
	specDir: string;
}
