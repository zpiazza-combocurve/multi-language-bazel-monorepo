import { convertIdxToDateUTC } from '@combocurve/shared';
import { BaseContext } from '@combocurve/shared/base-context';
import _ from 'lodash';

import {
	IDeleteAllProductionData,
	IDeleteSelectedProductionData,
	IDeleteWithInputProductionData,
} from '../models/production-delete-requests';
import { Resolution } from '../models/resolution';

export class DalDeleteProductionDataService {
	private readonly context: BaseContext;

	constructor(context: BaseContext) {
		this.context = context;
	}

	async perform(
		mode: 'all' | 'selected' | 'input',
		params: IDeleteAllProductionData | IDeleteSelectedProductionData | IDeleteWithInputProductionData,
		getAllowedWellsForDeletingProductionData: (allRequestedWells: string[]) => Promise<string[]>
	) {
		let deletedCount = 0;
		let wellIdsToRunCalcs: string[] = [];

		switch (mode) {
			case 'all': {
				const allDeleteParams = params as IDeleteAllProductionData;

				allDeleteParams.wells = await getAllowedWellsForDeletingProductionData(allDeleteParams.wells);

				wellIdsToRunCalcs = allDeleteParams.wells;

				deletedCount = await this._deleteAllProductionData(allDeleteParams);

				break;
			}

			case 'selected': {
				const selectedDeleteParams = params as IDeleteSelectedProductionData;

				selectedDeleteParams.deletions = _.pick(
					selectedDeleteParams.deletions,
					await getAllowedWellsForDeletingProductionData(Object.keys(selectedDeleteParams.deletions))
				);

				wellIdsToRunCalcs = Object.keys(selectedDeleteParams.deletions);

				deletedCount = await this._deleteSelectedProductionData(selectedDeleteParams);

				break;
			}

			case 'input': {
				const withInputDeleteParams = params as IDeleteWithInputProductionData;

				withInputDeleteParams.wells = await getAllowedWellsForDeletingProductionData(
					withInputDeleteParams.wells
				);

				wellIdsToRunCalcs = withInputDeleteParams.wells;

				deletedCount = await this._deleteWithInputProductionData(withInputDeleteParams);

				break;
			}

			default:
				throw new Error(`Unknown delete production data mode ${mode}.`);
		}

		return { deletedCount, wellIdsToRunCalcs };
	}

	private async _deleteAllProductionData(params: IDeleteAllProductionData) {
		let deletedCount = 0;

		// DAL needs a non-empty list of wells
		if (this.context.dal && params.wells.length > 0) {
			if (params.monthly) {
				const monthlyResponse = await this.context.dal.monthlyProduction.deleteByManyWells({
					wells: params.wells,
				});

				// TODO: add 'deleted' in the DAL
				deletedCount += monthlyResponse['deleted'] ?? 0;
			}

			if (params.daily) {
				const dailyResponse = await this.context.dal.dailyProduction.deleteByManyWells({
					wells: params.wells,
				});

				// TODO: add 'deleted' in the DAL
				deletedCount += dailyResponse['deleted'] ?? 0;
			}
		}

		return deletedCount;
	}

	private async _deleteSelectedProductionData(params: IDeleteSelectedProductionData) {
		const sorted = Object.entries(params.deletions).reduce((acc, [wellId, indexes]) => {
			acc[wellId] ??= [];
			acc[wellId].push(...indexes);
			acc[wellId] = acc[wellId].sort((a, b) => a - b);

			return acc;
		}, {} as { [key: string]: number[] });

		const ranges =
			params.resolution === 'daily'
				? this._getDailyDeletionDateRangesForSelectedSorted(sorted)
				: this._getMonthlyDeletionDateRangesForSelectedSorted(sorted);

		const deletedCount = await this._deleteForRanges(params.resolution, ranges);

		return deletedCount;
	}

	private async _deleteWithInputProductionData(params: IDeleteWithInputProductionData) {
		let deletedCount = 0;

		if (params.range) {
			const ranges = params.wells.map((wellId) => ({
				well: wellId,
				dateRange: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					startDate: new Date(params.range!.start),
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					endDate: new Date(params.range!.end),
				},
			}));

			if (params.monthly) {
				deletedCount += await this._deleteForRanges('monthly', ranges);
			}

			if (params.daily) {
				deletedCount += await this._deleteForRanges('daily', ranges);
			}
		} else if (params.relative) {
			if (params.monthly) {
				deletedCount += await this._deleteProductionFromRelativeDate('monthly', params.wells, params.relative);
			}

			if (params.daily) {
				deletedCount += await this._deleteProductionFromRelativeDate('daily', params.wells, params.relative);
			}
		}

