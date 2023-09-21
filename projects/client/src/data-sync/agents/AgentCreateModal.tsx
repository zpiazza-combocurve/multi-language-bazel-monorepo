import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';

interface AgentCreateModalProps extends DialogProps<void> {
	className?: string;
}

function AgentCreateModal(props: AgentCreateModalProps) {
	const { visible, onHide } = props;

	const {
		control,
		formState: { isValid },
		handleSubmit,
	} = useForm({
		defaultValues: { agentName: '' },
		mode: 'all',
	});

	const createAgentMutation = useMutation(
		async (values: { agentName: string }) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			return postApi(`/data-sync/agents/`, values) as Promise<any>;
		},
		{
			onSuccess: () => {
				confirmationAlert('Agent created');
				onHide();
			},
		}
	);

	const handleCreate = handleSubmit((values) => createAgentMutation.mutate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Create Agent</DialogTitle>
			<DialogContent>
				<RHFTextField name='agentName' label='Name' required rules={{ required: true }} control={control} />
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>

				<Button
					onClick={handleCreate}
					color='primary'
					variant='contained'
					disabled={!isValid || createAgentMutation.isLoading}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AgentCreateModal;
