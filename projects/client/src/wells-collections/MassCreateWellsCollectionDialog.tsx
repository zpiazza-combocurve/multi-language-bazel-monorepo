import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import produce from 'immer';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Icon,
	IconButton,
	RHFCheckboxField,
	RHFTextField,
	Typography,
} from '@/components/v2';
import SearchHeadersMultiselect from '@/create-wells/SelectHeaders/SearchHeadersMultiselect';
import { INPUT_CONTAINS_ERRORS_MESSAGE } from '@/create-wells/shared';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import yup from '@/helpers/yup-helpers';

import { useHeaders } from './helpers';
import { useMassCreateWellsCollectionMutation } from './mutations';
import { useWellsCollectionsQuery } from './queries';
import styles from './wells-collections.module.scss';

const INITIAL_VALUES = {
	name: 'Wells Collection',
	headers: {},
	headerAsName: false,
};

const MassCreateWellsCollectionSchema = yup.object().shape({
	headerAsName: yup.boolean(),
	name: yup.string().when('headerAsName', ([headerAsName], schema) => {
		if (!headerAsName) return schema.required();
		return schema.notRequired();
	}),
});

const NO_HEADER_ERROR_MESSAGE = 'At least 1 header is required';

const MassCreateWellsCollectionDialog = (props) => {
	const { onHide, visible, resolve, projectId } = props;

	const { wellHeadersDict, setHeaders, headers, selectedHeaders } = useHeaders(
		INITIAL_VALUES,
		projectId,
		false,
		true
	);

	const {
		control,
		formState: { errors },
		handleSubmit: withSubmitValues,
		watch,
		trigger,
	} = useForm({
		mode: 'all',
		defaultValues: INITIAL_VALUES,
		resolver: yupResolver(MassCreateWellsCollectionSchema),
	});

	const headerAsName = watch('headerAsName');

	const { invalidate: invalidateQuery } = useWellsCollectionsQuery(projectId, true);

	const { mutateAsync: create, isLoading: creating } = useMassCreateWellsCollectionMutation({
		onSuccess: (data: Inpt.WellsCollection[]) => {
			resolve(data);
			confirmationAlert(`Wells Collections created!`);
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

	const handleSubmit = withSubmitValues(async (values) => {
		const headerKeys = Object.keys(headers);
		await create({
			...values,
			headers: headerKeys,
			project: projectId,
		});
	});

	const hasErrors = Object.keys(errors).length > 0;

	useEffect(() => {
		trigger('name');
	}, [trigger, headerAsName]);

	return (
		<Dialog
			className={styles['mass-wells-collection-dialog']}
			onClose={onHide}
			open={visible}
			fullWidth
			maxWidth='md'
		>
			<DialogTitle className={styles['mass-collection-title']} disableTypography>
				<Typography>Mass Create Wells Collection</Typography>
				<IconButton disabled={creating} size='small' onClick={onHide}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<DialogContent className={styles['mass-collection-content']}>
				<Divider orientation='horizontal' />
				<div className={styles['mass-collection-fields']}>
					<RHFTextField
						className={styles['mass-collection-name-field']}
						variant='outlined'
						control={control}
						name='name'
						label='Name'
						fullWidth
						autoFocus
						required={!headerAsName}
						disabled={headerAsName}
						helperText={
							<span
								css={`
									display: flex;
									align-items: center;
									margin-top: 0.5rem;
								`}
							>
								<Icon
									fontSize='small'
									css={`
										margin-right: 0.5rem;
										color: white;
									`}
								>
									{faInfoCircle}
								</Icon>
								<span>The name will have a suffix to identify all the collections</span>
							</span>
						}
					/>
					<SearchHeadersMultiselect
						wellHeadersDict={wellHeadersDict}
						selectedHeaders={selectedHeaders}
						onAddHeader={onAddHeader}
						onRemoveHeader={onRemoveHeader}
						multiSelectCSS='flex: 1;'
					/>
				</div>
				<RHFCheckboxField
					className={styles['mass-collections-header-as-name']}
					label='Assign Header Criteria as the Wells Collection Name'
					control={control}
					name='headerAsName'
				/>
			</DialogContent>
			<DialogActions className={styles['mass-collection-actions']}>
				<Button disabled={creating} color='secondary' variant='text' onClick={onHide}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					color='secondary'
					variant='contained'
					disabled={
						creating ||
						(hasErrors && INPUT_CONTAINS_ERRORS_MESSAGE) ||
						(!Object.keys(headers).length && NO_HEADER_ERROR_MESSAGE)
					}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export { MassCreateWellsCollectionDialog };
