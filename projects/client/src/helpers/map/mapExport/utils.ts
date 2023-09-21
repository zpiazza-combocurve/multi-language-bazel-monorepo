export interface WellsColorData {
	colorBy: string;
	headerColors: Array<{
		value: string | null;
		color: string;
	}>;
}

export interface WellsSizeData {
	header: string;
	min: number;
	max: number;
}

export interface ScaleData {
	length: number;
	text: string;
	ratio: number;
}

export interface HeatmapData {
	header: string;
	gridCellSize: number;
	legend: Record<string, string>;
}

const POINTS_IN_INCH = 72;

const PAGE_WIDTH = 842; // points (A4 page size)
const PAGE_HEIGHT = 595; // points (A4 page size)

export const PAGE_MARGINS = 28.3465; // 1 cm in points
export const HEADER_HEIGHT = 42;

export const TITLE_FONT_SIZE = 18;
export const TITLE_CENTERING_DELTA = 8;
export const DESCRIPTION_FONT_SIZE = 12;
export const DESCRIPTION_MARGIN = 4;

export const SEPARATOR_WIDTH = 20; // this is actually height if the separator is horizontal

export const SIDEBAR_WIDTH = 120;
export const MAP_MARGIN = 10;

export const MAP_IMAGE_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGINS - SIDEBAR_WIDTH;
export const MAP_IMAGE_HEIGHT = PAGE_HEIGHT - 2 * PAGE_MARGINS - HEADER_HEIGHT - MAP_MARGIN;

export const MINIMAP_IMAGE_WIDTH = SIDEBAR_WIDTH - MAP_MARGIN;
export const MINIMAP_IMAGE_HEIGHT = SIDEBAR_WIDTH - MAP_MARGIN;
const MINIMAP_CLIENT_RATIO = 2;
export const MINIMAP_CLIENT_WIDTH = MINIMAP_IMAGE_WIDTH * MINIMAP_CLIENT_RATIO;
export const MINIMAP_CLIENT_HEIGHT = MINIMAP_IMAGE_HEIGHT * MINIMAP_CLIENT_RATIO;

export const LOGO_WIDTH = 170;
export const LOGO_HEIGHT = 42;

export const MAX_SCALE_LENGTH = POINTS_IN_INCH;

const HEATMAP_LINE_SPACING = 1.5;
export const HEATMAP_LEGEND_HEADER_HEIGHT = 8;
export const HEATMAP_LEGEND_SUBHEADER_HEIGHT = 8;
export const HEATMAP_LEGEND_HEADER_SPACING = 5;
export const HEATMAP_LEGEND_ENTRY_HEIGHT = 8;
export const HEATMAP_LEGEND_MAX_ENTRIES = 13;
const HEATMAP_PADDING = 5;
export const HEATMAP_LEGEND_HEIGHT =
	HEATMAP_LEGEND_HEADER_HEIGHT +
	HEATMAP_LEGEND_SUBHEADER_HEIGHT +
	HEATMAP_LEGEND_HEADER_SPACING +
	HEATMAP_LEGEND_MAX_ENTRIES * HEATMAP_LEGEND_ENTRY_HEIGHT +
	(HEATMAP_LEGEND_MAX_ENTRIES + 2) * HEATMAP_LINE_SPACING +
	2 * HEATMAP_PADDING;

export const WELL_COLORS_LIMIT_WITHOUT_SIZE = 35;
export const WELL_COLORS_LIMIT_WITH_SIZE = 24;
export const WELL_COLOR_VALUE_LIMIT = 20;
export const WELLS_LEGENDS_HEIGHT = MAP_IMAGE_HEIGHT - MINIMAP_IMAGE_HEIGHT;
export const WELLS_SIZE_STEPS = 5;
export const WELLS_SIZE_LEGEND_HEIGHT = 110;

export const COMPASS_HEIGHT = 20;
export const COMPASS_ROW_HEIGHT = 25;
export const SCALE_HEIGHT = 15;
export const SCALE_ROW_HEIGHT = SCALE_HEIGHT + 10;
export const ATTRIBUTION_HEIGHT = 15;
export const FREE_MAP_HEIGHT =
	MAP_IMAGE_HEIGHT - COMPASS_ROW_HEIGHT - HEATMAP_LEGEND_HEIGHT - SCALE_ROW_HEIGHT - ATTRIBUTION_HEIGHT;

export const MAPBOX_LOGO_ASPECT_RATIO = 800 / 180; // width / height

export const limitValues = <T>(values: T[], limit: number, ellipsis: T) =>
	values.length <= limit ? values : [...values.slice(0, limit - 2), ellipsis, values[values.length - 1]];

export const limitString = (value: string, limit: number) =>
	value.length <= limit ? value : value.substring(0, limit - 2) + '…';

export const getHorizontalResolution = (ppi: number, mapWidth: number) => (ppi * mapWidth) / POINTS_IN_INCH;
