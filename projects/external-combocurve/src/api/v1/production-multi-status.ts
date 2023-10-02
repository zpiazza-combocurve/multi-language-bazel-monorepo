import { keyBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { indexToDate } from '@src/helpers/dates';
import { ISingleProduction } from '@src/helpers/single-production';

import { IMultiStatusResponse, IRecordStatus } from './multi-status';

export interface IProductionRecordStatus extends IRecordStatus {
	well: string;
	date: Date;
}

const { CREATED, OK } = StatusCodes;

const getProdKey = (prod: ISingleProduction) =>
	prod.well && prod.index ? `${prod.well.toString()}|${prod.index}` : undefined;

const mapToReturned = (
	originalProd: Array<ISingleProduction | undefined>,
	returnedProd: ISingleProduction[],
): Array<ISingleProduction | undefined> => {
	const returnedProdFiltered = returnedProd
		.map((prod) => ({ id: getProdKey(prod), prod }))
		.filter((obj): obj is { id: string; prod: ISingleProduction } => !!obj.id);

	const idMap = keyBy(returnedProdFiltered, ({ id }) => id);

	return originalProd.map((prod) => {
		const id = prod && getProdKey(prod);
		return (id !== undefined && idMap[id].prod) || undefined;
	});
};

const toProductionStatus = ({ well, index }: ISingleProduction) => ({
	well: (well ?? Types.ObjectId()).toString(),
	date: indexToDate(index ?? 0) ?? new Date(),
});

const toCreatedStatus = (prod: ISingleProduction) => ({
	status: 'Created',
	code: CREATED,
	...toProductionStatus(prod),
});

const toOkStatus = (prod: ISingleProduction) => ({
	status: 'OK',
	code: OK,
	...toProductionStatus(prod),
});

export const getCreatedMultiResponse = (
	originalProd: Array<ISingleProduction | undefined>,
	returnedProd: ISingleProduction[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(originalProd, returnedProd);
	return { results: mapped.map((w) => w && toCreatedStatus(w)) as IProductionRecordStatus[] };
};

export const getOkMultiResponse = (
	originalProd: Array<ISingleProduction | undefined>,
	returnedProd: ISingleProduction[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(originalProd, returnedProd);
	return { results: mapped.map((w) => w && toOkStatus(w)) as IProductionRecordStatus[] };
};
