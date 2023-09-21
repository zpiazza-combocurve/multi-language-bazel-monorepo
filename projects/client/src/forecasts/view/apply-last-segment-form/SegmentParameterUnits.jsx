import { useMemo } from 'react';
import styled from 'styled-components';

import { fields as segmentParameters } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

const NumberFieldUnits = styled.span`
	color: gray;
	font-size: 0.75rem;
	margin-left: 0.25rem;
`;

const SegmentParameterUnits = (props) => {
	const { param, phase, units, useHeaderUnits } = props;

	const loaded = !!segmentParameters;

	const displayUnits = useMemo(() => {
		if (!loaded) {
			return null;
		}

		if (useHeaderUnits) {
			return segmentParameters?.[param]?.units?.[phase];
		}
		return units[phase];
	}, [loaded, param, phase, units, useHeaderUnits]);

	return loaded && displayUnits && <NumberFieldUnits>{displayUnits}</NumberFieldUnits>;
};

export default SegmentParameterUnits;
