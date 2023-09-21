import { ListItemText } from '@material-ui/core';
import { useState } from 'react';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	List,
	ListItem,
	Radio,
	RadioGroup,
	TextField,
	Typography,
} from '@/components/v2';
import { InfoTooltipWrapper } from '@/components/v2/misc';
import { genericErrorAlert } from '@/helpers/alerts';
import { handleBackdropClose } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';

const exportFileTypeTooltip = 'Maximum # of Rows for Excel is 1,048,576. For larger files, select CSV';
const numberOfTrialTooltip =
	'A sample is generated for each well, CAPEX and # of trials indicated. ' +
	'e.g. For 100 trials, 5 wells, with 1 CAPEX Model that contains 3 CAPEX Categories ' +
	'(Drilling, Completion, Facilities) will generate 5 \u00d7 3 \u00d7 100 = 1500 samples';

interface IExportProbabilisticDialog {
	close: () => void;
	visible: boolean;
	scenarioId: string;
	scenarioName: string;
	selectedAssignmentIds: [string];
	timeZone: string;
}

export const ExportProbabilisticDialog = ({
	visible,
	close,
	scenarioId,
	scenarioName,
	selectedAssignmentIds,
	timeZone,
}: IExportProbabilisticDialog) => {
	const [type, setType] = useState('excel');
	const [trials, setTrials] = useState('100');
	const [numberIsValid, setNumberIsValid] = useState(true);

	const handleSubmit = async () => {
		const body = {
			type,
			trials,
			scenarioId,
			scenarioName,
			selectedAssignmentIds,
			timeZone,
		};

		close();

		try {
			await postApi(`/scenarios/${scenarioId}/generateProbabilisticInputs`, body);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	return (
		<Dialog
			maxWidth='sm'
			fullWidth
			open={visible}
			onClose={(event, reason) => handleBackdropClose(event, reason, close)}
		>
			<DialogTitle>Generate and Export Probabilistic Inputs</DialogTitle>
			<DialogContent>
				<div
					css={`
						display: flex;
						justify-content: space-between;
					`}
				>
					<FormControl fullWidth>
						<FormLabel>
							<InfoTooltipWrapper tooltipTitle={exportFileTypeTooltip}>
								<div>Export File Type</div>
							</InfoTooltipWrapper>
						</FormLabel>
						<RadioGroup name='type' value={type} onChange={(event) => setType(event.target.value)}>
							<FormControlLabel value='excel' control={<Radio />} label='Excel' />
							<FormControlLabel value='csv' control={<Radio />} label='CSV' />
						</RadioGroup>
					</FormControl>
					<FormControl
						css={`
							width: 70%;
						`}
					>
						<FormLabel>
							<InfoTooltipWrapper tooltipTitle={numberOfTrialTooltip}>
								<div>Number of Trials</div>
							</InfoTooltipWrapper>
						</FormLabel>
						<TextField
							error={!numberIsValid}
							css={`
								margin-top: 10px;
							`}
							onChange={(e) => {
								const value = Math.floor(parseInt(e.target.value));
								setTrials(value.toString());
								if (value > 0 && value <= 10000) {
									setNumberIsValid(true);
								} else {
									setNumberIsValid(false);
								}
							}}
							helperText={!numberIsValid ? 'Must be between 1 and 10000' : null}
							variant='outlined'
							type='number'
							inputProps={{ max: 3000, min: 1 }}
							value={trials}
						/>
					</FormControl>
				</div>
				<Typography
					css={`
						border-bottom: 1px solid;
						font-size: 12pt;
						font-weight: 500;
						margin-top: 35px;
						padding-bottom: 20px;
					`}
				>
					Model
				</Typography>
				<List>
					<ListItem
						css={`
							border-bottom: 1px solid rgba(255, 255, 255, 0.5);
							font-size: 12pt;
							padding-left: 0;
						`}
					>
						<ListItemText primary='CAPEX' />
					</ListItem>
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={close}>Cancel</Button>
				<Button color='primary' disabled={!numberIsValid} onClick={() => handleSubmit()}>
					Generate
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ExportProbabilisticDialog;
