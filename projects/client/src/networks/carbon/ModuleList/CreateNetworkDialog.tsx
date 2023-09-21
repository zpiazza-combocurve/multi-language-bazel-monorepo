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
import { createNetworkModel } from '@/networks/carbon/api';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import { AnyEdge, AnyNode } from '../types';

interface CreateNetworkModelDialogProps extends DialogProps<void> {
	className?: string;
	initialData?: { nodes?: AnyNode[]; edges?: AnyEdge[] };
	taggingProp?: Record<string, string>;
}

function CreateNetworkModelDialog(props: CreateNetworkModelDialogProps) {
	const { visible, onHide, taggingProp = {} } = props;

	const { project } = useCurrentProject();
	const navigate = useNavigate();

	assert(project, 'Expected project');

	const { control, handleSubmit } = useForm({ defaultValues: { name: '' }, mode: 'all' });

	const createNetworkModelMutation = useMutation(
		async (values: { name: string }) =>
			createNetworkModel({ ...values, project: project._id, ...props.initialData }),
		{
			onError: (error: ExpectedError) => genericErrorAlert(error),
			onSuccess: (newNetworkModel, values) => {
				confirmationAlert(localize.operations.networkModel.create.complete({ networkModelName: values.name }));
				navigate(URLS.project(newNetworkModel.project).networkModel(newNetworkModel._id).view);
			},
		}
	);

	const handleCreate = handleSubmit((values) => createNetworkModelMutation.mutate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>{localize.network.dialogs.create.title()}</DialogTitle>
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
					disabled={createNetworkModelMutation.isLoading}
					{...taggingProp}
				>
					{localize.network.dialogs.create.confirm()}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CreateNetworkModelDialog;
