import { generateAverageGrid, generateIDWGrid } from './heatmap';

onmessage = (e) => {
	const { gridType, pointFeatures, options } = e.data;
	const generateGridFn = gridType === 'idw' ? generateIDWGrid : generateAverageGrid;
	const res = generateGridFn(pointFeatures, options);
	postMessage(res);
};
