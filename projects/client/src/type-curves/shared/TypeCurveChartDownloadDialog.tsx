import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Radio,
	RadioGroup,
} from '@material-ui/core';
import React, { useState } from 'react';
import { useMutation } from 'react-query';

import { InfoTooltipWrapper } from '@/components/v2';
import { failureAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { downloadFileV2, postApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';
import { useTypeCurve } from '@/type-curves/api';

type TypeCurveChartDownloadDialogProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	individualChartSettings: Record<string, any>;
	resolution: FitResolution;
	onClose: () => void;
	typeCurveId: string;
	visible: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const TypeCurveChartDownloadDialog = React.forwardRef((props: TypeCurveChartDownloadDialogProps, ref: any) => {
	const { individualChartSettings, resolution, onClose, typeCurveId, visible } = props;

	const { data: typeCurveData } = useTypeCurve(typeCurveId);
	assert(typeCurveData);

	const { project } = useAlfa();
	const projectName = project?.name;

	const [format, setFormat] = useState('pdf');
	const { isLoading: exportingCharts, mutateAsync: exportCharts } = useMutation(async () => {
		ref.current = true;
		const timeZoneFormatter = new Intl.DateTimeFormat();
		const {
			success,
			file_id: fileId,
			error_info: errorInfo,
		} = await postApi('/type-curve/export-charts', {
			typeCurveId,
			typeCurveName: typeCurveData.name,
			projectName,
			resolution,
			dailyRange: { align: [0, 2000], noalign: [0, 2000] },
			individualChartSettings,
			fileType: format,
			timeZone: timeZoneFormatter.resolvedOptions().timeZone,
			projectId: project?._id,
		});

		if (success) {
			downloadFileV2(fileId);
		} else {
			failureAlert(errorInfo.message);
		}
		ref.current = false;
		onClose();
	});

	useLoadingBar(exportingCharts);

	return (
		<Dialog id='type-curve-chart-download-dialog' open={visible} onClose={onClose}>
			<DialogTitle>
				<InfoTooltipWrapper tooltipTitle='Downloads charts using the settings currently displayed on the Type Curve Fit Page. NOTE: Cross Plot, Peak Rate Distribution, Probit, and Three Phase Fit charts are currently not supported for download.'>
					Chart Export Format
				</InfoTooltipWrapper>
			</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-begin' }}>
					<RadioGroup
						defaultValue='pdf'
						name='format-download-group'
						value={format}
						onChange={(event) => setFormat(event.target.value)}
					>
						<FormControlLabel value='pdf' control={<Radio />} label='PDF' />
						<FormControlLabel value='pptx' control={<Radio />} label='PPTX' />
					</RadioGroup>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button color='secondary' onClick={onClose} disabled={exportingCharts}>
					Cancel
				</Button>
				<Button color='secondary' variant='contained' onClick={() => exportCharts()} disabled={exportingCharts}>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
});

export default TypeCurveChartDownloadDialog;
