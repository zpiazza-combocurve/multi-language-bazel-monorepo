import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { DataPipelineItem } from '@/data-sync/data-flows/pipelines/PipelineForm.hooks';
import { DialogProps } from '@/helpers/dialog';

type FormValue = DataPipelineItem & {
	name: string;
	type: string;
	required: string;
};

interface DataPipelineManageModalProps extends DialogProps {
	className?: string;
	type?: 'update' | 'create';
	item?: FormValue;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onChange: (val: any) => void;
}

function DataPipelineManageModal(props: DataPipelineManageModalProps) {
	const { visible, onHide, type, item, onChange } = props;

	const defaultValues = useMemo(
		() => ({
			name: '',
			type: '',
			required: false,
			...(item ? item : {}),
		}),
		[item]
	);
	const methods = useForm<FormValue>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		defaultValues: defaultValues as any,
		mode: 'all',
	});

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = methods;

	const mutate = (values) => {
		onChange(values);
		onHide();
	};

	const handleCreate = handleSubmit((values) => mutate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>{type === 'update' ? 'Update' : 'Create'} Field</DialogTitle>
			<DialogContent>
				<Box>
					<Box sx={{ margin: '10px 0px', width: 600 }}>
						<RHFTextField
							fullWidth
							name='name'
							label='Name'
							control={control}
							required
							rules={{ required: true }}
						/>
					</Box>

					<Box sx={{ margin: '10px 0px', width: 600 }}>
						<RHFTextField
							rules={{ required: true }}
							required
							fullWidth
							name='type'
							label='Type'
							control={control}
						/>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>

				<Button onClick={handleCreate} color='primary' variant='contained' disabled={!isValid}>
					{type === 'update' ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DataPipelineManageModal;
