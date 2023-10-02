import { StatusCodes } from 'http-status-codes';

import { ApiMonthlyProduction } from '@src/api/v1/monthly-productions/fields';
import { IProductionRecordStatus } from '@src/api/v1/production-multi-status';

const { CREATED, OK } = StatusCodes;

export const getCreatedStatus = ({ well, date }: ApiMonthlyProduction): Partial<IProductionRecordStatus> => ({
	status: 'Created',
	code: CREATED,
	well: well?.toString(),
	date,
});

export const getOkStatus = ({ well, date }: ApiMonthlyProduction): Partial<IProductionRecordStatus> => ({
	status: 'OK',
	code: OK,
	well: well?.toString(),
	date,
});
