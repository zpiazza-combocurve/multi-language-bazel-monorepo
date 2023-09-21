import { PaletteType } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

import { ReactComponent as CCLogoDark } from './CCLogo/cc-logo-dark.svg';
import { ReactComponent as CCLogoLight } from './CCLogo/cc-logo-light.svg';

// TODO: improve types for svg?
const themeTypeToLogo: { [k in PaletteType]: JSX.Element } = {
	dark: CCLogoDark?.render?.(),
	light: CCLogoLight?.render?.(),
};

export function CCLogo() {
	const theme = useTheme();
	const themeType = theme.palette.type;
	const logo = themeTypeToLogo[themeType];
	return logo ?? <div />;
}

export default CCLogo;
