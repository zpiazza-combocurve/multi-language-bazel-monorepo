import { ErrorDetails, ValidationError } from '@src/helpers/validation';

export interface IValidationErrorEntry {
	name: string;
	message: string;
	location?: string;
	chosenID?: string;
}

export const validationErrorEntrySample: IValidationErrorEntry = {
	name: 'ValidationError',
	message: `The field age is required`,
	location: 'people.age',
	chosenID: 'chosen_id',
};

interface IMultipleValidationErrorDetails extends ErrorDetails {
	errors?: IValidationErrorEntry[];
}

const toValidationErrorEntry = ({ name, message, details: { location, chosenID } }: ValidationError) => ({
	name,
	message,
	location,
	chosenID,
});

export class MultipleValidationError extends Error {
	expected = true;
	details: IMultipleValidationErrorDetails;
	constructor(errors: ValidationError[]) {
		super('Validation errors');
		this.name = MultipleValidationError.name;
		this.details = {
			errors: errors.map(toValidationErrorEntry),
		};
	}
}

export class ValidationErrorAggregator {
	errors: ValidationError[] = [];
	chosenID?: string;

	setChosenId(chosenId?: string): void {
		this.chosenID = chosenId;
	}

	catch<T>(fn: () => T): T | undefined {
		try {
			return fn();
		} catch (e) {
			if (e instanceof ValidationError) {
				if (!this.errors.find((existingError) => existingError.equals(e as ValidationError))) {
					this.errors.push(e);
				}

				return undefined;
			}
			if (e instanceof MultipleValidationError) {
				const valErrors =
					e.details.errors?.map(
						({ name, message, location, chosenID: chosenId }) =>
							new ValidationError(message, location, name, undefined, chosenId),
					) ?? [];
				this.errors.push(...valErrors);
				return undefined;
			}
			throw e;
		}
	}

	throwAll(): void {
		this.errors.forEach((e) => (e.details.chosenID = this.chosenID));

		if (this.errors.length > 1) {
			throw new MultipleValidationError(this.errors);
		}
		if (this.errors.length === 1) {
			throw this.errors[0];
		}
	}

	getErrorEntries(): IValidationErrorEntry[] {
		return this.errors.map(toValidationErrorEntry);
	}

	clear(): void {
		this.errors = [];
	}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}
}
