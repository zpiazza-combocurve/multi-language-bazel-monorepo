import { groupBy, uniq } from 'lodash';
import { Types } from 'mongoose';

import { getStartIndexDaily, getStartIndexMonthly } from './dates';
import { IFilter, ISort, Pipeline } from './mongo-queries';
import { parseNumber, parseObjectId, ValidationError } from './validation';

export interface ISingleProduction {
	_id?: Types.ObjectId;
	well?: Types.ObjectId;
	index?: number;
	oil: number | null;
	gas: number | null;
	choke: number | null;
	water: number | null;
	operational_tag: string | null;
	gasInjection: number | null;
	waterInjection: number | null;
	co2Injection: number | null;
	steamInjection: number | null;
	ngl: number | null;
	customNumber0: number | null;
	customNumber1: number | null;
	customNumber2: number | null;
	customNumber3: number | null;
	customNumber4: number | null;
	createdAt?: Date;
	updatedAt?: Date;
	arrayIndex: number | null;
}

export interface IProductionCursor {
	id: Types.ObjectId;
	index: number;
}

const initSingleProduction = () => ({
	oil: null,
	gas: null,
	choke: null,
	water: null,
	operational_tag: null,
	gasInjection: null,
	waterInjection: null,
	co2Injection: null,
	steamInjection: null,
	ngl: null,
	customNumber0: null,
	customNumber1: null,
	customNumber2: null,
	customNumber3: null,
	customNumber4: null,
	arrayIndex: null,
});

export interface ISingleMonthlyProduction extends ISingleProduction {
	days_on: number | null;
}

export const initSingleMonthlyProduction = (): ISingleMonthlyProduction => ({
	...initSingleProduction(),
	days_on: null,
});

export interface ISingleDailyProduction extends ISingleProduction {
	hours_on: number | null;
	gas_lift_injection_pressure: number | null;
	bottom_hole_pressure: number | null;
	tubing_head_pressure: number | null;
	flowline_pressure: number | null;
	casing_head_pressure: number | null;
	vessel_separator_pressure: number | null;
}

export const initSingleDailyProduction = (): ISingleDailyProduction => ({
	...initSingleProduction(),
	hours_on: null,
	gas_lift_injection_pressure: null,
	bottom_hole_pressure: null,
	tubing_head_pressure: null,
	flowline_pressure: null,
	casing_head_pressure: null,
	vessel_separator_pressure: null,
});

const baseProductionPipeline = [
	{
		$unwind: {
			path: '$index',
			includeArrayIndex: 'arrayIndex',
			preserveNullAndEmptyArrays: false,
		},
	},
	{ $match: { index: { $ne: null } } },
];

const monthlyProductionPipeline = [
	...baseProductionPipeline,
	{
		$project: {
			well: 1,
			index: 1,
			createdAt: 1,
			updatedAt: 1,
			oil: { $arrayElemAt: ['$oil', '$arrayIndex'] },
			gas: { $arrayElemAt: ['$gas', '$arrayIndex'] },
			choke: { $arrayElemAt: ['$choke', '$arrayIndex'] },
			water: { $arrayElemAt: ['$water', '$arrayIndex'] },
			days_on: { $arrayElemAt: ['$days_on', '$arrayIndex'] },
			operational_tag: { $arrayElemAt: ['$operational_tag', '$arrayIndex'] },
			gasInjection: { $arrayElemAt: ['$gasInjection', '$arrayIndex'] },
			waterInjection: { $arrayElemAt: ['$waterInjection', '$arrayIndex'] },
			co2Injection: { $arrayElemAt: ['$co2Injection', '$arrayIndex'] },
			steamInjection: { $arrayElemAt: ['$steamInjection', '$arrayIndex'] },
			ngl: { $arrayElemAt: ['$ngl', '$arrayIndex'] },
			customNumber0: { $arrayElemAt: ['$customNumber0', '$arrayIndex'] },
			customNumber1: { $arrayElemAt: ['$customNumber1', '$arrayIndex'] },
			customNumber2: { $arrayElemAt: ['$customNumber2', '$arrayIndex'] },
			customNumber3: { $arrayElemAt: ['$customNumber3', '$arrayIndex'] },
			customNumber4: { $arrayElemAt: ['$customNumber4', '$arrayIndex'] },
			arrayIndex: 1,
		},
	},
];

