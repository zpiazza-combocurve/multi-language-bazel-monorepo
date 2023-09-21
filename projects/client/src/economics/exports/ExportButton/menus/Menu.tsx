import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';

import { Button, Menu as MUIMenu } from '@/components/v2';
import { FeatureIcons } from '@/helpers/features';

import { CustomMenuItem } from '../types';
import { MenuItem } from './MenuItem';

export function Menu({
	id,
	label,
	menuItems,
	disabled,
}: {
	id?: string;
	label;
	menuItems: CustomMenuItem[];
	disabled?;
}) {
	return (
		<PopupState variant='popover' disableAutoFocus>
			{(popupState) => (
				<>
					<Button
						{...bindTrigger(popupState)}
						startIcon={FeatureIcons.download}
						size='small'
						disabled={disabled}
						id={id}
					>
						{label}
					</Button>
					<MUIMenu
						css={`
							transform: translateY(2rem);
						`}
						{...bindMenu(popupState)}
						disableEnforceFocus
					>
						{menuItems.map((props) => (
							<MenuItem key={props.id} {...props} />
						))}
					</MUIMenu>
				</>
			)}
		</PopupState>
	);
}
