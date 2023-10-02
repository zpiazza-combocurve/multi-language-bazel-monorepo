/* eslint-disable
	@typescript-eslint/no-unused-vars,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { compositionObj, fromQuery, specs } from '@src/core/metadata/metadata';
import { CommandRequest } from '@src/core/requests/base';
import { HttpMessageContext } from '@src/core/common';

import { EconAssignParams, EconAssignServices } from './compositions';

@specs.produceResponse({ status: 400 })
@specs.produceResponse({ status: 200, headers: { 'X-Query-Count': 0 } })
export class EconModelsAssignmentsCount extends CommandRequest<null> {
	@compositionObj()
	params = new EconAssignParams();

	@compositionObj()
	services = new EconAssignServices();

	@fromQuery({ expects: 'array', itemsExpects: 'objectID' })
	wells?: Types.ObjectId[];

	@fromQuery({ expects: 'array', itemsExpects: 'objectID' })
	scenarios?: Types.ObjectId[];

	constructor() {
		super();
	}

	async validate(input: HttpMessageContext): Promise<boolean> {
		const EconTypeMismatchError = await this.services.econModelAssignmentService!.checkEconModel(
			this.params.econModelId!,
			this.params.econName!.mongoKey,
		);

		if (EconTypeMismatchError) {
			this.errors.push(EconTypeMismatchError);
		}

		return this.errors.length === 0;
	}

	async handle(input: HttpMessageContext): Promise<null | undefined> {
		const skip = 0;
		const take = 0;

		const assignments = await this.services!.econModelAssignmentService!.getPageEconModelAssignments(
			this.params.projectId!,
			this.params.econModelId!,
			this.params.econName!.mongoKey,
			skip,
			take,
			{ _id: 1 },
			this.wells,
			this.scenarios,
		);

		input.response.setHeader('X-Query-Count', assignments.total);
		return;
	}
}
