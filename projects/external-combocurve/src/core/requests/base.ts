/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-explicit-any */

import { IMultiStatusResponse, IRecordStatus } from '@src/api/v1/multi-status';
import { IValidationErrorEntry } from '@src/api/v1/multi-error';
import { ValidationError } from '@src/helpers/validation';

import { fromBody, fromQuery } from '../metadata/metadata';
import { HttpMessageContext } from '../common';

export abstract class RequestBase {
	public errors: ValidationError[] = [];

	public async validate(input: HttpMessageContext): Promise<boolean> {
		return true;
	}

	/**
	 * Parse the request errors to a common error response format
	 * @returns the array of errors parsed to the common format
	 */
	public getErrorsResponse(): IValidationErrorEntry[] {
		return this.errors.map((error) => ({
			name: error.name,
			message: error.message,
			location: error.details.location,
			chosenID: error.details.chosenID,
		}));
	}
}

export abstract class CommandRequest<TOutput> extends RequestBase {
	statusCode = 200;

	abstract handle(input: HttpMessageContext): Promise<TOutput | undefined>;
}

export abstract class PayloadCommandRequest<TInput, TOutput> extends RequestBase {
	@fromBody({
		isBody: true,
		expects: 'array',
		itemsExpects: 'object',
	})
	public payload?: TInput[];

	public payloadFactory: () => TInput;

	constructor(payloadFactory: () => TInput) {
		super();
		this.payloadFactory = payloadFactory;
	}

	abstract handle(input: HttpMessageContext): Promise<TOutput | undefined>;
}

export interface IProcessedRecord {
	processedStatus?: IRecordStatus | ValidationError;
}

export abstract class MultiRecordsRequest<TInput> extends PayloadCommandRequest<TInput, IMultiStatusResponse> {
	statusCode = 207;

	protected *importAndCompileRecords(processedRecords: IProcessedRecord[]): Generator<IRecordStatus> {
		for (const record of processedRecords) {
			if (record.processedStatus instanceof ValidationError) {
				this.errors.push(record.processedStatus);
				continue;
			}

			yield record.processedStatus ?? {
				status: 'BadRequest',
				code: 400,
			};
		}
	}
}

export abstract class DeleteRequest extends CommandRequest<number> {
	statusCode = 204;
}

export class PageInfo {
	@fromQuery({ expects: 'skip' })
	skip: number;

	@fromQuery({ expects: 'take' })
	take: number;

	constructor(skip: number, take: number) {
		this.skip = skip;
		this.take = take;
	}
}
