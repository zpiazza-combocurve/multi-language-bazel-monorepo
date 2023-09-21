import { useMemo } from 'react';

import { getAxisBoundary, getProdXAxisRanges } from '@/forecasts/charts/components/helpers';

// separated this out for future compatibility with older charts
const useDeterministicChartMinMax = (props) => {
	const { dataTable, chartSettings, seriesItems, xAxisUsingNumericUnits } = props;

	const [xMinOut, xMaxOut, yMinOut, yMaxOut] = useMemo(() => {
		const {
			cumMax: settingsCumMax,
			cumMin: settingsCumMin,
			xAxis,
			xLogScale,
			yearsBefore,
			yearsPast,
			yMax: settingsYMax,
			yMin: settingsYMin,
		} = chartSettings;

		let xMin;
		let xMax;
		let yMin;
		let yMax;
		if (seriesItems?.length) {
			const prodXAxisRanges = getProdXAxisRanges(dataTable, seriesItems);

			if (prodXAxisRanges?.length) {
				// get x-boundaries
				const maxProdTime = Math.max(...prodXAxisRanges);
				xMin = getAxisBoundary({
					axis: 'x',
					boundary: 'min',
					axisProps: {
						maxProdTime,
						xType: xAxis,
						yearsBefore,
						value: xAxisUsingNumericUnits ? settingsCumMin : null,
					},
				});

				// HACK: either contact zing to fix 0 values when scale is 'log' or adjust options to enforce non-zero values for log axes
				if (xLogScale && xMin === 0) {
					xMin = 0.1;
				}

				xMax = getAxisBoundary({
					axis: 'x',
					boundary: 'max',
					axisProps: {
						maxProdTime,
						xType: xAxis,
						yearsPast,
						value: xAxisUsingNumericUnits ? settingsCumMax : null,
					},
				});
			}

			yMax = getAxisBoundary({
				axis: 'y',
				boundary: 'max',
				axisProps: {
					value: settingsYMax,
				},
			});

			yMin = getAxisBoundary({
				axis: 'y',
				boundary: 'min',
				axisProps: { value: settingsYMin },
			});
		}

		// check to see if the min is larger than the max
		xMax = !Number.isFinite(xMin) || xMax > xMin ? xMax : undefined;
		yMax = !Number.isFinite(yMin) || yMax > yMin ? yMax : undefined;

		return [xMin, xMax, yMin, yMax];
	}, [chartSettings, dataTable, seriesItems, xAxisUsingNumericUnits]);

	return Object.assign([xMinOut, xMaxOut, yMinOut, yMaxOut], {
		xMin: xMinOut,
		xMax: xMaxOut,
		yMin: yMinOut,
		yMax: yMaxOut,
	});
};

export default useDeterministicChartMinMax;
