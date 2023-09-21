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
	RHFTextField,
	Tooltip,
} from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { hasNonWhitespace } from '@/helpers/text';
import { generateLookupTableName } from '@/lookup-tables/shared/utils';

import { CASE_INSENSITIVE_CHECKBOX_TITLE, CASE_INSENSITIVE_TOOLTIP_TITLE } from '../shared/constants';

const CreateLookupTableSchema = yup.object().shape({
	name: yup.string().required('This field is required.'),
	configuration: yup.object({
		caseInsensitiveMatching: yup.boolean(),
	}),
});

const initialValues = {
	name: '',
	configuration: {
		caseInsensitiveMatching: true,
	},
};

export function CreateLookupTableDialog({ onSubmit, onHide, visible, title = 'New Lookup Table', lookupTableType }) {
	const { user } = useAlfa();

	const {
		control,
		formState: { isValid, isSubmitting },
		handleSubmit: withSubmitValues,
		watch,
	} = useForm({
		defaultValues: { ...initialValues, name: generateLookupTableName({ user }) },
		resolver: yupResolver(CreateLookupTableSchema),
	});

	useLoadingBar(isSubmitting);

	const handleSubmit = withSubmitValues((values) => {
		onSubmit({
			...values,
		});
	});

	const lookupTableAnalyticsMap = {
		scenario: getTaggingProp('scenarioLookupTable', 'create'),
		typeCurve: getTaggingProp('typeCurveLookupTable', 'create'),
	};

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<RHFTextField control={control} name='name' label='Name' fullWidth />
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
					color='primary'
					disabled={!isValid || isSubmitting || !hasNonWhitespace(watch('name'))}
					onClick={handleSubmit}
					{...lookupTableAnalyticsMap[lookupTableType]}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}
