import styled from 'styled-components';

import { theme } from '@/helpers/styled';

const ColorMapping = {
	primary: 'primaryColor',
	secondary: 'secondaryColor',
	warning: 'warningColor',
	warningAlt: 'warningAlternativeColor',
} satisfies Record<string, keyof typeof theme>;

type Color = keyof typeof ColorMapping;

function themeColor({
	type = undefined,
	primary = false,
	secondary = false,
	warning = false,
	warningAlt = false,
}: { type?: Color } & { [K in Color]?: boolean }) {
	if (primary) {
		type = 'primary';
	}
	if (secondary) {
		type = 'secondary';
	}
	if (warning) {
		type = 'warning';
	}
	if (warningAlt) {
		type = 'warningAlt';
	}
	/* eslint-enable no-param-reassign */
	if (type === undefined) {
		return theme.textColor;
	}
	return theme[ColorMapping[type]] ?? theme.textColor;
}

const spacing = '1rem';

/** @deprecated Use material-ui [Typography](https://material-ui.com/system/typography/) instead */
export const ColoredText = styled.span`
	color: ${themeColor};
`;

/**
 * @deprecated Use material-ui [Typography](https://material-ui.com/system/typography/) instead
 * @type {any}
 */
export const Text = styled(ColoredText)`
	margin-left: ${spacing};
	margin-right: ${spacing};
`;
