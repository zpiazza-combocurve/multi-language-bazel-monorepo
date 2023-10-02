import { ValidationError } from '@src/helpers/validation';

export class CustomColumnHeaderNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, CustomColumnHeaderNotFoundError.name, statusCode);
	}
}
