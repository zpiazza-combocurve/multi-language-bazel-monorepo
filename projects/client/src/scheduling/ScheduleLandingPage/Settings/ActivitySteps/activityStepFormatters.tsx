import { ProcessCellForExportParams, ValueFormatterParams } from 'ag-grid-community';

import { formatValue } from '@/helpers/utilities';
import { ActivityStep, PAD_OPERATION_LABELS, PAD_OPERATION_LABELS_TO_KEY } from '@/inpt-shared/scheduling/shared';

import { formatDays, formatEnum, formatStepIdx } from '../shared/helpers';

export const activityStepFormatters = (
	params: ValueFormatterParams | ProcessCellForExportParams,
	activitySteps: ActivityStep[]
) => {
	const {
		context: { lookupTables = [], isSchedulingLookupTableEnabled },
		value,
	} = params;
	const { field } = params.column.getColDef();

	switch (field) {
		case 'previousStepIdx':
			return formatStepIdx(value, activitySteps);
		case 'stepDuration':
			if (isSchedulingLookupTableEnabled && value.useLookup && value.scheduleLookupId) {
				const lookupTable = lookupTables.find((table) => table._id === value.scheduleLookupId);
				const name = lookupTable?.name ?? 'Loading';

				return name;
			}
			return formatDays(value.days);
		case 'stepDuration.days': // kept to support when feature flag is disabled
			return formatDays(value);
		case 'padOperation':
			return formatEnum(PAD_OPERATION_LABELS, value);
		default:
			return formatValue(value);
	}
};

export const activityStepFromClipboardFormatters = (
	params: ValueFormatterParams | ProcessCellForExportParams,
	activitySteps: ActivityStep[]
) => {
	const { value } = params;
	const { field } = params.column.getColDef();

	switch (field) {
		case 'name':
		case 'color':
			return value;
		case 'previousStepIdx': {
			const steps = value.split(',');
			return steps
				.map((stepName: string) => {
					const step = activitySteps.find((step: ActivityStep) => step.name === stepName.trim());

					if (!step) return false;
					return step.stepIdx;
				})
				.filter(Boolean);
		}
		case 'padOperation':
			return PAD_OPERATION_LABELS_TO_KEY[value.toLowerCase()];
		case 'stepDuration.days':
			return value.replace(/\D/g, '');
		case 'requiresResources':
			return ['yes', 'true'].includes(value.toLowerCase());
		default:
			throw new Error(`Couldn't find a formatter for ${field}`);
	}
};
