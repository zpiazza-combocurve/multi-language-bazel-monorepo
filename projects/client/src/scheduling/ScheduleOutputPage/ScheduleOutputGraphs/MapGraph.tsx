import { Expression } from 'mapbox-gl';
import { useCallback } from 'react';
import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import { Box, InfoIcon } from '@/components/v2';
import { colorsArray } from '@/helpers/zing';
import MapControl from '@/map/MapboxGL/MapControl';
import WellMap from '@/map/StaticWellMapWithSettings';
import { WELL_COLOR, WellLayersOptions } from '@/map/WellMap/WellsSource';
import { Item, Padding, Shape } from '@/type-curves/shared/WellLEgendControl';

import { WellsInProductionData, getWellsInProduction } from '../api';
import { StyledSlider } from './components/StyledSlider';
import { Resolution, useOutputGraph } from './hooks/useOutputGraph';
import { getDefaultColorIndex, getGraphMarks } from './shared';

type MapGraphProps = {
	scheduleId: Inpt.ObjectId;
	wellIds: Inpt.ObjectId[];
	resolution: Resolution;
};

type AllYears = {
	[key: string]: string[];
};

type MapLayer = {
	key: string;
	label: string;
	color: string;
	tooltip: string;
};

type WellByYear = {
	id: string;
	[key: string]: boolean | string;
	hidden: boolean;
};

const getAllYears = (wellsInProductionByPeriod: [string, string[]]): AllYears => {
	const allYears = {};
	wellsInProductionByPeriod.forEach(([period, wells]) => {
		const year = period.includes('-') ? period.split('-')[1] : period;
		if (!allYears[year]) {
			allYears[year] = [...wells];
		} else {
			allYears[year] = [...allYears[year], ...wells];
		}
	});
	return allYears;
};

const getMapLayers = (allYears: AllYears): MapLayer[] => {
	const nextColor = getDefaultColorIndex(colorsArray.length);
	return Object.keys(allYears).map((year) => ({
		key: year,
		label: year,
		color: colorsArray[nextColor()],
		tooltip: year,
	}));
};

const getWellColorExpression = (mapLayers: MapLayer[]): Expression => {
	const wellColorExpression: Expression = ['case'];

	mapLayers.forEach((layer) => {
		const expression = [['==', ['get', layer.key], true], layer.color];
		wellColorExpression.push(...expression);
	});

	wellColorExpression.push(WELL_COLOR);

	return wellColorExpression;
};

const getWellsByYear = (allYears: AllYears) => {
	const wells: WellByYear[] = [];
	Object.entries(allYears).forEach(([year, wellsByYear]) => {
		(wellsByYear as string[]).forEach((well) => {
			wells.push({ id: well, [year]: true, hidden: false });
		});
	});
	return wells;
};

export const MapGraph = ({ scheduleId, wellIds, resolution }: MapGraphProps) => {
	const { sliderRange, setSliderRange } = useOutputGraph();

	const handleChange = (_, newValue: number | number[]) => {
		setSliderRange(newValue as number[]);
	};

	const { data, isLoading } = useQuery(
		['wells-in-production', scheduleId, resolution],
		() =>
			(getWellsInProduction(scheduleId, wellIds, resolution) as Promise<WellsInProductionData>).then((data) => {
				setSliderRange([0, data.allPeriods.length - 1]);
				return data;
			}),
		{ enabled: !!wellIds.length }
	);

	const { wellsInProductionByPeriod, allPeriods } = data || {
		wellsInProductionByPeriod: [],
		allPeriods: [],
	};

	const filterByIndex = useCallback(
		(data) => data.filter((_, index) => !(sliderRange[0] > index || sliderRange[1] < index)),
		[sliderRange]
	);

	const filteredWellsInProductionByPeriod = filterByIndex(Object.entries(wellsInProductionByPeriod));

	const allYears = getAllYears(filteredWellsInProductionByPeriod);

	const mapLayers = getMapLayers(allYears);

	const wellColorExpression = getWellColorExpression(mapLayers);

	const sourceLayerOptions: Partial<WellLayersOptions> = {
		surfacePaint: { 'circle-color': wellColorExpression },
		horizontalPaint: { 'line-color': wellColorExpression },
	};

	const wellsByYear = getWellsByYear(allYears);

	return (
		<Placeholder loading={isLoading}>
			<Box height='100%'>
				<WellMap
					css={`
						height: calc(100% - 55px);
						padding: 1rem 0;
						.custom-draw-controls {
							display: none;
						}
					`}
					sourceLayerOptions={sourceLayerOptions}
					wells={wellsByYear}
					mapLayers={mapLayers}
				>
					<MapControl css='padding: 0.5rem' position='bottom-right'>
						{mapLayers.map(({ key, label, color, tooltip }) => (
							<Item key={key}>
								<InfoIcon tooltipTitle={tooltip} />
								<span>{label}</span>
								<Padding />
								<Shape color={color} borderColor={color} />
							</Item>
						))}
					</MapControl>
				</WellMap>

				<StyledSlider
					color='secondary'
					getAriaLabel={() => 'Years Range'}
					getAriaValueText={(value) => String(value)}
					value={sliderRange.length ? sliderRange : [0, allPeriods.length - 1]}
					onChange={handleChange}
					max={allPeriods.length - 1}
					marks={getGraphMarks(allPeriods, resolution)}
				/>
			</Box>
		</Placeholder>
	);
};
