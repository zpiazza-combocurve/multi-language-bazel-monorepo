import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFCheckboxField,
	RHFSelectField,
	RHFTextField,
	Typography,
} from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { postApi, putApi } from '@/helpers/routing';
import { Item } from '@/module-list/types';

import { Editor } from '../components/Editor';
import { dumpJsonAsYaml, loadYaml } from '../data-flows/pipelines/DataPipeline.hooks';

type DataSourceItem = Assign<Item, Inpt.DataSource>;

interface DataSourceCreateModalProps extends DialogProps<void> {
	className?: string;
	type?: 'update' | 'create';
	item?: DataSourceItem;
	dataSourceTypes?: Inpt.DataSourceType[];
	runFilters: () => void;
}

function DataSourceCreateModal(props: DataSourceCreateModalProps) {
	const { visible, onHide, type, item, dataSourceTypes, runFilters } = props;

	const {
		control,
		handleSubmit,
		getValues,
		setValue,
		formState: { isValid },
	} = useForm({
		defaultValues: {
			dataSourceTypeId: '',
			name: '',
			allDataSyncAgentsAllowed: true,
			...(item ? item : {}),
			configuration: item?.configuration ? dumpJsonAsYaml(item?.configuration) : '',
		},
		mode: 'all',
	});

	const setEditorValue = (editorName) => (newValue, _ev) => {
		setValue(editorName, newValue, { shouldDirty: true });
	};

	const mutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async (values: any) => {
			const configurationJson = loadYaml(values.configuration);
			const data = {
				...values,
				configuration: configurationJson,
			};

			if (type === 'update' && item) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return putApi(`/data-sync/data-sources/${item.id}`, data) as Promise<any>;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return postApi(`/data-sync/data-sources`, data) as Promise<any>;
			}
		},
		{
			onSuccess: () => {
				confirmationAlert(type === 'update' ? 'Data Source updated' : 'Data Source created');
				runFilters();
				onHide();
			},
		}
	);

	const menuItems = (dataSourceTypes ?? []).map((el) => ({
		key: el.key,
		label: el.name,
		value: el._id,
	}));

	const handleCreate = handleSubmit((values) => mutation.mutate(values));

	return (
		<Dialog fullWidth maxWidth='sm' open={visible} onClose={onHide}>
			<DialogTitle>{type === 'update' ? 'Update' : 'Create'} Data Source</DialogTitle>
			<DialogContent>
				<Box sx={{ width: 300, margin: '10px 0px' }}>
					<RHFSelectField
						name='dataSourceTypeId'
						label='Data source type'
						menuItems={menuItems}
						control={control}
						rules={{ required: true }}
						fullWidth
						required
					/>
				</Box>
				<Box sx={{ width: 300, margin: '10px 0px' }}>
					<RHFTextField
						fullWidth
						name='name'
						label='Name'
						control={control}
						rules={{ required: true }}
						required
					/>
				</Box>
				<Box sx={{ width: 300, margin: '10px 0px' }}>
					<RHFCheckboxField
						name='allDataSyncAgentsAllowed'
						label='Is all data sync agents allowed'
						control={control}
						rules={{}}
					/>
				</Box>
				<Box sx={{ margin: '10px 0px' }}>
					<Box sx={{ margin: '10px 0px' }}>
						<Typography data-testid='data-flow-title' variant='h6'>
							Configuration
						</Typography>
					</Box>
					<Editor value={getValues(`configuration`)} setValue={setEditorValue(`configuration`)} />
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={handleCreate}
					color='primary'
					variant='contained'
					disabled={!isValid || mutation.isLoading}
				>
					{type === 'update' ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DataSourceCreateModal;
