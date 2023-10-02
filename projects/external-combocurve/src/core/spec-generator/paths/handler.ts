/* eslint-disable 
	complexity,
	@typescript-eslint/explicit-module-boundary-types, 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */
import Handlebars from 'handlebars';

import { IInternalRequestBindOptions, RequestBindOptionsKey, RequestBindPropertiesKey } from '@src/core/common';
import { PayloadCommandRequest } from '@src/core/requests/base';
import { specs } from '@src/core/metadata/metadata';

import { Controller, RouteRequest } from '../../controllers/base';
import { EndpointParameterSpec, EndpointPathSpec, EndpointResponseSpec, pathsTemplate } from '../templates';
import { getExample } from '../example.helper';

const statusNameMap: Record<number, string> = {
	200: 'OK',
	201: 'Created',
	202: 'Accepted',
	204: 'NoContent',
	207: 'MultiStatus',
	400: 'BadRequest',
	401: 'Unauthorized',
	403: 'Forbidden',
	404: 'NotFound',
};

export class PathsGenHandler<TController extends Controller> {
	private controller: TController;
	private definitionsBasePath: string;
	private baseRoute: string;
	private idPrefix: string;

	constructor(baseRoute: string, controller: TController, idPrefix?: string, definitionsBasePath?: string) {
		this.baseRoute = baseRoute;
		this.controller = controller;
		this.idPrefix = idPrefix ?? 'v1';
		this.definitionsBasePath = definitionsBasePath ?? '#/definitions/';
	}

	public getPathSpec(): string {
		const output: Record<string, EndpointPathSpec[]> = {};

		for (const routeRegister of this.controller.Routes) {
			const routeEndpoint = this.baseRoute + routeRegister.route;
			if (routeRegister.notGenerateSpecs !== true) {
				const routeSpec = this.getRouteSpec(routeRegister);

				const methodsForRoute = output[routeEndpoint] ?? [];
				methodsForRoute.push(routeSpec);

				output[routeEndpoint] = methodsForRoute;
			}
		}

		const templateInput = {
			routes: Object.entries(output).map(([endpoint, methods]) => ({
				completeRoute: endpoint,
				methods,
			})),
		};

		const template = Handlebars.compile(pathsTemplate);
		const result = template(templateInput);

		return result.substring(result.indexOf('\n') + 1);
	}

	public getRouteSpec(route: RouteRequest): EndpointPathSpec {
		const requestName = getNameFromType(route.requestSample).toLowerCase();
		const routeSpec: EndpointPathSpec = {
			verb: route.method,
			id: `${route.method}-${this.idPrefix}-${requestName}`,
			parameters: [],
			responses: [],
		};

		if (route.method === 'post' || route.method === 'put') {
			routeSpec.consumes = 'application/json';
			routeSpec.produces = 'application/json';
		}

		routeSpec.parameters = [...this.getParameters(route.requestSample)];
		routeSpec.responses = [...this.getResponses(route.requestSample)];

		return routeSpec;
	}

	public *getParameters(requestSample: any): Generator<EndpointParameterSpec> {
		const bindProperties = Reflect.getMetadata(RequestBindPropertiesKey, requestSample) as string[];
		for (const propertyKey of bindProperties ?? []) {
			const options = Reflect.getMetadata(
				RequestBindOptionsKey,
				requestSample,
				propertyKey,
			) as IInternalRequestBindOptions;

			if (!options || options.fromWhere === 'services') {
				continue;
			}

			if (options.fromWhere === 'composition') {
				for (const param of this.getParameters(
					options.objFactory ? options.objFactory() : requestSample[propertyKey],
				)) {
					yield param;
				}

				continue;
			}

			if (options.expects === 'take' || options.expects === 'skip' || options.expects === 'sort') {
				yield this.getSearchParam(requestSample, options);
			}

			const parameter: any = {
				fromWhere: options.fromWhere,
				name: propertyKey,
				required: options.isOptional ? false : true,
				type: options.expects === 'objectID' ? 'string' : options.expects,
				example: getExample(options.expects, propertyKey),
			};

			if (!this.checkPayloadCommandRequestEdgeCase(requestSample, parameter, options)) {
				if (options.expects === 'object') {
					this.completeObjectParameter(propertyKey, requestSample, parameter, options);
				} else if (options.expects === 'array') {
					this.completeArrayParameter(parameter, options);
				}
			}

			yield parameter as EndpointParameterSpec;
		}
	}

