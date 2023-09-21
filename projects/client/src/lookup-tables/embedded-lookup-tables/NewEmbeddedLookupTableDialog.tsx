import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { getTaggingProp } from '@/analytics/tagging';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFCheckboxField,
	RHFSelectField,
	RHFTextField,
	Tooltip,
} from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { hasNonWhitespace } from '@/helpers/text';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { generateLookupTableName } from '@/lookup-tables/shared/utils';

import { CASE_INSENSITIVE_CHECKBOX_TITLE, CASE_INSENSITIVE_TOOLTIP_TITLE } from '../shared/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type NewEmbeddedLookupTableDialogProps = DialogProps<{ name: string; assumptionKey: string; configuration: any }> & {
	chosenType?: string;
};

const CreateEmbeddedLookupTableSchema = yup.object().shape({
	name: yup.string().required('This field is required.'),
	assumptionKey: yup.string().required('This field is required.'),
	configuration: yup.object({
		caseInsensitiveMatching: yup.boolean(),
	}),
});

export const NewEmbeddedLookupTableDialog = ({
	resolve,
	onHide,
	visible,
	chosenType,
}: NewEmbeddedLookupTableDialogProps) => {
	const { user } = useAlfa();

	const {
		control,
		formState: { isValid, isSubmitting },
		handleSubmit: withSubmitValues,
		watch,
	} = useForm({
		defaultValues: {
			name: generateLookupTableName({ user }),
			assumptionKey: chosenType ?? AssumptionKey.expenses,
			configuration: {
				caseInsensitiveMatching: true,
				selectedHeaders: [],
			},
		},
		resolver: yupResolver(CreateEmbeddedLookupTableSchema),
	});

	useLoadingBar(isSubmitting);

	const handleSubmit = withSubmitValues((values) => {
		resolve(values);
	});

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>New Embedded Lookup Table</DialogTitle>
			<DialogContent>
				<RHFTextField control={control} name='name' label='Name' fullWidth />
				<RHFSelectField
					disabled={!!chosenType}
					control={control}
					name='assumptionKey'
					label='Type'
					fullWidth
					menuItems={[
						{ label: ASSUMPTION_LABELS[AssumptionKey.expenses], value: AssumptionKey.expenses },
						{ label: ASSUMPTION_LABELS[AssumptionKey.capex], value: AssumptionKey.capex },
					]}
				/>
				<Tooltip title={CASE_INSENSITIVE_TOOLTIP_TITLE} placement='bottom-start'>
					{
						// This div is here to make a tooltip showing on hovering label too,
						// deleting it will make tooltip show only on checkbox
					}
					<div>
						<RHFCheckboxField
							control={control}
							name='configuration.caseInsensitiveMatching'
							label={CASE_INSENSITIVE_CHECKBOX_TITLE}
						/>
					</div>
				</Tooltip>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={handleSubmit}
					color='primary'
					disabled={!isValid || isSubmitting || !hasNonWhitespace(watch('name'))}
					{...getTaggingProp('embeddedLookupTable', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};
