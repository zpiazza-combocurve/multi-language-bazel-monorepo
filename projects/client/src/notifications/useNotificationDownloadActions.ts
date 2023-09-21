import { useCallback } from 'react';

import { alerts } from '@/components/v2';
import { DownloadForecastExportDialog } from '@/forecasts/view/DownloadForecastExportDialog';
import { genericErrorAlert } from '@/helpers/alerts';
import { useVisibleDialog } from '@/helpers/dialog';
import { downloadExport, downloadFromUrl } from '@/helpers/routing';

import { NotificationExtraData, NotificationType } from './notification';

export const NOTIFICATIONS_WITH_EXPORT = [
	NotificationType.ECONOMICS_FILE,
	NotificationType.ECON_REPORT_BY_WELL,
	NotificationType.CC_TO_ARIES,
	NotificationType.CC_TO_PHDWIN,
	NotificationType.CC_CC_EXPORT,
	NotificationType.PRODUCTION_DATA_EXPORT,
	NotificationType.DIRECTIONAL_SURVEY_EXPORT,
	NotificationType.CC_CC_IMPORT,
	NotificationType.FORECAST_IMPORT,
	NotificationType.EXPORT_FORECAST_DATA,
	NotificationType.EXPORT_FORECAST_CHARTS,
	NotificationType.EXPORT_SCENARIO_TABLE_WITH_LOOKUP,
	NotificationType.MAP_LAYER_EXPORT,
	NotificationType.EXPORT_GANTT_TO_PDF,
	NotificationType.EXPORT_WELLS,
];

const simpleDownloadFromUrl = (extra: NotificationExtraData) => {
	if (extra?.output?.file?.url) {
		downloadFromUrl(extra.output.file.url, extra?.output?.file?.name);
	}
};

const simpleDownloadExport = (extra: NotificationExtraData) => {
	if (extra?.output?.file?.gcpName && extra?.output?.file?.name) {
		downloadExport(extra.output.file.gcpName, extra.output.file.name).catch((err) => {
			genericErrorAlert(err);
		});
	}
};

const importErrorsDownloadExport = (extra: NotificationExtraData) => {
	if (extra?.output?.file?.gcpName && extra?.output?.file?.name) {
		alerts
			.confirm({
				confirmText: 'Download',
				children:
					'There are some errors associated with your import, do you want to download the list of errors?',
				title: 'Import Completed Successfully',
			})
			.then((confirmed) => {
				if (confirmed) {
					simpleDownloadExport(extra);
				}
			});
	}
};

export const useNotificationDownloadActions = () => {
	const [downloadForecastExportDialog, confirmDownloadForecastExport] = useVisibleDialog(
		DownloadForecastExportDialog,
		{ forecast: {} as Inpt.Forecast }
	);

	const downloadIfExists = useCallback(
		(type: NotificationType, extra: NotificationExtraData) => {
			switch (type) {
				case NotificationType.ECONOMICS_FILE:
				case NotificationType.ECON_REPORT_BY_WELL:
				case NotificationType.CC_TO_ARIES:
				case NotificationType.CC_TO_PHDWIN:
				case NotificationType.CC_CC_EXPORT:
				case NotificationType.PRODUCTION_DATA_EXPORT:
				case NotificationType.DIRECTIONAL_SURVEY_EXPORT:
				case NotificationType.MAP_LAYER_EXPORT:
				case NotificationType.EXPORT_WELLS: {
					simpleDownloadExport(extra);

					break;
				}

				case NotificationType.CC_CC_IMPORT:
				case NotificationType.FORECAST_IMPORT: {
					importErrorsDownloadExport(extra);

					break;
				}

				case NotificationType.EXPORT_FORECAST_DATA:
				case NotificationType.EXPORT_FORECAST_CHARTS: {
					if (extra?.body?.forecastExportId && extra?.body?.forecastId && extra?.body?.forecastName) {
						confirmDownloadForecastExport({
							forecast: { _id: extra.body.forecastId, name: extra.body.forecastName } as Inpt.Forecast,
							forecastExportId: extra.body.forecastExportId,
						});
					}

					break;
				}
				case NotificationType.EXPORT_GANTT_TO_PDF:
				case NotificationType.EXPORT_SCENARIO_TABLE_WITH_LOOKUP: {
					simpleDownloadFromUrl(extra);

					break;
				}

				default:
					break;
			}
		},
		[confirmDownloadForecastExport]
	);

	return {
		downloadForecastExportDialog,
		downloadIfExists,
	};
};
