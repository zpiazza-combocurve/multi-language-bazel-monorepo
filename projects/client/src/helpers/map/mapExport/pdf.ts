import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

import { interpolate } from '@/helpers/math';

import { WELL_DEFAULT_COLOR } from '../colors';
import { MAX_WELLS_SIZE, MIN_WELLS_SIZE } from '../well-size';
import ccLogo from './logo';
import mapboxLogoBlack from './mapbox-logo-black';
import mapboxLogoWhite from './mapbox-logo-white';
import {
	ATTRIBUTION_HEIGHT,
	COMPASS_HEIGHT,
	DESCRIPTION_FONT_SIZE,
	DESCRIPTION_MARGIN,
	FREE_MAP_HEIGHT,
	HEADER_HEIGHT,
	HEATMAP_LEGEND_ENTRY_HEIGHT,
	HEATMAP_LEGEND_HEADER_HEIGHT,
	HEATMAP_LEGEND_HEADER_SPACING,
	HEATMAP_LEGEND_HEIGHT,
	HEATMAP_LEGEND_SUBHEADER_HEIGHT,
	HeatmapData,
	LOGO_HEIGHT,
	LOGO_WIDTH,
	MAPBOX_LOGO_ASPECT_RATIO,
	MAP_IMAGE_HEIGHT,
	MAP_IMAGE_WIDTH,
	MAP_MARGIN,
	MINIMAP_IMAGE_HEIGHT,
	MINIMAP_IMAGE_WIDTH,
	PAGE_MARGINS,
	SCALE_HEIGHT,
	SCALE_ROW_HEIGHT,
	SEPARATOR_WIDTH,
	SIDEBAR_WIDTH,
	ScaleData,
	TITLE_CENTERING_DELTA,
	TITLE_FONT_SIZE,
	WELLS_LEGENDS_HEIGHT,
	WELLS_SIZE_LEGEND_HEIGHT,
	WELLS_SIZE_STEPS,
	WELL_COLORS_LIMIT_WITHOUT_SIZE,
	WELL_COLORS_LIMIT_WITH_SIZE,
	WELL_COLOR_VALUE_LIMIT,
	WellsColorData,
	WellsSizeData,
	limitString,
	limitValues,
} from './utils';

// @ts-expect-error TODO fix pdf types
pdfMake.vfs = pdfFonts;

interface MapPdfOptions {
	theme: 'light' | 'dark';
	mapTitle: string;
	mapDescription: string;
	bearing: number;
	wellsColorData?: WellsColorData;
	wellsSizeData?: WellsSizeData;
	heatmapData?: HeatmapData;
	scale: ScaleData;
	minimapImgData?: string | null;
}

const getCircleSvg = (color: string) => `
	<svg viewBox="0 0 2 2">
		<circle cx="1" cy="1" r="1" fill="${color}"/>
	</svg>`;

const getRectSvg = (color: string) => `
	<svg viewBox="0 0 1 1">
		<rect width="1" height="1" fill="${color}"/>
	</svg>`;

const getCompassSvg = (angle: number) => `
	<svg viewBox="0 0 10 10" >
		<g transform="rotate(${angle} 5 5)">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M 5.173 0 C 4.903 0 4.723 0.12 4.643 0.37 L 3.063 4.63 C 3.013 4.75 2.993 4.88 3.003 5 L 4.263 5 C 4.263 4.99 4.263 4.98 4.263 4.98 C 4.263 4.71 4.353 4.48 4.523 4.31 C 4.703 4.13 4.913 4.05 5.173 4.06 C 5.433 4.05 5.653 4.13 5.823 4.31 C 6.003 4.48 6.093 4.71 6.093 4.98 C 6.093 4.98 6.093 4.99 6.093 5 L 7.343 5 C 7.353 4.88 7.333 4.75 7.283 4.63 L 5.703 0.37 C 5.623 0.12 5.443 0 5.173 0 Z" fill="black"></path>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M 5.173 10 C 5.443 10 5.623 9.88 5.703 9.63 L 7.283 5.37 C 7.333 5.25 7.353 5.12 7.343 5 L 6.093 5 C 6.093 5.01 6.093 5.02 6.093 5.02 C 6.093 5.29 6.003 5.52 5.823 5.69 C 5.653 5.87 5.433 5.95 5.173 5.94 C 4.913 5.95 4.703 5.87 4.523 5.69 C 4.353 5.52 4.263 5.29 4.263 5.02 C 4.263 5.02 4.263 5.01 4.263 5 L 3.003 5 C 2.993 5.12 3.013 5.25 3.063 5.37 L 4.643 9.63 C 4.723 9.88 4.903 10 5.173 10 Z" fill="#D9D9D9"></path>
		</g>
	</svg>`;

