import { Dictionary } from 'lodash';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import {
	FORECAST_RESOLUTION,
	ForecastResolutions,
	IForecastPhaseVolumes,
	IForecastRatioVolumes,
	IForecastSeriesVolumes,
	IForecastVolumes,
} from '@src/models/forecast-volume';
import {
	ForecastSegment,
	IForecastData,
	isDeterministicForecastData,
	isPSeries,
	IWellForecastDataGroup,
	PDict,
	PDictValue,
	PSeries,
	RatioPDictValue,
} from '@src/models/forecast-data';
import {
	getArpsInclineSegmentVolumes,
	getArpsSegmentVolumes,
} from '@src/strategies/forecast-segment-volumes/arps-segment-strategy';
import {
	getExponentialDeclineSegmentVolumes,
	getExponentialInclineSegmentVolumes,
} from '@src/strategies/forecast-segment-volumes/exponential-decline-segment-strategy';
import { getNextMonthStartIndex, indexToDate } from '@src/helpers/dates';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseForecastResolved } from '@src/api/v1/projects/forecasts/fields';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { BaseService } from '@src/base-context';
import config from '@src/config';
import { DAYS_IN_YEAR } from '@src/constants';
import { ForecastSegmentVolumeStrategy } from '@src/strategies/forecast-segment-volumes/forecast-segment-volume-strategy';
import { getArpsModifiedSegmentVolumes } from '@src/strategies/forecast-segment-volumes/modified-arps-segment-strategy';
import { getEmptySegmentVolumes } from '@src/strategies/forecast-segment-volumes/empty-segment-strategy';
import { getFlatSegmentVolumes } from '@src/strategies/forecast-segment-volumes/flat-segment-strategy';
import { getForecastDataModel } from '@src/helpers/context';
import { getLinearSegmentVolumes } from '@src/strategies/forecast-segment-volumes/linear-segment-strategy';
import { ISort } from '@src/helpers/mongo-queries';
import { multiplyArrayValues } from '@src/helpers/array';
import { notNil } from '@src/helpers/typing';
import { ValidationError } from '@src/helpers/validation';

import {
	ApiForecastVolumes,
	getFilters,
	getSort,
	toApiForecastDailyVolumes,
} from '../api/v1/projects/forecasts/volumes/fields/forecast-volumes';

const monthlyReportingDayOfMonth = 15;

export class ForecastVolumeService extends BaseService<ApiContextV1> {
	private segmentStrategies: Dictionary<ForecastSegmentVolumeStrategy> = {
		arps: getArpsSegmentVolumes,
		arps_inc: getArpsInclineSegmentVolumes,
		exp_dec: getExponentialDeclineSegmentVolumes,
		exp_inc: getExponentialInclineSegmentVolumes,
		flat: getFlatSegmentVolumes,
		linear: getLinearSegmentVolumes,
		arps_modified: getArpsModifiedSegmentVolumes,
		empty: getEmptySegmentVolumes,
	};

	static attribute = 'forecastVolumeService';

	// This is really just a count of wells in the forecast at the moment
	// but it could be expanded to include a count of phases/series as well
	async getForecastVolumesCount(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
	): Promise<number> {
		const mappedFilters = getFilters(filters, project, forecast);

		const pipelineFilter = mappedFilters ? [{ $match: mappedFilters }] : [];

		const pipelineGroup = [
			{
				$group: {
					_id: '$well',
				},
			},
		];

		const countOperation = [{ $count: 'count' }];

		const pipeline = [...pipelineFilter, ...pipelineGroup, ...countOperation];

		const forecastDataModel = getForecastDataModel(this.context, forecast.type);

		const result = await forecastDataModel.aggregate<{ count: number }>(pipeline);

		return result[0].count;
	}

