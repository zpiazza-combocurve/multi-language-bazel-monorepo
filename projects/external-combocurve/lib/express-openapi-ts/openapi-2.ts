/**
 * https://swagger.io/specification/v2/
 *
 * mime types: https://tools.ietf.org/html/rfc6838
 * mime types: https://swagger.io/specification/v2/#mimeTypes
 * status codes: https://tools.ietf.org/html/rfc7231#section-6
 * status codes: http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
 */

// utility types

interface IDictionary<T = any> {
	[key: string]: T;
}

// OpenAPI 2.0 types
// source: https://github.com/ferdikoomen/openapi-typescript-codegen/blob/master/src/openApi/v2/interfaces
/*
    array       A JSON array.
    boolean     A JSON boolean.
    integer     A JSON number without a fraction or exponent part.
    number      Any JSON number. Number includes integer.
    object      A JSON object.
    string      A JSON string.
*/
export type OpenApiPrimitiveType = 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';

export type OpenApiFormat =
	| 'int32' // signed 32 bits
	| 'int64' // signed 64 bits
	| 'float'
	| 'double'
	| 'string'
	| 'boolean'
	| 'byte' // base64 encoded characters
	| 'binary' // any sequence of octets
	| 'date' // ss defined by full-date - RFC3339
	| 'date-time' // as defined by date-time - RFC3339
	| 'password'; // used to hint UIs the input needs to be obscured

type OpenApiCollectionFormat = 'csv' | 'ssv' | 'tsv' | 'pipes';

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#contactObject
 */
export interface IOpenApiContact {
	email?: string;
	name?: string;
	url?: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#licenseObject
 */
export interface IOpenApiLicense {
	name: string;
	url?: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#infoObject
 */
export interface IOpenApiInfo {
	contact?: IOpenApiContact;
	description?: string;
	license?: IOpenApiLicense;
	termsOfService?: string;
	title: string;
	version: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#externalDocumentationObject
 */
export interface IOpenApiExternalDocs {
	description?: string;
	url: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject
 */
export interface IOpenApiReference {
	$ref?: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#itemsObject
 */
export interface IOpenApiItems {
	collectionFormat?: OpenApiCollectionFormat;
	default?: any;
	enum?: (string | number)[];
	exclusiveMaximum?: number;
	exclusiveMinimum?: number;
	format?: OpenApiFormat;
	items?: IOpenApiItems;
	maxItems?: number;
	maxLength?: number;
	maximum?: number;
	minItems?: number;
	minLength?: number;
	minimum?: number;
	multipleOf?: number;
	pattern?: string;
	type?: OpenApiPrimitiveType;
	uniqueItems?: boolean;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#xmlObject
 */
export interface IOpenApiXml {
	attribute?: boolean;
	name?: string;
	namespace?: string;
	prefix?: string;
	wrapped?: boolean;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject
 */
export interface IOpenApiSchema extends IOpenApiReference {
	[key: string]: any;
	additionalProperties?: boolean | IOpenApiSchema;
	allOf?: IOpenApiSchema[];
	default?: any;
	description?: string;
	discriminator?: string;
	enum?: (string | number)[];
	example?: any;
	exclusiveMaximum?: boolean;
	exclusiveMinimum?: boolean;
	externalDocs?: IOpenApiExternalDocs;
	format?: OpenApiFormat;
	items?: IOpenApiSchema;
	maxItems?: number;
	maxLength?: number;
	maxProperties?: number;
	maximum?: number;
	minItems?: number;
	minLength?: number;
	minProperties?: number;
	minimum?: number;
	multipleOf?: number;
	pattern?: string;
	properties?: IDictionary<IOpenApiSchema>;
	readOnly?: boolean;
	required?: string[];
	title?: string;
	type?: OpenApiPrimitiveType;
	uniqueItems?: boolean;
	xml?: IOpenApiXml;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parameterObject
 */
export interface IOpenApiParameter extends IOpenApiReference {
	[key: string]: any;
	allowEmptyValue?: boolean;
	collectionFormat?: OpenApiCollectionFormat;
	default?: any;
	description?: string;
	enum?: (string | number)[];
	exclusiveMaximum?: boolean;
	exclusiveMinimum?: boolean;
	format?: OpenApiFormat;
	in: 'path' | 'query' | 'header' | 'formData' | 'body';
	items?: IOpenApiItems;
	maxItems?: number;
	maxLength?: number;
	maximum?: number;
	minItems?: number;
	minLength?: number;
	minimum?: number;
	multipleOf?: number;
	name: string;
	pattern?: string;
	required?: boolean;
	schema?: IOpenApiSchema;
	type?: string;
	uniqueItems?: boolean;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#headerObject
 */
export interface IOpenApiHeader {
	collectionFormat?: OpenApiCollectionFormat;
	default?: any;
	description?: string;
	enum?: (string | number)[];
	exclusiveMaximum?: boolean;
	exclusiveMinimum?: boolean;
	format?: OpenApiFormat;
	items?: IDictionary<IOpenApiItems>;
	maxItems?: number;
	maxLength?: number;
	maximum?: number;
	minItems?: number;
	minLength?: number;
	minimum?: number;
	multipleOf?: number;
	pattern?: string;
	type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
	uniqueItems?: boolean;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject
 */
export interface IOpenApiExample {
	[mimetype: string]: any;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responseObject
 */
export interface IOpenApiResponse extends IOpenApiReference {
	description: string;
	schema?: IOpenApiSchema & IOpenApiReference;
	headers?: IDictionary<IOpenApiHeader>;
	examples?: IOpenApiExample;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responsesObject
 */
export interface IOpenApiResponses {
	default?: IOpenApiResponse;

