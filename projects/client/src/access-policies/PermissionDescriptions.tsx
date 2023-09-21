/* eslint react/jsx-key: warn */
import { PERMISSION_DESCRIPTIONS } from '@/inpt-shared/access-policies/shared';

const NO_PERMISSIONS_DESCRIPTION = 'No permissions';

export const PermissionDescriptions = ({ permissions }) => {
	return (
		<ul>
			{permissions.length === 0 ? (
				<li>{NO_PERMISSIONS_DESCRIPTION}</li>
			) : (
				permissions
					.map((permission) => PERMISSION_DESCRIPTIONS[permission])
					.filter(Boolean)
					// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
					.map((description) => <li>{description}</li>)
			)}
		</ul>
	);
};
