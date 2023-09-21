import { convertDateToIdx } from '@combocurve/forecast/helpers';
import _ from 'lodash';

import { User } from '@/access-policies/shared';
import { yearsToIndex } from '@/helpers/date';
import { arrayToRecord, getColorFromIndex } from '@/helpers/utilities';
import {
	ActivityStep,
	PadOperation,
	Resource,
	RunScheduleForm,
	SettingFormatted,
} from '@/inpt-shared/scheduling/shared';

export const prepareValues = (values: RunScheduleForm, projectId: Inpt.ObjectId) => {
	return {
		..._.omit(values, ['startProgram', 'overwriteManual']),
		project: projectId,
	} as SettingFormatted;
};

const createAvailability = (startIndex = convertDateToIdx(new Date().setHours(0))) => ({
	start: startIndex,
	end: startIndex + yearsToIndex(200),
});

export const formatDays = (value: number) => (value === 1 ? `${value} day` : `${value} days`);

export const formatEnum = <T>(enumObject: T, value: string) => enumObject[value];

export const formatStepIdx = (value: number[], activitySteps: ActivityStep[]) => {
	const previousStepLabels = activitySteps.reduce((acc: { [key: number]: string }, current: ActivityStep) => {
		acc[current.stepIdx] = current.name;
		return acc;
	}, {});

	const valueToLabel = Array.isArray(previousStepLabels)
		? arrayToRecord(previousStepLabels, 'value', 'label')
		: previousStepLabels;

	return value
		.sort()
		.map((idx: number) => valueToLabel[idx])
		.join(', ');
};

export const createResource = (lastIndex = 0, assignedStepIdx?: number): Resource => {
	const resourceNumber = lastIndex + 1;
	const stepIdx = assignedStepIdx ? [assignedStepIdx] : [];
	const active = Boolean(assignedStepIdx);

	return {
		active,
		availability: createAvailability(),
		demobilizationDays: 1,
		mobilizationDays: 1,
		name: `Resource ${resourceNumber}`,
		stepIdx,
		workOnHolidays: true,
	};
};

export const createActivityStep = (lastIndex = 0): ActivityStep => {
	const stepNumber = lastIndex + 1;
	const previousStepIdx = lastIndex ? [lastIndex] : [];

	return {
		color: getColorFromIndex(stepNumber),
		stepIdx: stepNumber,
		previousStepIdx,
		name: `Step Name ${stepNumber}`,
		padOperation: PadOperation.disabled,
		stepDuration: { days: 1, useLookup: false },
		requiresResources: true,
	};
};

export const generalValueSetter =
	(Schema) =>
	({ data, newValue, colDef }) => {
		const isValid = Schema.isValidSync({
			...data,
			[colDef.field]: newValue,
		});

		if (isValid) {
			data[colDef.field] = newValue;
			return true;
		}

		return false;
	};

export const parseStringToArrayNumber = (newValue: string | number[]) =>
	typeof newValue === 'string' ? newValue.split(',')?.map((value) => Number(value)) : newValue;

export const anyUser = {
	_id: '' as Inpt.ObjectId,
	name: 'Any User',
	firstName: '',
	lastName: '',
	email: '',
	locked: false,
	isEnterpriseConnection: false,
} as User & { name: string };
