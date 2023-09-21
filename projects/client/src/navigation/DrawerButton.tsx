import { faBars } from '@fortawesome/pro-regular-svg-icons';

import { IconButton, IconButtonProps } from '@/components/v2';
import { useSidebarVisibleStore } from '@/navigation/NavDrawer';

function DrawerButton(props: Omit<IconButtonProps, 'onClick'>) {
	const setVisible = useSidebarVisibleStore((state) => state.setNavVisible);

	const handleOpenDrawer = () => {
		setVisible(true);
	};

	return (
		<IconButton {...props} onClick={handleOpenDrawer}>
			{faBars}
		</IconButton>
	);
}

export default DrawerButton;
