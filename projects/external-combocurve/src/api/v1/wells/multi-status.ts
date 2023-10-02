import { keyBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IUpdate } from '@src/api/v1/fields';
import { IWell } from '@src/models/wells';

import { IErrorRecordStatus, IMultiStatusResponse, IRecordStatus, mergeRecordResults } from '../multi-status';
import { IValidationErrorEntry } from '../multi-error';

import { IReplace } from './fields';

const { CREATED, INTERNAL_SERVER_ERROR, OK } = StatusCodes;
export interface IWellRecordStatus extends IRecordStatus {
	id: string;
	chosenID: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface IWellErrorRecordStatus extends IErrorRecordStatus {
	chosenID?: string;
}

const mapToReturned = <T>(
	originalWells: Array<T | undefined>,
	returnedWells: IWell[],
	getOriginalId: (well: T) => string | undefined,
	getReturnedId: (well: IWell) => string | undefined,
): Array<IWell | undefined> => {
	const returnedWellsFiltered = returnedWells
		.map((well) => ({ id: getReturnedId(well), well }))
		.filter((obj): obj is { id: string; well: IWell } => !!obj.id);

	const idMap = keyBy(returnedWellsFiltered, ({ id }) => id);

	return originalWells.map((well) => {
		const id = well && getOriginalId(well);
		return id === undefined ? undefined : idMap[id]?.well;
	});
};

const filterFailedRecords = <T>(
	originalWells: Array<T | undefined>,
	returnedWells: IWell[],
	getOriginalId: (well: T) => string | undefined,
	getReturnedId: (well: IWell) => string | undefined,
): Array<T | undefined> => {
	if (originalWells.length === returnedWells.length) {
		return [];
	}

	const returnedWellsFiltered = returnedWells
		.map((well) => ({ id: getReturnedId(well), well }))
		.filter((obj): obj is { id: string; well: IWell } => !!obj.id);

	const idMap = keyBy(returnedWellsFiltered, ({ id }) => id);

	return originalWells.map((well) => {
		const id = well && getOriginalId(well);
		const returnedWell = id === undefined ? undefined : idMap[id]?.well;
		return returnedWell === undefined ? well : undefined;
	});
};

const toWellStatus = ({ _id, chosenID, createdAt, dataSource, updatedAt }: IWell) => ({
	id: (_id ?? Types.ObjectId()).toString(),
	chosenID: chosenID ?? '',
	dataSource: dataSource ?? '',
	createdAt: createdAt ?? new Date(),
	updatedAt: updatedAt ?? new Date(),
});

const toCreatedStatus = (well: IWell): IWellRecordStatus => ({
	status: 'Created',
	code: CREATED,
	...toWellStatus(well),
});

const toOkStatus = (well: IWell): IWellRecordStatus => ({
	status: 'OK',
	code: OK,
	...toWellStatus(well),
});

const toFailedStatus = (error: IValidationErrorEntry, chosenID?: string): IWellErrorRecordStatus => ({
	status: 'Failed',
	code: INTERNAL_SERVER_ERROR,
	errors: [error],
	chosenID: chosenID,
});

const toErrorEntry = (message: string, location?: number): IValidationErrorEntry => ({
	name: 'InternalServerError',
	message,
	location: `[${location}]`,
});

export const getCreatedMultiResponse = (
	originalWells: Array<IWell | undefined>,
	returnedWells: IWell[],
): IMultiStatusResponse => {
	const getId = (w: IWell) => w.chosenID;
	const created = mapToReturned(originalWells, returnedWells, getId, getId);
	const failed = filterFailedRecords(originalWells, returnedWells, getId, getId);
	const createdRecords = created.map((w) => w && toCreatedStatus(w)) as IWellRecordStatus[];
	const failedRecords = failed.map(
		(w) =>
			w &&
			toFailedStatus(
				toErrorEntry(`Failed to create well with identifier \`${w.chosenID}\``, originalWells.indexOf(w)),
				w.chosenID,
			),
	) as IErrorRecordStatus[];
	return { results: mergeRecordResults(createdRecords, failedRecords, originalWells.length) };
};

export const getReplaceMultiResponse = (
	originalWells: Array<IReplace | undefined>,
	returnedWells: IWell[],
): IMultiStatusResponse => {
	const getReplaceId = (w: IReplace) => w.id.toString();
	const getWellId = (w: IWell) => w._id.toString();
	const replaced = mapToReturned(originalWells, returnedWells, getReplaceId, getWellId);
	const failed = filterFailedRecords(originalWells, returnedWells, getReplaceId, getWellId);
	const replacedRecords = replaced.map((w) => w && toOkStatus(w)) as IWellRecordStatus[];
	const failedRecords = failed.map(
		(w) =>
			w &&
			toFailedStatus(
				toErrorEntry(`Failed to update well with identifier \`${w.id.toString()}\``, originalWells.indexOf(w)),
				w.update.chosenID,
			),
	) as IErrorRecordStatus[];
	return { results: mergeRecordResults(replacedRecords, failedRecords, originalWells.length) };
};

export const getUpdateMultiResponse = (
	originalWells: Array<IUpdate<IWell> | undefined>,
	returnedWells: IWell[],
): IMultiStatusResponse => {
	const getUpdateId = (w: IUpdate<IWell>) => w.id.toString();
	const getWellId = (w: IWell) => w._id.toString();
	const updated = mapToReturned(originalWells, returnedWells, getUpdateId, getWellId);
	const failed = filterFailedRecords(originalWells, returnedWells, getUpdateId, getWellId);
	const updatedRecords = updated.map((w) => w && toOkStatus(w)) as IWellRecordStatus[];
	const failedRecords = failed.map(
		(w) =>
			w &&
			toFailedStatus(
				toErrorEntry(`Failed to update well with identifier \`${w.id.toString()}\``, originalWells.indexOf(w)),
				w.update.chosenID,
			),
	) as IErrorRecordStatus[];
	return { results: mergeRecordResults(updatedRecords, failedRecords, originalWells.length) };
};
