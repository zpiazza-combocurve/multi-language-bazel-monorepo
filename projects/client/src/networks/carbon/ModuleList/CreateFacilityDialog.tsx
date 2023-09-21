import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { ExpectedError } from '@/helpers/errors';
import { localize } from '@/helpers/i18n';
import { hasNonWhitespace } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import { createNetworkModelFacility } from '@/networks/carbon/api';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import { AnyEdge, AnyNode } from '../types';

interface CreateFacilityDialogProps extends DialogProps<void> {
	className?: string;
	initialData?: { nodes?: AnyNode[]; edges?: AnyEdge[] };
	taggingProp?: Record<string, string>;
}

function CreateFacilityDialog(props: CreateFacilityDialogProps) {
	const { visible, onHide, taggingProp = {} } = props;

	const { project } = useCurrentProject();
	const navigate = useNavigate();

	assert(project, 'Expected project');

	const { control, handleSubmit } = useForm({ defaultValues: { name: '' }, mode: 'all' });

	const createFacilityMutation = useMutation(
		async (values: { name: string }) =>
			createNetworkModelFacility({ ...values, project: project._id, ...props.initialData }),
		{
			onError: (error: ExpectedError) => genericErrorAlert(error),
			onSuccess: (newFacility, values) => {
				confirmationAlert(
					localize.operations.networkModelFacility.create.complete({ facilityName: values.name })
				);
				navigate(URLS.project(newFacility.project).facility(newFacility._id).view);
			},
		}
	);

	const handleCreate = handleSubmit((values) => createFacilityMutation.mutate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Create Facility</DialogTitle>
			<DialogContent>
				<RHFTextField
					name='name'
					label='Name'
					control={control}
					rules={{ validate: (value: string) => hasNonWhitespace(value) || 'Name is required' }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>

				<Button
					onClick={handleCreate}
					color='primary'
					variant='contained'
					disabled={createFacilityMutation.isLoading}
					{...taggingProp}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CreateFacilityDialog;
