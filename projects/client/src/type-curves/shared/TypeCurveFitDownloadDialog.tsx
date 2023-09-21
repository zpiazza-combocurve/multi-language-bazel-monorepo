import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControlLabel,
	Radio,
	RadioGroup,
	useTheme,
} from '@material-ui/core';
import _ from 'lodash';
import { useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { CheckboxField, ReactDatePicker } from '@/components/v2';
import { failureAlert, useLoadingBar } from '@/helpers/alerts';
import { makeUtc } from '@/helpers/date';
import { downloadFileV2, postApi } from '@/helpers/routing';
import { convertDateToIdx } from '@/helpers/zing';

type TypeCurveFitDownloadDialogProps = {
	typeCurveId: string;
	visible: boolean;
	onClose: () => void;
};

const TypeCurveFitDownloadDialog = (props: TypeCurveFitDownloadDialogProps) => {
	const theme = useTheme();
	const { onClose = _.noop, typeCurveId, visible } = props;
	const [startDate, setStartDate] = useState<Date | null>(new Date());
	const [ratioSeries, setRatioSeries] = useState('best');
	const [phases, setPhases] = useState({ oil: true, gas: true, water: true });
	const PHASE_LABELS = { oil: 'Oil', gas: 'Gas', water: 'Water' };

	const { isLoading: exportingVolumes, mutateAsync: exportVolumes } = useMutation(async () => {
		onClose();
		const fpd = makeUtc(startDate);
		const fpdIndex = convertDateToIdx(fpd);
		const selectedPhases = Object.keys(phases).filter((k) => phases[k]);
		const {
			success,
			file_id: fileId,
			error_info: errorInfo,
		} = await postApi('/type-curve/volume-export', {
			typeCurveId,
			startTime: fpdIndex,
			phases: selectedPhases,
			basePhaseSeries: ratioSeries,
		});

		if (success) {
			downloadFileV2(fileId);
		} else {
			failureAlert(errorInfo.message);
		}
	});

	useLoadingBar(exportingVolumes);

	return (
		<Dialog id='type-curve-fit-download-dialog' open={visible} onClose={onClose}>
			<DialogTitle>Download Type Curve Time Series</DialogTitle>
			<DialogContent>
				<Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '10px' }}>
					<DialogContentText>
						<span
							css={`
								color: ${theme.palette.text.secondary};
							`}
						>
							Start Date For Type Curve Fits:
						</span>
					</DialogContentText>
					<ReactDatePicker
						selected={startDate}
						onChange={setStartDate}
						asUtc={false}
						variant='outlined'
						fullWidth
					/>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'space-between',
							marginTop: '0.5rem',
						}}
					>
						<Box style={{ display: 'flex', flexDirection: 'column', flexBasis: '45%', gap: '10px' }}>
							<DialogContentText>
								<span
									css={`
										color: ${theme.palette.text.secondary};
									`}
								>
									Phases for
									<br />
									Background Wells:
								</span>
							</DialogContentText>
							{Object.entries(phases).map(([label, value]) => {
								return (
									<CheckboxField
										key={label}
										checked={value}
										label={PHASE_LABELS[label]}
										value={value}
										onChange={() => {
											setPhases({ ...phases, [label]: !value });
										}}
									/>
								);
							})}
						</Box>
						<Box sx={{ display: 'flex', flexDirection: 'column', flexBasis: '45%' }}>
							<DialogContentText>
								<span
									css={`
										color: ${theme.palette.text.secondary};
									`}
								>
									Base Phase Series
									<br />
									for Ratio Fits:
								</span>
							</DialogContentText>
							<RadioGroup
								name='format-download-group'
								value={ratioSeries}
								onChange={(event) => setRatioSeries(event.target.value)}
							>
								<FormControlLabel value='best' control={<Radio />} label='Best' />
								<FormControlLabel value='P50' control={<Radio />} label='P50' />
								<FormControlLabel value='P10' control={<Radio />} label='P10' />
								<FormControlLabel value='P90' control={<Radio />} label='P90' />
							</RadioGroup>
						</Box>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button color='secondary' onClick={onClose}>
					Cancel
				</Button>
				<Button
					color='secondary'
					variant='contained'
					onClick={() => exportVolumes()}
					{...getTaggingProp('typeCurve', 'exportTimeseries')}
				>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TypeCurveFitDownloadDialog;
