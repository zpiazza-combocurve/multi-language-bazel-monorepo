import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { Box, Dialog, DialogActions, DialogContent, DialogTitle, RHFSelectField } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';

import { MainButton } from '../components/MainButton';
import { TextButton } from '../components/TextButton';
import { useAgentInstanceUpdate, useAgentVersions } from './Agents.hooks';

interface ChooseVersionDialogProps extends DialogProps<void> {
	className?: string;
	connectionId: string;
}

function ChooseVersionDialog(props: ChooseVersionDialogProps) {
	const { visible, onHide, connectionId } = props;

	const { data: versions } = useAgentVersions();
	const { mutation } = useAgentInstanceUpdate();

	const { control, handleSubmit } = useForm({
		defaultValues: {
			agentVersion: versions?.length ? versions[0].version : null,
		},
		mode: 'all',
	});

	const menuItems = (versions ?? []).map((el) => ({
		key: el.version,
		label: el.version,
		value: el.version,
	}));

	const onInstanceUpdate = useCallback(
		(values) => {
			mutation.mutate(
				{ connectionId, ...values },
				{
					onSuccess() {
						confirmationAlert('Agent update requested');
						onHide();
					},
				}
			);
		},
		[mutation, connectionId, onHide]
	);

	const handleCreate = handleSubmit((values) => onInstanceUpdate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Update Agent</DialogTitle>
			<DialogContent>
				<Box sx={{ width: 300 }}>
					<RHFSelectField
						fullWidth
						name='agentVersion'
						label='Version'
						control={control}
						rules={{}}
						menuItems={menuItems}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<TextButton onClick={onHide}>Cancel</TextButton>
				<MainButton onClick={handleCreate} disabled={mutation.isLoading}>
					Update
				</MainButton>
			</DialogActions>
		</Dialog>
	);
}

export default ChooseVersionDialog;
