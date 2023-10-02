import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IWellRecordStatus } from '@src/api/v1/wells/multi-status';

const { CREATED, OK } = StatusCodes;

export const getCreatedStatus = (chosenID: string): IWellRecordStatus => ({
	status: 'Created',
	code: CREATED,
	id: 'generated-id',
	chosenID,
	createdAt: new Date('2000-01-01'),
	updatedAt: new Date('2000-01-01'),
});

export const getOkStatus = (id: Types.ObjectId, chosenID: string): IWellRecordStatus => ({
	status: 'OK',
	code: OK,
	id: id.toString(),
	chosenID,
	createdAt: new Date('2000-01-01'),
	updatedAt: new Date('2000-01-01'),
});