	async getForecastVolumes(
		skip: number,
		take: number,
		sort: ISort,
		startDate: number | undefined,
		endDate: number | undefined,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
		resolution: ForecastResolutions,
		cursor?: string,
	): Promise<IPageData<ApiForecastVolumes>> {
		const { allowCursor, sortQuery } = getSort(sort, cursor) || {};

		const wellForecastDataGroups = await this.getWellForecastDataGroups(
			skip,
			take,
			sortQuery ?? {},
			filters,
			project,
			forecast,
			cursor,
		);

		const forecastVolumeData = this.getWellForecastDataGroupVolumes(
			forecast,
			wellForecastDataGroups,
			resolution,
			startDate,
			endDate,
		);

		const result = forecastVolumeData
			.slice(0, take)
			.map((forecastVolumeData) => toApiForecastDailyVolumes(forecastVolumeData));

		return {
			result: result,
			hasNext: forecastVolumeData.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as keyof ApiForecastVolumes] as CursorType)
					: null,
		};
	}

	private async getWellForecastDataGroups(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
		cursor?: string,
	): Promise<Array<IWellForecastDataGroup>> {
		const { sortQuery, cursorFilter } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, forecast, cursorFilter);

		const pipelineFilter = mappedFilters ? [{ $match: mappedFilters }] : [];

		// Group forecast outputs by well so that all phases are calculated
		// and returned at one time.  This also allows us to use cursor pagination
		// using the well id
		const pipelineGroup = [
			{
				$group: {
					_id: '$well',
					outputs: { $push: '$$ROOT' },
					well: { $first: '$well' },
					forecast: { $first: '$forecast' },
					project: { $first: '$project' },
				},
			},
		];
		const pipelineSort = sortQuery ? [{ $sort: sortQuery }] : [];
		const pipelineSkip = skip !== undefined ? [{ $skip: skip }] : [];
		const pipelineLimit = take ? [{ $limit: take + 1 }] : [];

		const pipeline = [...pipelineFilter, ...pipelineGroup, ...pipelineSort, ...pipelineSkip, ...pipelineLimit];

		const forecastDataModel = getForecastDataModel(this.context, forecast.type);

		const forecastData = await forecastDataModel.aggregate<IWellForecastDataGroup>(pipeline);

		return forecastData;
	}

	private getWellForecastDataGroupVolumes(
		forecast: BaseForecastResolved,
		wellForecastDataGroups: Array<IWellForecastDataGroup>,
		resolution: ForecastResolutions,
		startIdx?: number,
		endIdx?: number,
	): Array<IForecastVolumes> {
		return wellForecastDataGroups.map((wellForecastDataGroup) => {
			const forecastVolumes = {
				project: wellForecastDataGroup.project,
				forecast: wellForecastDataGroup.forecast,
				well: wellForecastDataGroup.well,
				resolution: resolution,
				phases: this.getForecastPhaseVolumes(forecast, wellForecastDataGroup, resolution, startIdx, endIdx),
			};

			return forecastVolumes;
		});
	}

	private getForecastPhaseVolumes(
		forecast: BaseForecastResolved,
		wellForecastDataGroup: IWellForecastDataGroup,
		resolution: ForecastResolutions,
		startIdx?: number,
		endIdx?: number,
	): Array<IForecastPhaseVolumes> {
		// find the start index of the first segment across all
		// phases and series in order to ensure that all results
		// for the same well have the same start date.  This is
		// to keep our results in line with the UI volume export functionality
		const firstStartIndex = startIdx || this.getFirstSegmentStartIndex(wellForecastDataGroup.outputs);
		const lastEndIndex = endIdx || this.getLastSegmentEndIndex(wellForecastDataGroup.outputs);

		this.validateIndexesAgainstSegments(firstStartIndex, lastEndIndex, endIdx, startIdx);

		// Get base phase volumes
		const phaseVolumes: Array<IForecastPhaseVolumes> = wellForecastDataGroup.outputs
			.filter((output) => output?.P_dict) // filter out outputs that don't have a P_dict
			.filter(
				(output) =>
					forecast.type == 'probabilistic' ||
					(isDeterministicForecastData(output) && output.forecastType == 'rate'),
			)
			.map((output) => {
				return {
					phase: output.phase,
					forecastOutputId: output._id,
					series: Object.entries(<PDict>output.P_dict) // explode P_dict to access each series in output
						.filter(([key, value]) => isPSeries(key) && value.segments && value.segments.length > 0) // filter out series with no segments
						.map(([key, value]) => {
							return this.getForecastSeriesVolumes(
								key as PSeries,
								value,
								resolution,
								firstStartIndex,
								lastEndIndex,
							);
						}),
				};
			});

		if (forecast.type == 'deterministic') {
			// reconcile ratio phases for deterministic outputs
			wellForecastDataGroup.outputs.forEach((output) => {
				if (
					isDeterministicForecastData(output) &&
					output.forecastType == 'ratio' &&
					output?.ratio?.segments &&
					output.ratio.segments.length > 0
				) {
					const basePhase = phaseVolumes.find((phaseVolume) => phaseVolume.phase == output.ratio?.basePhase);

					if (basePhase) {
						const ratioPhase = {
							phase: output.phase,
							forecastOutputId: output._id,
							series: [],
							ratio: this.getForecastRatioVolume(
								output.ratio,
								basePhase,
								resolution,
								firstStartIndex,
								lastEndIndex,
							),
						};

						phaseVolumes.push(ratioPhase);
					}
				}
			});
		}

		// roll up monthly values
		if (resolution == 'monthly') {
			phaseVolumes.forEach((phase) => {
				phase.series.forEach((series) => {
					series.volumes = this.rollUpMonthlyValues(series.volumes, firstStartIndex, lastEndIndex);
					series.startDate = this.getAdjustedMonthlyReportingDate(series.startDate);
					series.endDate = this.getAdjustedMonthlyReportingDate(series.endDate);
				});

				if (phase.ratio) {
					phase.ratio.volumes = phase.ratio.volumes?.length
						? this.rollUpMonthlyValues(phase.ratio.volumes, firstStartIndex, lastEndIndex)
						: [];
					phase.ratio.startDate = this.getAdjustedMonthlyReportingDate(phase.ratio.startDate);
					phase.ratio.endDate = this.getAdjustedMonthlyReportingDate(phase.ratio.endDate);
				}
			});
		}

		return phaseVolumes;
	}

	private validateIndexesAgainstSegments(
		firstStartIndex: number,
		lastEndIndex: number,
		endIdx: number | undefined,
		startIdx: number | undefined,
	) {
		if (firstStartIndex < Infinity && lastEndIndex > -Infinity && firstStartIndex > lastEndIndex) {
			// The endDate query param was the only param of the date params set and it was set to a date that is before the first segment starts.
			if (endIdx && !startIdx) {
				throw new ValidationError(
					`The endDate query param was set to a date before the first segment starts for one or more wells. If you want to use this endDate you must provide a startDate param before the first segment starts.`,
					'endDate',
				);
			}
			// The startDate query param was the only param of the date params set and it was set to a date that is after the last segment ends.
			if (startIdx && !endIdx) {
				throw new ValidationError(
					`The startDate query param was set to a date after the last segment ends for one or more wells. If you want to use this startDate you must provide an endDate param after the last segment ends.`,
					'startDate',
				);
			}
			// Both startDate and endDate query params were set and the startDate is greater than the endDate.
			if (startIdx && endIdx) {
				throw new ValidationError(
					`The startDate and endDate query params were set such that the startDate is greater than the endDate.`,
					'startDate or endDate',
				);
			}
		}
	}

	private getAdjustedMonthlyReportingDate(inputDate: Date): Date {
		return new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), monthlyReportingDayOfMonth));
	}

	// Daily volumes can be limited by config to a certain number of years.
	// If this config is enabled we need to calculate the new end date.
	private getEndIndex(resolution: string, firstStartIndex: number, lastEndIndex: number) {
		if (resolution === FORECAST_RESOLUTION[0] && config.dailyForecastVolumeYearNumberLimit > 0) {
			const limitInDays = Math.round(config.dailyForecastVolumeYearNumberLimit * DAYS_IN_YEAR);
			const timeDifference = lastEndIndex - firstStartIndex;
			// if the time difference is less than or equal to limitInDays, return lastEndIndex
			// otherwise, return firstStartIndex plus the limitInDays
			return timeDifference <= limitInDays ? lastEndIndex : firstStartIndex + limitInDays;
		} else {
			// if resolution is not 'FORECAST_RESOLUTION[0] a.k.a Daily Resolution' or config.dailyForecastVolumeYearNumberLimit is 0 or less,
			// then return lastEndIndex if it's not null or undefined, otherwise return 0
			return lastEndIndex ?? 0;
		}
	}

	private getForecastRatioVolume(
		ratio: RatioPDictValue,
		basePhase: IForecastPhaseVolumes,
		resolution: ForecastResolutions,
		firstStartIndex: number,
		lastEndIndex: number,
	): IForecastRatioVolumes {
		const endIndex = this.getEndIndex(resolution, firstStartIndex, lastEndIndex);

		const ratioVolumes = this.getForecastSeriesSegmentVolumes(
			ratio.segments,
			resolution,
			firstStartIndex,
			lastEndIndex,
		);

		return {
			eur: ratio.eur,
			basePhase: ratio.basePhase,
			startDate: indexToDate(firstStartIndex),
			endDate: indexToDate(endIndex),
			volumes: basePhase.series?.length ? multiplyArrayValues(ratioVolumes, basePhase.series[0].volumes) : [],
		};
	}

	private getForecastSeriesVolumes(
		seriesType: PSeries,
		series: PDictValue,
		resolution: ForecastResolutions,
		firstStartIndex: number,
		lastEndIndex: number,
	): IForecastSeriesVolumes {
		const endIndex = this.getEndIndex(resolution, firstStartIndex, lastEndIndex);

		return {
			eur: series.eur,
			series: seriesType,
			startDate: indexToDate(firstStartIndex),
			endDate: indexToDate(endIndex),
			volumes: this.getForecastSeriesSegmentVolumes(series.segments, resolution, firstStartIndex, lastEndIndex),
		};
	}

	private getForecastSeriesSegmentVolumes(
		segments: Array<ForecastSegment> | undefined,
		resolution: ForecastResolutions,
		wellForecastFirstSegmentStartIndex: number,
		wellForecastLastSegmentEndIndex: number,
	): Array<number> {
		return resolution == 'monthly'
			? this.getMonthlyForecastSeriesSegmentVolumes(segments, wellForecastFirstSegmentStartIndex)
			: this.getDailyForecastSeriesSegmentVolumes(
					segments,
					wellForecastFirstSegmentStartIndex,
					wellForecastLastSegmentEndIndex,
			  );
	}

	private getDailyForecastSeriesSegmentVolumes(
		segments: Array<ForecastSegment> | undefined,
		wellForecastFirstSegmentStartIndex: number,
		wellForecastLastSegmentEndIndex: number,
	): Array<number> {
		const volumes: Array<number> = [];

		if (!segments) {
			return volumes;
		}

		const firstSegmentStartIndex = segments[0].start_idx ?? 0;
		const lastSegmentEndIndex = segments[segments.length - 1].end_idx ?? 0;

		// If the application is configured to limit daily forecast volumes we need to determine
		// the total number of days to calculate volumes for.  This will allow us to not process
		// segments if the necessary number of daily volumes has already been reached.
		let allowedVolumeDaysRemaining =
			config.dailyForecastVolumeYearNumberLimit > 0
				? Math.round(config.dailyForecastVolumeYearNumberLimit * DAYS_IN_YEAR) + 1
				: 0;

		// If the well has other phases/series with segments that start prior to any segments in
		// this phase, include padding values so that all output volumes for the given well have the same
		// date range.  This is included because the UI export has this functionality.
		if (wellForecastFirstSegmentStartIndex < firstSegmentStartIndex) {
			let emptyValueCount = firstSegmentStartIndex - wellForecastFirstSegmentStartIndex;

			if (emptyValueCount > allowedVolumeDaysRemaining) {
				emptyValueCount = allowedVolumeDaysRemaining;
			}

			volumes.push(...Array(emptyValueCount).fill(0));
			allowedVolumeDaysRemaining -= emptyValueCount;
		}

		// If this series ends before any of the other series in the forecast for the well
		// then pad the end of the volumes with zero values
		if (lastSegmentEndIndex < wellForecastLastSegmentEndIndex) {
			segments.push({
				start_idx: lastSegmentEndIndex,
				end_idx: wellForecastLastSegmentEndIndex,
				name: 'empty',
			});
		}

		segments
			.filter((segment) => segment.name)
			.forEach((segment) => {
				const startIndex = segment.start_idx ?? 0;
				const originalEndIndex = (segment.end_idx ?? 0) + 1;

				let daysToProcess = originalEndIndex - startIndex;

				if (daysToProcess > allowedVolumeDaysRemaining) {
					daysToProcess = allowedVolumeDaysRemaining;
				}

				// If we have already met the required number of days skip
				// processing remaining segments as their results would just be discarded
				if (config.dailyForecastVolumeYearNumberLimit == 0 || daysToProcess > 0) {
					const segmentVolumeStrategy =
						segment.name && segment.name in this.segmentStrategies
							? this.segmentStrategies[segment.name]
							: this.segmentStrategies['empty'];

					volumes.push(...segmentVolumeStrategy(segment).slice(0, daysToProcess));
				}

				allowedVolumeDaysRemaining -= daysToProcess;
			});

		return volumes;
	}

	private getMonthlyForecastSeriesSegmentVolumes(
		segments: Array<ForecastSegment> | undefined,
		wellForecastFirstSegmentStartIndex: number,
	): Array<number> {
		let volumes: Array<number> = [];

		if (!segments) {
			return volumes;
		}

		const firstSegmentStartIndex = segments[0].start_idx ?? 0;

		// If the well has other phases/series with segments that start prior to any segments in
		// this phase, include padding values so that all output volumes for the given well have the same
		// date range.  This is included because the UI export has this functionality.
		if (wellForecastFirstSegmentStartIndex < firstSegmentStartIndex) {
			const emptyValueCount = firstSegmentStartIndex - wellForecastFirstSegmentStartIndex;
			volumes.push(...Array(emptyValueCount).fill(0));
		}

		segments
			.filter((segment) => segment.name)
			.forEach((segment) => {
				const segmentVolumeStrategy =
					segment.name && segment.name in this.segmentStrategies
						? this.segmentStrategies[segment.name]
						: this.segmentStrategies['empty'];

				volumes = volumes.concat(segmentVolumeStrategy(segment));
			});

		return volumes;
	}

	private rollUpMonthlyValues(values: Array<number>, startIndex: number, endIndex: number): Array<number> {
		let nextMonthStartIndex = getNextMonthStartIndex(startIndex);
		const aggregatedValues = [];
		let currentAggregateValue = 0;

		for (let i = startIndex; i <= endIndex; i++) {
			if (i === nextMonthStartIndex) {
				aggregatedValues.push(currentAggregateValue);
				currentAggregateValue = 0;
				nextMonthStartIndex = getNextMonthStartIndex(i);
			}

			const valueIndex = i - startIndex;

			if (valueIndex < values.length) {
				currentAggregateValue += values[valueIndex];
			}
		}

		// add remaining aggregate value
		aggregatedValues.push(currentAggregateValue);

		return aggregatedValues;
	}

	private getAllRatioSegments(forecastOutputs: Array<IForecastData>): Array<ForecastSegment> {
		return forecastOutputs
			.filter(isDeterministicForecastData)
			.filter((x) => x.forecastType == 'ratio' && x.ratio && x.ratio.segments && x.phase != x.ratio.basePhase)
			.flatMap((x) => x.ratio?.segments)
			.filter(notNil);
	}

	private getAllPDictSegments(forecastOutputs: Array<IForecastData>): Array<ForecastSegment> {
		return forecastOutputs
			.map((x) => x.P_dict)
			.filter(notNil)
			.filter((x) => !isDeterministicForecastData(x) || x.forecastType == 'rate')
			.flatMap((x) => Object.values(<PDict>x))
			.flatMap((x) => x.segments)
			.filter(notNil);
	}

	getFirstSegmentStartIndex(forecastOutputs: Array<IForecastData>): number {
		return Math.min(
			...this.getAllPDictSegments(forecastOutputs)
				.concat(this.getAllRatioSegments(forecastOutputs))
				.map((x) => x.start_idx ?? 0)
				.filter((x) => x > 0),
		);
	}

	getLastSegmentEndIndex(forecastOutputs: Array<IForecastData>): number {
		return Math.max(
			...this.getAllPDictSegments(forecastOutputs)
				.concat(this.getAllRatioSegments(forecastOutputs))
				.map((x) => x.end_idx ?? 0)
				.filter((x) => x > 0),
		);
	}
}
