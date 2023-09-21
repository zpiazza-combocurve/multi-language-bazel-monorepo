export type WellHeaderValue = string | number | boolean | Date | undefined;

export type WellHeaderInfo = {
	label: string;
	type: string;
	isPCH: boolean;
	options?: { label: string; value: string }[];
	min?: number;
	max?: number;
};

export interface CreateGenericWellsModel {
	_id?: Inpt.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
	name: string;
	default: boolean;
	wellNamePrefix: string;
	numOfWells: number;
	wellsPerPad: number;
	headers: CreateGenericWellsHeaderModel[];
}

export interface CreateGenericWellsHeaderModel {
	key: string;
	value?: WellHeaderValue;
}
