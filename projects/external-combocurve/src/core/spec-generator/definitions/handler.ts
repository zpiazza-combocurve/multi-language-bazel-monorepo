/* eslint-disable 
	complexity,
	@typescript-eslint/explicit-module-boundary-types, 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */
import Handlebars from 'handlebars';

import { definitionsTemplate, ObjectDefinitionSpec } from '../templates';
import { IInternalRequestBindOptions, RequestBindOptionsKey, RequestBindPropertiesKey } from '../../common';
import { Controller } from '../../controllers/base';
import { fillDefinitionExamples } from '../example.helper';
import { PayloadCommandRequest } from '../../requests/base';
import { specs } from '../../metadata/metadata';

import { reqParseInput, requestSpecParses, resParseInput, responseSpecParses } from './parses';

type sampleObjContext = {
	obj: any; // The object sample
	name?: string; // The name of the definitions. It's different for reponse and inner objects
	parentKey?: string; // When it's a inner obj of a response, this is the key of the parent object
};

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

export class DefinitionsGenHandler<TController extends Controller> {
	private controller: TController;
	private definitionsBasePath: string;

	constructor(controller: TController, definitionsBasePath?: string) {
		this.controller = controller;
		this.definitionsBasePath = definitionsBasePath ?? '#/definitions/';
	}

	public getDefinitionSpec(): string {
		const requestHash = new Set<string>();
		const objectsDefinitions: ObjectDefinitionSpec[] = [];

		for (const route of this.controller.Routes) {
			const routeRequestModel = route.requestSample;
			const requestName = this.getNameFromType(routeRequestModel);

			// Sometimes we can use the same request model for different routes
			if (requestHash.has(requestName)) {
				continue;
			}

			requestHash.add(requestName);

			objectsDefinitions.push(...this.mapRequestObjects(routeRequestModel));
			objectsDefinitions.push(...this.mapResponseSamples(requestName, routeRequestModel as Record<string, any>));
		}

		// Create the complete examples
		fillDefinitionExamples(objectsDefinitions);

		this.addDefinitionsBasePath(objectsDefinitions);

		const template = Handlebars.compile(definitionsTemplate);
		const result = template({
			objects: objectsDefinitions.filter((f) => f.properties.length > 0),
		});

		// The template has a empty line at the beginning, so we need to remove it
		return result.substring(result.indexOf('\n') + 1);
	}

	private addDefinitionsBasePath(objectsDefinitions: ObjectDefinitionSpec[]): void {
		for (const obj of objectsDefinitions) {
			for (const objProp of obj.properties.filter((p) => p.typeKey === '$ref')) {
				objProp.type = this.definitionsBasePath + objProp.type;
			}

			for (const objProp of obj.properties.filter((p) => p.itemsTypeKey === '$ref')) {
				objProp.type = this.definitionsBasePath + objProp.itemsType;
			}
		}
	}

	public mapRequestObjects(request: any): ObjectDefinitionSpec[] {
		// Run through request's properties and get all objects
		// This is pretty much a single graph traversal

		const output: ObjectDefinitionSpec[] = [];
		const objects: any[] = [request];

		while (objects.length > 0) {
			const currentObject = objects.pop();
			const objectSpec: ObjectDefinitionSpec = {
				name: this.getNameFromType(currentObject),
				properties: [],
				required: [],
			};

			const bindProperties = Reflect.getMetadata(RequestBindPropertiesKey, currentObject) as string[];

			for (const propertyKey of bindProperties ?? []) {
				const options = Reflect.getMetadata(
					RequestBindOptionsKey,
					currentObject,
					propertyKey,
				) as IInternalRequestBindOptions;

				// Spec definitions just consider body objects
				if (!options || (options.fromWhere !== 'body' && options.fromWhere !== 'scope')) {
					continue;
				}

				// CommandRequest has a special treatment, because it's have a payload property that should be ignored
				if (options.isBody && this.isCommandRequest(currentObject, options) && options.objFactory) {
					objects.push(options.objFactory());
					continue;
				}

				if (options.expects === 'object') {
					// We have a unique edge case that's when the propert is a object but have a sample.
					// In general this means the object does not have a bunch of these decorators
					// so we can't get the properties from metadata
					if (options.specOptions?.sample) {
						this.requestSampleEdgeCase(propertyKey, options, objectSpec, output);
						continue;
					}

					objects.push(options.objFactory!());
				}

				const specParse = requestSpecParses[options.expects];
				if (specParse) {
					const input: reqParseInput = {
						prop: propertyKey,
						opt: options,
					};

					objectSpec.properties.push(specParse(input));
				}

				if (options.isOptional !== true) {
					objectSpec.required!.push(propertyKey);
				}
			}

			output.push(objectSpec);
		}

		return output;
	}

