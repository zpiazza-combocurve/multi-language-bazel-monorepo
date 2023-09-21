import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import produce from 'immer';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	RHFTextField,
	Typography,
} from '@/components/v2';
import SearchHeadersMultiselect from '@/create-wells/SelectHeaders/SearchHeadersMultiselect';
import SelectedHeadersList from '@/create-wells/SelectHeaders/SelectedHeadersList';
import { INPUT_CONTAINS_ERRORS_MESSAGE } from '@/create-wells/shared';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';

import { useHeaders } from './helpers';
import { useCreateWellsCollectionMutation } from './mutations';
import { useWellsCollectionsQuery } from './queries';
import styles from './wells-collections.module.scss';

const INITIAL_VALUES = {
	well_name: 'Wells Collection',
	headers: {},
};

const CreateWellsCollectionSchema = yup.object({
	well_name: yup.string().required('This field is required.'),
});

interface CreateWellsCollectionDialogProps extends DialogProps<Inpt.WellsCollection> {
	projectId?: Inpt.ObjectId<'project'>;
}

const CreateWellsCollectionDialog = (props: CreateWellsCollectionDialogProps) => {
	const { onHide, visible, resolve, projectId } = props;

	const { wellHeadersDict, setHeaders, headers, selectedHeaders, headersKeyValuePairs } = useHeaders(
		INITIAL_VALUES,
		projectId,
		true
	);

	const {
		control,
		formState: { isSubmitting, errors },
		handleSubmit: withSubmitValues,
	} = useForm({
		mode: 'all',
		defaultValues: INITIAL_VALUES,
		resolver: yupResolver(CreateWellsCollectionSchema),
	});

	const { invalidate: invalidateQuery } = useWellsCollectionsQuery(projectId, true);

	const { mutateAsync: create, isLoading: creating } = useCreateWellsCollectionMutation({
		onSuccess: (data: Inpt.WellsCollection) => {
			resolve(data);
			confirmationAlert(`Wells Collection '${data.well_name}' created!`);
			invalidateQuery();
		},
		onError: (error: Error) => {
			genericErrorAlert(error);
		},
	});

	const onAddHeader = useCallback(
		(key: string | undefined) => {
			if (!key) {
				return;
			}

			setHeaders(
				produce((draft) => {
					draft[key] = null;
				})
			);
		},
		[setHeaders]
	);

	const onRemoveHeader = useCallback(
		(key: string | undefined) => {
			if (!key) {
				return;
			}

			setHeaders(
				produce((draft) => {
					delete draft[key];
				})
			);
		},
		[setHeaders]
	);

	const onChangeHeaderValue = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(key: string, value: any) => {
			setHeaders(
				produce((draft) => {
					draft[key] = value;
				})
			);
		},
		[setHeaders]
	);

	const handleSubmit = withSubmitValues(async (values) => {
		await create({
			...values,
			headers,
			project: projectId,
		});
	});

	useLoadingBar(creating);

	const hasErrors = Object.keys(errors).length > 0;

	return (
		<Dialog className={styles['wells-collection-dialog']} onClose={onHide} open={visible} fullWidth maxWidth='md'>
			<DialogTitle className={styles['dialog-title']} disableTypography>
				<Typography>Create Wells Collection</Typography>
				<IconButton disabled={creating} size='small' onClick={onHide}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<DialogContent className={styles['dialog-content']}>
				<Divider className={styles.divider} orientation='horizontal' />
				<RHFTextField
					variant='outlined'
					control={control}
					name='well_name'
					label='Name *'
					fullWidth
					autoFocus
				/>
				<SearchHeadersMultiselect
					multiSelectCSS='margin-top: 1rem;'
					wellHeadersDict={wellHeadersDict}
					selectedHeaders={selectedHeaders}
					onAddHeader={onAddHeader}
					onRemoveHeader={onRemoveHeader}
					disableClearable
					disableTags
				/>
				{selectedHeaders.length > 0 && (
					<SelectedHeadersList
						wellHeadersDict={wellHeadersDict}
						headers={headersKeyValuePairs}
						onChangeHeaderValue={onChangeHeaderValue}
						onRemoveHeader={onRemoveHeader}
					/>
				)}

				<Divider className={styles.divider} orientation='horizontal' />
			</DialogContent>
			<DialogActions className={styles['dialog-actions']}>
				<Button disabled={creating} color='secondary' variant='text' onClick={onHide}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					color='secondary'
					variant='contained'
					disabled={creating || isSubmitting || (hasErrors && INPUT_CONTAINS_ERRORS_MESSAGE)}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default CreateWellsCollectionDialog;
