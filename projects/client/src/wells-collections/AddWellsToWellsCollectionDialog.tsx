import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { useState } from 'react';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	Typography,
} from '@/components/v2';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';

import { useAddWellsToWellsCollectionMutation } from './mutations';
import { useWellsCollectionsQuery } from './queries';
import styles from './wells-collections.module.scss';

interface AddWellsToWellsCollectionDialogProps extends DialogProps<void> {
	projectId?: Inpt.ObjectId<'project'>;
	wells: Inpt.ObjectId<'well'>[];
}

const AddWellsToWellsCollectionDialog = (props: AddWellsToWellsCollectionDialogProps) => {
	const { onHide, visible, resolve, projectId, wells } = props;
	const [chosenWellCollectionId, setChosenWellCollectionId] = useState<Inpt.ObjectId<'wells-collection'> | undefined>(
		undefined
	);

	const { data, invalidate: invalidateQuery } = useWellsCollectionsQuery(projectId, true);

	const { mutateAsync: add, isLoading: adding } = useAddWellsToWellsCollectionMutation({
		onSuccess: (_, variables) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const { well_name, wells_collection_items: existingWells } = data!.find(
				({ _id }) => _id === variables.wellsCollectionId
			)!;
			const newWellsCount = wells.filter((well) => !existingWells.includes(well)).length;

			confirmationAlert(
				`${pluralize(
					newWellsCount,
					'new well was',
					'new wells were'
				)} added to the '${well_name}' Wells Collection!`
			);
			invalidateQuery();
			resolve();
		},
		onError: (error: Error) => {
			genericErrorAlert(error);
		},
	});

	const onAdd = async () => {
		if (chosenWellCollectionId) {
			await add({ wellsCollectionId: chosenWellCollectionId, wells });
		}
	};

	useLoadingBar(adding);

	return (
		<Dialog
			className={classNames(styles['wells-collection-dialog'], styles['add-wells-to-collection-dialog'])}
			onClose={onHide}
			open={visible}
			fullWidth
			maxWidth='sm'
		>
			<DialogTitle className={styles['dialog-title']} disableTypography>
				<Typography>Add Wells ({wells.length}) to Collection</Typography>
				<IconButton disabled={adding} size='small' onClick={onHide}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<DialogContent className={styles['dialog-content']}>
				<div className={styles.headers}>
					<Typography>Collections</Typography>
					<Typography>Wells</Typography>
				</div>
				<Divider className={styles.divider} orientation='horizontal' flexItem />
				<List className={styles['collections-list']}>
					{data?.map((wellsCollection) => (
						<ListItem
							key={wellsCollection._id}
							className={classNames(
								styles['collections-list-item'],
								wellsCollection._id === chosenWellCollectionId ? styles.chosen : ''
							)}
							onClick={() => setChosenWellCollectionId(wellsCollection._id)}
						>
							<Typography>{wellsCollection.well_name}</Typography>
							<Typography>{wellsCollection.wells_collection_items.length}</Typography>
						</ListItem>
					))}
				</List>
			</DialogContent>
			<DialogActions className={styles['dialog-actions']}>
				<Button disabled={adding} color='secondary' variant='text' onClick={onHide}>
					Cancel
				</Button>
				<Button
					onClick={onAdd}
					color='secondary'
					variant='contained'
					disabled={adding || !chosenWellCollectionId}
				>
					Add
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddWellsToWellsCollectionDialog;
