import { getApiField, IField } from '@src/api/v1/fields';
import { IPhaseGroup } from '@src/models/econ/differentials';
import { isNil } from '@src/helpers/typing';

import { getPhaseGroupFields } from './phase-fields';

export type PhaseGroupField<T> = IField<IPhaseGroup, T>;

type TypeOfField<FT> = FT extends PhaseGroupField<infer T> ? T : never;

export type ApiPhaseGroupKey = keyof typeof PHASE_GROUP_FIELDS;

export type ApiPhaseGroup = {
	[key in ApiPhaseGroupKey]?: TypeOfField<(typeof PHASE_GROUP_FIELDS)[key]>;
};

export const PHASE_GROUP_FIELDS = {
	oil: getPhaseGroupFields('oil'),
	gas: getPhaseGroupFields('gas'),
	ngl: getPhaseGroupFields('ngl'),
	dripCondensate: getPhaseGroupFields('drip_condensate'),
};

export const toPhaseGroup = (apiPhaseGroup: ApiPhaseGroup): IPhaseGroup | Record<string, unknown> => {
	const phaseGroupResult = {};

	if (isNil(apiPhaseGroup)) {
		return phaseGroupResult;
	}

	Object.entries(PHASE_GROUP_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (phaseGroup: IPhaseGroup, value: unknown) => void;
			coercedWrite(phaseGroupResult as IPhaseGroup, apiPhaseGroup[field as ApiPhaseGroupKey]);
		}
	});
	return phaseGroupResult;
};

export const toApiPhaseGroup = (phaseGroup: IPhaseGroup): ApiPhaseGroup => {
	const apiPhaseGroup: Record<string, ApiPhaseGroup[ApiPhaseGroupKey]> = {};
	Object.entries(PHASE_GROUP_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiPhaseGroup[field] = read(phaseGroup);
		}
	});
	return apiPhaseGroup;
};

export const getApiPhaseGroupField = (field: string): (typeof PHASE_GROUP_FIELDS)[ApiPhaseGroupKey] | null =>
	getApiField(field, PHASE_GROUP_FIELDS);
