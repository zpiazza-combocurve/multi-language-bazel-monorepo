/* eslint-disable complexity, @typescript-eslint/ban-types */
import 'reflect-metadata';
import { Request } from 'express';

import { RequestStructureError, ValidationError } from '@src/helpers/validation';

import { FieldMetadata, MetadaWrapper } from '../metadata/metada-wrapper';
import { IInternalRequestBindOptions, NamingTypes, ParseOutput } from '../common';

import { appParses } from './parses';
import { RequestStructure } from './request-structure';
import { sourceFieldLookup } from './field-lookup';

const propertyNotFound = Symbol('propertyNotFound');

// Just a helper type to avoid write Record<string, unknown> everywhere
type JsObj = Record<string, unknown>;

export class BindHandler<TRequestType extends {}> {
	errors: ValidationError[] = [];

	constructor(
		private requestModel: TRequestType,
		private request: Request,
		private metadata: MetadaWrapper,
		private requestStructure: RequestStructure,
		private namingConfig = NamingTypes.ExactlyEqual,
	) {}

	public getModel(): TRequestType {
		return this.requestModel;
	}

	public bind(): ValidationError[] {
		this.innerBind('', this.requestModel, this.metadata.fields);
		return this.errors;
	}

	private innerBind(
		location: string,
		modelAux: JsObj,
		fields: FieldMetadata[],
		scopedSource: unknown = undefined,
	): void {
		// Check unknown fields on source
		if (scopedSource !== undefined) {
			this.errors.push(
				...this.requestStructure.checkUnknowInfoOnSource(
					scopedSource as Record<string, unknown>,
					fields.map((f) => f.name),
					location,
				),
			);
		}

		for (const field of fields) {
			if (field.options.fromWhere === 'composition' && field.innerFields) {
				if (modelAux[field.name] === undefined) {
					modelAux[field.name] = getInstance(field.options.objFactory);
				}

				const innerModel = modelAux[field.name] as JsObj;
				this.innerBind(location, innerModel, field.innerFields.fields, undefined);

				continue;
			}

			const requestValue = this.getPropertyFromRequest(field, scopedSource);

			// If the property is not found, it's not a problem if the property is optional
			if (requestValue === propertyNotFound) {
				if (field.options.isOptional !== true) {
					this.errors.push(new RequestStructureError(`Property ${field.name} not found`, location));
				}

				continue;
			}

			// When object is expected, It's create a scoped that is the object value from request
			// And then called this same bind recursively to fill the object using this new scope
			if (field.options.expects === 'object' && field.options.customParse === undefined && field.innerFields) {
				if (typeof requestValue !== 'object') {
					this.errors.push(new RequestStructureError(`Property ${field.name} is not an object`, location));
				}

				modelAux[field.name] = getInstance(field.options.objFactory);

				this.innerBind(
					location + field.name,
					modelAux[field.name] as JsObj,
					field.innerFields.fields,
					requestValue,
				);

				continue;
			}

			let parsedValue = requestValue;

			// We don't need to parse services since they are come from our context
			if (field.options.expects !== 'service') {
				parsedValue = this.getPropertParsedValue(field, requestValue, location);
			}

			modelAux[field.name] = parsedValue;
		}
	}

	private getPropertyFromRequest(field: FieldMetadata, scopedSource: unknown = undefined): unknown {
		const source = this.requestStructure.getRequestSource(field.options.fromWhere, scopedSource);

		// We accept both array and single object for body
		if (field.options.fromWhere === 'body' && field.options.isBody) {
			return field.options.expects === 'array' && !Array.isArray(source) ? [source] : source;
		}

		const keyValue = sourceFieldLookup(source, field.name, this.namingConfig);
		return keyValue?.value ?? propertyNotFound;
	}

	private getPropertParsedValue(
		field: FieldMetadata,
		requestValue: unknown,
		location: string,
		overrideExpects?: string,
	): unknown {
		const expectType = overrideExpects ?? field.options.expects;

		if (expectType === 'array') {
			return this.getArrayPropertParsedValue(field, requestValue, location);
		}

		let parseFN = appParses[expectType];
		if (field.options.customParse !== undefined) {
			parseFN = field.options.customParse;
		}

		const output = parseFN({
			name: field.name,
			value: requestValue,
			location,
			model: this.requestModel,
			request: this.request,
			requirements: field.options.requirements,
		});
		if (output.errorMsg) {
			this.errors.push(
				output.errorName
					? new ValidationError(output.errorMsg, location, output.errorName)
					: new RequestStructureError(output.errorMsg, location),
			);
			return;
		}

		this.checkTargetConstructor(field.options, output, location);
		return output.parsedValue;
	}

	// Fill Array
	private getArrayPropertParsedValue(field: FieldMetadata, requestValue: unknown, location: string): unknown {
		if (!Array.isArray(requestValue)) {
			if (field.options.fromWhere === 'query') {
				requestValue = [requestValue];
			} else {
				this.errors.push(new RequestStructureError(`Property ${field.name} is not an array`, location));
				return;
			}
		}

		const aux = requestValue as unknown[];
		const minLength = field.options.requirements?.minItems ?? 0;
		const maxLength = field.options.requirements?.maxItems ?? Number.MAX_SAFE_INTEGER;

		if (aux.length < minLength || aux.length > maxLength) {
			this.errors.push(
				new RequestStructureError(
					`${field.name} must have between ${minLength} and ${maxLength} items`,
					location,
				),
			);
			return;
		}

		if (!field.options.itemsExpects) {
			this.errors.push(
				new RequestStructureError(`Items expects not defined for property array ${field.name}`, location),
			);
			return;
		}

		if (field.options.itemsExpects === 'object' && !field.options.objFactory) {
			this.errors.push(
				new RequestStructureError(`typeFactory defined for property object ${field.name}`, location),
			);
			return;
		}

		let arrayIdx = 0;
		const output: unknown[] = [];

		for (const item of aux) {
			const currentLocation = `${location}${field.options.isBody ? '' : field.name}[${arrayIdx++}]`;
			if (field.options.itemsExpects === 'object' && field.innerFields) {
				const obj = getInstance(field.options.objFactory);
				output.push(obj);

				this.innerBind(currentLocation, obj as JsObj, field.innerFields.fields, item);
			} else {
				output.push(this.getPropertParsedValue(field, item, currentLocation, field.options.itemsExpects));
			}
		}

		return output;
	}

	private checkTargetConstructor(options: IInternalRequestBindOptions, parsedValue: ParseOutput, location: string) {
		if (options.targetConstructor === undefined) {
			return;
		}

		try {
			parsedValue.parsedValue = options.targetConstructor(parsedValue.parsedValue);
		} catch (err) {
			const error = err as Error;
			this.errors.push(new ValidationError(error.message, location, error.name));
		}
	}

	public hasErrors(): boolean {
		return true;
	}
}

function getInstance(factory: (() => unknown) | undefined): unknown {
	let aux: unknown = factory;
	while (typeof aux === 'function') {
		aux = aux();
	}

	return aux;
}
