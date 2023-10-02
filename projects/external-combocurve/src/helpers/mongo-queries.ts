import { Types } from 'mongoose';

import { DataSource } from '@src/models/wells';
import { ProjectResolved } from '@src/api/v1/projects/wells/fields';

import { ParsedQueryValue, ParseQueryOperator } from './fields/field-definition';

export interface ISort {
	[key: string]: 1 | -1;
}

export type IProjection<T> = {
	[K in keyof T]?: 1 | 0;
};

export interface IFilter<T = unknown> {
	[key: string]: T;
}

export type IExpression = unknown;

export interface IMatch {
	$match: IFilter;
}
export interface IProject {
	$project: Record<string, unknown>;
}
export interface IUnwind {
	$unwind: string | { path: string; includeArrayIndex?: string; preserveNullAndEmptyArrays?: boolean };
}
export interface IPipelineSort {
	$sort: ISort;
}
export interface ISkip {
	$skip: number;
}
export interface ILimit {
	$limit: number;
}
export interface ICount {
	$count: string;
}

export interface IGroup {
	$group: {
		_id: string | null;
		[key: string]: unknown;
	};
}

export interface ILookupEquality {
	$lookup: {
		from: string;
		localField: string;
		foreignField: string;
		as: string;
	};
}

export interface ILookupAdvanced {
	$lookup: {
		from: string;
		let: Record<string, unknown>;
		pipeline: Pipeline;
		as: string;
	};
}

export type ILookup = ILookupEquality | ILookupAdvanced;

export interface IReplaceRoot {
	$replaceRoot: {
		newRoot: unknown;
	};
}

export interface ISet {
	$set: {
		[key: string]: IExpression;
	};
}

export type IStep =
	| IMatch
	| IProject
	| IUnwind
	| ILookup
	| IReplaceRoot
	| IPipelineSort
	| ISkip
	| ILimit
	| ICount
	| IGroup
	| ISet;

export enum Steps {
	Match = '$match',
	Project = '$project',
	Unwind = '$unwind',
	Lookup = '$lookup',
	ReplaceRoot = '$replaceroot',
	Sort = '$sort',
	Skip = '$skip',
	Limit = '$limit',
	Count = '$count',
	Group = '$group',
	Set = '$set',
}

export type Pipeline = IStep[];

export const COMPANY_SCOPE_FILTER = { project: null };

type IdQuery = { _id: { $in: Types.ObjectId[] } };
type ChosenIdQuery = { chosenID: { $in: string[] }; dataSource?: DataSource };
type MixedIdsQuery = (IdQuery | ChosenIdQuery | { $or: Array<IdQuery | ChosenIdQuery> } | Record<never, never>) & {
	project: string | null;
};

export const operatorApiToDB = {
	ge: '$gte',
	gt: '$gt',
	le: '$lte',
	lt: '$lt',
};

export const getMixedIdsQuery = (
	ids: Types.ObjectId[],
	chosenIds: string[],
	dataSource?: DataSource,
	project: string | null = null,
): MixedIdsQuery => {
	const idQuery = ids.length && { _id: { $in: ids } };
	const chosenIdQuery = chosenIds.length && { chosenID: { $in: chosenIds }, dataSource };
	const finalQuery = idQuery && chosenIdQuery ? { $or: [idQuery, chosenIdQuery] } : idQuery || chosenIdQuery || {};

	return { ...finalQuery, project };
};

export const getDbFilter = <T, k>(
	parsedValues: ParsedQueryValue<T>[],
	transformValue: (value: NonNullable<T>) => NonNullable<T | k> = (value) => value,
	transformOperator: (operator: ParseQueryOperator) => ParseQueryOperator = (operator) => operator,
): NonNullable<T | k> | { [key in string]: NonNullable<T | k> | NonNullable<T | k>[] } => {
	if (parsedValues.length === 1) {
		return parsedValues[0].operator
			? { [operatorApiToDB[transformOperator(parsedValues[0].operator)]]: transformValue(parsedValues[0].value) }
			: transformValue(parsedValues[0].value);
	}

	return {
		$in: parsedValues.map((v) => transformValue(v.value)),
	};
};

export interface WellScope {
	project?: ProjectResolved;
	company: boolean;
}

export const getScopeProject = ({ project, company }: WellScope): Types.ObjectId | null => {
	if (!company && !project) {
		throw Error('A project must be included for non-company wells');
	}
	return company ? null : project?._id ?? null;
};
