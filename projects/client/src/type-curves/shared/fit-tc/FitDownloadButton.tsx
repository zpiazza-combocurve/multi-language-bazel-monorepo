import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { MenuIconButton, MenuItem } from '@/components/v2';
import { CLOSE_ATTR_NAME } from '@/components/v2/menu/shared';
import { InfoTooltipWrapper } from '@/components/v2/misc';
import { failureAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { downloadFile, downloadFileV2, postApi } from '@/helpers/routing';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';
import TypeCurveFitDownloadDialog from '@/type-curves/shared/TypeCurveFitDownloadDialog';

import TypeCurveChartDownloadDialog from '../TypeCurveChartDownloadDialog';

type FitDownloadButtonProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	individualChartSettings: Record<string, any>;
	typeCurveId: string;
	resolution: FitResolution;
};

const FitDownloadButton = (props: FitDownloadButtonProps) => {
	const { typeCurveId } = props;
	const [timeSeriesDownloadVisible, setTimeSeriesDownloadVisible] = useState(false);
	const [chartsDownloadVisible, setChartsDownloadVisible] = useState(false);
	const { project } = useAlfa();

	const isDownloading = useRef(false);
	const handleChartDownloadClose = () => {
		if (!isDownloading.current) {
			setChartsDownloadVisible(false);
		}
	};

	const { isLoading: exporting, mutateAsync: exportToCsv } = useMutation(async () => {
		const typeCurveIds = [typeCurveId];
		const {
			success,
			file_id: fileId,
			error_info: errorInfo,
		} = await postApi('/type-curve/export-fit-parameters', {
			typeCurveIds,
			projectId: project?._id,
		});

		if (success) {
			downloadFile(fileId);
		} else {
			failureAlert(errorInfo.message);
		}
	});

	useLoadingBar(exporting);

	const { isLoading: exportingXlsx, mutateAsync: exportToXlsx } = useMutation(async () => {
		const typeCurveIds = [typeCurveId];
		const timeZoneFormatter = new Intl.DateTimeFormat();
		const {
			success,
			file_id: fileId,
			error_info: errorInfo,
		} = await postApi('/type-curve/export-workflow', {
			typeCurveIds,
			projectId: project?._id,
			timeZone: timeZoneFormatter.resolvedOptions().timeZone,
		});

		if (success) {
			downloadFileV2(fileId);
		} else {
			failureAlert(errorInfo.message);
		}
	});

	useLoadingBar(exportingXlsx);

	return (
		<>
			<MenuIconButton icon={faDownload} size='small' tooltipTitle='Download Options'>
				<MenuItem onClick={() => setTimeSeriesDownloadVisible(true)} {...{ [CLOSE_ATTR_NAME]: true }}>
					Download Time Series (XLSX)
				</MenuItem>

				<MenuItem onClick={() => exportToCsv()} {...{ [CLOSE_ATTR_NAME]: true }}>
					Download Fit Parameters (CSV)
				</MenuItem>

				<MenuItem onClick={() => exportToXlsx()} {...getTaggingProp('typeCurve', 'downloadTCWorkflow')}>
					<InfoTooltipWrapper
						placeIconAfter
						tooltipTitle='Includes rep wells, normalization, time series and fit parameter data.'
					>
						Download Type Curve Workflow (XLSX)
					</InfoTooltipWrapper>
				</MenuItem>

				<MenuItem onClick={() => setChartsDownloadVisible(true)} {...{ [CLOSE_ATTR_NAME]: true }}>
					Download Charts (PDF or PPTX)
				</MenuItem>
			</MenuIconButton>

			<TypeCurveFitDownloadDialog
				onClose={() => setTimeSeriesDownloadVisible(false)}
				typeCurveId={typeCurveId}
				visible={timeSeriesDownloadVisible}
			/>

			<TypeCurveChartDownloadDialog
				onClose={handleChartDownloadClose}
				visible={chartsDownloadVisible}
				ref={isDownloading}
				{...props}
			/>
		</>
	);
};

export default FitDownloadButton;