	private getSearchParam(requestSample: any, options: IInternalRequestBindOptions): EndpointParameterSpec {
		const searchParam = options.expects as 'take' | 'skip' | 'sort';
		switch (searchParam) {
			case 'skip':
				return {
					fromWhere: 'query',
					name: 'skip',
					description: 'number of items to skip',
					default: requestSample.skip ?? '0',
					type: 'integer',
					format: 'int32',
				};
			case 'take':
				return {
					fromWhere: 'query',
					name: 'take',
					type: 'integer',
					format: 'int32',
					description: 'max records to return',
					default: requestSample.take ?? '25',
					minimum: 1,
					maximum: 200,
				};
			case 'sort':
				return {
					fromWhere: 'query',
					name: 'sort',
					type: 'string',
					default: 'id',
					description:
						'field to sort by, including + or - at the beginning for ascending or descending order, respectively',
					stringEnum: options.requirements?.validValues as string[],
				};
		}
	}

	private checkPayloadCommandRequestEdgeCase(
		requestSample: any,
		parameter: any,
		options: IInternalRequestBindOptions,
	): boolean {
		if (options.isBody && requestSample instanceof PayloadCommandRequest) {
			parameter.isArray = true;
			parameter.itemsTypeKey = '$ref';
			parameter.itemsType = `${this.definitionsBasePath}${getNameFromType(options.objFactory!())}`;
			return true;
		}

		return false;
	}

	private completeObjectParameter(
		propertyKey: string,
		requestSample: any,
		parameter: any,
		options: IInternalRequestBindOptions,
	) {
		delete parameter.type;

		if (options.customParse !== undefined && options.objFactory === undefined) {
			const reqName = getNameFromType(requestSample);
			const propName = capitalize(propertyKey);

			parameter.schema = `${this.definitionsBasePath}${reqName}${propName}Input`;
			return;
		}

		parameter.schema = `${this.definitionsBasePath}${getNameFromType(options.objFactory!())}`;
	}

	private completeArrayParameter(parameter: any, options: IInternalRequestBindOptions) {
		parameter.isArray = true;
		parameter.minItems = options.requirements?.minItems;
		parameter.maxItems = options.requirements?.maxItems;

		delete parameter.example;

		if (options.expects === 'object') {
			const arrayObj = options.objFactory!();

			parameter.itemsTypeKey = '$ref';
			parameter.itemsType = `${this.definitionsBasePath}${getNameFromType(arrayObj)}`;
		} else {
			parameter.itemsTypeKey = 'type';
			parameter.itemsType = options.itemsExpects === 'objectID' ? 'string' : options.itemsExpects;
			parameter.itemsExample = getExample(options.itemsExpects!, '');
		}
	}

	public *getResponses(requestSample: any): Generator<EndpointResponseSpec> {
		for (const responseSpecOptions of specs.responseOptions(requestSample.constructor).sort((s) => +s.status)) {
			const statusName = statusNameMap[responseSpecOptions.status] ?? '';

			const responseSpec: EndpointResponseSpec = {
				status: responseSpecOptions.status,
				description: `${statusName} Response`,
			};

			if (responseSpecOptions.schema) {
				const requestName = getNameFromType(requestSample);
				responseSpec.schema = `${this.definitionsBasePath}${requestName}${statusName}Response`;
			}

			if (responseSpecOptions.headers) {
				responseSpec.headers = Object.entries(responseSpecOptions.headers).map(([key, value]) => ({
					name: key,
					type: typeof value,
				}));
			}

			yield responseSpec;
		}
	}
}

function getNameFromType(type: any): string {
	return Object.getPrototypeOf(type).constructor.name;
}

function capitalize(s?: string): string {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
