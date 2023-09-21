import { convertIdxToDate } from '@combocurve/forecast/helpers';

type FPD = {
	value: number | 'N/A' | null;
	originalField: string;
};

type Event = FPD & {
	field: string;
	stepIdx: number;
	resourceIdx?: number;
};

type OriginalData = {
	[key: string]: number | string | null;
};

type WellModifiedValues = {
	wellName: string;
	events: { [key: string]: Event };
	originalData: OriginalData;
	FPD?: FPD;
	FPY?: Omit<FPD, 'originalField'>;
};

type ModifiedValues = {
	[key: string]: WellModifiedValues;
};

export class EditTableModifiedValues {
	private modifiedValues: ModifiedValues;

	constructor() {
		this.modifiedValues = {};
	}

	public getModifiedValue({ id, field }: { id: string; field: string }): Event {
		if (this.isFPD(field)) return this.modifiedValues[id]?.[field];
		else return this.modifiedValues[id]?.events[field];
	}

	public setModifiedValue({
		id,
		wellName,
		field,
		value,
		originalField,
		stepIdx,
		resourceIdx,
		originalData,
	}: {
		id: string;
		wellName: string;
		field: string;
		value: number | null;
		originalField: string;
		stepIdx?: number;
		resourceIdx?: number;
		originalData: OriginalData;
	}): void {
		this.modifiedValues[id] ??= {
			wellName,
			events: {},
			originalData,
		};

		if (this.isFPD(field)) {
			this.modifiedValues[id][field] = { value, originalField };
			this.modifiedValues[id]['FPY'] = {
				value: value === null ? 'N/A' : convertIdxToDate(value).getFullYear(),
			};
		} else {
			this.modifiedValues[id] ??= {
				wellName,
				events: {},
				originalData,
			};

			this.modifiedValues[id].events[field] = {
				value,
				field,
				originalField,
				stepIdx: stepIdx ?? 0,
				resourceIdx,
			};
		}
	}

	public getModifiedData() {
		return Object.entries(this.modifiedValues).map(([id, newValues]) => {
			const updateValues = {
				id,
				wellName: newValues.wellName,
				events: Object.values(newValues.events),
				originalData: newValues.originalData,
			};

			if (newValues.FPD) {
				updateValues['FPD'] = newValues.FPD;
			}

			return updateValues;
		});
	}

	private isFPD(field: string) {
		return ['FPD', 'FPY'].includes(field);
	}
}