		return deletedCount;
	}

	private async _deleteProductionFromRelativeDate(
		resolution: Resolution,
		wells: string[],
		relativeData: {
			offset: number;
			units: 'day' | 'month' | 'year';
			wellHeaderField: string;
		}
	) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const wellsRelativeDates: any[] = await this.context.models.WellModel.find({
			_id: { $in: wells },
		})
			.select(`_id ${relativeData.wellHeaderField}`)
			.lean();

		const ranges: { dateRange: { startDate: Date; endDate: Date }; well: string }[] = [];

		wellsRelativeDates.forEach((curr) => {
			const firstDate: Date | null = curr[relativeData.wellHeaderField];

			if (firstDate) {
				let secondDate = new Date(firstDate);

				switch (relativeData.units) {
					case 'day': {
						secondDate = new Date(secondDate.setUTCDate(secondDate.getUTCDate() + relativeData.offset));
						break;
					}

					case 'month': {
						secondDate = new Date(secondDate.setUTCMonth(secondDate.getUTCMonth() + relativeData.offset));
						break;
					}

					case 'year': {
						secondDate = new Date(
							secondDate.setUTCFullYear(secondDate.getUTCFullYear() + relativeData.offset)
						);
						break;
					}

					default:
						break;
				}

				const [start, end] = [firstDate, secondDate].sort((a, b) => a.getTime() - b.getTime());

				const { startDate, endDate } = (() => {
					const startDate = new Date(start);
					const endDate = new Date(end);

					if (relativeData.offset > 0) {
						endDate.setUTCDate(endDate.getUTCDate() - 1);
					} else {
						startDate.setUTCDate(startDate.getUTCDate() + 1);
					}

					return { startDate, endDate };
				})();

				ranges.push({ well: curr._id.toString(), dateRange: { startDate, endDate } });
			}
		});

		const deletedCount = await this._deleteForRanges(resolution, ranges);

		return deletedCount;
	}

	private async _deleteForRanges(
		resolution: Resolution,
		ranges: {
			dateRange: {
				startDate: Date;
				endDate: Date;
			};
			well: string;
		}[]
	) {
		let deletedCount = 0;

		const production =
			resolution === 'daily' ? this.context.dal?.dailyProduction : this.context.dal?.monthlyProduction;

		if (!production) {
			return deletedCount;
		}

		for (const request of ranges) {
			const response = await production.deleteByWell(request);

			// TODO: add 'deleted' in the DAL
			deletedCount += response['deleted'] ?? 0;
		}

		return deletedCount;
	}

	private _getDailyDeletionDateRangesForSelectedSorted(sorted: { [key: string]: number[] }) {
		const nextIndexIsAdjacentToPreviousIfTheirDifferenceIsLessOrEqualThan = 1;

		return this._getDeletionDateRangesForSelectedSorted(
			sorted,
			nextIndexIsAdjacentToPreviousIfTheirDifferenceIsLessOrEqualThan
		);
	}

	private _getMonthlyDeletionDateRangesForSelectedSorted(sorted: { [key: string]: number[] }) {
		//as for monthly index is the mid of month, difference can vary, so set 35 to be in range for sure
		const nextIndexIsAdjacentToPreviousIfTheirDifferenceIsLessOrEqualThan = 35;

		return this._getDeletionDateRangesForSelectedSorted(
			sorted,
			nextIndexIsAdjacentToPreviousIfTheirDifferenceIsLessOrEqualThan
		);
	}

	private _getDeletionDateRangesForSelectedSorted(
		sorted: { [key: string]: number[] },
		indexIsAdjacentToPreviousIfDifferenceIsLessOrEqualThan: number
	) {
		const ranges: { dateRange: { startDate: Date; endDate: Date }; well: string }[] = [];

		Object.entries(sorted).forEach(([wellId, indexes]) => {
			const initialDate = indexes.length > 0 ? convertIdxToDateUTC(indexes[0]) : undefined;
			let dateFrom = initialDate;
			let dateTo = initialDate;

			for (let i = 1; i < indexes.length; ++i) {
				const idx = indexes[i];
				const previousIdx = indexes[i - 1];

				if (idx !== previousIdx) {
					const date = convertIdxToDateUTC(idx);

					if (idx - previousIdx <= indexIsAdjacentToPreviousIfDifferenceIsLessOrEqualThan) {
						//means next one is next day and range can be extended
						dateTo = date;
					} else {
						if (dateFrom && dateTo) {
							ranges.push({ well: wellId, dateRange: { startDate: dateFrom, endDate: dateTo } });
						}

						dateFrom = date;
						dateTo = date;
					}
				}
			}

			//last range that wasn't added in the loop
			if (dateFrom && dateTo) {
				ranges.push({ well: wellId, dateRange: { startDate: dateFrom, endDate: dateTo } });
			}
		});

		return ranges;
	}
}