	/** This method is responsible for getting all objects from a request sample */
	private requestSampleEdgeCase(
		propertyKey: string,
		bindingOptions: IInternalRequestBindOptions,
		currentObjSpec: ObjectDefinitionSpec,
		requestObjSpecs: ObjectDefinitionSpec[],
	) {
		// Get all definitions from this object sample
		const objDefinitions = this.getObjSpecFromSample(
			[{ obj: bindingOptions.specOptions?.sample, parentKey: propertyKey }],
			currentObjSpec.name,
			'Input',
		);

		// Then point the current request definition property to the first definition cretated by the sample
		if (objDefinitions.length > 0) {
			requestObjSpecs.push(...objDefinitions);
			currentObjSpec.properties.push({
				name: propertyKey,
				type: objDefinitions[0].name,
				typeKey: '$ref',
			});
		}
	}

	public mapResponseSamples(requestName: string, request: Record<string, any>): ObjectDefinitionSpec[] {
		const objs: sampleObjContext[] = [];

		// Run through all request's spec options registered on metadata
		for (const responseSpecOptions of specs.responseOptions(request.constructor).sort((s) => +s.status)) {
			if (responseSpecOptions.schema) {
				const statusName = statusNameMap[responseSpecOptions.status] ?? '';

				// The default definition name for the responses will be the request name + status name + Response
				// Example: GetUsersOKResponse, GetUsersNotFoundResponse
				objs.push({
					obj: responseSpecOptions.schema,
					name: `${requestName}${statusName}Response`,
				});
			}
		}

		return this.getObjSpecFromSample(objs, requestName, 'Output');
	}

	private getObjSpecFromSample(objs: sampleObjContext[], requestName: string, suffix: string) {
		// Run through all object entries, if found a new object add it to the stack
		// Based on the value type create the definition object properties

		const output: ObjectDefinitionSpec[] = [];
		while (objs.length > 0) {
			const currentObj = objs.pop()!;

			// The response's objects had their names defined based on status code + 'Response' suffix
			// The inner objects will have their names defined based on the RequestName + parent object property name + suffix
			// Example: GetUsersAddressListOutput, GetUsersZipCodeOutput
			const objectSpec: ObjectDefinitionSpec = {
				name: currentObj.name ?? `${requestName}${capitalize(currentObj.parentKey)}${suffix}`,
				properties: [],
			};

			Object.entries(currentObj.obj).forEach(([key, value]) => {
				if (value !== undefined) {
					let propType = typeof value as string;

					// If the value is an array, it's necessary to check if we have more objects inside it
					if (propType === 'object' && Array.isArray(value)) {
						propType = 'array';

						const firstItem = value[0];
						if (typeof firstItem === 'object') {
							objs.push({
								obj: firstItem,
								parentKey: key,
							});
						}
					}

					const parse = responseSpecParses[propType];
					const input: resParseInput = {
						prop: key,
						value: value,
						requestName: requestName,
						objSuffix: suffix,
					};

					objectSpec.properties.push(parse(input));

					if (propType === 'object' && !Array.isArray(value)) {
						objs.push({
							obj: value,
							parentKey: key,
						});
					}
				}
			});

			output.push(objectSpec);
		}

		return output;
	}

	private getNameFromType(type: any): string {
		return Object.getPrototypeOf(type).constructor.name;
	}

	private isCommandRequest(requestModel: unknown, options: IInternalRequestBindOptions): boolean {
		if (requestModel instanceof PayloadCommandRequest) {
			const commandReq = requestModel as PayloadCommandRequest<unknown, unknown>;
			options.objFactory = commandReq.payloadFactory;
			return true;
		}

		return false;
	}
}

function capitalize(s?: string): string {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