const getSeparatorSvg = (length: number, vertical = false) =>
	vertical
		? `
			<svg viewBox="0 0 ${SEPARATOR_WIDTH} ${length}">
				<line x1="${SEPARATOR_WIDTH / 2}" y1="0" x2="${SEPARATOR_WIDTH / 2}" y2="${length}" stroke="#DAD9D8" />
			</svg>`
		: `
			<svg viewBox="0 0 ${length} ${SEPARATOR_WIDTH}">
				<line x1="0" y1="${SEPARATOR_WIDTH / 2}" x2="${length}" y2="${SEPARATOR_WIDTH / 2}" stroke="#DAD9D8" />
			</svg>`;

const getScaleSvg = (scale: ScaleData) => `
	<svg viewBox="0 0 ${scale.length} ${SCALE_HEIGHT}">
		<polyline
			points="0,0 0,${SCALE_HEIGHT} ${scale.length},${SCALE_HEIGHT} ${scale.length},0"
			fill="white"
			fill-opacity="0.75"
			stroke="#333"
			stroke-width="2"
		/>
		<text x="6" y="${(SCALE_HEIGHT * 2) / 3}" font-size="${SCALE_HEIGHT / 2}" color="#333">${scale.text}</text>
	</svg>`;

const getWellsColorTable = (wellsColorData: WellsColorData | undefined, valuesLimit: number) => ({
	table: {
		widths: [8, '*'],
		body: [
			[{ text: 'Color By', fontSize: 8, colSpan: 2 }, ''],
			[
				{
					text: wellsColorData?.colorBy ?? 'No header selected',
					bold: true,
					italics: !wellsColorData,
					margin: [0, 4, 0, 8],
					colSpan: 2,
				},
				'',
			],
			...limitValues<{ color: string; value: string | null; italics?: boolean }>(
				wellsColorData?.headerColors ?? [],
				valuesLimit,
				{
					color: 'rgba(0,0,0,0)',
					value: `... ${(wellsColorData?.headerColors?.length ?? 0) - valuesLimit + 1} more`,
					italics: true,
				}
			).map(({ color, value, italics }) => [
				{ svg: getCircleSvg(color), fit: [8, 8] },
				{
					text: limitString(value ?? 'Default', WELL_COLOR_VALUE_LIMIT),
					fontSize: 8,
					italics: italics || value === null,
					margin: [4, 0, 0, 0],
				},
			]),
		],
	},
	layout: 'invisibleTable',
});

const getWellsSizeTable = ({ header, min, max }: WellsSizeData, { ratio }: ScaleData) => {
	const circles =
		min !== max
			? [...new Array(WELLS_SIZE_STEPS)].map((_, i) => {
					const circleSize = interpolate(MIN_WELLS_SIZE, MAX_WELLS_SIZE, WELLS_SIZE_STEPS, i) * ratio * 2;
					return [
						{
							svg: getCircleSvg(WELL_DEFAULT_COLOR),
							fit: [circleSize, circleSize],
							alignment: 'center',
							margin: [0, Math.max(0, (8 - circleSize) / 2)],
						},
						{
							text: interpolate(min, max, WELLS_SIZE_STEPS, i).toFixed(2),
							fontSize: 8,
							margin: [4, Math.max(0, (circleSize - 8) / 2), 0, Math.max(0, (circleSize - 8) / 2)],
						},
					];
			  })
			: [
					[
						{
							svg: getCircleSvg(WELL_DEFAULT_COLOR),
							fit: [8, 8],
						},
						{
							text: min.toFixed(2),
							fontSize: 8,
							margin: [4, 0, 0, 0],
						},
					],
			  ];

	const width = min !== max ? [MAX_WELLS_SIZE * ratio * 2, '*'] : [8, '*'];

	return {
		table: {
			widths: width,
			body: [
				[{ text: 'Size By', fontSize: 8, colSpan: 2 }, ''],
				[{ text: header, bold: true, margin: [0, 4, 0, 8], colSpan: 2 }, ''],
				...circles,
			],
		},
		layout: 'invisibleTable',
	};
};

