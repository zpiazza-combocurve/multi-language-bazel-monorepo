/**
 * OpenAPI data types
 * docs: https://swagger.io/docs/specification/data-models/data-types/
 * NOTE:
 *  This file is currently a duplicate of the one in lib.
 *  Keeping it here is the easiest while lib dir is not included in the production build.
 *  We'll do something about it once I have a clearer idea about the future or lib/express-openapi-ts
 */

export enum OpenApiDataType {
	array = 'array',
	boolean = 'boolean',
	integer = 'integer',
	number = 'number',
	object = 'object',
	string = 'string',
}

export enum OpenApiIntegerFormat {
	int32 = 'int32', // signed 32-bit integers (commonly used integer type)
	int64 = 'int64', // signed 64-bit integers (long type)
}

export enum OpenApiNumberFormat {
	float = 'float', // floating-point numbers
	double = 'double', // floating-point numbers with double precision
}

export enum OpenApiStringFormat {
	'date-time' = 'date-time', // the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z
	binary = 'binary', // binary data, used to describe files (see Files below)
	byte = 'byte', // base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==
	date = 'date', // full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21
	password = 'password', // a hint to UIs to mask the input
}
