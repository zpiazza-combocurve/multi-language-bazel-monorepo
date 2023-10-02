/* eslint-disable complexity */

import 'reflect-metadata';
import { RequestStructureError } from '@src/helpers/validation';

import { IInternalRequestBindOptions, RequestBindOptionsKey, RequestBindPropertiesKey } from '../common';
import { PayloadCommandRequest } from '../requests/base';

export type FieldMetadata = {
	name: string;
	options: IInternalRequestBindOptions;
	innerFields?: MetadaWrapper;
};

export class MetadaWrapper {
	public fields: FieldMetadata[] = [];
	public bodyFields: FieldMetadata[] = [];
	public queryFields: FieldMetadata[] = [];
	public paramsFields: FieldMetadata[] = [];
	public servicesFields: FieldMetadata[] = [];

	constructor(public modelSample: unknown) {
		this.bstFields(this.modelSample as Record<string, unknown>);

		Object.freeze(this.fields);
		Object.freeze(this.bodyFields);
		Object.freeze(this.queryFields);
		Object.freeze(this.paramsFields);
		Object.freeze(this.servicesFields);
	}

	private bstFields(model: Record<string, unknown>): void {
		const bindProps = Reflect.getMetadata(RequestBindPropertiesKey, model) as string[];

		for (const prop of bindProps ?? []) {
			const options = Reflect.getMetadata(RequestBindOptionsKey, model, prop) as IInternalRequestBindOptions;

			if (!options) {
				continue;
			}

			const field: FieldMetadata = { name: prop, options };
			this.fields.push(field);

			switch (options.fromWhere) {
				case 'body':
					this.bodyFields.push(field);
					break;
				case 'query':
					this.queryFields.push(field);
					break;
				case 'params':
					this.paramsFields.push(field);
					break;
				case 'services':
					this.servicesFields.push(field);
					break;
			}

			// Composition objects are just a extension of the object itself
			// It's a way to reuse some models with request binders
			if (options.fromWhere === 'composition') {
				if (model[prop] === undefined) {
					if (!options.objFactory) {
						throw new RequestStructureError(`Type factory not defined for property object ${prop}`);
					}

					model[prop] = this.getInstance(options.objFactory);
				}

				field.innerFields = new MetadaWrapper(model[prop]);
			} else {
				if (options.isBody) {
					this.handleCommandRequestEdgeCase(model, options);
				}

				const isObject = options.expects === 'object' && options.customParse === undefined;
				const isArrayOfObjects = options.expects === 'array' && options.itemsExpects === 'object';

				if (isObject || isArrayOfObjects) {
					if (options.objFactory === undefined && model[prop] === undefined) {
						throw new RequestStructureError(`Type factory not defined for property object ${prop}`);
					}

					const innerModel = model[prop] ?? this.getInstance(options.objFactory);
					field.innerFields = new MetadaWrapper(innerModel);
				}
			}
		}
	}

	private handleCommandRequestEdgeCase(requestModel: unknown, options: IInternalRequestBindOptions) {
		// PayloadCommandRequest has a special property called 'payload' to represent the payload itself
		// This property is defined on the base class, and because that it's not possible to define the objFactoy
		// For the payload property on the base class, so we need to define it here

		if (requestModel instanceof PayloadCommandRequest) {
			const commandReq = requestModel as PayloadCommandRequest<unknown, unknown>;
			options.objFactory = commandReq.payloadFactory;
		}
	}

	private getInstance(factory: (() => unknown) | undefined): unknown {
		let aux: unknown = factory;
		while (typeof aux === 'function') {
			aux = aux();
		}

		return aux;
	}
}
