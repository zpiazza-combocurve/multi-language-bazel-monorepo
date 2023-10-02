import { Types } from 'mongoose';

import { DataSource, IWell } from '@src/models/wells';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { notNil } from '@src/helpers/typing';
import { RequestStructureError } from '@src/helpers/validation';

import { CursorType, IPageData } from '../pagination';
import { ApiContextV1 } from '../context';
import { IErrorRecordStatus } from '../multi-status';
import { IValidationErrorEntry } from '../multi-error';

import { addMeasures, removeMeasures, updateMeasures } from './measures-facade';
import { CreateDSRequest, UpdateDSRequest } from './models/requests';
import { getFilters, getSort } from './models/fields';
import { DSResponse } from './models/responses';

type flexCCResponse = {
	found: number;
	imported: number;
	updated: number;
};

const unexpectedErrorMsg = 'An error unexpected happened.';

export class DirectionalSurveysService extends BaseService<ApiContextV1> {
	static noMeasureProjection = {
		_id: 1,
		well: 1,
		project: 1,
		createdAt: 1,
		updatedAt: 1,
	};

	async getDSByID(dsID: Types.ObjectId): Promise<DSResponse | null> {
		const output = await this.context.models.WellDirectionalSurvey.findById(dsID);
		return output === null ? null : new DSResponse(output);
	}

	async getDSCount(filters: ApiQueryFilters): Promise<number> {
		const filterWells = await this.getFilteredWells(getFilters(filters));
		const filter = filterWells.length ? { well: { $in: filterWells } } : {};

		const baseQuery = this.context.models.WellDirectionalSurvey.find(filter);
		const countQuery = filterWells.length ? baseQuery.countDocuments() : baseQuery.estimatedDocumentCount();

		return await countQuery;
	}