const dailyProductionPipeline = [
	...baseProductionPipeline,
	{
		$project: {
			well: 1,
			index: 1,
			createdAt: 1,
			updatedAt: 1,
			oil: { $arrayElemAt: ['$oil', '$arrayIndex'] },
			gas: { $arrayElemAt: ['$gas', '$arrayIndex'] },
			choke: { $arrayElemAt: ['$choke', '$arrayIndex'] },
			water: { $arrayElemAt: ['$water', '$arrayIndex'] },
			hours_on: { $arrayElemAt: ['$hours_on', '$arrayIndex'] },
			gas_lift_injection_pressure: { $arrayElemAt: ['$gas_lift_injection_pressure', '$arrayIndex'] },
			bottom_hole_pressure: { $arrayElemAt: ['$bottom_hole_pressure', '$arrayIndex'] },
			tubing_head_pressure: { $arrayElemAt: ['$tubing_head_pressure', '$arrayIndex'] },
			flowline_pressure: { $arrayElemAt: ['$flowline_pressure', '$arrayIndex'] },
			casing_head_pressure: { $arrayElemAt: ['$casing_head_pressure', '$arrayIndex'] },
			vessel_separator_pressure: { $arrayElemAt: ['$vessel_separator_pressure', '$arrayIndex'] },
			operational_tag: { $arrayElemAt: ['$operational_tag', '$arrayIndex'] },
			gasInjection: { $arrayElemAt: ['$gasInjection', '$arrayIndex'] },
			waterInjection: { $arrayElemAt: ['$waterInjection', '$arrayIndex'] },
			co2Injection: { $arrayElemAt: ['$co2Injection', '$arrayIndex'] },
			steamInjection: { $arrayElemAt: ['$steamInjection', '$arrayIndex'] },
			ngl: { $arrayElemAt: ['$ngl', '$arrayIndex'] },
			customNumber0: { $arrayElemAt: ['$customNumber0', '$arrayIndex'] },
			customNumber1: { $arrayElemAt: ['$customNumber1', '$arrayIndex'] },
			customNumber2: { $arrayElemAt: ['$customNumber2', '$arrayIndex'] },
			customNumber3: { $arrayElemAt: ['$customNumber3', '$arrayIndex'] },
			customNumber4: { $arrayElemAt: ['$customNumber4', '$arrayIndex'] },
			arrayIndex: 1,
		},
	},
];

interface IProductionPipelineOptions {
	productionKind: 'monthly' | 'daily';
	beforeUnwindFilters?: IFilter;
	afterUnwindFilters?: IFilter;
	sort?: ISort;
	skip?: number;
	limit?: number;
	count?: boolean;
}

interface IProductionPipelineCountOptions {
	productionKind: 'monthly' | 'daily';
	beforeUnwindFilters?: IFilter;
	afterUnwindFilters?: IFilter;
}

export const getProductionCountPipeline = ({
	beforeUnwindFilters,
	afterUnwindFilters,
}: IProductionPipelineCountOptions): Pipeline => {
	const beforeUnwindMatch = beforeUnwindFilters ? [{ $match: beforeUnwindFilters }] : [];
	const afterUnwindMatch = afterUnwindFilters ? [{ $match: afterUnwindFilters }] : [];

	return [...beforeUnwindMatch, ...baseProductionPipeline, ...afterUnwindMatch, { $count: 'count' }];
};

export const getProductionPipeline = ({
	productionKind,
	beforeUnwindFilters,
	afterUnwindFilters,
	sort,
	skip,
	limit,
	count,
}: IProductionPipelineOptions): Pipeline => {
	const pipeline = productionKind === 'monthly' ? monthlyProductionPipeline : dailyProductionPipeline;

	const beforeUnwindMatch = beforeUnwindFilters ? [{ $match: beforeUnwindFilters }] : [];
	const afterUnwindMatch = afterUnwindFilters ? [{ $match: afterUnwindFilters }] : [];
	const pipelineSort = sort ? [{ $sort: sort }] : [];
	const pipelineSkip = skip !== undefined ? [{ $skip: skip }] : [];
	const pipelineLimit = limit ? [{ $limit: limit }] : [];
	const pipelineCount = count ? [{ $count: 'count' }] : [];

	return [
		...beforeUnwindMatch,
		...pipelineSort,
		...pipeline,
		...afterUnwindMatch,
		...pipelineSkip,
		...pipelineLimit,
		...pipelineCount,
	];
};

export const getFindPipeline = (
	productionKind: IProductionPipelineOptions['productionKind'],
	productionData: ISingleProduction[],
	limit?: number,
): Pipeline => {
	const getStartIndex = productionKind === 'monthly' ? getStartIndexMonthly : getStartIndexDaily;

	const validData = productionData.filter(
		(prod): prod is ISingleProduction & { well: Types.ObjectId; index: number } =>
			prod.well !== undefined && prod.index !== undefined,
	);
	const prodDataByWell = groupBy(validData, ({ well }) => well);
	const beforeUnwindFilters = {
		$or: Object.values(prodDataByWell).map((prod) => ({
			well: prod[0].well,
			startIndex: {
				$in: uniq(prod.map(({ index }) => getStartIndex(index))),
			},
		})),
	};

	const afterUnwindFilters = {
		$or: Object.values(prodDataByWell).map((prod) => ({
			well: prod[0].well,
			index: {
				$in: prod.map(({ index }) => index),
			},
		})),
	};

	return getProductionPipeline({ productionKind, beforeUnwindFilters, afterUnwindFilters, limit });
};

export const getFindOnePipeline = (
	productionKind: IProductionPipelineOptions['productionKind'],
	productionData: ISingleProduction[],
): Pipeline => getFindPipeline(productionKind, productionData, 1);

export const parseProductionCursor = (cursor?: string): IProductionCursor | null => {
	if (!cursor) {
		return null;
	}

	try {
		const [idPart, indexPart] = cursor.split('|');
		const id = parseObjectId(idPart);
		const index = parseNumber(indexPart);

		return {
			id,
			index,
		};
	} catch (error) {
		throw new ValidationError(`Cursor is not valid`);
	}
};

export const createProductionCursor = (id?: Types.ObjectId, index?: number | null): string => `${id}|${index}`;
