import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFCheckboxField,
	RHFTextField,
} from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { postApi, putApi } from '@/helpers/routing';
import { Item } from '@/module-list/types';

import { MainButton } from '../components/MainButton';
import { TextButton } from '../components/TextButton';

type DataSecretItem = Assign<Item, Inpt.DataSecret>;

interface DataSecretCreateModalProps extends DialogProps {
	className?: string;
	type?: 'update' | 'create';
	item?: DataSecretItem;
	runFilters?: () => void;
}

function DataSecretCreateModal(props: DataSecretCreateModalProps) {
	const { visible, onHide, type, item, runFilters } = props;

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm({
		defaultValues: { key: '', value: '', ...(item ? item : {}) },
		mode: 'all',
	});

	const createSecretMutation = useMutation(
		async (values: Partial<DataSecretItem>) => {
			if (type === 'update' && item) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return putApi(`/data-sync/data-secrets/${item.key}`, values) as Promise<any>;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return postApi(`/data-sync/data-secrets`, values) as Promise<any>;
			}
		},
		{
			onSuccess: () => {
				confirmationAlert(type === 'update' ? 'Data Secret updated' : 'Data Secret created');
				runFilters?.();
				onHide();
			},
		}
	);

	const handleCreate = handleSubmit((values) => createSecretMutation.mutate(values));

	return (
		<Dialog fullWidth maxWidth='xs' open={visible} onClose={onHide}>
			<DialogTitle>{type === 'update' ? 'Update' : 'Create'} Secret</DialogTitle>
			<DialogContent>
				<Box sx={{ margin: '10px  0px' }}>
					<RHFTextField
						fullWidth
						name='key'
						label='Key'
						disabled={type === 'update'}
						control={control}
						required
						rules={{ required: true }}
					/>
				</Box>

				<Box sx={{ margin: '10px 0px' }}>
					<RHFTextField
						multiline
						maxRows={20}
						fullWidth
						name='value'
						label='Value'
						control={control}
						required
						rules={{ required: true }}
					/>
				</Box>

				<Box sx={{ margin: '10px 0px' }}>
					<RHFCheckboxField name='hidden' label='Hide' control={control} rules={{}} />
				</Box>
			</DialogContent>
			<DialogActions>
				<TextButton onClick={onHide}>Cancel</TextButton>

				<MainButton onClick={handleCreate} disabled={!isValid || createSecretMutation.isLoading}>
					{type === 'update' ? 'Update' : 'Create'}
				</MainButton>
			</DialogActions>
		</Dialog>
	);
}

export default DataSecretCreateModal;
