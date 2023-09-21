import { useCallback } from 'react';

import { SwitchField } from '@/components/v2';
import { capitalize } from '@/helpers/text';

const ResolutionToggle = ({ resolution, setResolution }) => {
	const toggleResolution = useCallback(
		(ev) => setResolution(ev.target.checked ? 'monthly' : 'daily'),
		[setResolution]
	);

	const isMonthly = resolution === 'monthly';
	return (
		<SwitchField
			css={`
				justify-content: space-between;
			`}
			checked={isMonthly}
			color='secondary'
			label={`Toggle Resolution (${capitalize(resolution)})`}
			labelPlacement='start'
			onChange={toggleResolution}
		/>
	);
};

export default ResolutionToggle;
