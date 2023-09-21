import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFSelectField, Typography } from '@/components/v2';
import { ALL_DATA_SOURCES } from '@/data-import/FileImport/CreateDialog';
import { DialogProps } from '@/helpers/dialog';

const SELECT_DATA_SOURCES = Object.keys(ALL_DATA_SOURCES).map((source) => ({
	label: ALL_DATA_SOURCES[source],
	value: source,
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type ChangeWellsSourceDialogProps = DialogProps<{ source: any }> & {
	selection: string[];
};

const initialValues = {
	source: undefined,
};

const SelectSourceSchema = yup.object().shape({
	source: yup.string().oneOf(Object.keys(ALL_DATA_SOURCES)).required('This field is required.'),
});

function ChangeWellsSourceDialog({ visible, onHide, selection, resolve }: ChangeWellsSourceDialogProps) {
	const {
		control,
		handleSubmit: withSubmitValues,
		formState: { isSubmitting, isValid, errors },
	} = useForm({
		defaultValues: initialValues,
		mode: 'all',
		resolver: yupResolver(SelectSourceSchema),
	});

	const handleApply = withSubmitValues((values) => resolve(values));

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xs' fullWidth>
			<DialogTitle>Change Wells Data Source</DialogTitle>
			<DialogContent
				css={`
					margin-bottom: ${({ theme }) => theme.spacing(3)}px;
				`}
			>
				<Typography
					variant='body1'
					css={`
						margin-bottom: ${({ theme }) => theme.spacing(3)}px;
					`}
				>
					{selection.length} Wells Selected
				</Typography>
				<Typography
					variant='body1'
					css={`
						margin-bottom: ${({ theme }) => theme.spacing(3)}px;
					`}
				>
					Select a new Data Source from the drop-down below
				</Typography>
				<RHFSelectField
					label='Select Source'
					control={control}
					name='source'
					menuItems={SELECT_DATA_SOURCES}
					error={!!errors.source}
					fullWidth
					variant='outlined'
					SelectProps={{ MenuProps: { disablePortal: true } }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} color='secondary'>
					Cancel
				</Button>
				<Button color='secondary' variant='contained' onClick={handleApply} disabled={isSubmitting || !isValid}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ChangeWellsSourceDialog;
