import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { FieldNameError, isObject, RequestStructureError, RequiredFieldError } from '../validation';
import { notNil } from '../typing';

export function readRequestFromDocument<MongoType, Api, ApiKey extends keyof Api>(
	mongoModel: MongoType | undefined,
	fields: Record<string, unknown>,
): Api {
	const output: Record<string, Api[ApiKey]> = {};
	Object.entries(fields).forEach(([fieldApiName, value]) => {
		const fieldValue = value as Record<string, unknown>;
		if ('read' in fieldValue && typeof fieldValue.read === 'function' && (fieldApiName as ApiKey)) {
			output[fieldApiName] = fieldValue.read(mongoModel);
		}
	});

	return output as unknown as Api;
}

export function writeDocumentWithRequest<MongoType, Api, ApiKey extends keyof Api>(
	request: Api | undefined,
	fields: Record<string, unknown>,
): MongoType {
	const output: Record<string, Api[ApiKey]> = {};
	if (request) {
		Object.entries(fields).forEach(([fieldApiName, value]) => {
			const fieldValue = value as Record<string, unknown>;
			if ('write' in fieldValue && typeof fieldValue.write === 'function' && (fieldApiName as ApiKey)) {
				fieldValue.write(output as unknown as MongoType, request[fieldApiName as ApiKey]);
			}
		});
	}

	return output as unknown as MongoType;
}

export function parseRequestFromPayload<ApiRequest, ApiKey extends keyof ApiRequest>(
	name: string,
	fields: Record<string, unknown>,
	data: unknown,
	location?: string,
): ApiRequest {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ${name} data structure`, location);
	}

	const request: Record<string, ApiRequest[ApiKey]> = {};
	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;

				if (field in fields) {
					const apiField = fields[field] as Record<string, unknown>;

					let parsedValue = value as ApiRequest[ApiKey];
					if ('parse' in apiField && typeof apiField.parse === 'function') {
						parsedValue = apiField.parse(value, fieldPath);
					}

					if ('write' in apiField) {
						request[field] = parsedValue;
					}
				} else {
					throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
				}
			}),
		);

	// Fill the request with default values
	Object.entries(fields).forEach(([name, config]) => {
		const field = config as Record<string, unknown>;
		const fieldOptions = field.options as Record<string, unknown>;

		if (!fieldOptions || fieldOptions.hasDefault !== true || request[name] !== undefined) {
			return;
		}

		const fieldPath = `${location}.${name}`;
		try {
			if ('parse' in field && typeof field.parse === 'function') {
				const parsedValue = field.parse(undefined, fieldPath);

				if ('write' in field) {
					request[name] = parsedValue;
				}
			}
		} catch (_) {
			// Fields with default value should not throw errors when parse undefined!
			// Assuming here if the field has a default value, should be required
			throw new RequiredFieldError(`\`${name}\` is a required field`, fieldPath);
		}
	});

	errorAggregator.throwAll();

	return request as unknown as ApiRequest;
}
