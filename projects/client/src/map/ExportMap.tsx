import { faPrint } from '@fortawesome/pro-regular-svg-icons';
import { RefObject } from 'react';

import { IconButton } from '@/components/v2';
import { withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { renderMapToImage, renderMiniMapToImage } from '@/helpers/map/mapExport/mapRenderer';
import { createMapPdf } from '@/helpers/map/mapExport/pdf';
import {
	HeatmapData,
	MAP_IMAGE_WIDTH,
	MINIMAP_IMAGE_WIDTH,
	WellsColorData,
	WellsSizeData,
	getHorizontalResolution,
} from '@/helpers/map/mapExport/utils';
import { downloadFromUrl } from '@/helpers/routing';

import { ExportMapDialog, MapExportOptions } from './ExportMapDialog';
import { MapLayers } from './MapLayers';

interface ExportMapProps {
	mapLayersRef: RefObject<MapLayers>;
	size?: 'small' | 'medium';
}

interface MapExportData extends MapExportOptions {
	theme: 'light' | 'dark';
	wellsColorData?: WellsColorData;
	wellsSizeData?: WellsSizeData;
	heatmapData?: HeatmapData;
}

export const getFileData = async (
	map,
	{
		theme,
		fileType,
		mapTitle,
		mapDescription,
		horizontalResolution,
		ppi,
		wellsColorData,
		wellsSizeData,
		heatmapData,
	}: MapExportData
) => {
	if (fileType === 'jpeg') {
		const { imgData } = await renderMapToImage(map, horizontalResolution);
		return imgData;
	}

	const { imgData, bearing, scale, boundsPolygon } = await renderMapToImage(
		map,
		getHorizontalResolution(ppi, MAP_IMAGE_WIDTH)
	);
	const minimapImgData = await renderMiniMapToImage(
		map,
		boundsPolygon,
		getHorizontalResolution(ppi, MINIMAP_IMAGE_WIDTH)
	);
	return createMapPdf(imgData, {
		theme,
		mapTitle,
		mapDescription,
		bearing,
		scale,
		wellsColorData,
		wellsSizeData,
		heatmapData,
		minimapImgData,
	});
};

export function ExportMap({ mapLayersRef, size }: ExportMapProps) {
	const [exportMapDialog, promptExportMapDialog] = useDialog(ExportMapDialog);

	const { wellHeadersLabels } = useWellHeaders({ enableProjectCustomHeaders: true });

	const openExportMapDialog = async () => {
		const mapExportOptions = await promptExportMapDialog();

		if (!mapLayersRef.current) {
			return;
		}

		const mapper = mapLayersRef.current.mapRef.current.map;
		const theme = mapper.getTheme().theme;
		const map = mapper.getMap();

		if (!mapExportOptions || !map) {
			return;
		}

		const {
			colorBy,
			headerColors,
			sizeBy: { header: sizeByHeader, min: sizeByMin, max: sizeByMax } = {},
		} = mapLayersRef.current.props;
		const wellsColorData = colorBy ? { colorBy: wellHeadersLabels[colorBy], headerColors } : undefined;
		const wellsSizeData =
			sizeByHeader && sizeByMin !== undefined && sizeByMax !== undefined
				? { header: wellHeadersLabels[sizeByHeader], min: sizeByMin, max: sizeByMax }
				: undefined;

		const { heatmap } = mapLayersRef.current.state;
		const heatmapData =
			heatmap.legend && ['show', 'show+fetching-data'].includes(heatmap.status)
				? {
						header: wellHeadersLabels[heatmap.options.header],
						gridCellSize: heatmap.options.gridCellSize,
						legend: heatmap.legend,
				  }
				: undefined;

		const fileData = await withLoadingBar(
			getFileData(map, { ...mapExportOptions, wellsColorData, wellsSizeData, heatmapData, theme })
		);
		downloadFromUrl(fileData, `map`);
	};

	return (
		<>
			<IconButton onClick={openExportMapDialog} tooltipTitle='Export Map' size={size || 'small'}>
				{faPrint}
			</IconButton>
			{exportMapDialog}
		</>
	);
}
