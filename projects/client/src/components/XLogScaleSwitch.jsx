import { useCallback } from 'react';

import { SwitchItem } from '@/components/v2';
import { warningAlert } from '@/helpers/alerts';

export const XLogScaleSwitch = (props) => {
	const { disableWarning, label = 'X-Axis Log Scale', onChange, xAxis, ...rest } = props;

	const applyChange = useCallback(
		(checked) => {
			// display warning if the xAxis is time
			if (xAxis === 'time' && !disableWarning) {
				// HACK: doubled the time to make the message appear longer. it seems that maybe the chart rendering is cutting into the visual of the warning
				warningAlert('X-Axis is set to time, changing the x-axis scale will have no effect', 4000);
			}

			onChange(checked);
		},
		[disableWarning, onChange, xAxis]
	);

	return <SwitchItem label={label} onChange={applyChange} {...rest} />;
};
