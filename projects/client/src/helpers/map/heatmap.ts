import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanIntersects from '@turf/boolean-intersects';
import buffer from '@turf/buffer';
import convex from '@turf/convex';
import { Units, point } from '@turf/helpers';
import interpolate from '@turf/interpolate';
import squareGrid from '@turf/square-grid';

import { numberDisplay, percentileDisplay } from '../text';

const CONCAVE_HULL_CONCAVITY = 4; // value determined empirically from what "looks good" on the map

const bufferedBbox = (boundingBox, bufferDistance, units) =>
	// TODO it was previusly `step` instead of `steps`, check which one it is
	bbox(buffer(bboxPolygon(boundingBox), bufferDistance, { units, steps: 1 }));

const gridTag = (pointFeatures, grid) => {
	const first = grid.features[0];
	const last = grid.features[grid.features.length - 1];

	const [xMin, yMin] = bbox(first);
	const [, , xMax, yMax] = bbox(last);
	const width = xMax - xMin;
	const height = yMax - yMin;

	const rows = grid.features.findIndex((f) => bbox(f)[0] !== xMin);
	const columns = grid.features.length / rows;

	return {
		...pointFeatures,
		features: pointFeatures.features.map((p) => {
			const [x, y] = p.geometry.coordinates;
			const r = Math.floor(((y - yMin) * rows) / height);
			const c = Math.floor(((x - xMin) * columns) / width);
			const gridIndex = c * rows + r;
			return { ...p, properties: { ...p.properties, gridPos: gridIndex } };
		}),
	};
};

const toPoints = (featureCollection) => {
	return {
		...featureCollection,
		features: featureCollection.features.map((f) => {
			const [xMin, yMin, xMax, yMax] = bbox(f);
			return point([(xMax + xMin) / 2, (yMax + yMin) / 2], f.properties);
		}),
	};
};

export const generateAverageGrid = (pointFeatures, { cellSize, gridWidth = 100, property = 'z' }) => {
	const [xMin, yMin, xMax, yMax] = bbox(pointFeatures);

	let actualCellSize = cellSize;
	let cellSizeUnits: Units = 'miles';
	if (!actualCellSize) {
		actualCellSize = (xMax - xMin) / gridWidth;
		cellSizeUnits = 'degrees';
	}

	const bboxWithBuffer = bufferedBbox([xMin, yMin, xMax, yMax], actualCellSize, cellSizeUnits);

	const grid = squareGrid<{ sum: number; count: number }>(bboxWithBuffer, actualCellSize, { units: cellSizeUnits });

	const taggedPoints = gridTag(pointFeatures, grid);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	(taggedPoints.features as any[]).forEach(({ properties: { gridPos, [property]: value } }) => {
		if (gridPos === null || gridPos === undefined || gridPos < 0 || gridPos >= grid.features.length) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const gridSquareProps = grid.features[gridPos].properties!; // TODO assert this
		gridSquareProps.sum = (gridSquareProps.sum || 0) + value;
		gridSquareProps.count = (gridSquareProps.count || 0) + 1;
	});

	grid.features.forEach(({ properties }) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const { sum, count } = properties as any;
		properties[property] = count ? sum / count : null;
	});

	return { ...grid, features: grid.features.filter(({ properties }) => properties[property] !== null) };
};

export const generateIDWGrid = (pointFeatures, { cellSize, gridWidth = 100, property = 'z', extrapolate = false }) => {
	let actualCellSize = cellSize;
	let cellSizeUnits: Units = 'miles';
	if (!actualCellSize) {
		const [xMin, , xMax] = bbox(pointFeatures);
		actualCellSize = (xMax - xMin) / gridWidth;
		cellSizeUnits = 'degrees';
	}

	const averageGrid = generateAverageGrid(pointFeatures, { cellSize: actualCellSize, property });
	const pointsAverageGrid = toPoints(averageGrid);

	const grid = interpolate(pointsAverageGrid, actualCellSize, {
		property,
		gridType: 'square',
		units: cellSizeUnits,
		weight: 16,
	});

	if (extrapolate) {
		return grid;
	}

	const concaveHull = convex(pointsAverageGrid, { concavity: CONCAVE_HULL_CONCAVITY });

	return {
		...grid,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		features: grid.features.filter((f) => booleanIntersects(f, concaveHull!)), // TODO assert this
	};
};

export const getSteps = (pointFeatures, amount, { property = 'z' }) => {
	if (!pointFeatures?.features?.length) {
		return [];
	}

	const [zMin, zMax] = pointFeatures.features.reduce(
		([min, max], { properties }) => [
			Math.min(properties?.[property] ?? Infinity, min),
			Math.max(properties?.[property] ?? -Infinity, max),
		],
		[Infinity, -Infinity]
	);
	return [...new Array(amount).keys()]
		.map((i) => zMin + (i * (zMax - zMin)) / (amount - 1))
		.map((value) => ({ value, label: numberDisplay(value, 0) }));
};

export const getPercentileSteps = (pointFeatures, amount, { property = 'z', highlightOutliers = true }) => {
	if (!pointFeatures?.features?.length) {
		return [];
	}

	const values = pointFeatures.features.map((f) => f?.properties?.[property]).filter((v) => v || v === 0);

	const actualAmount = Math.min(values.length, amount);
	const actualHighlightOutliers = highlightOutliers && amount >= 4;

	const evenAmount = actualHighlightOutliers ? actualAmount - 2 : actualAmount;

	values.sort((a, b) => a - b);

	const pArray = [...new Array(evenAmount).keys()].map((i) => i / (evenAmount - 1));
	const finalPArray = actualHighlightOutliers
		? [pArray[0], 0.02, ...pArray.slice(1, -1), 0.98, pArray[pArray.length - 1]]
		: pArray;

	return finalPArray
		.map((p) => ({ v: values[Math.floor(p * (values.length - 1))], p }))
		.map(({ v, p }) => ({ value: v, label: percentileDisplay(p, numberDisplay(v, 0)) }));
};
