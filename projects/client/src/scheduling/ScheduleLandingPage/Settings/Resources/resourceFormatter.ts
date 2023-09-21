import { ProcessCellForExportParams, ValueFormatterParams } from 'ag-grid-community';

import { formatIdx, formatValue } from '@/helpers/utilities';
import { ActivityStep } from '@/inpt-shared/scheduling/shared';

import { formatDays, formatStepIdx } from '../shared/helpers';

export const resourceFormatter = (
	params: ValueFormatterParams | ProcessCellForExportParams,
	activitySteps: ActivityStep[]
) => {
	const { field } = params.column.getColDef();

	switch (field) {
		case 'stepIdx':
			return formatStepIdx(params.value, activitySteps);
		case 'mobilizationDays':
		case 'demobilizationDays':
			return formatDays(params.value);
		case 'data.availability.start':
			return formatIdx(params.node?.data?.availability?.start);
		case 'data.availability.end':
			return formatIdx(params.node?.data?.availability?.end);
		default:
			return formatValue(params.value);
	}
};

export const resourceFromClipboardFormatters = (
	params: ValueFormatterParams | ProcessCellForExportParams,
	activitySteps: ActivityStep[]
) => {
	const { field } = params.column.getColDef();

	switch (field) {
		case 'name':
			return params.value;
		case 'stepIdx': {
			const steps = params.value.split(',');
			return steps
				.map((stepName: string) => {
					const step = activitySteps.find((step: ActivityStep) => step.name === stepName.trim());

					if (!step) return false;
					return step.stepIdx;
				})
				.filter(Boolean);
		}
		case 'mobilizationDays':
		case 'demobilizationDays':
			return params.value.replace(/\D/g, '');
		case 'data.availability.start':
		case 'data.availability.end':
			return new Date(params.value);
		case 'active':
			return ['yes', 'true'].includes(params.value.toLowerCase());
		default:
			throw new Error(`Couldn't find a formatter for ${field}`);
	}
};
