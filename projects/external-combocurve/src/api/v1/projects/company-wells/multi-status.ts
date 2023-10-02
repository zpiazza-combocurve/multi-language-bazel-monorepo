import keyBy from 'lodash/keyBy';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IMultiStatusResponse, IRecordStatus } from '../../multi-status';

import { IProjectCompanyWell } from './fields';

const { CREATED } = StatusCodes;

export interface IWellRecordStatus extends IRecordStatus {
	id: string;
	chosenID: string;
	dataSource: string;
}

const mapToReturned = (
	originalWells: Array<IProjectCompanyWell | undefined>,
	returnedWellsIds: Types.ObjectId[],
	getOriginalId: (well: IProjectCompanyWell) => string | undefined,
): Array<IProjectCompanyWell | undefined> => {
	const idMap = keyBy(returnedWellsIds, (id) => id.toString());

	return originalWells.map((well) => {
		const id = well && getOriginalId(well);
		return id === undefined || !idMap[id] ? undefined : well;
	});
};

const toWellStatus = ({ _id, chosenID, dataSource }: IProjectCompanyWell) => ({
	id: (_id ?? Types.ObjectId()).toString(),
	chosenID: chosenID ?? '',
	dataSource: dataSource ?? '',
});

const toCreatedStatus = (well: IProjectCompanyWell): IWellRecordStatus => ({
	status: 'Created',
	code: CREATED,
	...toWellStatus(well),
});

export const getCreatedMultiResponse = (
	originalWells: Array<IProjectCompanyWell | undefined>,
	returnedWellsIds: Types.ObjectId[],
): IMultiStatusResponse => {
	const getId = (w: IProjectCompanyWell) => w._id.toString();
	const mapped = mapToReturned(originalWells, returnedWellsIds, getId);
	return { results: mapped.map((w) => w && toCreatedStatus(w)) as IWellRecordStatus[] };
};
