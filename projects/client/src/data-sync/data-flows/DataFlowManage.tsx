import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import { Box, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { postApi, putApi } from '@/helpers/routing';
import { Item } from '@/module-list/types';

import { MainButton } from '../components/MainButton';
import { TextButton } from '../components/TextButton';

type DataFlowItem = Assign<Item, Inpt.DataFlow>;

export interface DataFlowManageModalProps extends DialogProps {
	className?: string;
	type?: 'update' | 'create';
	item?: DataFlowItem;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onCreate?: (data: any) => void;
	onUpdate?: () => void;
}

function DataFlowManageModal(props: DataFlowManageModalProps) {
	const { visible, onHide, type, item, onCreate, onUpdate } = props;

	const defaultValues = useMemo(
		() => ({
			name: '',
			description: '',
			...(item ? item : {}),
		}),
		[item]
	);

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm({
		defaultValues,
		mode: 'all',
	});

	const mutation = useMutation(
		async (values: Partial<DataFlowItem>) => {
			if (type === 'update' && item) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return putApi(`/data-sync/data-flows/${item._id}`, values) as Promise<any>;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return postApi(`/data-sync/data-flows`, values) as Promise<any>;
			}
		},
		{
			onSuccess: (data) => {
				if (type === 'update') {
					confirmationAlert('Data Flow updated');
					onUpdate?.();
				} else {
					confirmationAlert('Data Flow created');
					onCreate?.(data);
				}

				onHide();
			},
		}
	);

	const handleCreate = handleSubmit((values: Partial<DataFlowItem>) => mutation.mutate(values));

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>{type === 'update' ? 'Update' : 'Create'} Data Flow</DialogTitle>
			<DialogContent>
				<Box sx={{ width: 300 }}>
					<Box sx={{ margin: '10px 0px' }}>
						<RHFTextField
							fullWidth
							name='name'
							label='Name'
							control={control}
							required
							rules={{ required: true, maxLength: 200 }}
						/>
					</Box>

					<Box sx={{ margin: '10px 0px' }}>
						<RHFTextField
							fullWidth
							name='description'
							label='Description'
							control={control}
							rules={{ maxLength: 600 }}
						/>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions>
				<TextButton onClick={onHide}>Cancel</TextButton>

				<MainButton onClick={handleCreate} disabled={!isValid || mutation.isLoading}>
					{type === 'update' ? 'Update' : 'Create'}
				</MainButton>
			</DialogActions>
		</Dialog>
	);
}

export default DataFlowManageModal;
