import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MUIcon, { IconProps } from '@material-ui/core/Icon';
import { forwardRef } from 'react';

import { withCustomColors, withTooltip } from './helpers';

/**
 * Icon wrapper to support fontawesome
 *
 * @note `children` will be treated as a fontawesome icon
 */
function Icon({ children, ...props }: IconProps, ref) {
	return (
		<MUIcon
			ref={ref}
			{...props}
			css={`
				min-width: 1rem;
				width: initial;
				display: flex; // HACK
				align-items: center;
				justify-content: center;
			`}
		>
			<FontAwesomeIcon
				css={`
					font-size: calc(1em - 4px);
					${props.color ? `color: ${props.color}` : ''};
				`}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				icon={children as any}
			/>
		</MUIcon>
	);
}

export default withCustomColors(withTooltip(forwardRef(Icon)));
