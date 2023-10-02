import { ValidationError } from '@src/helpers/validation';

export class ForecastDataNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ForecastDataNotFoundError.name, statusCode);
	}
}
