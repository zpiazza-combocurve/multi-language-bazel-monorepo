/* eslint-disable 
	@typescript-eslint/no-non-null-assertion */

import { Types } from 'mongoose';

import { fromBody, fromParams, fromServices, specs } from '@src/core/metadata/metadata';
import { IMultiStatusResponse, IRecordStatus, multiStatusResponseSample } from '@src/api/v1/multi-status';
import { CommandRequest } from '@src/core/requests/base';
import { HttpMessageContext } from '@src/core/common';
import { validationErrorEntrySample } from '@src/api/v1/multi-error';

import { ScenarioWellsService } from '../../service';

@specs.produceResponse({ status: 404 })
@specs.produceResponse({ status: 400, schema: validationErrorEntrySample })
@specs.produceResponse({ status: 207, schema: multiStatusResponseSample })
export class ScenarioWellsUpsert extends CommandRequest<IMultiStatusResponse> {
	statusCode = 207;

	@fromParams({ expects: 'objectID' })
	scenarioId?: Types.ObjectId;

	@fromParams({ expects: 'objectID' })
	projectId?: Types.ObjectId;

	@fromBody({
		isBody: true,
		expects: 'array',
		itemsExpects: 'objectID',
		requirements: { minItems: 1, maxItems: ScenarioWellsService.maxWellsPerScenario },
	})
	public wells?: Types.ObjectId[];

	@fromServices()
	public scenarioWellsService?: ScenarioWellsService;

	async handle(input: HttpMessageContext): Promise<IMultiStatusResponse | undefined> {
		const scenario = await this.scenarioWellsService!.getScenarioWells(this.scenarioId, this.projectId);
		if (!scenario) {
			input.response.status(404);
			return;
		}

		const projectWells = await this.scenarioWellsService!.getProjectWells(this.projectId!);
		const projectWellsHash = new Set(projectWells?.map((well) => well.toHexString()));

		const scenarioWellsHash = new Set(scenario.wells.map((well) => well.toHexString()));
		const newWells: Types.ObjectId[] = [];

		const output = this.addWells(scenarioWellsHash, projectWellsHash, newWells);
		const limit = ScenarioWellsService.maxWellsPerScenario;

		if (scenarioWellsHash.size > limit) {
			input.response.status(400).json({
				status: 'BadRequest',
				code: 400,
				message: `The number of wells in scenario exceeds the limit of ${limit}`,
			});

			return;
		}

		await this.scenarioWellsService!.updateScenarioWells(this.scenarioId!, this.projectId!, newWells);
		return {
			results: output,
		};
	}

	public addWells(
		scenarioHash: Set<string>,
		projectWellsHash: Set<string>,
		newWells: Types.ObjectId[],
	): IRecordStatus[] {
		return (this.wells ?? []).map((wellID) => {
			if (wellID === undefined) {
				return { status: 'BadRequest', code: 400 };
			}

			const wellIDStr = wellID.toHexString();
			if (!projectWellsHash.has(wellIDStr)) {
				return { status: 'NotFound', code: 404, chosenID: wellID.toHexString() };
			}

			if (!scenarioHash.has(wellIDStr)) {
				scenarioHash.add(wellIDStr);
				newWells.push(wellID);
			}

			return { status: 'Created', code: 201, chosenID: wellID.toHexString() };
		});
	}
}
