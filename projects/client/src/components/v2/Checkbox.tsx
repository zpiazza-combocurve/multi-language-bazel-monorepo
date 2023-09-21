import { Checkbox } from '@material-ui/core';

import { withDisabledTooltip, withPointerEvents, withTooltip } from './helpers';

export default withDisabledTooltip(withTooltip(withPointerEvents(Checkbox)));
