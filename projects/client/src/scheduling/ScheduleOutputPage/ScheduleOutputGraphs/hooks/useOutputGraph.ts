import { useState } from 'react';

export type Resolution = 'month' | 'year' | 'quarter';

export const useOutputGraph = () => {
	const [resolution, setResolution] = useState<Resolution>('month');
	const [chartType, setChartType] = useState('bar');
	const [sliderRange, setSliderRange] = useState<number[]>([]);

	return {
		resolution,
		setResolution,
		chartType,
		setChartType,
		sliderRange,
		setSliderRange,
	};
};
