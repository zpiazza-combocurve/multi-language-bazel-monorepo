/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { fromParams, fromQuery, fromServices, specs } from '@src/core/metadata/metadata';
import { DeleteRequest } from '@src/core/requests/base';
import { EconName } from '@src/value-objects/econ-name';
import { HttpMessageContext } from '@src/core/common';
import { validationErrorEntrySample } from '@src/api/v1/multi-error';

import { QualifiersService } from '../../service';

type scenarioQualifierItem = {
	name: string;
};

const qualifierNameRequirements = {
	invalidValues: [
		{
			value: QualifiersService.defaultQualifierName,
			reason: `The 'Default' value is reserved by system`,
		},
	],
	arrMaxLength: 20,
};

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 400, schema: validationErrorEntrySample })
@specs.produceResponse({ status: 204, headers: { 'x-delete-count': 1 } })
export class QualifiersDelete extends DeleteRequest {
	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromQuery({
		isOptional: false,
		expects: 'array',
		itemsExpects: 'string',
		targetConstructor: (input) => new EconName(input as string),
		requirements: { maxItems: 20 },
	})
	econNames?: EconName[];

	@fromQuery({
		isOptional: false,
		expects: 'array',
		itemsExpects: 'string',
		requirements: qualifierNameRequirements,
	})
	qualifierNames?: string[];

	@fromServices()
	qualifiersService?: QualifiersService;

	async handle(input: HttpMessageContext): Promise<number | undefined> {
		const scenario = await this.qualifiersService!.getScenarioWithOnlyQualifiers(this.scenarioId, this.projectId);
		if (!scenario) {
			input.response.status(404).end();
			return;
		}

		// econModelKey : deletedQualifierKey
		const trackDeletedQualifiers: Record<string, string[]> = {};

		for (const econName of this.econNames!) {
			const econQualifiers = this.qualifiersService!.getAllEconQualifierFromScenario(econName.mongoKey, scenario);
			const activeQualifier = this.qualifiersService!.getActiveEconQualifierFromScenario(
				econName.mongoKey,
				scenario,
			);

			for (const qualifier of this.qualifierNames!) {
				if (qualifier === activeQualifier) {
					input.response.status(400).json({
						name: 'ActiveQualifierDeletion',
						message: `The qualifier '${qualifier}' is active qualifier of '${econName.name}' econ model`,
						location: `[${this.qualifierNames!.indexOf(qualifier)}]`,
					});

					return;
				}

				const qualifierKey = this.removeQualifier(econQualifiers, qualifier);
				if (qualifierKey) {
					const deleted = trackDeletedQualifiers[econName.mongoKey] || [];
					deleted.push(qualifierKey);
					trackDeletedQualifiers[econName.mongoKey] = deleted;
				}
			}
		}

		await this.qualifiersService!.deleteScenarioQualifiers(scenario, trackDeletedQualifiers);

		return Object.values(trackDeletedQualifiers)
			.map((qualifiers) => qualifiers.length)
			.reduce((a, b) => a + b, 0);
	}

	public removeQualifier(
		econQualifiers: Record<string, scenarioQualifierItem>,
		qualifier: string,
	): string | undefined {
		for (const key in econQualifiers) {
			if (key !== QualifiersService.defaultQualifierKey && econQualifiers[key].name === qualifier) {
				delete econQualifiers[key];
				return key;
			}
		}
	}
}
