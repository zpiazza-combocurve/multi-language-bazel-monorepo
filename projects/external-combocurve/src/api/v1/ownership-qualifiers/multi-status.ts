import { keyBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';

import { IMultiStatusResponse, IRecordStatus } from '../multi-status';

const { CREATED, OK } = StatusCodes;

interface IOwnershipQualifierRecordStatus extends IRecordStatus {
	well: string;
	qualifierKey: string;
}

const getProdKey = (ownershipQualifier: IOwnershipQualifier) =>
	ownershipQualifier.well && ownershipQualifier.qualifierKey
		? `${ownershipQualifier.well.toString()}|${ownershipQualifier.qualifierKey}`
		: undefined;

const mapToReturned = (
	original: Array<IOwnershipQualifier | undefined>,
	returned: IOwnershipQualifier[],
): Array<IOwnershipQualifier | undefined> => {
	const returnedOwnershipQualifiersFiltered = returned
		.map((ownershipQualifier) => ({ id: getProdKey(ownershipQualifier), ownershipQualifier }))
		.filter((obj): obj is { id: string; ownershipQualifier: IOwnershipQualifier } => !!obj.id);

	const idMap = keyBy(returnedOwnershipQualifiersFiltered, ({ id }) => id);

	return original.map((ownershipQualifier) => {
		const id = ownershipQualifier && getProdKey(ownershipQualifier);
		return (id !== undefined && idMap[id]?.ownershipQualifier) || undefined;
	});
};

const toOwnershipQualifierStatus = ({ well, qualifierKey }: IOwnershipQualifier) => ({
	well: (well ?? Types.ObjectId()).toString(),
	qualifierKey: qualifierKey ?? '',
});

const toCreatedStatus = (ownershipQualifier: IOwnershipQualifier) => ({
	status: 'Created',
	code: CREATED,
	...toOwnershipQualifierStatus(ownershipQualifier),
});

const toOkStatus = (ownershipQualifier: IOwnershipQualifier) => ({
	status: 'OK',
	code: OK,
	...toOwnershipQualifierStatus(ownershipQualifier),
});

export const getCreatedMultiResponse = (
	originalProd: Array<IOwnershipQualifier | undefined>,
	returnedProd: IOwnershipQualifier[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(originalProd, returnedProd);
	return { results: mapped.map((w) => w && toCreatedStatus(w)) as IOwnershipQualifierRecordStatus[] };
};

export const getOkMultiResponse = (
	originalProd: Array<IOwnershipQualifier | undefined>,
	returnedProd: IOwnershipQualifier[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(originalProd, returnedProd);
	return { results: mapped.map((w) => w && toOkStatus(w)) as IOwnershipQualifierRecordStatus[] };
};
