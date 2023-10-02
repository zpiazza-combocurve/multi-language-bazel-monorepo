import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CUSTOM_HEADER_COLLECTIONS, CustomColumnService, CustomHeadersCollections } from './service';
import { CustomColumnHeaderNotFoundError } from './validation';

type Locals = { service: CustomColumnService };

export const getCollectionCustomColumns = async (req: Request, res: Response): Promise<void> => {
	const { service } = res.locals as Locals;
	const { collection } = req.params;
	if (!CUSTOM_HEADER_COLLECTIONS.includes(collection)) {
		throw new CustomColumnHeaderNotFoundError(`${collection} custom columns not found`);
	}
	res.status(StatusCodes.OK).json(await service.getCustomColumns(collection as CustomHeadersCollections));
};
