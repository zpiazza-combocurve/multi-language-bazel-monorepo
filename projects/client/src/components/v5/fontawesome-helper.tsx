import { forwardRef } from 'react';

import { addHOCName } from '../shared';
import FontAwesomeSvgIcon from './FontAwesomeSvgIcon';

export interface WithFontwawesomeProps {
	children: unknown;
}

/**
 * @example
 * 	import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
 * 	import MuiIconButton from '@mui/material/IconButton';
 * 	import { withFontawesome } from '@/components/v5/fontawesome-helper.tsx';
 *
 * 	const IconButton = withFontwawesome(MuiIconButton);
 *
 * 	<IconButton>{faQuestion}</IconButton>;
 */
export function withFontwawesome<P>(Component: React.ComponentType<P>) {
	function WithFontwawesomeComponent(props: P & WithFontwawesomeProps, ref: React.Ref<unknown>) {
		const { children, ...rest } = props;
		return (
			<Component ref={ref} {...(rest as P)}>
				<FontAwesomeSvgIcon>{children}</FontAwesomeSvgIcon>
			</Component>
		);
	}

	return addHOCName(forwardRef(WithFontwawesomeComponent), 'withFontwawesome', Component);
}
