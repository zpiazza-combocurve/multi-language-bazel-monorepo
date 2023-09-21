import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useContext } from 'react';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { Selection } from '@/components/hooks/useSelection';
import { MenuButton } from '@/components/v2';
import { genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import ChangeIdentifiersMenu, {
	useChangeIdentifiersMenuCallbacks,
} from '@/manage-wells/WellsPage/well-identifiers/ChangeIdentifiersMenu';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';

import ConfirmDeleteWellsDialog from './ManageWells/ConfirmDeleteWellsDialog';

const DELETE_WELLS_LIMIT = 10_000;
const DELETE_WELLS_LIMIT_REACHED = `Can only delete up to ${DELETE_WELLS_LIMIT} wells. Filter down the wells further.`;

function isDeleteWellsLimitReached(selectedWells: number, totalWells: number) {
	return selectedWells > 0 ? selectedWells > DELETE_WELLS_LIMIT : !!totalWells && totalWells > DELETE_WELLS_LIMIT;
}

function Operations({ selection }: { selection: Selection<string> }) {
	const { operationInProgress, collisionsDialog } = useChangeIdentifiersMenuCallbacks();

	return (
		<>
			{collisionsDialog}
			<MenuButton
				css='text-transform: unset;'
				label='Operations'
				endIcon={faChevronDown}
				list
				disabled={!selection.selectedSet.size}
			>
				{/* TODO: Ideally WellsPageContext should use ObjectId instead of string, which is why this cast is needed */}
				<ChangeIdentifiersMenu
					operationInProgress={operationInProgress}
					selection={selection as unknown as Selection<Inpt.ObjectId>}
					dataSource
					chosenId
				/>
			</MenuButton>
		</>
	);
}

export function ManageWells() {
	const ability = useContext(AbilityContext);
	const [confirmDeleteWellsDialog, confirmDeleteWells] = useDialog(ConfirmDeleteWellsDialog);

	const deleteWells = async (wellIds: string[]) => {
		try {
			await postApi(`/well/deleteWells`, { wellIds });
		} catch (error) {
			genericErrorAlert(error, `Failed to delete ${pluralize(wellIds.length, 'well', 'wells')}`);
		}
	};

	const handleRemove = async (selectedWells: string[], getWellIds: () => Promise<string[]>, totalWells: number) => {
		if (isDeleteWellsLimitReached(selectedWells.length, totalWells)) {
			warningAlert(DELETE_WELLS_LIMIT_REACHED);
			return;
		}

		try {
			const wellIds = selectedWells.length > 0 ? selectedWells : await getWellIds();
			const confirm = await confirmDeleteWells({ wellIds });

			if (confirm) {
				deleteWells(wellIds);
			}
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const canDeleteCompanyWells = ability.can(ACTIONS.Delete, SUBJECTS.CompanyWells);
	const canCreateCompanyWells = ability.can(ACTIONS.Create, SUBJECTS.CompanyWells);

	return (
		<>
			{confirmDeleteWellsDialog}
			<WellsPageWithSingleWellViewDialog
				companyOnly
				padded
				createWellsProps={{
					disabled: !canCreateCompanyWells && PERMISSIONS_TOOLTIP_MESSAGE,
					restButtonProps: { tooltipTitle: 'Create new wells' },
				}}
				removeWellsProps={{
					onRemove: handleRemove,
					disabled: (selectedWells, totalWells) => {
						return (
							(!canDeleteCompanyWells && PERMISSIONS_TOOLTIP_MESSAGE) ||
							(isDeleteWellsLimitReached(selectedWells.length, totalWells) && DELETE_WELLS_LIMIT_REACHED)
						);
					},
					getTooltipTitle: () => `Delete up to ${DELETE_WELLS_LIMIT} wells`,
				}}
				operations={Operations}
			/>
		</>
	);
}
