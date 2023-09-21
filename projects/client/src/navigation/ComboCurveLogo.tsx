import { useAlfa } from '@/helpers/alfa';
import { THEME } from '@/helpers/theme';

import { ReactComponent as DrawerLogoDark } from './logo-dark.svg';
import { ReactComponent as DrawerLogoLight } from './logo-light.svg';
import { ReactComponent as NavLogoDark } from './nav_logo_dark.svg';
import { ReactComponent as NavLogoLight } from './nav_logo_light.svg';

const VARIANTS = {
	navbar: {
		dark: <NavLogoDark />,
		light: <NavLogoLight />,
	},
	drawer: {
		dark: <DrawerLogoLight />,
		light: <DrawerLogoDark />,
	},
};

interface IComboCurveLogoProps {
	variant?: 'navbar' | 'drawer';
}

function ComboCurveLogo({ variant = 'drawer' }: IComboCurveLogoProps) {
	const { theme } = useAlfa(['theme']);
	return (
		<div
			css={`
				padding: ${variant === 'drawer' ? '1.5rem' : '0'};
			`}
		>
			<div
				css={`
					svg {
						width: 150px;
						height: ${variant === 'navbar' ? '48px' : 'auto'};
					}
				`}
			>
				{theme === THEME.DARK ? VARIANTS[variant].dark : VARIANTS[variant].light}
			</div>
		</div>
	);
}

export default ComboCurveLogo;
