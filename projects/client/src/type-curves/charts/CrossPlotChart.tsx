import { useTheme } from '@material-ui/core';
import { useEffect, useMemo } from 'react';

import Zingchart from '@/components/Zingchart';
import { useMergedState } from '@/components/hooks';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { getTcConvertFunc } from '@/forecasts/shared/getUnitTemplates';
import { labelWithUnit } from '@/helpers/text';
import { ColorBySeriesObject, ZingchartSerie, genScaleY } from '@/helpers/zing';
import { fields as defaultUnits } from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as headersUnits } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import {
	CHART_COLORS,
	TcZingChart,
	getChartHeaderInfo,
	tcTooltip,
	useTcChartMinMax,
} from '@/type-curves/charts/shared';
import { genTCScaleX } from '@/type-curves/shared/tcChartConfig';

import { PROXIMTY_EMPTY_OBJ } from '../TypeCurveView/TypeCurveWellTable';
import { getHeaderLabel } from '../shared/useHeaders';
import { useTypeCurveInfo } from '../shared/useTypeCurveInfo';
import { DATE_HEADERS, getHeaderValue, getInput } from './HeaderChart';
import { getDefaultCrossPlot } from './graphProperties';
import { SharedChartProps } from './types';

const getUnit = (header) => defaultUnits[header] ?? headersUnits[header];

export const useCrossPlotChartState = ({ phase }: { phase: Phase }) => {
	const [crossPlotState, setCrossPlotState] = useMergedState({
		crossplot: getDefaultCrossPlot(phase),
		displayUndefinedAsZero: false,
		showExcludedWells: false,
	});

	useEffect(() => {
		setCrossPlotState({ crossplot: getDefaultCrossPlot(phase) });
	}, [phase, setCrossPlotState]);

	return {
		crossPlotState,
		setCrossPlotState,
	};
};

