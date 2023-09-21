import { useMemo } from 'react';

import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { useDebouncedValue } from '@/helpers/debounce';

interface SeriesItem {
	collection: string;
	x: string;
	y: string;
}

export default (props) => {
	const { daily, monthly, forecast, xAxis, chartSettings, debounceTime = 1000, shouldDebounce = true } = props;
	const seriesItems = useMemo(() => {
		const output: SeriesItem[] = Object.entries({ forecast, monthly, daily })
			.map(([collection, yy]) => [...yy].map((y) => ({ collection, x: xAxis, y })))
			.flat();

		// Special case for `mbt` and `mbt_filtered` axis types.
		if (!['mbt', 'mbt_filtered'].includes(xAxis)) {
			return output;
		}
		const outputMBT: SeriesItem[] = output
			// MBT (maybe filtered) must be accompanied by `relativeTime`.
			.map(({ collection, y }) => [
				{ collection, x: xAxis === 'mbt' ? `mbt_${y}` : `mbt_${y}_filtered`, y },
				{ collection, x: 'relativeTime', y },
			])
			.flat()
			// Only valid phases are allowed for mbt axis type, however any
			// stream can use relative time :)
			.filter(({ y, x }) => x === 'relativeTime' || VALID_PHASES.includes(y as Phase));
		return outputMBT;
	}, [xAxis, daily, monthly, forecast]);

	const results = useMemo(() => ({ seriesItems, chartSettings }), [seriesItems, chartSettings]);

	// Hook should not normally be placed within a conditional but this is necessary to prevent constant rerenders on
	// on the graphs that would cause weird legend interaction. MAKE SURE NOT TO HAVE SHOULDDEBOUNCE VALUE CHANGE AFTER
	// USING HOOK.
	if (shouldDebounce) {
		return useDebouncedValue(results, debounceTime);
	}

	return results;
};