	async getDirectionalSurveys(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		withMeasures: boolean,
		cursor?: string,
	): Promise<IPageData<DSResponse>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) ?? {};

		const filterWells = await this.getFilteredWells(getFilters(filters, cursorFilter));
		const filter = filterWells.length ? { well: { $in: filterWells } } : {};

		const projection = withMeasures ? {} : DirectionalSurveysService.noMeasureProjection;
		const tags = await this.context.models.WellDirectionalSurvey.find(filter, projection)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const resultTags = tags.slice(0, take).map((m) => new DSResponse(m));

		return {
			result: resultTags,
			hasNext: tags.length > take,
			cursor: resultTags.length > 0 && allowCursor ? (resultTags[resultTags.length - 1].id as CursorType) : null,
		};
	}

	private async getFilteredWells(filter: IFilter<unknown>): Promise<Types.ObjectId[]> {
		this.checkFilters(filter);

		if ('chosenID' in filter && 'dataSource' in filter && 'project' in filter) {
			const { chosenID, dataSource, well, project } = filter;

			const queryFilter = {
				project: project as Types.ObjectId,
				chosenID: chosenID as string,
				dataSource: dataSource as DataSource,
			};

			const wells = await this.context.models.WellModel.find(queryFilter, { _id: 1 });
			const wellsIDs = [...wells.map((w) => w._id), well as Types.ObjectId].filter(notNil);

			return wellsIDs;
		}

		return filter.well ? [filter.well as Types.ObjectId] : [];
	}

	private checkFilters(filter: IFilter<unknown>) {
		const hasOneOfThem = filter.chosenID || filter.dataSource || filter.project;
		const hasAllOfThem = filter.chosenID && filter.dataSource && filter.project;

		// chosenID, dataSource and project are mutually exclusive
		if (hasOneOfThem && !hasAllOfThem) {
			throw new RequestStructureError(
				'Incomplete filter selection. The filters chosenID, dataSource and project are mutually exclusive.',
				'query',
			);
		}
	}

	async countWells(chosenID: string, projectID: string | null): Promise<number> {
		const projID = projectID ? Types.ObjectId(projectID) : null;
		const filter = { chosenID: chosenID, project: projID };
		return await this.context.models.WellModel.count(filter);
	}

	async updateDirectionalSurvey(req: UpdateDSRequest, dsID: Types.ObjectId): Promise<IErrorRecordStatus> {
		const output: IErrorRecordStatus = {
			code: 400,
			status: '',
			errors: [],
		};

		const ds = await this.context.models.WellDirectionalSurvey.findById(dsID);
		if (ds === null) {
			output.code = 404;
			output.errors.push({
				name: 'NotFoundError',
				message: `Was not found a directional surver for the given ID`,
				chosenID: dsID.toHexString(),
			});

			return output;
		}

		this.callMerge(output, req.add, (add) => addMeasures(ds, add));
		this.callMerge(output, req.update, (update) => updateMeasures(ds, update));
		this.callMerge(output, req.remove, (remove) => removeMeasures(ds, remove));

		if (output.errors.length === 0) {
			const updateModel = {
				well: ds.well,
				schemaVersion: 1,
				project: ds.project,
				measuredDepth: ds.measuredDepth,
				trueVerticalDepth: ds.trueVerticalDepth,
				azimuth: ds.azimuth,
				inclination: ds.inclination,
				deviationNS: ds.deviationNS,
				deviationEW: ds.deviationEW,
				latitude: ds.latitude,
				longitude: ds.longitude,
			};

			const result = await this.saveDS(
				updateModel as Record<string, unknown>,
				req.spatialDataType,
				req.dataSource,
				'update',
			);
			if (result.updated !== 1 || result.imported !== ds.measuredDepth.length) {
				const message = this.createErrorMessage('created', result, ds.measuredDepth.length);

				output.code = 500;
				output.errors.push({
					name: 'UnexpectedError',
					message: message,
					chosenID: dsID.toHexString(),
				});
			}
		}

		output.code = 200;
		output.status = 'updated';

		return output;
	}

	private callMerge<T>(output: IErrorRecordStatus, req: T | null, mergeFN: (b: T) => IValidationErrorEntry[]): void {
		if (req !== null) {
			const errors = mergeFN(req);
			if (errors.length !== 0) {
				output.errors.push(...errors);
				return;
			}
		}
	}

	async createDirectionalSurveys(req: CreateDSRequest): Promise<IErrorRecordStatus> {
		const output: IErrorRecordStatus = {
			chosenID: undefined,
			status: 'error',
			code: 400,
			errors: [],
		};

		const projID = req.projectID ? Types.ObjectId(req.projectID) : null;
		const well = await this.findWell(req.chosenID, projID);

		if (well) {
			const newModel = {
				well: well._id,
				schemaVersion: 1,
				project: projID,
				measuredDepth: [],
				trueVerticalDepth: [],
				azimuth: [],
				inclination: [],
				deviationNS: [],
				deviationEW: [],
				latitude: [],
				longitude: [],
			};

			const errors = addMeasures(newModel, req);
			if (errors.length !== 0) {
				output.errors.push(...errors);
				return output;
			}

			const result = await this.saveDS(newModel, req.spatialDataType, req.dataSource, 'update');
			if (result.updated !== 1 || result.imported !== req.measuredDepth.length) {
				const message = this.createErrorMessage('created', result, req.measuredDepth.length);

				output.code = 500;
				output.errors.push({
					name: 'UnexpectedError',
					message: message,
					chosenID: req.chosenID,
				});

				return output;
			}

			output.code = 201;
			output.status = 'created';
		}

		return output;
	}

	private createErrorMessage(operation: string, result: flexCCResponse, rowsCount: number) {
		let message = unexpectedErrorMsg;
		if (result.updated === 1 && result.imported !== rowsCount) {
			message += ` ${result.updated} of rows were ${operation} the other ${
				rowsCount - result.updated
			} were invalid.`;
		}

		return message;
	}

	private async findWell(chosenID: string, projectID: Types.ObjectId | null): Promise<IWell | null> {
		const projection = { _id: 1 };
		const filter = { chosenID: chosenID, project: projectID };

		return await this.context.models.WellModel.findOne(filter, projection);
	}

	private async saveDS(
		dsMongo: Record<string, unknown>,
		spatialDataType: string,
		dataSource: string,
		operation: string,
	): Promise<flexCCResponse> {
		return await callCloudFunction({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: {
					...dsMongo,
					spatialDataType,
					dataSource,
				},
				importOperation: operation,
				resourceType: 'directional_surveys',
			},
			headers: this.context.headers,
		});
	}

	async deleteDSByID(id: Types.ObjectId): Promise<number> {
		const ds = await this.context.models.WellDirectionalSurvey.findById(id, { well: 1 });
		if (ds === null) {
			return 0;
		}

		const response: flexCCResponse = await callCloudFunction({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: {
					id,
					well_id: ds.well,
				},
				importOperation: 'delete',
				resourceType: 'directional_surveys',
			},
			headers: this.context.headers,
		});

		return response.updated;
	}
}
