import { BaseContext, BaseService, Destroyer, convertIdxToDate } from '@combocurve/shared';
import { beginningOfTime, endOfTime } from '@combocurve/shared/helpers/utilities';
import { findLast, keyBy, omit } from 'lodash';
import { Model, Types } from 'mongoose';

import { IDeleteAllProductionData, IDeleteWithInputProductionData } from '../models/production-delete-requests';
import { Resolution } from '../models/resolution';
import { DalDeleteProductionDataService } from './dal-delete-production-data-service';
import { ScheduleService } from './schedules';

export interface WellDeleteResponse {
	msg: string;
	successCount: number;
	forecastingWells: boolean;
}

export interface ProductionDeleteResponse {
	successCount: number;
	serviceResponse?: string;
}

// used for deleting production data
const NON_BUCKET_PRODUCTION_DATA_FIELDS = [
	'_id',
	'createdAt',
	'updatedAt',
	'project',
	'well',
	'chosenID',
	'startIndex',
	'first_production_index',
	'__v',
	// 'index', //to delete production data the index is set to null
];

class WellService extends BaseService<BaseContext> {
	protected dalDeleteProductionDataService: DalDeleteProductionDataService;
	protected scheduleService: ScheduleService;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	protected destroyer: any;

	constructor(context: BaseContext) {
		super(context);
		this.dalDeleteProductionDataService = new DalDeleteProductionDataService(context);
		this.scheduleService = new ScheduleService(context);
		this.destroyer = new Destroyer({
			root: this.context.models.WellModel,
			children: [
				{
					model: this.context.models.MonthlyProductionModel,
					batchSize: 1000,
				},
				{
					model: this.context.models.DailyProductionModel,
					batchSize: 1000,
				},
			],
			refKey: 'well',
		});
	}

	deleteWells = async (wellIds: string[], projPermaDelete = false, limiter = null): Promise<WellDeleteResponse> => {
		// TODO: update to use destroyer (3)
		let ids = wellIds;
		let forecastingIds: Set<string> = new Set();

		if (!projPermaDelete) {
			// TODO: separate the "destroy" vs "unlink" (or side effect) phases
			// If any wells are part of running forecasts then we can't delete them yet. Exclude them and delete the others.
			const arrayOfForecastingIds = (
				await this.context.models.ForecastModel.aggregate([
					{ $match: { wells: { $in: wellIds }, running: true } },
					{ $project: { _id: false, wells: true } },
					{ $unwind: { path: '$wells' } },
					{ $match: { wells: { $in: wellIds } } },
					{ $group: { _id: '$wells' } },
				])
			).map((e) => e._id.toString());

			forecastingIds = new Set(arrayOfForecastingIds);

			ids = wellIds.filter((id) => !forecastingIds.has(id));

			await this.context.models.ForecastModel.updateMany(
				{ wells: { $in: ids } },
				{ $pullAll: { wells: ids } }
			).exec();
			await this.context.models.ForecastDataModel.deleteMany({ well: { $in: ids } }).exec();
			await this.context.models.DeterministicForecastDataModel.deleteMany({ well: { $in: ids } });
			await this.context.models.ForecastBucketModel.updateMany(
				{ bucket: { $in: ids } },
				{ $pullAll: { bucket: ids } }
			).exec();
			await this.context.models.EconRunModel.find({ wells: { $in: ids } }, { _id: 1 }).then(async (runIdsObj) => {
				const runIds = runIdsObj.map(({ _id }) => _id);
				await this.context.models.EconRunModel.deleteMany({ _id: { $in: runIds } }).exec();
				return this.context.models.EconRunsDataModel.deleteMany({ run: { $in: runIds } }).exec();
			});
			await this.context.models.FilterModel.updateMany(
				{ excludeWells: { $in: ids } },
				{ $pullAll: { excludeWells: ids } }
			).exec();
			await this.context.models.ProjectModel.updateMany(
				{ wells: { $in: ids } },
				{ $pullAll: { wells: ids } }
			).exec();
			await this.context.models.ScenarioModel.updateMany(
				{ wells: { $in: ids } },
				{ $pullAll: { wells: ids } }
			).exec();
			await this.context.models.ScenarioWellAssignmentModel.deleteMany({ well: { $in: ids } }).exec();
			await this.context.models.TypeCurveModel.updateMany(
				{ wells: { $in: ids } },
				{ $pullAll: { wells: ids }, wellsRemoved: true }
			).exec();
			await this.context.models.TypeCurveWellAssignmentModel.deleteMany({ well: { $in: ids } });
			await this.context.models.AssumptionModel.deleteMany({ well: { $in: ids } }).exec();
			await this.scheduleService.removeWellsFromAll(ids);
		}

		const destroyerResult = await this.destroyer
			.destroyAll({ _id: { $in: ids } }, { well: { $in: ids } }, { limiter })
			.exec();

		const response: WellDeleteResponse = {
			msg: `Successfully deleted ${destroyerResult[0].deletedCount} wells.`,
			forecastingWells: false,
			successCount: destroyerResult[0].deletedCount,
		};

		if (!projPermaDelete && forecastingIds.size) {
			response.msg += `\n${forecastingIds.size} wells were part of a running forecast and could not be deleted.\nPlease try again later.`;
			response.forecastingWells = true;
		}

		return response;
	};

