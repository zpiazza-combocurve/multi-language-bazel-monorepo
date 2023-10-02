import { ValidationError } from '@src/helpers/validation';

export class EconOneLinerNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, EconOneLinerNotFoundError.name, statusCode);
	}
}
