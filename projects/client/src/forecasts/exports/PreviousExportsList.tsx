import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { Placeholder } from '@/components';
import { Box, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useVisibleDialog } from '@/helpers/dialog';
import { deleteApi, getApi } from '@/helpers/routing';
import { fullNameAndLocalDate } from '@/helpers/user';

import { DownloadForecastExportDialog } from '../view/DownloadForecastExportDialog';

import './styles.scss';

export const PreviousExportsList = ({ forecastId, forecast, kinds }) => {
	const queryClient = useQueryClient();

	const [dialog, confirmDownload] = useVisibleDialog(DownloadForecastExportDialog);
	const forecastExportsQuery = useQuery(
		['forecast', forecastId, kinds],
		/** @returns {Promise<ForecastExport[]>} */
		() => getApi(`/forecast/${forecastId}/forecast-exports`, { kinds }, false)
	);

	const deleteExportMutation = useMutation(
		(exportId) => deleteApi(`/forecast/${forecastId}/forecast-exports/${exportId}`),
		{ onSuccess: () => queryClient.invalidateQueries(['forecast', forecastId, kinds]) }
	);

	useLoadingBar(deleteExportMutation.isLoading);

	if (forecastExportsQuery.isLoading) {
		return <Placeholder loading loadingText='Loading Previous Exports' />;
	}

	if (!forecastExportsQuery.data) {
		return <div>Error loading previous exports</div>;
	}

	if (forecastExportsQuery.data.length === 0) {
		return <div>No previous exports</div>;
	}

	/** @param {ForecastExport} forecastExport */
	const formatInfo = (forecastExport) => {
		const info: string[] = [];
		info.push(`${forecastExport.wells.length} wells`);
		info.push(forecastExport.status);
		if (
			forecastExport.foreacastDaily?.settings.include &&
			forecastExport.productionDaily?.settings.include &&
			forecastExport.forecastDaily?.settings.mergeWithProduction
		) {
			info.push('Combined Daily');
		} else {
			if (forecastExport.forecastDaily?.settings.include) {
				info.push('Forecast Daily');
			}
			if (forecastExport.productionDaily?.settings.include) {
				info.push('Production Daily');
			}
		}
		if (
			forecastExport.forecastMonthly?.settings.include &&
			forecastExport.productionMonthly?.settings.include &&
			forecastExport.forecastMonthly?.settings.mergeWithProduction
		) {
			info.push('Combined Monthly');
		} else {
			if (forecastExport.forecastMonthly?.settings.include) {
				info.push('Forecast Monthly');
			}
			if (forecastExport.productionMonthly?.settings.include) {
				info.push('Production Monthly');
			}
		}
		if (forecastExport.charts?.settings.include) {
			info.push('Charts');
		}
		return info.join(' | ');
	};

	return (
		<Box
			css={`
				width: 100%;
				display: flex;
				flex-direction: column;
			`}
		>
			{dialog}
			<List dense>
				{forecastExportsQuery.data.map((forecastExport) => (
					<ListItem
						key={forecastExport._id}
						button
						onClick={() => confirmDownload({ forecastExportId: forecastExport?._id, forecast })}
					>
						<ListItemText
							primary={formatInfo(forecastExport)}
							secondary={fullNameAndLocalDate(forecastExport.createdBy, forecastExport.createdAt)}
							secondaryTypographyProps={{
								classes: { colorTextSecondary: 'text-secondary' },
								color: 'textSecondary',
							}}
						/>

						<ListItemSecondaryAction>
							<IconButton
								disabled={forecastExport.status === 'pending'}
								onClick={() => deleteExportMutation.mutate(forecastExport._id)}
								tooltipTitle='Delete'
							>
								{faTrash}
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
				))}
			</List>
		</Box>
	);
};
