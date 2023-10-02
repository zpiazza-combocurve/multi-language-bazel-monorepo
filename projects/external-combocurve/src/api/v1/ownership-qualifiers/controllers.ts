import { keyBy, partition } from 'lodash';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
	checkRecordCount,
	DifferentDataSourceError,
	getValidFilters,
	isObject,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../multi-status';
import { ValidationErrorAggregator } from '../multi-error';

import {
	ApiOwnershipQualifier,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toOwnershipQualifier,
	WRITE_RECORD_LIMIT,
} from './fields/ownership-qualifier';
import {
	checkDuplicates,
	checkMaxQualifiersCount,
	MAX_QUALIFIER_COUNT,
	OwnershipQualifierCollisionError,
	OwnershipQualifierLimitError,
	OwnershipQualifierNotFoundError,
	parseApiOwnershipQualifiers,
} from './validations/ownership-qualifier';
import { OwnershipQualifierService } from './service';

const { MULTI_STATUS, OK } = StatusCodes;

type Locals = { service: OwnershipQualifierService };

const DEFAULT_PAGE_SIZE = 100;
const IS_TRANSACTIONAL = false;

export const getOwnershipQualifierHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getOwnershipQualifierCount(filters);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getOwnershipQualifiers = async (req: Request, res: Response<ApiOwnershipQualifier[]>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getOwnershipQualifiers(skip, take, sort, filters, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getOwnershipQualifierById = async (req: Request, res: Response<ApiOwnershipQualifier>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const ownershipQualifierId = parseObjectId(id);

	const ownershipQualifier = await service.getById(ownershipQualifierId);
	if (!ownershipQualifier) {
		throw new OwnershipQualifierNotFoundError(`No ownership qualifier was found with id \`${id}\``);
	}

	res.status(OK).json(ownershipQualifier);
};

export const postOwnershipQualifiers = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiOwnershipQualifiers = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid ownership qualifier data structure', `[${index}]`);
			}
			return parseApiOwnershipQualifiers(element, index);
		}),
	);

	const dataSource = apiOwnershipQualifiers.find(
		(ownershipQualifier) => ownershipQualifier && notNil(ownershipQualifier.dataSource),
	)?.dataSource;
	apiOwnershipQualifiers = apiOwnershipQualifiers.map((ownershipQualifier, index) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier?.dataSource && ownershipQualifier.dataSource !== dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${ownershipQualifier.dataSource}\`. All records in a request must be from the same data source.`,
					`[${index}]`,
				);
			}
			return ownershipQualifier;
		}),
	);

	const dataWithFoundIds = await service.getWellsIds(apiOwnershipQualifiers);
	apiOwnershipQualifiers = dataWithFoundIds.map((ownershipQualifier, index) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier && !ownershipQualifier.well) {
				const { well, dataSource, chosenID } = apiOwnershipQualifiers[index] ?? {};
				const message = well
					? `No well was found with id \`${well}\``
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\``;
				throw new OwnershipQualifierNotFoundError(message, `[${index}]`);
			}
			return ownershipQualifier;
		}),
	);

	let ownershipQualifiers = apiOwnershipQualifiers.map(
		(ownershipQualifier) => ownershipQualifier && toOwnershipQualifier(ownershipQualifier),
	);

	ownershipQualifiers = checkDuplicates(ownershipQualifiers, errorAggregator);

	const matchesOwnershipQualifiers = await service.findMatches(ownershipQualifiers.filter(notNil));
	const existingOwnershipQualifiers = keyBy(
		matchesOwnershipQualifiers,
		({ well, qualifierKey }) => `${well}|${qualifierKey}`,
	);
	ownershipQualifiers = ownershipQualifiers.map((ownershipQualifier, indexInList) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier === undefined) {
				return undefined;
			}
			const { well, qualifierKey } = ownershipQualifier;

			if (well === undefined || qualifierKey === undefined) {
				return undefined;
			}

			const wellIdStr = well.toString();
			const match = existingOwnershipQualifiers[`${wellIdStr}|${qualifierKey}`];

			if (!match) {
				return ownershipQualifier;
			}

			throw new OwnershipQualifierCollisionError(
				`Ownership qualifier well \`${well}\` and qualifier key \`${qualifierKey}\` already exist`,
				`[${indexInList}]`,
			);
		}),
	);

	const existingQualifierKeys = await service.getExistingQualifierKeys();
	ownershipQualifiers = ownershipQualifiers.map((ownershipQualifier, indexInList) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier === undefined) {
				return undefined;
			}

			const { qualifierKey } = ownershipQualifier;

			if (existingQualifierKeys.includes(qualifierKey)) {
				return ownershipQualifier;
			}

			if (existingQualifierKeys.length === MAX_QUALIFIER_COUNT) {
				throw new OwnershipQualifierLimitError(
					`Qualifier key limit exceeded. Up to ${MAX_QUALIFIER_COUNT} qualifier keys are allowed`,
					`[${indexInList}]`,
				);
			}
			existingQualifierKeys.push(qualifierKey);
			return ownershipQualifier;
		}),
	);

	const countByWell = await service.getCountByWell(ownershipQualifiers.filter(notNil));
	ownershipQualifiers = checkMaxQualifiersCount(ownershipQualifiers, countByWell, errorAggregator);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(ownershipQualifiers);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putOwnershipQualifier = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiOwnershipQualifiers = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid ownership qualifier data structure', `[${index}]`);
			}
			return parseApiOwnershipQualifiers(element, index);
		}),
	);

	const dataSource = apiOwnershipQualifiers.find(
		(ownershipQualifier) => ownershipQualifier && notNil(ownershipQualifier.dataSource),
	)?.dataSource;
	apiOwnershipQualifiers = apiOwnershipQualifiers.map((ownershipQualifier, index) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier?.dataSource && ownershipQualifier.dataSource !== dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${ownershipQualifier.dataSource}\`. All records in a request must be from the same data source.`,
					`[${index}]`,
				);
			}
			return ownershipQualifier;
		}),
	);

	const dataWithFoundIds = await service.getWellsIds(apiOwnershipQualifiers);
	apiOwnershipQualifiers = dataWithFoundIds.map((ownershipQualifier, index) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier && !ownershipQualifier.well) {
				const { well, dataSource, chosenID } = apiOwnershipQualifiers[index] ?? {};
				const message = well
					? `No well was found with id \`${well}\``
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\``;
				throw new OwnershipQualifierNotFoundError(message, `[${index}]`);
			}
			return ownershipQualifier;
		}),
	);

	let ownershipQualifiers = apiOwnershipQualifiers.map(
		(ownershipQualifier) => ownershipQualifier && toOwnershipQualifier(ownershipQualifier),
	);

	const existingQualifierKeys = await service.getExistingQualifierKeys();
	ownershipQualifiers = ownershipQualifiers.map((ownershipQualifier, indexInList) =>
		errorAggregator.catch(() => {
			if (ownershipQualifier === undefined) {
				return undefined;
			}

			const { qualifierKey } = ownershipQualifier;

			if (existingQualifierKeys.includes(qualifierKey)) {
				return ownershipQualifier;
			}

			if (existingQualifierKeys.length === MAX_QUALIFIER_COUNT) {
				throw new OwnershipQualifierLimitError(
					`Qualifier key limit exceeded. Up to ${MAX_QUALIFIER_COUNT} qualifier keys are allowed`,
					`[${indexInList}]`,
				);
			}
			existingQualifierKeys.push(qualifierKey);
			return ownershipQualifier;
		}),
	);

	ownershipQualifiers = checkDuplicates(ownershipQualifiers, errorAggregator);
	const foundData = await service.findMatches(ownershipQualifiers.filter(notNil));
	const [existingOwnershipQualifiers, notExistingOwnershipQualifiers] = partition(
		ownershipQualifiers.filter(notNil),
		({ well, qualifierKey }) => !!foundData.find((oq) => oq.well === well && oq.qualifierKey === qualifierKey),
	);

	const countByWell = await service.getCountByWell(existingOwnershipQualifiers);
	ownershipQualifiers = [
		...checkMaxQualifiersCount(existingOwnershipQualifiers, countByWell, errorAggregator),
		...notExistingOwnershipQualifiers,
	];

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(ownershipQualifiers);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};
