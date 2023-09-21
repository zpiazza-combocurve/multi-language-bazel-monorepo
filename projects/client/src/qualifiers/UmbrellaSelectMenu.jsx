/** @deprecated Use QualifierSelectMenu instead */
import { faCheck, faUmbrella } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MenuButton } from 'react-md';

import { useDialog } from '@/helpers/dialog';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';

import QualifierSaveDialog from './QualifierSaveDialog';
import { generateDefaultName } from './helpers';

export default function UmbrellaSelectMenu({
	column,
	containerClassName,
	onCreate,
	onSelect,
	selectedId,
	umbrellas = [],
	canUpdate = true,
	disableDefaultUmbrella = false,
}) {
	const [createDialog, showCreateDialog] = useDialog(QualifierSaveDialog);

	const handleCreateQualifier = async () => {
		const name = await showCreateDialog({ initialName: generateDefaultName(column, umbrellas), umbrellas });
		if (name) {
			onCreate({ name, column });
		}
	};
	const selected = selectedId ? umbrellas.find(({ _id }) => _id === selectedId) : null;

	return (
		<div className={containerClassName}>
			<MenuButton
				id='default-model-btn'
				listId='theme-pop-up-menu-list'
				position={MenuButton.Positions.BELOW}
				className='unset-text-transform well-table-btn header-secondary-menu-btn header-column-btn umbrella-btn'
				menuItems={[
					{
						primaryText: 'New Qualifier...',
						onClick: handleCreateQualifier,
						disabled: !canUpdate && PERMISSIONS_TOOLTIP_MESSAGE,
					},

					...(umbrellas.length > 0 ? [{ divider: true }] : []),

					!disableDefaultUmbrella && {
						onClick: () => onSelect(null, column),
						primaryText: 'Default',
						disabled: !canUpdate && PERMISSIONS_TOOLTIP_MESSAGE,
						rightIcon:
							selected === null ? (
								<FontAwesomeIcon className='list-left-icon themeMe' icon={faCheck} />
							) : null,
					},

					...umbrellas.map(({ _id, name }) => ({
						onClick: () => onSelect(_id),
						primaryText: name,
						disabled: !canUpdate && PERMISSIONS_TOOLTIP_MESSAGE,
						rightIcon:
							selectedId === _id ? (
								<FontAwesomeIcon className='list-left-icon themeMe' icon={faCheck} />
							) : null,
					})),
				].filter(Boolean)}
				flat
			>
				<span>{selected ? selected.name : 'Default'}</span>
				<FontAwesomeIcon className='right-btn-icon' icon={faUmbrella} />
			</MenuButton>
			{createDialog}
		</div>
	);
}
