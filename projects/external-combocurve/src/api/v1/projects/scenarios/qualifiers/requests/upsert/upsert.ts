/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { fromParams, fromParentScope, fromServices, specs } from '@src/core/metadata/metadata';
import { IMultiStatusResponse, IRecordStatus, multiStatusResponseSample } from '@src/api/v1/multi-status';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { IScenario } from '@src/models/scenarios';
import { MultiRecordsRequest } from '@src/core/requests/base';
import { ValidationError } from '@src/helpers/validation';

import { QualifiersService } from '../../service';

const qualifierNameRequirements = {
	invalidValues: [{ value: 'Default', reason: `The 'Default' value is reserved by system` }],
};

export class QualifierUpsertPayload {
	@fromParentScope({
		expects: 'string',
		targetConstructor: (input) => new EconName(input as string),
	})
	public econModel?: EconName;

	@fromParentScope({
		expects: 'string',
		requirements: qualifierNameRequirements,
	})
	public name?: string;

	@fromParentScope({
		isOptional: true,
		expects: 'string',
		requirements: qualifierNameRequirements,
	})
	public newName?: string;

	public isValid(): boolean {
		return this.econModel instanceof EconName && this.name !== undefined;
	}
}

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 207, schema: multiStatusResponseSample })
export class QualifiersUpsert extends MultiRecordsRequest<QualifierUpsertPayload> {
	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromServices()
	qualifiersService?: QualifiersService;

	constructor() {
		super(() => new QualifierUpsertPayload());
	}

	async handle(input: HttpMessageContext): Promise<IMultiStatusResponse | undefined> {
		const scenario = await this.qualifiersService!.getScenarioWithOnlyQualifiers(this.scenarioId, this.projectId);
		if (!scenario) {
			input.response.status(404).end();
			return undefined;
		}

		const output: IRecordStatus[] = [];
		const payload = this.payload || [];
		const affectedEconModels = new Set<string>();

		for (let idx = 0; idx < payload.length; idx++) {
			const current = payload[idx];
			if (current.isValid()) {
				const econQualifiers = this.qualifiersService!.getAllEconQualifierFromScenario(
					current.econModel!.mongoKey,
					scenario,
				);
				const qualifiersNames = Object.values(econQualifiers).map((x) => x.name);

				const isOk = current.newName
					? this.updateQualifier(current, scenario, qualifiersNames, idx)
					: this.addQualifier(current, scenario, qualifiersNames, idx);

				if (isOk) {
					affectedEconModels.add(current.econModel!.mongoKey);
				}

				output.push(isOk ? this.createStatusResponse(current) : { status: 'Error', code: 400 });
			}
		}

		await this.qualifiersService!.updateScenarioQualifiers(scenario, [...affectedEconModels]);
		return { results: output };
	}

	public addQualifier(
		current: QualifierUpsertPayload,
		scenario: IScenario,
		econQualifiers: string[],
		idx: number,
	): boolean {
		if (econQualifiers.includes(current.name!)) {
			this.errors.push(new ValidationError(`Qualifier ${current.name} already exists`, `[${idx}]`));
			return false;
		}

		if (econQualifiers.length == 20) {
			this.errors.push(new ValidationError(`Maximum number of qualifiers reached`, `[${idx}]`));
			return false;
		}

		const qualifier = this.qualifiersService!.getAllEconQualifierFromScenario(
			current.econModel!.mongoKey,
			scenario,
		);
		const newQualifierInternalName = `qualifier${econQualifiers.length}`;

		qualifier[newQualifierInternalName] = {
			name: current.name!,
		};

		return true;
	}

	public updateQualifier(
		current: QualifierUpsertPayload,
		qualifiers: IScenario,
		econQualifiers: string[],
		idx: number,
	): boolean {
		if (current.name === current.newName) {
			return true;
		}

		const index = econQualifiers.findIndex((x) => x === current.name);
		if (index === -1) {
			this.errors.push(
				new ValidationError(`Qualifier ${current.name} not found`, `[${idx}]`, 'QualifierNotFound'),
			);
			return false;
		}

		if (econQualifiers.includes(current.newName!)) {
			this.errors.push(
				new ValidationError(`Qualifier ${current.newName} already exists`, `[${idx}]`, 'DuplicatedQualifier'),
			);
			return false;
		}

		const qualifier = this.qualifiersService!.getAllEconQualifierFromScenario(
			current.econModel!.mongoKey,
			qualifiers,
		);
		const qualifierName = `qualifier${index}`;

		qualifier[qualifierName] = {
			name: current.newName!,
		};

		return true;
	}

	private createStatusResponse(current: QualifierUpsertPayload): IRecordStatus {
		return {
			status: current.newName ? 'Updated' : 'Created',
			code: current.newName ? 204 : 201,
			chosenID: current.newName ? current.newName : current.name,
		};
	}
}