const getWellsLegends = (
	wellsColorData: WellsColorData | undefined,
	wellsSizeData: WellsSizeData | undefined,
	scale: ScaleData
) => {
	if (!wellsColorData && !wellsSizeData) {
		return '';
	}
	if (!wellsSizeData) {
		return getWellsColorTable(wellsColorData, WELL_COLORS_LIMIT_WITHOUT_SIZE);
	}
	if (!wellsColorData) {
		return getWellsSizeTable(wellsSizeData, scale);
	}
	return {
		table: {
			heights: [WELLS_SIZE_LEGEND_HEIGHT, WELLS_LEGENDS_HEIGHT - WELLS_SIZE_LEGEND_HEIGHT],
			widths: [SIDEBAR_WIDTH - MAP_MARGIN],
			body: [
				[getWellsSizeTable(wellsSizeData, scale)],
				[getWellsColorTable(wellsColorData, WELL_COLORS_LIMIT_WITH_SIZE)],
			],
		},
		layout: 'invisibleTable',
	};
};

const getHeatmapTable = (heatmapData: HeatmapData | undefined, theme: MapPdfOptions['theme']) =>
	heatmapData
		? {
				table: {
					widths: [HEATMAP_LEGEND_ENTRY_HEIGHT, '*'],
					body: [
						[
							{
								text: heatmapData.header,
								colSpan: 2,
								fontSize: HEATMAP_LEGEND_HEADER_HEIGHT,
								fillOpacity: 0,
							},
							'',
						],
						[
							{
								text: `${heatmapData.gridCellSize} Mile Grid`,
								margin: [0, 0, 0, HEATMAP_LEGEND_HEADER_SPACING],
								colSpan: 2,
								fontSize: HEATMAP_LEGEND_SUBHEADER_HEIGHT,
								fillOpacity: 0,
							},
							'',
						],
						...Object.entries(heatmapData.legend).map(([color, value]) => [
							{
								svg: getRectSvg(color),
								fit: [HEATMAP_LEGEND_ENTRY_HEIGHT, HEATMAP_LEGEND_ENTRY_HEIGHT],
								fillOpacity: 0,
							},
							{
								text: value,
								fontSize: HEATMAP_LEGEND_ENTRY_HEIGHT,
								margin: [4, 0, 0, 0],
								fillOpacity: 0,
							},
						]),
					],
				},
				layout: 'invisibleTable',
				color: theme === 'light' ? '#414343' : '#d1d1d1',
				fillColor: theme === 'light' ? '#f5f5f5' : '#242426',
				fillOpacity: 0.8,
				margin: [5, 5, 5, 5],
		  }
		: '';

const getMapOverlay = ({
	theme,
	bearing,
	scale,
	heatmapData,
}: Pick<MapPdfOptions, 'theme' | 'bearing' | 'scale' | 'heatmapData'>) => ({
	table: {
		widths: [MAP_IMAGE_WIDTH / 2, MAP_IMAGE_WIDTH / 2],
		heights: [COMPASS_HEIGHT, FREE_MAP_HEIGHT, HEATMAP_LEGEND_HEIGHT, SCALE_ROW_HEIGHT, ATTRIBUTION_HEIGHT],
		body: [
			[
				'',
				{
					table: {
						widths: ['*', COMPASS_HEIGHT, 5],
						heights: [5, COMPASS_HEIGHT],
						body: [
							['', '', ''],
							[
								'',
								{
									svg: getCompassSvg(-bearing),
									fit: [COMPASS_HEIGHT - 4, COMPASS_HEIGHT - 4],
									margin: [2, 2, 2, 2],
									fillColor: 'white',
									fillOpacity: 0.5,
								},
								'',
							],
						],
					},
					layout: 'invisibleTable',
				},
			],
			['', ''],
			[
				{
					table: { widths: [5, 90, '*'], body: [['', getHeatmapTable(heatmapData, theme), '']] },
					layout: 'invisibleTable',
				},
				'',
			],
			[{ svg: getScaleSvg(scale), margin: [5, 5, 0, 5] }, ''],
			[
				{
					svg: theme === 'light' ? mapboxLogoBlack : mapboxLogoWhite,
					fit: [(ATTRIBUTION_HEIGHT - 5) * MAPBOX_LOGO_ASPECT_RATIO, ATTRIBUTION_HEIGHT - 5],
					margin: [5, 0, 0, 5],
				},
				{
					table: {
						widths: ['*', 'auto'],
						heights: [3, 12],
						body: [
							['', ''],
							[
								'',
								{
									text: [
										'© ',
										{ text: 'Mapbox', link: 'https://www.mapbox.com/about/maps/' },
										' © ',
										{ text: 'OpenStreetMap', link: 'http://www.openstreetmap.org/copyright' },
										' ',
										{
											text: 'Improve this map',
											link: 'https://www.mapbox.com/map-feedback/',
											bold: true,
										},
									],
									alignment: 'right',
									fontSize: 8,
									fillColor: 'white',
									fillOpacity: 0.5,
									margin: [2, 2, 2, 2],
								},
							],
						],
					},
					layout: 'invisibleTable',
				},
			],
		],
	},
	layout: 'invisibleTable',
});

