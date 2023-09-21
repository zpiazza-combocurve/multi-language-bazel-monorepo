import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { useMemo } from 'react';
import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogLikeProps } from '@/helpers/dialog';
import { downloadFile, getApi } from '@/helpers/routing';
import { titleize } from '@/helpers/text';

const getForecastExport = (forecastId: string, forecastExportId: string) =>
	getApi(`/forecast/${forecastId}/forecast-exports/${forecastExportId}`);

type DownloadForecastExportDialogProps = {
	forecast: Inpt.Forecast;
	forecastExportId: string;
} & DialogLikeProps;

export function DownloadForecastExportDialog({
	forecast,
	forecastExportId,
	visible,
	onHide,
}: DownloadForecastExportDialogProps) {
	const { _id: forecastId, name: forecastName } = forecast ?? {};

	const forecastExportQuery = useQuery(
		['forecast', forecastId, 'single-csv-exports', forecastExportId],
		() => getForecastExport(forecastId, forecastExportId),
		{ enabled: !!forecastExportId }
	);

	const files = useMemo(() => {
		if (!forecastExportQuery.isSuccess) {
			return [];
		}
		return ['forecastDaily', 'forecastMonthly', 'productionDaily', 'productionMonthly', 'charts'].filter(
			(key) => !!forecastExportQuery.data[key]?.file
		);
	}, [forecastExportQuery.data, forecastExportQuery.isSuccess]);

	const getFileText = (key) => {
		if (key === 'forecastMonthly' && forecastExportQuery.data.forecastMonthly.settings.mergeWithProduction) {
			return 'Combined Monthly';
		}
		if (key === 'forecastDaily' && forecastExportQuery.data.forecastDaily.settings.mergeWithProduction) {
			return 'Combined Daily';
		}
		return titleize(key);
	};

	return (
		<Dialog open={!!visible} onClose={onHide} maxWidth='xs' fullWidth>
			<DialogTitle>Download Files</DialogTitle>
			<DialogContent>
				{forecastExportQuery.isLoading && <Placeholder loading />}
				{forecastExportQuery.isSuccess && files.length === 0 && 'No files to download'}
				{forecastExportQuery.isSuccess && files.length > 0 && (
					<>
						{files.map((key) => (
							<Box key={key} my={2}>
								<Button
									startIcon={faDownload}
									onClick={() =>
										downloadFile(
											forecastExportQuery.data?.[key].file,
											`${forecastName} - ${getFileText(key)}`
										)
									}
								>
									Download {getFileText(key)}
								</Button>
							</Box>
						))}
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}
