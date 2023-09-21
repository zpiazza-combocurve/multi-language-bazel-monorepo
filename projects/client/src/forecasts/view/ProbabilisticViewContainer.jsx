import { useState } from 'react';

import DeterministicView from '@/forecasts/deterministic/View';
import ProbabilisticView from '@/forecasts/view/View';

const ProbabilisticViewContainer = (props) => {
	const [isComparisonActive, setIsComparisonActive] = useState(false);

	return isComparisonActive ? (
		<DeterministicView isProbabilistic setIsComparisonActive={setIsComparisonActive} {...props} />
	) : (
		<ProbabilisticView setIsComparisonActive={setIsComparisonActive} {...props} />
	);
};

export default ProbabilisticViewContainer;
