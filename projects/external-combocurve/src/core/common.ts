import { Request, Response } from 'express';

export type ExpectType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'object'
	| 'array'
	| 'sort'
	| 'page'
	| 'skip'
	| 'take'
	| 'objectID'
	| 'service'
	| 'custom';

export type ParseOutput = {
	errorName?: string | undefined;
	errorMsg?: string | undefined;
	errorReason?: string | undefined;
	parsedValue?: unknown;
};

export type ParseInput = {
	name: string;
	value: unknown;
	location: string;
	model: unknown;
	request: Request;
	requirements?: IValueRequirements;
};

export type ParseFN = (input: ParseInput) => ParseOutput;

export interface InvalidValue {
	value: unknown;
	reason: string;
}

export interface IValueRequirements {
	maxLength?: number;
	validValues?: unknown[];
	invalidValues?: InvalidValue[];
	range?: [number, number];
	minItems?: number;
	maxItems?: number;
}

export type HttpMessageContext = {
	request: Request;
	response: Response;
	method?: {
		name?: string;
		httpMethod?: 'head' | 'get' | 'post' | 'put' | 'delete';
	};
};

export interface IInternalRequestBindOptions extends IRequestBindOptions {
	fromWhere: 'body' | 'query' | 'params' | 'services' | 'scope' | 'composition';
}

export interface IBindSpecOptions {
	description?: string;
	sample?: unknown;
}

export interface IRequestBindOptions {
	/**
	 * True if the property is not required.
	 * If the property is not required and the value is not present, an error will raised
	 */
	isOptional?: boolean;

	/** The type expected from the source */
	expects: ExpectType;

	/** When expects is 'array' use this property to define the items type */
	itemsExpects?: ExpectType;

	/** When the values is from route specify the index */
	routeIdx?: number;

	/**
	 * Set the order to bind.
	 * The default order it's the order of the properties in the class
	 */
	order?: number;

	/** The value requirement */
	requirements?: IValueRequirements;

	/** Use this property to indicate the value is the body and not present in it */
	isBody?: boolean;

	/**
	 * The value will be validated using the ajv schema.
	 * Set the schema name here
	 */
	ajvSchema?: string;

	/**
	 * When the expects is 'object' set this function to create the object.
	 * @returns the empty object expected from the target
	 */
	objFactory?: () => unknown;

	/**
	 * When the target value has a constructor or has some logic to define it
	 * @param value the value expected from the source
	 * @returns the target value
	 */
	targetConstructor?: (value: unknown) => unknown;

	/**
	 * When the expects is 'custom' set this function to parse the value.
	 */
	customParse?: ParseFN;

	/** Some info to add on spec files */
	specOptions?: IBindSpecOptions;
}

export enum NamingTypes {
	/** The name of the property in the source should match exactly */
	ExactlyEqual = 1,

	/** Accepts PascaCase */
	PascalCase = 2,

	/** Accepts snake_case */
	SnakeCase = 4,

	/** Accepts snake_case, PascalCase and the same name as the property */
	All = 7,
}

export const RequestBindOptionsKey = Symbol('requestBindOptions');
export const RequestBindPropertiesKey = Symbol('requestBindProperties');
export const SpecResponseMethodKey = Symbol('specResponseMethod');
export const SpecControllerKey = Symbol('specControllerKey');
export const SpecRequestKey = Symbol('specRequestKey');

export function camelToPascal(camelCase: string): string {
	return camelCase.replace(/(?:^|[\s_-])(\w)/g, (_, char) => char.toUpperCase());
}

export function camelToSnake(camelCase: string): string {
	return camelCase.replace(/(?:^|\.?)([A-Z])/g, (_, char) => '_' + char.toLowerCase()).replace(/^_/, '');
}
