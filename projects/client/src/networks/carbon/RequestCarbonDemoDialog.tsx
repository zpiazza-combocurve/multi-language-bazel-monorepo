import { faTimes as faClose } from '@fortawesome/pro-regular-svg-icons';
import { Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@material-ui/core';
import { useMutation } from 'react-query';

import { Button, IconButton, InfoIcon } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps, withStaticDialog } from '@/helpers/dialog';

import emissionimage from './RequestCarbonDemoDialog/emission.png';
import planningimage from './RequestCarbonDemoDialog/planning.png';
import { requestCarbonDemo } from './api';

type RequestCarbonDemoDialogProps = DialogProps<never>;

function RequestCarbonDemoDialog(props: RequestCarbonDemoDialogProps) {
	const requestDemoMutation = useMutation(async () => {
		await requestCarbonDemo();
		confirmationAlert('ComboCurve representatives will reach out to you within 24hr to set up a demo.');
	});

	const img = ({ src, title }) => (
		<div
			css={`
				display: flex;
				flex-direction: column;
				flex: 1;
				gap: ${({ theme }) => theme.spacing(1)}px;
			`}
		>
			<div>{title}</div>
			<img
				src={src}
				css={`
					width: 100%;
					border-radius: 4px;
				`}
			/>
		</div>
	);

	return (
		<Dialog open={props.visible} onClose={props.onHide} maxWidth='md'>
			<DialogTitle
				css={`
					display: flex;
					align-items: center;
					padding-left: ${({ theme }) => theme.spacing(2)}px;
					padding-right: ${({ theme }) => theme.spacing(2)}px;
					padding-top: ${({ theme }) => theme.spacing(2)}px;
				`}
				disableTypography
			>
				<Typography variant='h6' component='div'>
					Carbon Demo
				</Typography>
				<div css={{ flex: 1 }} />
				<IconButton size='small' onClick={props.onHide}>
					{faClose}
				</IconButton>
			</DialogTitle>
			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					gap: ${({ theme }) => theme.spacing(2)}px;
					padding: ${({ theme }) => theme.spacing(2)}px;
				`}
			>
				<Paper
					elevation={0}
					css={`
						padding: ${({ theme }) => theme.spacing(1)}px;
						background-color: ${({ theme }) => theme.palette.background.opaque};
					`}
				>
					<InfoIcon withRightMargin />
					Carbon Network is a part of ComboCarbon where Emission Modeling, Forecasting, Economics Integration,
					and Reporting reside.
				</Paper>
				<div
					css={`
						display: flex;
						gap: ${({ theme }) => theme.spacing(2)}px;
					`}
				>
					{img({ src: emissionimage, title: 'Emission Forecast' })}
					{img({ src: planningimage, title: 'Decarbonization Planning' })}
				</div>
			</DialogContent>
			<DialogActions
				css={`
					padding: ${({ theme }) => theme.spacing(2)}px;
					padding-top: 0;
				`}
			>
				<Button
					variant='contained'
					color='secondary'
					disabled={requestDemoMutation.isLoading || requestDemoMutation.isSuccess}
					onClick={() => requestDemoMutation.mutate()}
				>
					Request Demo
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export const showRequestCarbonDemoDialog = withStaticDialog(RequestCarbonDemoDialog);

export default RequestCarbonDemoDialog;
