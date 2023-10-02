/* eslint-disable 
	@typescript-eslint/no-unused-vars,
	@typescript-eslint/no-non-null-assertion */
import { Types } from 'mongoose';

import { fromParams, fromQuery, fromServices, specs } from '@src/core/metadata/metadata';
import { DeleteRequest } from '@src/core/requests/base';
import { HttpMessageContext } from '@src/core/common';

import { ScenarioWellsService } from '../../service';

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 204, headers: { 'x-delete-count': 1 } })
export class ScenarioWellsDelete extends DeleteRequest {
	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromQuery({
		isOptional: false,
		expects: 'array',
		itemsExpects: 'objectID',
		requirements: { maxItems: 2500 },
	})
	wells?: Types.ObjectId[];

	@fromServices()
	public scenarioWellsService?: ScenarioWellsService;

	async handle(input: HttpMessageContext): Promise<number | undefined> {
		const scenario = await this.scenarioWellsService!.getScenarioWells(this.scenarioId, this.projectId);
		if (!scenario) {
			input.response.status(404);
			return;
		}

		// Types.ObjectId does not implement 'SameValueZero' equality algorithm used by Set
		const scenarioHash = new Set(scenario.wells.map((well) => well.toHexString()));

		const deletedWells: Types.ObjectId[] = [];
		for (const wellID of this.wells ?? []) {
			if (scenarioHash.has(wellID.toHexString())) {
				deletedWells.push(wellID);
			}
		}

		if (deletedWells.length > 0) {
			const isDeleted = await this.scenarioWellsService!.unassignWells(this.scenarioId!, deletedWells);
			if (isDeleted) {
				return deletedWells.length;
			}
		}

		return 0;
	}
}
