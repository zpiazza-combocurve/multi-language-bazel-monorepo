import { BaseContext, BaseService } from '@combocurve/shared';
import { serviceResolver } from '@combocurve/shared/middleware';
import { Types } from 'mongoose';

import {
	DeterministicPdict,
	FORECAST_BASE_PHASES,
	FORECAST_TYPES,
	ForecastDataModel,
	ForecastModel,
	ForecastSegmentModel,
	ForecastWellAssignmentModel,
} from '../entities/forecast';
import { convertIdxToDate } from '../helpers/math';
import MultipleSegments from '../models/multipleSegments';

export const MAX_WELLS_IN_FORECAST = 25_000;

export interface AddWellToForecastResponse {
	message: string;
	wellsIds: string[];
}

export interface ForecastDeleteResponse {
	msg: string;
}

export interface ForecastParametersResponse {
	_id: Types.ObjectId;
	P_dict: Types.ObjectId;
}

class ForecastService extends BaseService<BaseContext> {
	// eslint-disable-next-line no-useless-constructor -- TODO eslint fix later
	constructor(context: BaseContext) {
		super(context);
	}

	addWellsToForecast = async (
		forecastId: Types.ObjectId,
		inputForecastWells: Types.ObjectId[]
	): Promise<AddWellToForecastResponse> => {
		const { project: projectId, wells: forecastWells, type } = await this.getForecast(forecastId);

		const wellSet = new Set<string>(inputForecastWells.map((y) => y.toString()));
		for (let i = 0, len = forecastWells.length; i < len; i++) {
			wellSet.delete(forecastWells[i].toString());
		}
		const wellsToAdd = [...wellSet];

		if (wellsToAdd.length + forecastWells.length > MAX_WELLS_IN_FORECAST) {
			const response: AddWellToForecastResponse = {
				message: `Wells Added Exceed ${MAX_WELLS_IN_FORECAST} Well Forecast Limit`,
				wellsIds: [],
			};
			return response;
		}

		while (wellsToAdd.length) {
			const forecastDataModel = [] as ForecastDataModel[];
			const wellForecastAssignments = [] as ForecastWellAssignmentModel[];
			const curWells = wellsToAdd.splice(0, 200);

			for (let i = 0, len = curWells.length; i < len; i++) {
				const wellId = curWells[i];

				// eslint-disable-next-line new-cap -- TODO eslint fix later
				const data = { oil: Types.ObjectId(), gas: new Types.ObjectId(), water: new Types.ObjectId() };
				wellForecastAssignments.push({
					data,
					forecast: forecastId,
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					well: Types.ObjectId(wellId),
				});

				FORECAST_BASE_PHASES.forEach((phase) => {
					forecastDataModel.push({
						_id: data[phase],
						data_freq: 'monthly',
						forecast: forecastId,
						forecastType: 'not_forecasted',
						P_dict: {},
						p_extra: {},
						phase,
						project: projectId,
						warning: { status: false, message: '' },
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						well: Types.ObjectId(wellId),
					});
				});
			}
			await this.saveForecastWellAssignment(type, wellForecastAssignments, forecastDataModel);
		}

		const forecastUpdated = await this.updateForecastWellsAndGetForecast(forecastId, wellSet);

		const response: AddWellToForecastResponse = {
			message: `Successfully Added ${wellSet.size} well(s) To Forecast`,
			wellsIds: forecastUpdated.wells.map((wellId) => wellId.toString()),
		};

		return response;
	};

	getForecast = async (forecastId: Types.ObjectId): Promise<ForecastModel> => {
		return (await this.context.models.ForecastModel.findOne({ _id: forecastId }))?.toObject() as ForecastModel;
	};

	getMultipleSegments = async (segments: ForecastSegmentModel[]): Promise<MultipleSegments> => {
		const multipleSegments = new MultipleSegments(segments);
		return multipleSegments;
	};