	deleteProductions = async (
		resolution: Resolution,
		wellIds: string[],
		startDate?: Date,
		endDate?: Date
	): Promise<ProductionDeleteResponse> => {
		let request: IDeleteAllProductionData | IDeleteWithInputProductionData;
		let mode: 'all' | 'input';
		let response = 'ok';

		if (!wellIds?.length) {
			return { successCount: 0, serviceResponse: response };
		}

		const parseResolution = (kind: Resolution): { monthly: boolean; daily: boolean } => {
			return { monthly: kind === 'monthly', daily: kind === 'daily' };
		};

		if (startDate || endDate) {
			mode = 'input';
			request = {
				...parseResolution(resolution),
				wells: wellIds,
				range: {
					start: startDate ?? beginningOfTime,
					end: endDate ?? endOfTime,
				},
			};
		} else {
			mode = 'all';
			request = {
				...parseResolution(resolution),
				wells: wellIds,
			};
		}

		const { deletedCount, wellIdsToRunCalcs } = await this.dalDeleteProductionDataService.perform(
			mode,
			request,
			(x) => Promise.resolve(x)
		);

		//TODO: only run calcs when delete performed after DAL is updated to return deleted count
		//if (deletedCount > 0 && (wellIdsToRunCalcs?.length ?? 0) > 0) {
		if ((wellIdsToRunCalcs?.length ?? 0) > 0) {
			try {
				await this.updateProdCalcFields(wellIds, resolution);
			} catch (error) {
				response = `Error updating production calc fields. ${error}`;
			}
		}

		return { successCount: deletedCount || 0, serviceResponse: response };
	};

	updateProdCalcFields = async (wellsIds: string[], resolution: Resolution): Promise<void> => {
		const wellsDates: {
			well: string;
			hasData: boolean;
			firstProdDate: Date | undefined;
			lastProdDate: Date | undefined;
		}[] = [];

		for (const wellId of wellsIds) {
			const dates = (await this.getProductionDatesByWell(wellId, resolution)).sort();
			const hasData = dates.length > 0;

			wellsDates.push({
				well: wellId,
				hasData,
				firstProdDate: hasData ? dates[0] : undefined,
				lastProdDate: hasData ? dates[dates.length - 1] : undefined,
			});
		}

		const updateProdFieldOperations = wellsDates.map((wellDates) => {
			return {
				updateOne: {
					filter: { _id: wellDates.well },
					update: {
						$set:
							resolution === 'daily'
								? {
										has_daily: wellDates.hasData,
										first_prod_date_daily_calc: wellDates.firstProdDate,
										last_prod_date_daily: wellDates.lastProdDate,
								  }
								: {
										has_monthly: wellDates.hasData,
										first_prod_date_monthly_calc: wellDates.firstProdDate,
										last_prod_date_monthly: wellDates.lastProdDate,
								  },
					},
				},
			};
		});

		await this.context.models.WellModel.bulkWrite(updateProdFieldOperations, { ordered: false });
	};

