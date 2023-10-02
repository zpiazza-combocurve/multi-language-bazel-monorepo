import { ValidationError } from '@src/helpers/validation';

export class EconRunNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, EconRunNotFoundError.name, statusCode);
	}
}
