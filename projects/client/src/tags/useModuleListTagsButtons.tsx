import { faTag } from '@fortawesome/pro-regular-svg-icons';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';

import { Button, Menu, MenuItem } from '@/components/v2';
import MassAddTagsButton, { useMassAddTags } from '@/tags/MassAddTagsButton';
import MassRemoveTagsButton, { useMassRemoveTags } from '@/tags/MassRemoveTagsButton';

export const ModuleListTagsMenu = ({ refresh, selection, feat }) => {
	const tagsProps = {
		refresh,
		feat,
		featIds: [...selection.selectedSet] as Inpt.ObjectId[],
	};
	const massAddTags = useMassAddTags(tagsProps);

	const massRemoveTags = useMassRemoveTags(tagsProps);

	return (
		<>
			<PopupState variant='popover' popupId='demo-popup-menu'>
				{(popupState) => {
					const menuOptions = bindMenu(popupState);
					const { anchorEl } = menuOptions;
					return (
						<>
							<Button
								disabled={!selection.selectedSet.size}
								startIcon={faTag}
								{...bindTrigger(popupState)}
							>
								Manage Tags
							</Button>
							<Menu
								style={{
									transform: `translateY(calc(${anchorEl?.clientHeight}px + 0.5rem))`,
								}}
								{...menuOptions}
							>
								<MenuItem
									{...massAddTags.buttonProps}
									tooltipTitle={undefined}
									onClick={() => {
										massAddTags.buttonProps.onClick();
										menuOptions.onClose();
									}}
								>
									Add Tags
								</MenuItem>
								<MenuItem
									{...massRemoveTags.buttonProps}
									tooltipTitle={undefined}
									onClick={() => {
										massRemoveTags.buttonProps.onClick();
										menuOptions.onClose();
									}}
								>
									Remove Tags
								</MenuItem>
							</Menu>
						</>
					);
				}}
			</PopupState>
			{massAddTags.assignTagsDialog}
			{massRemoveTags.assignTagsDialog}
		</>
	);
};

const useModuleListTagsButtons = (refresh, selection, feat: string) => {
	const addTagsButton = (
		<MassAddTagsButton refresh={refresh} feat={feat} featIds={[...selection.selectedSet] as Inpt.ObjectId[]} />
	);

	const removeTagsButton = (
		<MassRemoveTagsButton refresh={refresh} feat={feat} featIds={[...selection.selectedSet] as Inpt.ObjectId[]} />
	);

	return [addTagsButton, removeTagsButton];
};

export default useModuleListTagsButtons;
