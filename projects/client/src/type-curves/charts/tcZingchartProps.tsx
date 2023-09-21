import { cloneDeep, merge } from 'lodash';

import { useCallbackRef } from '@/components/hooks';
import { capitalize } from '@/helpers/text';
import { getColorObjectFromStringArray } from '@/helpers/utilities';
import { scatterSeriesConfig, zingchart } from '@/helpers/zing';

import { C4_DATA_SERIES_LABELS, FIT_OBJECT } from './graphProperties';
import { getTcDefaultGui } from './shared';

const WELL_DATA_LABELS = Object.values(C4_DATA_SERIES_LABELS);
const FIT_LABELS = Object.keys(FIT_OBJECT).map((pKey) => `${capitalize(pKey)} Fit`);
const NON_BG_LABELS = WELL_DATA_LABELS.concat(FIT_LABELS);

// single-well series refers to charts with different well series that belong to the same colorBy value; these require some  customizations
// scatter and distribution charts by nature can group wells using colorBy value, and only differ in styling
export type ColorBySeriesType = 'single-well' | 'scatter' | 'distribution';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const useZingchartColorBySeries = (enabled: boolean, seriesType: ColorBySeriesType, zcData: any) => {
	const { series: seriesArr } = zcData;

	const colorByValues: string[] = [...new Set(seriesArr.map(({ colorByValue }) => colorByValue))] as string[];
	const colors = getColorObjectFromStringArray(colorByValues);

	const usedColorByValues: string[] = [];
	zcData.series = !enabled
		? seriesArr
		: seriesArr.map((currSeries) => {
				const { colorByValue } = currSeries;

				if (!colorByValue) return currSeries;

				// we only need one legend item per color series
				if (!usedColorByValues.includes(colorByValue)) {
					currSeries.showInLegend = true;
					usedColorByValues.push(colorByValue);
				}
				currSeries.text = colorByValue;

				switch (seriesType) {
					case 'single-well': {
						return {
							...currSeries,
							lineColor: colors[colorByValue],
						};
					}
					case 'scatter': {
						return {
							...currSeries,
							...scatterSeriesConfig({ color: colors[colorByValue] }),
						};
					}
					case 'distribution': {
						return {
							...currSeries,
							...scatterSeriesConfig({ color: colors[colorByValue], size: 5 }),
						};
					}
					default: {
						return currSeries;
					}
				}
		  });

	return zcData;
};

const useZingchartEvents = (series, seriesType, { useColorBy, useExcludedWells }) => {
	// in single-well series, we want the ability to toggle different (background) series using one legend item
	const legendItemClick = useCallbackRef((p) => {
		if (NON_BG_LABELS.includes(p.plottext)) return;
		const indeces = series
			.map(({ id, text }, index) => (text === p.plottext && id !== p.plotid ? index : null))
			.filter((val) => Boolean(val));

		zingchart.plugins.fastline.togglePlot({
			id: p.id,
			plotindex: indeces,
		});
	});

	const enabled = seriesType === 'single-well' && (useColorBy || useExcludedWells);
	const events = enabled
		? {
				legend_item_click: legendItemClick,
				legend_marker_click: legendItemClick,
		  }
		: {};
	return events;
};

const useTypeCurveZingchartProps = (
	zcData,
	{ disableXLSX, disablePDF, useColorBy, colorBySeriesType, useExcludedWells }
) => {
	const _data = cloneDeep(zcData);
	const customData = merge(_data, getTcDefaultGui({ disableXLSX, disablePDF }));

	const data = useZingchartColorBySeries(useColorBy, colorBySeriesType, customData);
	const events = useZingchartEvents(customData.series, colorBySeriesType, { useColorBy, useExcludedWells });

	return { data, events };
};

export { useTypeCurveZingchartProps };
