import styled from 'styled-components';

import { theme } from '@/helpers/styled';

export type GridType = 'idw' | 'average';
export type ColorScale = 'value' | 'percentile';

export interface HeatmapOptions {
	header: string;
	gridType: GridType;
	gridCellSize: number;
	colorScale: ColorScale;
}

const MIN_CELL_SIZE = 0.2; // miles
const MIN_RECOMMENDED_CELL_SIZE = 1; // mile
const MAX_CELL_SIZE = 500; // miles

export const HEATMAP_MIN_WELLS = 4;

export const HEATMAP_COLOR_PALETTE = [
	'#5e4fa2',
	'#486CB0',
	'#66c2a5',
	'#e6f598',
	'#fee08b',
	'#f46d43',
	'#ba2049',
	'#9e0142',
];

export const DEFAULT_HEATMAP_OPTIONS: HeatmapOptions = {
	header: 'true_vertical_depth',
	gridType: 'average',
	gridCellSize: 2,
	colorScale: 'percentile',
};

const Warning = styled.span`
	color: ${theme.warningAlternativeColor};
`;

export const validateHeader = (header, numericHeaders) =>
	numericHeaders.includes(header) ? [true, null] : [false, 'Must be a numeric well header.'];

export const validateGridCellSize = (gridCellSize) => {
	const parsed = parseFloat(gridCellSize);
	if (!Number.isFinite(parsed) || parsed < MIN_CELL_SIZE || parsed > MAX_CELL_SIZE) {
		return [false, `Must be between ${MIN_CELL_SIZE} and ${MAX_CELL_SIZE} miles.`];
	}
	if (parsed < MIN_RECOMMENDED_CELL_SIZE) {
		return [
			true,
			// eslint-disable-next-line react/jsx-key
			<Warning>{`Performance may be impacted for Grid Cell Size smaller than ${MIN_RECOMMENDED_CELL_SIZE} mile.`}</Warning>,
		];
	}
	return [true, null];
};

export const sanitizeHeatmapOptions = (
	{ header, gridCellSize, gridType }: HeatmapOptions,
	wellHeaders: string[],
	wellHeadersTypes: Record<string, { type: string }>
) => {
	const numericHeaders = wellHeaders.filter((k) =>
		['number', 'percent', 'integer'].includes(wellHeadersTypes[k]?.type)
	);

	return {
		header: validateHeader(header, numericHeaders)[0] ? header : DEFAULT_HEATMAP_OPTIONS.header,
		gridCellSize: validateGridCellSize(gridCellSize)[0] ? gridCellSize : DEFAULT_HEATMAP_OPTIONS.gridCellSize,
		gridType: gridType ?? DEFAULT_HEATMAP_OPTIONS.gridType,
		colorScale: DEFAULT_HEATMAP_OPTIONS.colorScale, // fixed
	};
};

export class HeatmapError extends Error {
	constructor(...params) {
		super(...params);
		this.name = HeatmapError.name;
	}
}
