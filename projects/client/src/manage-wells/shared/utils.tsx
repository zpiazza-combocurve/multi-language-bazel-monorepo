import { IServerSideGetRowsRequest } from 'ag-grid-community';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import { queryClient } from '@/helpers/query-cache';
import { postApi, putApi } from '@/helpers/routing';
import { getConvertFunc } from '@/helpers/units';
import { createMap, formatValue, objectFromKeys } from '@/helpers/utilities';
import { convertIdxToMilli } from '@/helpers/zing';
import { fields as dailyUnitsTempaltes } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitsTempaltes } from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as monthlyUnitsTempaltes } from '@/inpt-shared/display-templates/units/monthly-units.json';
import { MAP_TILE_QUERY_PREFIX } from '@/map/MapWellsCache';
import { WELLS_COLLECTIONS_BEGIN_QUERY_KEY } from '@/wells-collections/queries';

import { WellDirectionalSurveyData, WellHeadersData, WellProductionData } from './types';

export interface IDeleteWithInputProductionData {
	monthly: boolean;
	daily: boolean;
	wells: string[];
	range?: {
		start: Date;
		end: Date;
	};
	relative?: {
		offset: number;
		units: string;
		wellHeaderField: string;
	};
}

export interface IDeleteAllProductionData {
	monthly: boolean;
	daily: boolean;
	wells: string[];
}

export interface IDeleteSelectedProductionData {
	resolution: 'daily' | 'monthly';
	deletions: {
		[key: string]: number[]; // well id with bucket indices to delete
	};
}

export function getProductionUnit(header: string, resolution: 'daily' | 'monthly') {
	const unit = defaultUnitsTempaltes[header];
	const convert = unit
		? getConvertFunc(
				resolution === 'daily' ? dailyUnitsTempaltes[header] : monthlyUnitsTempaltes[header],
				defaultUnitsTempaltes[header]
		  )
		: _.identity;
	return { unit, convert };
}

export function productionDataToTableFormat(
	wellData: WellProductionData | (WellProductionData & WellHeadersData),
	skipValueFormatting = false,
	formatter = formatValue
) {
	/** Headers which are in array format, like oil, gas and water production values */
	const arrayHeaders = Object.keys(wellData).filter((key) => key !== 'index' && Array.isArray(wellData[key]));

	const sharedHeaders = _.omit(wellData, arrayHeaders);

	if (!wellData.index) {
		return null;
	}

	return wellData.index.map((index, i) => ({
		...sharedHeaders,
		...objectFromKeys(arrayHeaders, (key) =>
			skipValueFormatting ? wellData[key][i] : formatter(wellData[key][i])
		),
		index: skipValueFormatting ? new Date(convertIdxToMilli(index)) : formatter(new Date(convertIdxToMilli(index))),
	}));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const createMapById = <T extends { _id: string } = any>(data: T[]) => createMap(data, '_id');

export function getWellsHeaders(wellIds: string[]) {
	return postApi(`/well/getWellHeaderValues`, { wells: wellIds }) as Promise<WellHeadersData[]>;
}

export function getWellsProduction(wellIds: string[], resolution: 'monthly' | 'daily') {
	return postApi(`/well/production-data/${resolution}`, {
		wells: wellIds,
		divide: false,
	}) as Promise<Record<string, WellProductionData>>;
}

export function getWellsDirectionalSurvey(wellIds: string[], headers?: string[]) {
	return postApi(`/directional-survey/get-wells-data`, { wells: wellIds, divide: false, fields: headers }) as Promise<
		WellDirectionalSurveyData[]
	>;
}

export function updateProduction(
	resolution: 'monthly' | 'daily',
	updates: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		[key: string]: any[];
	}
) {
	return putApi(`/well/production-data/${resolution}`, updates);
}

export function deleteProduction(
	mode: string,
	body: IDeleteAllProductionData | IDeleteSelectedProductionData | IDeleteWithInputProductionData
) {
	return postApi(`/well/production-data/delete/${mode}`, body);
}

