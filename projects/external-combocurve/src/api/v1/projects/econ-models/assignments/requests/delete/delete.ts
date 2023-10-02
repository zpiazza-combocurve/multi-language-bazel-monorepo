/* eslint-disable
	@typescript-eslint/no-unused-vars,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { compositionObj, fromQuery, specs } from '@src/core/metadata/metadata';
import { DeleteRequest } from '@src/core/requests/base';
import { HttpMessageContext } from '@src/core/common';
import { IQualifiers } from '@src/models/scenarios';
import { MAX_WELLS_IN_SCENARIO } from '@src/constants';
import { QualifiersService } from '@src/api/v1/projects/scenarios/qualifiers/service';
import { ValidationError } from '@src/helpers/validation';

import { EconAssignParams, EconAssignServices } from '../compositions';

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 204, headers: { 'x-delete-count': 1 } })
export class EconModelAssignmentDelete extends DeleteRequest {
	@compositionObj()
	params = new EconAssignParams();

	@compositionObj()
	services = new EconAssignServices();

	@fromQuery({ isOptional: false, expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromQuery({ isOptional: false, expects: 'string' })
	qualifierName?: string;

	@fromQuery({ expects: 'array', itemsExpects: 'objectID', requirements: { maxItems: MAX_WELLS_IN_SCENARIO } })
	wells?: Types.ObjectId[];

	@fromQuery({ expects: 'boolean' })
	allWells?: boolean;

	async validate(input: HttpMessageContext): Promise<boolean> {
		const EconTypeMismatchError = await this.services.econModelAssignmentService!.checkEconModel(
			this.params.econModelId!,
			this.params.econName!.mongoKey,
		);

		if (EconTypeMismatchError) {
			this.errors.push(EconTypeMismatchError);
		}

		if (!this.allWells && !this.wells) {
			this.errors.push(new ValidationError('Must provide wells ([ID1, ID2 ...]) or allWells (true)', 'query'));
		}

		return this.errors.length === 0;
	}

	async handle(input: HttpMessageContext): Promise<number | undefined> {
		const scenario = await this.services.qualifiersService!.getScenarioWithOnlyQualifiers(this.scenarioId!);

		const qualifier = (scenario?.columns ?? {})[this.params.econName!.mongoKey]?.qualifiers;
		const qualifierKey = this.findQualifierKey(this.qualifierName!, qualifier);

		if (!scenario || !qualifier || !qualifierKey) {
			input.response.status(404);
			return;
		}

		return await this.services.econModelAssignmentService!.removeEconFromWells(
			this.scenarioId!,
			qualifierKey,
			this.params.econName!.mongoKey,
			this.allWells ? undefined : this.wells,
		);
	}

	findQualifierKey(qualifierName: string, qualifier?: IQualifiers): string | undefined {
		if (qualifierName === QualifiersService.defaultQualifierName) {
			return QualifiersService.defaultQualifierKey;
		}

		const pair = Object.entries(qualifier ?? {}).find(([key, value]) => value.name === qualifierName);
		return pair?.[0];
	}
}