export default function CrossPlotChart(
	props: SharedChartProps & {
		crossplot: { x: string; y: string };
		displayUndefinedAsZero: boolean;
		typeCurveId: string;
		showExcludedWells: boolean;
	}
) {
	const {
		chartBehaviors = {},
		chartSettings,
		colorBy,
		crossplot,
		curPhase,
		displayUndefinedAsZero,
		eurMap,
		excludedIds,
		headersMap,
		selection,
		setYAxisLabel,
		showExcludedWells,
		typeCurveId,
		wellIds,
	} = props;

	const {
		palette: { charts },
	} = useTheme();

	const { x: xHeader, y: yHeader } = crossplot;

	const { wellsInfoMap } = useTypeCurveInfo(typeCurveId, false, PROXIMTY_EMPTY_OBJ);

	const [cdata, plotsWellIds] = useMemo(() => {
		if (!wellsInfoMap) {
			return [[], []];
		}

		const convertX = getTcConvertFunc(xHeader);
		const convertY = getTcConvertFunc(yHeader);

		const series: ZingchartSerie[] = [];
		const retWellList: string[][] = [];

		if (!colorBy) {
			const values = wellIds
				.map((wellId) => [
					getHeaderValue({ wellId, header: xHeader, convert: convertX, headersMap, eurMap: wellsInfoMap }) ??
						(displayUndefinedAsZero ? 0 : null),
					getHeaderValue({ wellId, header: yHeader, convert: convertY, headersMap, eurMap: wellsInfoMap }) ??
						(displayUndefinedAsZero ? 0 : null),
				])
				.map(([x, y]) => (x === null || y === null ? [null, null] : [x, y]));
			series.push({
				id: 'wells',
				values,
				text: getHeaderLabel(yHeader),
				...getChartHeaderInfo(wellIds, headersMap),
			});
			retWellList.push(wellIds);
		} else {
			const groupedSeries: ColorBySeriesObject = {};
			wellIds.forEach((wellId) => {
				const colorByValue =
					getHeaderValue({ wellId, header: colorBy, convert: getInput, headersMap, eurMap }) ?? 'N/A';

				const xValue =
					getHeaderValue({ wellId, header: xHeader, convert: convertX, headersMap, eurMap }) ??
					(displayUndefinedAsZero ? 0 : null);
				const yValue =
					getHeaderValue({ wellId, header: yHeader, convert: convertY, headersMap, eurMap }) ??
					(displayUndefinedAsZero ? 0 : null);

				if (!groupedSeries[colorByValue]) {
					groupedSeries[colorByValue] = {
						text: colorByValue,
						values: [],
						wells: [],
						colorByValue,
					};
				}
				const coordinates = xValue === null || yValue === null ? [null, null] : [xValue, yValue];
				groupedSeries[colorByValue].values.push(coordinates);
				groupedSeries[colorByValue].wells.push(wellId);
			});

			Object.values(groupedSeries).forEach((thisSeries) => {
				const newObjectValues = {
					...getChartHeaderInfo(thisSeries.wells, headersMap),
				};
				Object.assign(thisSeries, newObjectValues);
				retWellList.push(thisSeries.wells);
				series.push(thisSeries);
			});
		}

		if (showExcludedWells) {
			const values = excludedIds
				.map((wellId) => [
					getHeaderValue({ wellId, header: xHeader, convert: convertX, headersMap, eurMap: wellsInfoMap }) ??
						(displayUndefinedAsZero ? 0 : null),
					getHeaderValue({ wellId, header: yHeader, convert: convertY, headersMap, eurMap: wellsInfoMap }) ??
						(displayUndefinedAsZero ? 0 : null),
				])
				.map(([x, y]) => (x === null || y === null ? [null, null] : [x, y]));

			series.push({
				id: 'excluded',
				values,
				text: 'Excluded',
				...getChartHeaderInfo(excludedIds, headersMap),
				marker: { backgroundColor: charts.excluded },
			});
			retWellList.push(excludedIds);
		}

		return [series, retWellList];
	}, [
		wellsInfoMap,
		xHeader,
		yHeader,
		colorBy,
		showExcludedWells,
		wellIds,
		headersMap,
		displayUndefinedAsZero,
		eurMap,
		excludedIds,
		charts.excluded,
	]);

	const { enableLegend, yMin: settingsYMin, yMax: settingsYMax, yLogScale, fontSizeScale } = chartSettings;

	const { yMin, yMax } = useTcChartMinMax({
		yMin: settingsYMin,
		yMax: settingsYMax,
	});

	useEffect(() => {
		setYAxisLabel(labelWithUnit(getHeaderLabel(yHeader), getUnit(yHeader)));
	}, [setYAxisLabel, yHeader]);

	return (
		<TcZingChart
			{...chartBehaviors}
			modules='selection-tool'
			selection={selection}
			selectionPlotId='wells'
			selectionPlotsNodesIds={plotsWellIds}
			data={{
				crosshairX: Zingchart.CROSSHAIR.SCALE,
				crosshairY: Zingchart.CROSSHAIR.SCALE,
				legend: { visible: enableLegend },
				scaleX: genTCScaleX({
					fontSizeScale,
					time: DATE_HEADERS.includes(xHeader),
					xLabel: labelWithUnit(getHeaderLabel(xHeader), getUnit(xHeader)),
				}),
				scaleY: genScaleY({ time: false, log: yLogScale, minValue: yMin, maxValue: yMax, fontSizeScale }),
				plot: {
					marker: { backgroundColor: CHART_COLORS[curPhase].crossplot },
					hoverMarker: { backgroundColor: charts.hovered, type: 'circle' },
					tooltip: tcTooltip(),
					selectedMarker: { backgroundColor: charts.selected },
				},
				tooltip: { visible: true },
				type: 'scatter',
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				selectType: 'multi-select',
				series: cdata,
			}}
			debounce={false}
			useColorBy={Boolean(colorBy)}
			colorBySeriesType='scatter'
		/>
	);
}
