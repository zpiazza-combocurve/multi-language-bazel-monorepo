import { ValidationError } from '@src/helpers/validation';

export class MonthlyExportNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, MonthlyExportNotFoundError.name, statusCode);
	}
}

export class MonthlyExportInvalidScopeError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, MonthlyExportInvalidScopeError.name, statusCode);
	}
}
