import { StatusCodes } from 'http-status-codes';

import { ApiDailyProduction } from '@src/api/v1/daily-productions/fields';
import { IProductionRecordStatus } from '@src/api/v1/production-multi-status';

const { CREATED, OK } = StatusCodes;

export const getCreatedStatus = ({ well, date }: ApiDailyProduction): Partial<IProductionRecordStatus> => ({
	status: 'Created',
	code: CREATED,
	well: well?.toString(),
	date,
});

export const getOkStatus = ({ well, date }: ApiDailyProduction): Partial<IProductionRecordStatus> => ({
	status: 'OK',
	code: OK,
	well: well?.toString(),
	date,
});
