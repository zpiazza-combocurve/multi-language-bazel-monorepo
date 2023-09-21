import { useCallbackRef } from '@/components/hooks';
import { withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { downloadFromUrl } from '@/helpers/routing';

import { getFileData } from '../ExportMap';
import { ExportMapDialog } from '../ExportMapDialog';

export const useExportMap = (map, heatmap, mapLayers, sizeBy, colorBy, headerColors) => {
	const [exportMapDialog, promptExportMapDialog] = useDialog(ExportMapDialog);
	const { wellHeadersLabels } = useWellHeaders({ enableProjectCustomHeaders: true });

	const openExportMapDialog = useCallbackRef(async () => {
		const mapExportOptions = await promptExportMapDialog();

		if (!mapExportOptions || !map) {
			return;
		}

		const theme = map.theme;

		const legend = {
			colorBy: 'Legend',
			headerColors: mapLayers.map((layer) => {
				return { value: layer.label, color: layer.color };
			}),
		};

		const { header: sizeByHeader, min: sizeByMin, max: sizeByMax } = sizeBy;

		const wellsColorData =
			legend.headerColors.length > 0 ? legend : { colorBy: wellHeadersLabels[colorBy], headerColors };

		const wellsSizeData =
			sizeByHeader && sizeByMin !== undefined && sizeByMax !== undefined
				? { header: wellHeadersLabels[sizeByHeader], min: sizeByMin, max: sizeByMax }
				: undefined;

		const heatmapData =
			heatmap && heatmap?.legend && heatmap?.options?.header
				? {
						header: wellHeadersLabels[heatmap.options.header],
						gridCellSize: heatmap.options.gridCellSize,
						legend: heatmap.legend,
				  }
				: undefined;

		const fileData = await withLoadingBar(
			getFileData(map, {
				...mapExportOptions,
				wellsColorData,
				wellsSizeData,
				heatmapData,
				theme,
			})
		);
		downloadFromUrl(fileData, `map`);
	});

	return { exportMapDialog, openExportMapDialog };
};
