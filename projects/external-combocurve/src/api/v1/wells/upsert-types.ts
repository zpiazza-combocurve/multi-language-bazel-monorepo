import { IWell } from '@src/models/wells';

import { IReplace } from './fields';

export interface ICreateEntry {
	type: 'create';
	well: IWell;
}

export interface IReplaceEntry {
	type: 'replace';
	replace: IReplace;
}

export type UpsertEntry = ICreateEntry | IReplaceEntry;

export const isCreate = (entry: UpsertEntry | undefined): entry is ICreateEntry => entry?.type === 'create';
export const isReplace = (entry: UpsertEntry | undefined): entry is IReplaceEntry => entry?.type === 'replace';
