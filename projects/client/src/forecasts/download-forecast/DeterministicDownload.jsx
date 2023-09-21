import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { useMutation } from 'react-query';

import { Button as DefaultButton } from '@/components';
import { muiTooltiped } from '@/components/tooltipped';
import { genericErrorAlert } from '@/helpers/alerts';
import { downloadFile, postApi } from '@/helpers/routing';

const Button = muiTooltiped(DefaultButton);

const useDeterministicDownload = ({ forecastId, wellId }) => {
	const { isLoading: downloading, mutateAsync: download } = useMutation(async () => {
		try {
			const body = {
				forecastId,
				wellId,
			};
			const {
				success,
				file_id: fileId,
				error_info: errorInfo,
			} = await postApi(`/forecast/${forecastId}/singleWellDownload`, body);

			if (!success) {
				throw Error(errorInfo);
			}
			await downloadFile(fileId);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	return Object.assign([downloading, download], { download, downloading });
};

const useProximityDownload = ({ forecastId, wellId }) => {
	const { isLoading: downloading, mutateAsync: download } = useMutation(async () => {
		try {
			const body = {
				forecastId,
				wellId,
			};
			const {
				success,
				file_id: fileId,
				error_info: errorInfo,
			} = await postApi(`/forecast/proximitySingleWellDownload`, body);

			if (!success) {
				throw Error(errorInfo);
			}
			await downloadFile(fileId);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	return Object.assign([downloading, download], { download, downloading });
};

const DeterministicDownloadButton = (props) => {
	const { forecastId, wellId, small } = props;
	const [downloading, download] = useDeterministicDownload({ forecastId, wellId });

	return (
		<Button
			disabled={downloading}
			faIcon={faDownload}
			labelTooltip='Download Forecast'
			onClick={download}
			placement='left'
			primary
			small={small}
		/>
	);
};

export { DeterministicDownloadButton, useProximityDownload, useDeterministicDownload };