	[httpcode: string]: IOpenApiResponse;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject
 */
export interface IOpenApiSecurityRequirement {
	[key: string]: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#operationObject
 */
export interface IOpenApiOperation {
	consumes?: string[]; // https://swagger.io/specification/v2/#mimeTypes
	deprecated?: boolean;
	description?: string;
	externalDocs?: IOpenApiExternalDocs;
	operationId?: string;
	parameters?: IOpenApiParameter[];
	produces?: string[]; // https://swagger.io/specification/v2/#mimeTypes
	responses: IOpenApiResponses;
	schemes: ('http' | 'https' | 'ws' | 'wss')[];
	security?: IOpenApiSecurityRequirement[];
	summary?: string;
	tags?: string[];
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#pathItemObject
 */
export interface IOpenApiPath extends IOpenApiReference {
	delete?: IOpenApiOperation;
	get?: IOpenApiOperation;
	head?: IOpenApiOperation;
	options?: IOpenApiOperation;
	parameters?: IOpenApiParameter[];
	patch?: IOpenApiOperation;
	post?: IOpenApiOperation;
	put?: IOpenApiOperation;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securitySchemeObject
 */
export interface IOpenApiSecurityScheme {
	authorizationUrl?: string;
	description?: string;
	flow?: 'implicit' | 'password' | 'application' | 'accessCode';
	in?: 'query' | 'header';
	name?: string;
	scopes: IDictionary<string>;
	tokenUrl?: string;
	type: 'basic' | 'apiKey' | 'oauth2';
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject
 */
export interface IOpenApiTag {
	description?: string;
	externalDocs?: IOpenApiExternalDocs;
	name: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
 */
export interface IOpenApi2 {
	basePath?: string;
	consumes?: string[]; // https://swagger.io/specification/v2/#mimeTypes
	definitions?: IDictionary<IOpenApiSchema>;
	externalDocs?: IOpenApiExternalDocs;
	host?: string;
	info: IOpenApiInfo;
	parameters?: IDictionary<IOpenApiParameter>;
	paths: IDictionary<IOpenApiPath>;
	produces?: string[]; // https://swagger.io/specification/v2/#mimeTypes
	responses?: IDictionary<IOpenApiResponse>;
	schemes?: string[];
	security?: IOpenApiSecurityRequirement[];
	securityDefinitions?: IDictionary<IOpenApiSecurityScheme>;
	swagger: string;
	tags?: IOpenApiTag[];
}
