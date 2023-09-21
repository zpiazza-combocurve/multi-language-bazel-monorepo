import { convertDateToIdxFloor } from '@combocurve/forecast/helpers';
import { forwardRef, useImperativeHandle } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { RHFCheckboxField, RHFReactDatePicker } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { postApi } from '@/helpers/routing';
import { RunScheduleForm } from '@/inpt-shared/scheduling/shared';

type RunContentProps = {
	scheduleId: Inpt.ObjectId;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	methods: UseFormReturn<RunScheduleForm, any>;
};

export const RunContent = forwardRef(({ scheduleId, methods }: RunContentProps, ref) => {
	const { isSchedulingRunOverwriteManualEnabled } = useLDFeatureFlags();

	const { control, getValues } = methods;

	const handleRun = async () => {
		const scheduleSettings = getValues();
		await postApi(`/schedules/${scheduleId}/constructions`, {
			scheduleSettings: {
				name: scheduleSettings.name,
				activitySteps: scheduleSettings.activitySteps,
				resources: scheduleSettings.resources,
				startProgram: convertDateToIdxFloor(scheduleSettings.startProgram),
				overwriteManual: scheduleSettings.overwriteManual,
			},
		});
	};

	useImperativeHandle(ref, () => ({
		handleRun,
	}));

	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				gap: 1rem;
			`}
		>
			<RHFReactDatePicker
				control={control}
				label='Start Program'
				name='startProgram'
				variant='outlined'
				color='secondary'
				size='small'
				required
				fullWidth
			/>
			{isSchedulingRunOverwriteManualEnabled && (
				<RHFCheckboxField control={control} name='overwriteManual' label='Overwrite Manual' size='small' />
			)}
		</div>
	);
});
