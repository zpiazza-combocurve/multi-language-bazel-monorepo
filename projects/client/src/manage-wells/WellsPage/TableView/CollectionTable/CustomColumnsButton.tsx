import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useContext, useMemo } from 'react';

import usePermissions, { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/usePermissions';
import { ButtonItem, MenuButton } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useDialog } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { useDispatchCustomEvent } from '@/helpers/pub-sub';
import { WellsPageContext } from '@/manage-wells/WellsPage';

import CustomHeadersDialog from './CustomHeadersDialog';
import CustomStreamsDialog from './CustomStreamsDialog';
import { PROJECT_CUSTOM_HEADERS_UPDATED_EVENT_NAME } from './shared';

export interface CustomColumnsButtonProps {
	projectId: Inpt.ObjectId<'project'>;
}

const CustomColumnsButton = (props: CustomColumnsButtonProps) => {
	const { projectId } = props;

	const { isCustomStreamsEnabled, isWellsCollectionsEnabled } = useLDFeatureFlags();
	const { editingWells } = useContext(WellsPageContext);
	const { wellHeadersLabels, wellHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
		enableScopeHeader: true,
		enableWellsCollectionHeader: isWellsCollectionsEnabled,
	});

	const dispatch = useDispatchCustomEvent();

	const isWellHeader = useMemo(() => {
		const wellHeadersSet = new Set<string>(
			wellHeadersKeys.map((key) => wellHeadersLabels[key].toLowerCase().trim())
		);
		return (key) => wellHeadersSet.has(key.toLowerCase().trim());
	}, [wellHeadersLabels, wellHeadersKeys]);

	const [customColumnsDialog, showCustomHeadersDialog] = useDialog(CustomHeadersDialog, { isWellHeader });
	const [customStreamsDialog, showCustomStreamsDialog] = useDialog(CustomStreamsDialog, { projectId });

	const onManageProjectCustomHeaders = async () => {
		const result = await showCustomHeadersDialog();

		if (result != null) {
			dispatch(PROJECT_CUSTOM_HEADERS_UPDATED_EVENT_NAME, result.newHeaders);
		}
	};

	const onManageProjectCustomStreams = async () => {
		const result = await showCustomStreamsDialog();

		if (result != null) {
			// TODO: do smth later if needed
		}
	};

	const { canView: canViewProjectHeaders } = usePermissions(SUBJECTS.ProjectCustomHeaders, projectId);
	// TODO: change subject to ProjectCustomStreams when it will be added
	const { canView: canViewProjectCustomStreams } = usePermissions(SUBJECTS.ProjectCustomHeaders, projectId);

	return (
		<>
			{customColumnsDialog}
			{customStreamsDialog}
			<MenuButton css='text-transform: unset;' label='Custom Columns' endIcon={faChevronDown} list>
				<ButtonItem
					onClick={onManageProjectCustomHeaders}
					label='Project Custom Headers'
					disabled={
						(!canViewProjectHeaders && PERMISSIONS_TOOLTIP_MESSAGE) ||
						(editingWells && 'Cancel Edit Mode before managing table configuration')
					}
				/>
				{isCustomStreamsEnabled && (
					<ButtonItem
						label='Project Custom Streams'
						onClick={onManageProjectCustomStreams}
						disabled={!canViewProjectCustomStreams && PERMISSIONS_TOOLTIP_MESSAGE}
					/>
				)}
			</MenuButton>
		</>
	);
};

export default CustomColumnsButton;
