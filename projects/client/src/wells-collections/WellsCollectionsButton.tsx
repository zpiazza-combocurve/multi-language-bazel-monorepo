import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';

import usePermissions, { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/usePermissions';
import { Selection } from '@/components/hooks/useSelection';
import { ButtonItem, MenuButton } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { useProject } from '@/projects/api';

import CreateWellsCollectionDialog from './CreateWellsCollectionDialog';
import { MassCreateWellsCollectionDialog } from './MassCreateWellsCollectionDialog';
import useAddWellsToWellsCollection from './useAddWellsToWellsCollection';
import useRemoveWellsCollection from './useRemoveWellsCollection';
import useRemoveWellsFromWellsCollections from './useRemoveWellsFromWellsCollections';
import styles from './wells-collections.module.scss';

export interface WellsCollectionsButtonProps {
	projectId?: Inpt.ObjectId<'project'>;
	idsSelection: Selection<string>;
	nodeIdsSelection: Selection<string>;
}

const WellsCollectionsButton = (props: WellsCollectionsButtonProps) => {
	const { isWellsCollectionsEnabled, isMassCreateWellCollectionsEnabled } = useLDFeatureFlags();

	const { projectId, idsSelection, nodeIdsSelection } = props;

	const { reload: reloadProject } = useProject(projectId);

	const {
		add: addWellsToWellsCollections,
		disabled: addWellsToWellsCollectionsDisabled,
		addWellToCollectionDialog,
	} = useAddWellsToWellsCollection(projectId, idsSelection, true);

	const {
		remove: removeWellsFromWellsCollections,
		removing: removingWellsFromWellsCollections,
		disabled: removeWellsFromWellsCollectionsDisabled,
	} = useRemoveWellsFromWellsCollections(projectId, nodeIdsSelection, true);

	const {
		remove: removeWellsCollection,
		removing: removingWellsCollection,
		disabled: removeWellsCollectionsDisabled,
		deleteDialog,
	} = useRemoveWellsCollection(projectId, nodeIdsSelection);

	const {
		canCreate: canCreateWellsCollections,
		canDelete: canDeleteWellsCollections,
		canUpdate: canUpdateWellsCollections,
	} = usePermissions(SUBJECTS.WellsCollections, projectId);

	const [createCollectionDialog, promptCreateCollectionDialog] = useDialog(CreateWellsCollectionDialog);
	const [massCreateCollectionDialog, promptMassCreateCollectionDialog] = useDialog(MassCreateWellsCollectionDialog);

	const onCreateCollection = async () => {
		const created = await promptCreateCollectionDialog({
			projectId,
		});

		if (created) {
			reloadProject();
		}
	};

	const onMassCreateCollection = async () => {
		const created = await promptMassCreateCollectionDialog({
			projectId,
		});

		if (created) {
			reloadProject();
		}
	};

	useLoadingBar(removingWellsFromWellsCollections || removingWellsCollection);

	if (!isWellsCollectionsEnabled) {
		return null;
	}

	return (
		<>
			{addWellToCollectionDialog}
			{createCollectionDialog}
			{deleteDialog}
			{massCreateCollectionDialog}
			<MenuButton className={styles['menu-button']} label='Collections' endIcon={faChevronDown} list>
				<ButtonItem
					onClick={onCreateCollection}
					label='Create Wells Collection'
					disabled={!canCreateWellsCollections && PERMISSIONS_TOOLTIP_MESSAGE}
				/>
				{isMassCreateWellCollectionsEnabled && (
					<ButtonItem
						label='Mass Create Wells Collection'
						disabled={!canCreateWellsCollections && PERMISSIONS_TOOLTIP_MESSAGE}
						onClick={onMassCreateCollection}
					/>
				)}
				<ButtonItem
					onClick={removeWellsCollection}
					label='Delete Wells Collection'
					disabled={
						removeWellsCollectionsDisabled || (!canDeleteWellsCollections && PERMISSIONS_TOOLTIP_MESSAGE)
					}
				/>
				<ButtonItem
					disabled={
						addWellsToWellsCollectionsDisabled ||
						(!canUpdateWellsCollections && PERMISSIONS_TOOLTIP_MESSAGE)
					}
					onClick={() => addWellsToWellsCollections()}
					label='Add Wells to Collection'
				/>
				<ButtonItem
					disabled={
						removeWellsFromWellsCollectionsDisabled ||
						(!canUpdateWellsCollections && PERMISSIONS_TOOLTIP_MESSAGE)
					}
					onClick={() => removeWellsFromWellsCollections()}
					label='Remove Wells From Collection'
				/>
			</MenuButton>
		</>
	);
};

export default WellsCollectionsButton;
