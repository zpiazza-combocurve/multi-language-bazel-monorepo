import { withDialog } from '@/helpers/dialog';
import { getCurrentTheme } from '@/helpers/theme';

import { PromptGenericDialog } from '../../components/GenericDialog/GenericDialog';
import { RunContent } from './RunContent';

export const genericDialog = withDialog(PromptGenericDialog);

export const runDialog = ({ scheduleId, methods, runAnalyticsTagging = {} }) => {
	const theme = getCurrentTheme();

	return genericDialog({
		title: 'Run Schedule',
		disableMinHeight: true,
		children: <RunContent scheduleId={scheduleId} methods={methods} />,
		actions: [
			{
				key: 'cancel',
				children: 'Cancel',
				variant: 'text',
				color: 'secondary',
				value: true,
			},
			{
				key: 'run',
				children: 'Run',
				variant: 'contained',
				color: 'secondary',
				value: true,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				getOnClickFunction: (ref: any) => {
					ref.current?.handleRun();
				},
				shouldResolve: true,
				style: { color: theme.background },
				...runAnalyticsTagging,
			},
		],
	});
};
