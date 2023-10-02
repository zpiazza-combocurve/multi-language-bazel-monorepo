import { IOpenApiPath, IOpenApiSchema, OpenApiFormat, OpenApiPrimitiveType } from '../openapi-2';

export type ResourceDefinitions = Record<string, IOpenApiSchema>;
export type ResourcePaths = Record<string, IOpenApiPath>;

export interface WriteOptions {
	recordLimit: number;
}

export interface ReadOptions {
	recordLimit: number;
}

export interface IResourceSchemaField {
	properties?: Record<string, IResourceSchemaField>;
	items?: IResourceSchemaField;
	format?: OpenApiFormat;
	isRequired?: boolean;
	maxLength?: number;
	type: OpenApiPrimitiveType;
	read?: (...args: any[]) => any;
	write?: (...args: any[]) => void;
}

export type ResourceSchema = Record<string, IResourceSchemaField>;

export interface ILoadedResource {
	definitionName?: string;
	definitions: ResourceDefinitions;
	dir: string;
	generateDefinitions: boolean;
	paths: ResourcePaths;
	relativeDir: string;
	schema: ResourceSchema;
	uri: string;
	writeOptions?: WriteOptions;
	readOptions?: ReadOptions;
}
