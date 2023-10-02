import { StatusCodes } from 'http-status-codes';

import { IWellRecordStatus } from '@src/api/v1/projects/company-wells/multi-status';

const { CREATED } = StatusCodes;

export const getCreatedStatus = (dataSource: string, chosenID: string, id: string): IWellRecordStatus => ({
	status: 'Created',
	code: CREATED,
	id,
	chosenID,
	dataSource,
});