	postDeterministicForecastSegments = async (
		forecastId: Types.ObjectId,
		wellId: Types.ObjectId,
		phase: string,
		series: string,
		segments: ForecastSegmentModel[]
	): Promise<Types.ObjectId> => {
		const location = `P_dict.${series}.segments`;
		const queryParams = { forecast: forecastId, phase, well: wellId };
		await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
			$push: { [location]: { $each: segments } },
			$set: {
				forecasted: true,
				forecastType: 'rate',
				forecastSubType: 'external_integration',
				status: 'in_progress',
				reviewedAt: null,
				reviewedBy: null,
			},
		});
		const segmentsId = (await this.context.models.DeterministicForecastDataModel.findOne(queryParams)
			.select({ _id: 1 })
			.lean()) as Types.ObjectId;
		return segmentsId;
	};

	getDeterministicForecastSegments = async (
		forecastId: Types.ObjectId,
		wellId: Types.ObjectId,
		phase: string,
		series: string
	): Promise<Array<ForecastSegmentModel>> => {
		const location = `P_dict.${series}.segments`;
		const queryParams = { forecast: forecastId, phase, well: wellId };
		const results =
			((
				await this.context.models.DeterministicForecastDataModel.findOne(queryParams, { _id: 0, [location]: 1 })
			)?.toObject() as DeterministicPdict) || {};
		const segments = results.P_dict?.best?.segments || [];
		return segments;
	};

	deleteDeterministicForecastSegments = async (
		forecastId: Types.ObjectId,
		wellId: Types.ObjectId,
		phase: string,
		series: string
	): Promise<void> => {
		const location = `P_dict.${series}.segments`;
		const queryParams = { forecast: forecastId, phase, well: wellId };
		await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
			$set: {
				[location]: [],
				forecasted: false,
				forecastType: 'not_forecasted',
				forecastSubType: null,
				status: 'in_progress',
				reviewedAt: null,
				reviewedBy: null,
			},
		});
	};

	putDeterministicForecastSegments = async (
		forecastId: Types.ObjectId,
		wellId: Types.ObjectId,
		phase: string,
		series: string,
		segments: ForecastSegmentModel[]
	): Promise<Types.ObjectId> => {
		const location = `P_dict.${series}.segments`;
		const queryParams = { forecast: forecastId, phase, well: wellId };

		await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
			$set: {
				[location]: segments,
				forecasted: true,
				forecastType: 'rate',
				forecastSubType: 'external_integration',
				status: 'in_progress',
				reviewedAt: null,
				reviewedBy: null,
			},
		});
		const segmentsId = (await this.context.models.DeterministicForecastDataModel.findOne(queryParams)
			.select({ _id: 1 })
			.lean()) as Types.ObjectId;
		return segmentsId;
	};

	getForecastParams = async (forecastId: Types.ObjectId): Promise<ForecastDataModel> => {
		return (
			await this.context.models.ForecastDataModel.findOne({ _id: forecastId })
		)?.toObject() as ForecastDataModel;
	};

	saveForecastWellAssignment = async (
		forecastType: string,
		assignmentWellForecast: ForecastWellAssignmentModel[],
		forecastData: ForecastDataModel[]
	) => {
		//are these transactions using unit of work?
		await this.context.models.ForecastWellAssignmentModel.insertMany(assignmentWellForecast);

		if (forecastType === FORECAST_TYPES.Probabilistic) {
			await this.context.models.ForecastDataModel.insertMany(forecastData);
		} else {
			await this.context.models.DeterministicForecastDataModel.insertMany(forecastData);
		}
	};

	updateForecastWellsAndGetForecast = async (
		forecastId: Types.ObjectId,
		wellsToAdd: Set<string>
	): Promise<ForecastModel> => {
		return (
			await this.context.models.ForecastModel.findOneAndUpdate(
				{ _id: forecastId },
				{ $push: { wells: [...wellsToAdd] } },
				{ new: true }
			)
		)?.toObject() as ForecastModel;
	};

	toApiForecastSegment = (forecastSegment: ForecastSegmentModel) => {
		return {
			b: forecastSegment?.b,
			flatValue: forecastSegment?.c,
			diEffSec: forecastSegment?.D_eff as number,
			slope: forecastSegment?.k,
			endDate: convertIdxToDate(forecastSegment?.end_idx).toISOString().slice(0, 10),
			segmentType: forecastSegment?.name,
			qEnd: forecastSegment?.q_end,
			qStart: forecastSegment?.q_start,
			startDate: convertIdxToDate(forecastSegment.start_idx).toISOString().slice(0, 10),
			targetDSwEffSec: forecastSegment?.target_D_eff_sw,
		};
	};
}
export { ForecastService, serviceResolver };
