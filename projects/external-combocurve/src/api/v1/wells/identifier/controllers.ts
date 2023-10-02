import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { checkRecordCount, RequestStructureError } from '@src/helpers/validation';
import { ITenantCacheEntry } from '@src/middleware/tenant-cache';
import { notNil } from '@src/helpers/typing';

import { getResponseFromErrors, mergeResponses, withCounts } from '../../multi-status';
import { ValidationErrorAggregator } from '../../multi-error';

import { parsePatchWellIdentifier, removeNotFoundWells } from './validation';
import { WellIdentifierService } from './service';
import { WRITE_RECORD_LIMIT } from './fields';

const { MULTI_STATUS } = StatusCodes;

type Locals = { service: WellIdentifierService; cachedTenant: ITenantCacheEntry };

export const patchWellsIdentifier = async (req: Request, res: Response): Promise<void> => {
	const data = req.body;
	const { service, cachedTenant } = res.locals as Locals;

	if (!Array.isArray(data)) {
		throw new RequestStructureError('Invalid data structure');
	}

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();
	let wellIdentifierRequest = parsePatchWellIdentifier(data, errorAggregator);
	const wellIds = wellIdentifierRequest.filter(notNil).map((w) => w?.wellId.toString()) as string[];
	if (wellIds.length) {
		const existingWells = await service.getExistingWellIds(wellIds);

		//check for wells that don't exist
		if (existingWells.length != wellIds.length) {
			wellIdentifierRequest = removeNotFoundWells(wellIds, existingWells, wellIdentifierRequest, errorAggregator);
		}
	}

	const userId = cachedTenant.get('apiUserId');
	const successResponse = await service.changeWellIdentifiers(wellIdentifierRequest, userId);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};
