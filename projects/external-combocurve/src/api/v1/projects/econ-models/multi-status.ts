import { keyBy } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { IBaseEconModel } from '@src/models/econ/econ-models';

import { IMultiStatusResponse, IRecordStatus } from '../../multi-status';

const { CREATED, OK } = StatusCodes;
interface IEconModelRecordStatus extends IRecordStatus {
	name: string;
}

const mapToReturned = (
	original: Array<IBaseEconModel | undefined>,
	returned: IBaseEconModel[],
): Array<IBaseEconModel | undefined> => {
	const returnedEconModelsFiltered = returned
		.map((econModel) => ({ id: econModel.name, econModel: econModel }))
		.filter((obj): obj is { id: string; econModel: IBaseEconModel } => !!obj.id);

	const idMap = keyBy(returnedEconModelsFiltered, ({ id }) => id);

	return original.map((econModel) => {
		const id = econModel && econModel.name;
		return (id !== undefined && idMap[id]?.econModel) || undefined;
	});
};

const toCreatedStatus = (econModel: IBaseEconModel) => ({
	status: 'Created',
	code: CREATED,
	name: econModel.name,
});

const toOkStatus = (econModel: IBaseEconModel) => ({
	status: 'OK',
	code: OK,
	name: econModel.name,
});

export const getCreatedMultiResponse = (
	original: Array<IBaseEconModel | undefined>,
	returned: IBaseEconModel[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(original, returned);
	return { results: mapped.map((w) => w && toCreatedStatus(w)) as IEconModelRecordStatus[] };
};

export const getOkMultiResponse = (
	original: Array<IBaseEconModel | undefined>,
	returned: IBaseEconModel[],
): IMultiStatusResponse => {
	const mapped = mapToReturned(original, returned);
	return { results: mapped.map((w) => w && toOkStatus(w)) as IEconModelRecordStatus[] };
};