	private async getProductionDatesByWell(wellId: string, resolution: Resolution): Promise<Date[]> {
		if (!wellId) {
			return [];
		}

		const resolutionEndpoint =
			resolution === 'daily' ? this.context.dal?.dailyProduction : this.context.dal?.monthlyProduction;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const resultIterator = resolutionEndpoint!.fetch({
			wells: [wellId],
			fieldMask: ['date'],
		});

		const result: Date[] = [];

		for await (const chunk of resultIterator) {
			if (chunk.date) {
				result.push(chunk.date);
			}
		}

		return result;
	}

	deleteProductionsMongo = async (
		resolution: Resolution,
		wellIds: string[],
		productionIds?: string[],
		startDateIndex?: number,
		endDateIndex?: number
	): Promise<ProductionDeleteResponse> => {
		let results = 0;
		const productionModel =
			resolution === 'daily'
				? this.context.models.DailyProductionModel
				: this.context.models.MonthlyProductionModel;
		if (productionIds && productionIds.length) {
			wellIds = await productionModel.find({ _id: { $in: productionIds } }, { well: 1 }).distinct('well');

			results = (await productionModel.deleteMany({ _id: { $in: productionIds } })).deletedCount || 0;
		} else {
			results = await this.deleteProductionDataFromRange(
				wellIds.map(Types.ObjectId),
				productionModel,
				startDateIndex as number,
				endDateIndex as number
			);
		}
		if (results > 0) {
			await this.updateProdCalcFieldsOld(wellIds, resolution);
		}

		return { serviceResponse: 'ok', successCount: results };
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	updateProdCalcFieldsOld = async (wellsIds: string[], kind: 'daily' | 'monthly'): Promise<any> => {
		const productionModel =
			kind === 'daily' ? this.context.models.DailyProductionModel : this.context.models.MonthlyProductionModel;

		// Find first and last production dates for each well
		const pipeline = [
			{
				$match: {
					well: { $in: wellsIds.map(Types.ObjectId) },
				},
			},
			{
				$sort: {
					startIndex: 1,
				},
			},
			{
				$group: {
					_id: '$well',
					firstIndex: { $first: '$index' },
					lastIndex: { $last: '$index' },
				},
			},
		];

		const datesLimitPerWellArr = (
			await productionModel.aggregate<{
				_id: Types.ObjectId;
				firstIndex: Array<number | null>;
				lastIndex: Array<number | null>;
			}>(pipeline)
		).map(({ _id, firstIndex, lastIndex }) => ({
			well: _id,
			firstProdDateIdx: firstIndex?.find((index) => index) || null,
			lastProdDateIdx: findLast(lastIndex, (index) => !!index) || null,
		}));

		const datesLimitPerWell = keyBy(datesLimitPerWellArr, ({ well }) => well.toString());

		const updateProdFieldOperations = wellsIds.map((id) => {
			const firstProdDateIdx = datesLimitPerWell[id]?.firstProdDateIdx;
			const lastProdDateIdx = datesLimitPerWell[id]?.lastProdDateIdx;
			const prodCalc = {
				hasData: datesLimitPerWell[id] !== undefined,
				firstProdDate: firstProdDateIdx ? convertIdxToDate(firstProdDateIdx) : null,
				lastProdDate: lastProdDateIdx ? convertIdxToDate(lastProdDateIdx) : null,
			};

			return {
				updateOne: {
					filter: { _id: id },
					update: {
						$set:
							kind === 'daily'
								? {
										has_daily: prodCalc.hasData,
										first_prod_date_daily_calc: prodCalc.firstProdDate,
										last_prod_date_daily: prodCalc.lastProdDate,
								  }
								: {
										has_monthly: prodCalc.hasData,
										first_prod_date_monthly_calc: prodCalc.firstProdDate,
										last_prod_date_monthly: prodCalc.lastProdDate,
								  },
					},
				},
			};
		});

		return await this.context.models.WellModel.bulkWrite(updateProdFieldOperations, { ordered: false });
	};

	async deleteProductionDataFromRange(
		wells: Types.ObjectId[],
		// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
		model: Model<unknown, {}, {}>,
		startIdx: number,
		endIdx: number
	): Promise<number> {
		const wellsWithIdx = wells.reduce((prev, curr) => {
			return {
				...prev,
				[curr.toString()]: {
					startIdx,
					endIdx,
				},
			};
		}, {});

		const { deletedCount, preliminaryDocUpdates } =
			await this.getPreliminaryDocUpdatesWithDeletedCountForProductionDataDelete(wellsWithIdx, model);

		await this.deleteProductionFromDocUpdates(model, preliminaryDocUpdates);

		return deletedCount;
	}

	async getPreliminaryDocUpdatesWithDeletedCountForProductionDataDelete(
		wellsWithIdx: { [key: string]: { startIdx: number; endIdx: number } },
		// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
		model: Model<unknown, {}, {}>
	) {
		let deletedCount = 0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const productions: any[] = await model
			.find({ well: { $in: Object.keys(wellsWithIdx).map((w) => new Types.ObjectId(w)) } })
			.lean();

		const preliminaryDocUpdates = {};

		for (let i = 0; i < productions.length; ++i) {
			const productionDoc = productions[i];
			const firstProdIdx = productionDoc.index[productionDoc.first_production_index];
			const lastProdIdx = findLast(productionDoc.index, (idx) => !!idx);
			const { startIdx, endIdx } = wellsWithIdx[productionDoc.well.toString()];

			if (
				firstProdIdx !== null &&
				((startIdx <= firstProdIdx && firstProdIdx <= endIdx && endIdx <= lastProdIdx) ||
					(firstProdIdx <= startIdx && endIdx <= lastProdIdx) ||
					(startIdx >= firstProdIdx && startIdx <= lastProdIdx && endIdx >= lastProdIdx) ||
					(firstProdIdx >= startIdx && endIdx >= lastProdIdx))
			) {
				const prodDocToUpdate = productionDoc;

				prodDocToUpdate.index.forEach((index) => {
					if (index !== null && index >= startIdx && index <= endIdx) {
						++deletedCount;

						const prodDocStrId = prodDocToUpdate._id.toString();
						preliminaryDocUpdates[prodDocStrId] =
							preliminaryDocUpdates[prodDocStrId] ||
							omit(prodDocToUpdate, NON_BUCKET_PRODUCTION_DATA_FIELDS);
						const patch = preliminaryDocUpdates[prodDocStrId];
						const fieldBucketIndex = prodDocToUpdate.index.indexOf(index);

						Object.keys(patch).forEach((bucket) => {
							patch[bucket][fieldBucketIndex] = null;
						});
					}
				});
			}
		}

		return {
			deletedCount,
			preliminaryDocUpdates,
		};
	}

	// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	async deleteProductionFromDocUpdates(model: Model<unknown, {}, {}>, preliminaryDocUpdates: any) {
		const finalDocUpdates = {};
		const productionDocDeletions: Types.ObjectId[] = [];

		Object.keys(preliminaryDocUpdates).forEach((prodDocStrId) => {
			const update = preliminaryDocUpdates[prodDocStrId];
			const firstProdIndex = update.index.findIndex((i) => i !== null);

			if (firstProdIndex > -1) {
				// update production document, where not all values from buckets were delete and update first_production_index
				finalDocUpdates[prodDocStrId] = { ...update, first_production_index: firstProdIndex };
			} else {
				// delete production document completely, because all of the bucket fields became filled with null
				productionDocDeletions.push(new Types.ObjectId(prodDocStrId));
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const writes: any[] = Object.keys(finalDocUpdates).map((docId) => ({
			updateOne: {
				filter: { _id: new Types.ObjectId(docId) },
				update: finalDocUpdates[docId],
			},
		}));

		if (productionDocDeletions.length > 0) {
			writes.push({
				deleteMany: {
					filter: { _id: { $in: productionDocDeletions } },
				},
			});
		}

		await model.bulkWrite(writes);
	}
}

export { WellService, NON_BUCKET_PRODUCTION_DATA_FIELDS };
