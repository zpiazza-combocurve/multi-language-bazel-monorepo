import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { IDENTIFIERS } from '@/components/misc/WellIdentifierSelect';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFRadioGroupField,
	Typography,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type ChangeChosenIdDialogProps = DialogProps<{ identifier: any }> & {
	selection: string[];
};

const initialValues = {
	identifier: undefined,
};

const ChangeChosenIdSchema = yup.object().shape({
	identifier: yup.string().required('This field is required'),
});

const VALID_IDENTIFIERS = IDENTIFIERS.filter((identifier) => identifier.value !== 'chosenID');

function ChangeChosenIdDialog({ visible, onHide, selection, resolve }: ChangeChosenIdDialogProps) {
	const {
		control,
		formState: { isSubmitting, isValid, errors },
		handleSubmit: withSubmitValues,
	} = useForm({
		defaultValues: initialValues,
		mode: 'all',
		resolver: yupResolver(ChangeChosenIdSchema),
	});

	const handleRun = withSubmitValues((values) => resolve(values));
	return (
		<Dialog open={visible} maxWidth='xs' onClose={onHide}>
			<DialogTitle>Change Wells Chosen ID</DialogTitle>
			<DialogContent>
				<Typography
					variant='subtitle1'
					css={`
						font-weight: 500;
						margin-bottom: ${({ theme }) => theme.spacing(3)}px;
					`}
				>
					{pluralize(selection.length, 'well', 'wells')} selected
				</Typography>

				<Typography variant='subtitle1'>Select a new Chosen ID from the list below</Typography>

				<RHFRadioGroupField
					name='identifier'
					options={VALID_IDENTIFIERS}
					control={control}
					error={!!errors.identifier}
					row
					gridOptions={{
						xs: 6,
					}}
					css={`
						margin-top: ${({ theme }) => theme.spacing(3)}px;
						margin-bottom: ${({ theme }) => theme.spacing(3)}px;
					`}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} color='secondary'>
					Cancel
				</Button>
				<Button color='secondary' variant='contained' onClick={handleRun} disabled={isSubmitting || !isValid}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ChangeChosenIdDialog;
