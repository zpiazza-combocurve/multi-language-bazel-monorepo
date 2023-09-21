import MuiIconButton from '@mui/material/IconButton';

import { withBadge } from './badge-helper';
import { withFontwawesome } from './fontawesome-helper';
import { withTooltip } from './tooltip-helper';

/**
 * Similar to components/v2/IconButton but for mui@v5. Features:
 *
 * - Fontawesome support
 * - Integrated tooltips
 * - Integrated badge
 *
 * @example
 * 	import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
 * 	import IconButton from '@components/v5/IconButton';
 *
 * 	<IconButton
 * 		tooltipTitle='Help'
 * 		badgeProps={{
 * 			badgeContent: 1,
 * 		}}
 * 	>
 * 		{faQuestion}
 * 	</IconButton>;
 *
 * @see https://mui.com/material-ui/react-button/#icon-button
 */
export default withBadge(withTooltip(withFontwawesome(MuiIconButton)));
