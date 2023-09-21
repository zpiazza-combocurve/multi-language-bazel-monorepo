import pointsWithinPolygon from '@turf/points-within-polygon';
import { FeatureCollection, Point } from 'geojson';
import { useContext, useEffect, useMemo, useState } from 'react';

import { failureAlert } from '@/helpers/alerts';
import { getPercentileSteps, getSteps } from '@/helpers/map/heatmap';
import HeatmapWorker from '@/helpers/map/heatmap.worker?worker';
import { hasProperty, isSingleWell, toPointFeature } from '@/helpers/map/helpers';
import { postApi } from '@/helpers/routing';
import { workerToPromise } from '@/helpers/webWorker';
import { MapboxGLContext } from '@/map/MapboxGL/context';
import { useCurrentProject } from '@/projects/api';

import { notNull } from '../../../../../internal-api/src/shared/helpers/types';
import { WellGeoJson } from '../WellsSource';
import HeatmapLegend from './HeatmapLegend';
import HeatmapMenuControl from './HeatmapMenu';
import HeatmapSource from './HeatmapSource';
import { HEATMAP_COLOR_PALETTE, HEATMAP_MIN_WELLS, HeatmapError, HeatmapOptions } from './shared';

interface HeatmapProps {
	wells: WellGeoJson[];
	onHeatmapDataChange;
}

interface HeatmapData {
	heatmapData: FeatureCollection;
	steps: Array<{ value: number; label: string }>;
	options: HeatmapOptions;
}

function getWellsWithinBounds<TProperties>(
	wells: FeatureCollection<Point, TProperties>,
	bounds: number[][] | undefined
) {
	if (!bounds) {
		return wells;
	}

	const [[west, south], [east, north]] = bounds;
	const boundsPolygon = {
		type: 'Feature' as const,
		properties: {},
		geometry: {
			type: 'Polygon' as const,
			coordinates: [
				[
					[west, south],
					[east, south],
					[east, north],
					[west, north],
					[west, south],
				],
			],
		},
	};

	return pointsWithinPolygon(wells, boundsPolygon);
}

const calculateHeatmap = async (
	wells: WellGeoJson[],
	bounds: number[][] | undefined,
	{ header, gridType, gridCellSize, colorScale }: HeatmapOptions
) => {
	if (!wells.every(isSingleWell)) {
		throw new HeatmapError('Please zoom in to see wells. Heatmap does not work at well cluster mode');
	}

	const wellPoints = {
		type: 'FeatureCollection' as const,
		features: wells.map(toPointFeature),
	};

	const visibleWells = getWellsWithinBounds(wellPoints, bounds);

	const pointFeatures = {
		type: 'FeatureCollection',
		features: visibleWells.features.filter((f) => hasProperty(f, header)).map(toPointFeature),
	};

	if (pointFeatures.features.length < HEATMAP_MIN_WELLS) {
		throw new HeatmapError(
			`Not enough wells on map with a value for the selected header. At least ${HEATMAP_MIN_WELLS} required for heatmap.`
		);
	}

	const generateHeatmapAsync = workerToPromise<FeatureCollection>(new HeatmapWorker());
	const heatmapData = await generateHeatmapAsync({
		gridType,
		pointFeatures,
		options: {
			property: header,
			cellSize: gridCellSize,
		},
	});

	const getStepsFn = colorScale === 'percentile' ? getPercentileSteps : getSteps;
	const steps = getStepsFn(pointFeatures, HEATMAP_COLOR_PALETTE.length, { property: header });

	return { heatmapData, steps };
};

function Heatmap({ wells, onHeatmapDataChange }: HeatmapProps) {
	const { project } = useCurrentProject();

	const { map } = useContext(MapboxGLContext);

	const [isGenerating, setIsGenerating] = useState(false);
	const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

	const generateHeatmap = async (options: HeatmapOptions) => {
		const { header } = options;

		setIsGenerating(true);

		try {
			const inputData = wells.some((w) => header in w.properties)
				? wells
				: await postApi<Array<WellGeoJson | null>>('/map/wells', {
						wellIds: wells.map((w) => w.properties.wellId).filter(notNull),
						headers: [header],
						project: project?._id,
				  });
			const inputDataWells = inputData.filter(notNull);

			const outputData = await calculateHeatmap(inputDataWells, map?.getBounds().toArray(), options);

			setHeatmapData({ ...outputData, options });
		} catch (e) {
			if (e instanceof HeatmapError) {
				failureAlert(e.message);
			} else {
				failureAlert('An error occurred while generating the heatmap');
			}
		} finally {
			setIsGenerating(false);
		}
	};

	const legend = useMemo(
		() =>
			heatmapData?.steps.reduce<Record<string, string>>(
				(prev, { label }, i) => ({ ...prev, [HEATMAP_COLOR_PALETTE[i]]: label }),
				{}
			) ?? {},
		[heatmapData]
	);

	useEffect(() => {
		onHeatmapDataChange({ ...heatmapData, legend });
	}, [onHeatmapDataChange, heatmapData, legend]);

	return (
		<>
			<HeatmapMenuControl
				disabled={isGenerating}
				clearable={!!heatmapData}
				onGenerate={generateHeatmap}
				onClear={() => setHeatmapData(null)}
			/>
			{heatmapData && (
				<>
					<HeatmapLegend options={heatmapData.options} legend={legend} />
					<HeatmapSource
						header={heatmapData.options.header}
						heatmapData={heatmapData.heatmapData}
						steps={heatmapData.steps}
					/>
				</>
			)}
		</>
	);
}

export default Heatmap;
