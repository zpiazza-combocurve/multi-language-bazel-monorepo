import { ValidationError } from '@src/helpers/validation';

export class TypeCurveNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, TypeCurveNotFoundError.name, statusCode);
	}
}
