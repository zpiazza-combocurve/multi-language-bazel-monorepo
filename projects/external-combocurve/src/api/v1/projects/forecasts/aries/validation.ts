import { LeanDocument } from 'mongoose';

import { IWell } from '@src/models/wells';
import { ValidationError } from '@src/helpers/validation';

import { getWellSelectedIdValue, SelectedIdKey } from './fields';

export class InvalidSelectedIdError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, InvalidSelectedIdError.name, statusCode);
	}
}

export const validateWellsSelectedId = (wells: LeanDocument<IWell>[], selectedIdKey: SelectedIdKey): void => {
	const wellIdSet = new Set(wells.map((well) => getWellSelectedIdValue(well, selectedIdKey)).filter((well) => well));

	if (wellIdSet.size !== wells.length) {
		throw new InvalidSelectedIdError(
			`One or more Wells in this Forecast have missing or duplicate values for: ${selectedIdKey}`,
		);
	}
};