export function useWellsHeaders<T = WellHeadersData[]>(
	wells: string[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: UseQueryOptions<WellHeadersData[], any, T, any>
) {
	return useQuery({
		...options,
		queryKey: ['well-headers', wells],
		queryFn: () => getWellsHeaders(wells),
	});
}

export function useWellsHeadersMap(wells: string[], { enabled = true } = {}) {
	return useWellsHeaders(wells, { enabled, select: (data) => createMapById(data) });
}

export function useWellsProductionMapBaseQuery(wells: string[], resolution: 'monthly' | 'daily') {
	const queryClient = useQueryClient();
	const key = ['well-data', wells, resolution];

	const invalidate = () => queryClient.invalidateQueries(key);

	return {
		key,
		invalidate,
	};
}

export function useWellsProductionMap(wells: string[], resolution: 'monthly' | 'daily', { enabled = true } = {}) {
	const { key } = useWellsProductionMapBaseQuery(wells, resolution);

	return useQuery(key, () => getWellsProduction(wells, resolution), {
		select: _.values,
		enabled,
	});
}

export const withProps =
	<P,>(Component: React.ElementType, props: P) =>
	(moreProps: Omit<React.ComponentProps<typeof Component>, keyof P>) =>
		(
			// can't avoid prop spreading here
			<Component {...props} {...moreProps} />
		);

export function invalidateQueries(client = queryClient) {
	client.invalidateQueries(['well-headers']);
	client.invalidateQueries(['well-data']);
	client.invalidateQueries(['project-custom-headers-data']);
	client.invalidateQueries(['wells-map']);
	client.invalidateQueries([MAP_TILE_QUERY_PREFIX]);
	client.invalidateQueries([WELLS_COLLECTIONS_BEGIN_QUERY_KEY]);
}

interface ProductionCount {
	/** Well id */
	well: string;
	/** All production indices for the well */
	production: number[];
}

interface DirectionalSurveyCount {
	well: string;
	count: number;
}

// /** Will convert from `wellIds` to `productionIds` */
async function getProductionCount(
	wellIds: string[],
	/** `daily` or `monthly` */
	resolution: string
) {
	// TODO fetch production ids
	return postApi('/well/production-data/getProductionCount', {
		wellIds,
		resolution,
	}) as Promise<ProductionCount[]>;
}

async function getDirectionalSurveyCounts(wellIds: string[]) {
	return postApi(`/directional-surveys/get-counts`, { wellIds }) as Promise<DirectionalSurveyCount[]>;
}

function useProductionCountQuery<T = ProductionCount[]>(
	wellIds: string[],
	/** `daily` or `monthly` */
	resolution: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: UseQueryOptions<ProductionCount[], any, T, any>
) {
	const queryClient = useQueryClient();
	const queryKey = ['wells', 'getProductionIds', wellIds, resolution];

	const invalidateProductionCount = () => {
		queryClient.invalidateQueries(queryKey);
	};

	return {
		...useQuery({
			...options,
			queryKey,
			queryFn: () => getProductionCount(wellIds, resolution),
		}),
		invalidateProductionCount,
	};
}

export const ROW_ID_SPLITTER = '-';

function getCompositeRowId(wellId: string, index: number) {
	return `${wellId}${ROW_ID_SPLITTER}${index}`;
}

function useProductionIdsQuery(
	wellIds: string[],
	/** `daily` or `monthly` */
	resolution: string
) {
	return useProductionCountQuery(wellIds, resolution, {
		select: (data) => {
			const productionIds = data.flatMap(({ well, production }) =>
				production.map((index) => getCompositeRowId(well, index))
			);

			return { productionIds };
		},
	});
}

interface WellProduction {
	well: string;
	index: number;
	oil: number;
	gas: number;
	water: number;
}

function getProductionData(
	wellIds: string[],
	resolution: string,
	request: IServerSideGetRowsRequest
): Promise<WellProduction[]> {
	return postApi('/well/production-data/getProductionData', {
		wellIds,
		resolution,
		request,
	});
}

function getDirectionalSurveyData(wellIds: string[], request: IServerSideGetRowsRequest): Promise<WellProduction[]> {
	return postApi('/directional-surveys/get-data', { wellIds, request });
}

export function useVirtualizedProductionData(wellIds: string[], /** 'monthly' | 'daily' */ resolution: string) {
	const productionIdsQuery = useProductionIdsQuery(wellIds, resolution);
	const [wellHeadersMap, setWellHeadersMap] = useState<{
		[index: string]: WellHeadersData;
	}>({});

	useEffect(() => {
		(async () => {
			setWellHeadersMap(_.keyBy(await getWellsHeaders(wellIds), '_id'));
		})();
	}, [wellIds]);

	return {
		productionIds: productionIdsQuery.data?.productionIds,
		invalidateProductionCount: productionIdsQuery.invalidateProductionCount,
		fetch: useCallback(
			async (request: IServerSideGetRowsRequest) => {
				const wellsProduction = await getProductionData(wellIds, resolution, request);
				const rows = wellsProduction.map((prod) => ({
					...prod,
					...wellHeadersMap[prod.well],
					_id: getCompositeRowId(prod.well, prod.index),
				}));

				return rows;
			},
			[resolution, wellHeadersMap, wellIds]
		),
	};
}

function useDirectionalSurveyCountsQuery<T = DirectionalSurveyCount[]>(
	wellIds: string[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: UseQueryOptions<DirectionalSurveyCount[], any, T, any>
) {
	const queryClient = useQueryClient();
	const queryKey = ['directional-surveys', 'counts', wellIds];

	const invalidateDirectionalSurveyCounts = () => {
		queryClient.invalidateQueries(queryKey);
	};

	return {
		...useQuery({
			...options,
			queryKey,
			queryFn: () => getDirectionalSurveyCounts(wellIds),
		}),
		invalidateDirectionalSurveyCounts,
	};
}

function useDirectionalSurveyIdsQuery(wellIds: string[]) {
	return useDirectionalSurveyCountsQuery(wellIds, {
		select: (data) => {
			const directionalSurveyIds = data.flatMap(({ well, count }) =>
				[...new Array(count)].map((_, index) => getCompositeRowId(well, index))
			);

			return { productionIds: directionalSurveyIds };
		},
	});
}

export function useVirtualizedSurveyData(wellIds: string[]) {
	const directionalSurveyIdsQuery = useDirectionalSurveyIdsQuery(wellIds);
	const [wellHeadersMap, setWellHeadersMap] = useState<{
		[index: string]: WellHeadersData;
	}>({});

	useEffect(() => {
		(async () => {
			setWellHeadersMap(_.keyBy(await getWellsHeaders(wellIds), '_id'));
		})();
	}, [wellIds]);

	const fetch = useCallback(
		async (request: IServerSideGetRowsRequest) => {
			const wellsDirectionalSurvey = await getDirectionalSurveyData(wellIds, request);
			const rows = wellsDirectionalSurvey.map((survey) => ({
				...survey,
				...wellHeadersMap[survey.well],
				_id: getCompositeRowId(survey.well, survey.index),
			}));

			return rows;
		},
		[wellHeadersMap, wellIds]
	);

	return {
		directionalSurveyIds: directionalSurveyIdsQuery.data?.productionIds,
		invalidateCount: directionalSurveyIdsQuery.invalidateDirectionalSurveyCounts,
		fetch,
	};
}