const getTitleTable = (mapTitle: string, mapDescription: string) => {
	const rowHeight = HEADER_HEIGHT / 2;

	const titleMargin = rowHeight - TITLE_FONT_SIZE;
	const titleFinalMargin = mapDescription ? titleMargin : titleMargin + TITLE_CENTERING_DELTA;

	const descriptionFinalMargin = mapTitle ? DESCRIPTION_MARGIN : TITLE_CENTERING_DELTA - DESCRIPTION_FONT_SIZE;

	return {
		table: {
			widths: ['*'],
			heights: [rowHeight, rowHeight],
			body: [
				[
					{
						text: mapTitle,
						fontSize: TITLE_FONT_SIZE,
						bold: true,
						margin: [0, titleFinalMargin, 0, -titleFinalMargin],
					},
				],
				[{ text: mapDescription, fontSize: DESCRIPTION_FONT_SIZE, margin: [0, descriptionFinalMargin, 0, 0] }],
			],
		},
		layout: 'invisibleTable',
	};
};

const getPdfContent = (
	mapImage: string,
	{
		theme,
		mapTitle,
		mapDescription,
		bearing,
		scale,
		wellsColorData,
		wellsSizeData,
		heatmapData,
		minimapImgData,
	}: MapPdfOptions
): TDocumentDefinitions => ({
	pageSize: 'A4',
	pageOrientation: 'landscape',
	pageMargins: 0,
	background: [
		{
			image: mapImage,
			width: MAP_IMAGE_WIDTH,
			absolutePosition: { x: PAGE_MARGINS, y: PAGE_MARGINS + HEADER_HEIGHT + MAP_MARGIN },
		},
	],
	content: [
		{
			table: {
				widths: [LOGO_WIDTH, SEPARATOR_WIDTH, '*', SIDEBAR_WIDTH],
				heights: [HEADER_HEIGHT, MAP_MARGIN, MAP_IMAGE_HEIGHT],
				body: [
					[
						{ svg: ccLogo, fit: [LOGO_WIDTH, LOGO_HEIGHT] },
						{ svg: getSeparatorSvg(HEADER_HEIGHT, true), fit: [SEPARATOR_WIDTH, HEADER_HEIGHT] },
						{ ...getTitleTable(mapTitle, mapDescription), colSpan: 2 },
						'',
					],
					['', '', '', ''],
					[
						{ ...getMapOverlay({ theme, bearing, scale, heatmapData }), colSpan: 3 },
						'',
						'',
						{
							table: {
								heights: [WELLS_LEGENDS_HEIGHT, MINIMAP_IMAGE_HEIGHT],
								widths: [SIDEBAR_WIDTH - MAP_MARGIN],
								body: [
									[getWellsLegends(wellsColorData, wellsSizeData, scale)],
									[
										minimapImgData
											? {
													image: minimapImgData,
													width: MINIMAP_IMAGE_WIDTH,
											  }
											: '',
									],
								],
							},
							layout: 'invisibleTable',
							margin: [10, 0, 0, 0],
						},
					],
				],
			},
			margin: [PAGE_MARGINS, PAGE_MARGINS, PAGE_MARGINS, PAGE_MARGINS] as [number, number, number, number],
			layout: 'invisibleTable',
		},
	],
});

export const createMapPdf = (mapImage: string, options: MapPdfOptions): Promise<string> => {
	const doc = pdfMake.createPdf(getPdfContent(mapImage, options), {
		invisibleTable: {
			hLineWidth: () => 0,
			vLineWidth: () => 0,
			paddingLeft: () => 0,
			paddingRight: () => 0,
			paddingTop: () => 0,
			paddingBottom: () => 0,
		},
	});

	return new Promise((resolve) => {
		doc.getDataUrl((data: string) => resolve(data));
	});
};
