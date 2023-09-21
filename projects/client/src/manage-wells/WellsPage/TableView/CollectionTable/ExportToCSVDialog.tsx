import { Box } from '@material-ui/core';
import _ from 'lodash';
import { useForm } from 'react-hook-form';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	RHFReactDatePicker,
	RHFTextField,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';

export const ExportToCSVDialog = ({
	resolve,
	onHide,
	visible,
	resolution,
	totalWells,
}: DialogProps<{
	resolution: string;
	startDate?: Date;
	endDate?: Date;
}> & { totalWells: number; resolution: string }) => {
	const {
		control,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: {
			resolution,
			startDate: undefined,
			endDate: undefined,
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const handleSubmit = withFormValues((values) => resolve(_.pickBy(values) as any));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Export Production Data</DialogTitle>
			<DialogContent css={{ height: '25rem' }}>
				<RHFTextField control={control} name='resolution' label='Resolution' select fullWidth required>
					<MenuItem value='daily'>Daily</MenuItem>
					<MenuItem value='monthly'>Monthly</MenuItem>
				</RHFTextField>
				<Box mt={3} display='flex' flexDirection='row' justifyContent='space-between'>
					<RHFReactDatePicker control={control} name='startDate' label='Production Start Date' fullWidth />
					<Box mx={1} />
					<RHFReactDatePicker control={control} name='endDate' label='Production End Date' fullWidth />
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' disabled={!isValid && isSubmitted} onClick={() => handleSubmit()}>
					Export ({pluralize(totalWells, 'Well', 'Wells')})
				</Button>
			</DialogActions>
		</Dialog>
	);
};
