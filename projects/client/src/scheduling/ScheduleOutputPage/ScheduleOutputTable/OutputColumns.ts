import { convertIdxToDate } from '@combocurve/forecast/helpers';
import _ from 'lodash';

enum DB_FIELDS {
	MOB_START = 'mob.start',
	MOB_END = 'mob.end',
	WORK_START = 'work.start',
	WORK_END = 'work.end',
	DEMOB_START = 'demob.start',
	DEMOB_END = 'demob.end',
	RESOURCE_IDX = 'resourceIdx',
	RESOURCE = 'resourceName',
	ACTIVITY_STEP_IDX = 'activityStepIdx',
	ACTIVITY_STEP_NAME = 'activityStepName',
}

enum LABELS_FIELD {
	MOB_START = 'Mob Start',
	MOB_END = 'Mob End',
	WORK_START = 'Work Start',
	WORK_END = 'Work End',
	DEMOB_START = 'Demob Start',
	DEMOB_END = 'Demob End',
	RESOURCE_IDX = 'Resource Idx',
	RESOURCE = 'Resource',
	ACTIVITY_STEP_IDX = 'Activity Step Idx',
	ACTIVITY_STEP_NAME = 'Activity Step',
}

class OutputColumnDef {
	dbField: DB_FIELDS;
	fieldLabel: LABELS_FIELD;
	type: string;
	readOnly: boolean;
	hide: boolean;

	constructor(dbField: DB_FIELDS, fieldLabel: LABELS_FIELD, type = 'idx', readOnly = false, hide = false) {
		this.dbField = dbField;
		this.fieldLabel = fieldLabel;
		this.type = type;
		this.readOnly = readOnly;
		this.hide = hide;
	}
}

const defaultColumns: OutputColumnDef[] = [
	new OutputColumnDef(DB_FIELDS.MOB_START, LABELS_FIELD.MOB_START),
	new OutputColumnDef(DB_FIELDS.MOB_END, LABELS_FIELD.MOB_END),
	new OutputColumnDef(DB_FIELDS.WORK_START, LABELS_FIELD.WORK_START),
	new OutputColumnDef(DB_FIELDS.WORK_END, LABELS_FIELD.WORK_END),
	new OutputColumnDef(DB_FIELDS.DEMOB_START, LABELS_FIELD.DEMOB_START),
	new OutputColumnDef(DB_FIELDS.DEMOB_END, LABELS_FIELD.DEMOB_END),
	new OutputColumnDef(DB_FIELDS.RESOURCE, LABELS_FIELD.RESOURCE, 'combobox', false),
	new OutputColumnDef(DB_FIELDS.RESOURCE_IDX, LABELS_FIELD.RESOURCE_IDX, 'idx', true, true),
	new OutputColumnDef(DB_FIELDS.ACTIVITY_STEP_IDX, LABELS_FIELD.ACTIVITY_STEP_IDX, 'idx', true, true),
	new OutputColumnDef(DB_FIELDS.ACTIVITY_STEP_NAME, LABELS_FIELD.ACTIVITY_STEP_NAME, 'string', true, true),
];

type WellOutputs = {
	wells: {
		_id: string;
		well: { [key: string]: string };
		output: {
			FPD: number | null;
			events: {
				activityStepIdx: number;
				activityStepName: string;
				demob: { end: number | null; start: number | null };
				mob: { end: number | null; start: number | null };
				resourceIdx: number;
				resourceName: string;
				work: { end: number | null; start: number | null };
			}[];
		};
	}[];
};

export class OutputColumns {
	wellOutputs: WellOutputs;

	constructor(wellOutputs?: WellOutputs) {
		this.wellOutputs = wellOutputs || { wells: [] };
	}

	public getDef() {
		const outputColumns = {};
		const outputEvents = this.wellOutputs.wells.map((row) => row.output.events).flat();

		outputEvents.forEach((event) => {
			const { activityStepName: stepName, activityStepIdx: stepIdx } = event;

			defaultColumns.forEach((column) => {
				const { readOnly, type, dbField, fieldLabel, hide } = column;
				const fieldName = this.getFieldName(stepName, fieldLabel);

				outputColumns[fieldName] = {
					field: fieldName,
					originalField: dbField,
					title: `${stepName} ${fieldLabel}`,
					readOnly,
					type,
					stepIdx,
					hide,
				};
			});
		});

		outputColumns['FPD'] = {
			field: 'FPD',
			originalField: 'FPD',
			title: 'First Production Date',
			type: 'idx',
		};

		outputColumns['FPY'] = {
			field: 'FPY',
			title: 'First Prod Year',
			type: 'string',
			readOnly: true,
		};

		return outputColumns;
	}

	public getData() {
		return this.wellOutputs.wells.map(({ _id, well, output }) => {
			const mappedEvents = {};

			const FPD = output.FPD;
			mappedEvents['FPD'] = FPD;
			mappedEvents['FPY'] = FPD === null ? null : convertIdxToDate(FPD).getFullYear();

			output.events.forEach((event) => {
				const { activityStepName: stepName } = event;

				defaultColumns.forEach((column) => {
					const { dbField, fieldLabel } = column;
					const fieldName = this.getFieldName(stepName, fieldLabel);

					const value = _.get(event, dbField) as number | null;
					mappedEvents[fieldName] = value;
				});
			});

			return {
				...well,
				...mappedEvents,
				_id,
			};
		});
	}

	private getFieldName(stepName: string, fieldLabel: string): string {
		return `${stepName}${fieldLabel}`.replaceAll(' ', '');
	}
}
