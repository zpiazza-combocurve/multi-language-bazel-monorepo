import {
	Divider,
	Grid,
	Link,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@material-ui/core';
import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { Button, Container, Paper } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import theme from '@/helpers/styled';
import NotFound from '@/not-found/not-found';

import { useApiProvision } from './useApiProvision';

const ADDITIONAL_INFORMATION_LINKS = [
	{
		text: 'REST API Documentation',
		href: 'http://docs.api.combocurve.com/',
	},
	{
		text: 'REST API Forum',
		href: 'http://forum.api.combocurve.com/',
	},
	{
		text: 'Data Dictionary',
		href: 'https://drive.google.com/uc?export=download&id=1iBif7G0oMz4JcVXcl3CK7zqZlfGwsiOD',
	},
];

const getStepLabels = (hasProvisionedAPI) => {
	return [
		{
			label: 'REST API Access',
			description: hasProvisionedAPI
				? 'REST API access has been enabled for your organization.'
				: 'Enable access to the ComboCurve REST API for your organization. This is required before generating credentials.',
			button: 'Enable',
		},
		{
			label: 'Credentials',
			description: 'Create and download credentials for ComboCurve Sync or for direct REST API access.',
			description2: 'Once you have downloaded the credentials please store them securely.',
			button: 'Create & Download',
		},
	];
};

const StyledStepper = styled(Stepper)`
	background-color: ${theme.backgroundOpaque};
	width: 863px;
	margin-top: 4em;
	margin-bottom: ${({ theme }) => theme.spacing(2)}px;
	padding: ${({ theme }) => `${theme.spacing(3)}px ${theme.spacing(2)}px`};

	.MuiStepContent-root {
		padding-right: 0;
	}
`;

const StyledStepLabel = styled(StepLabel).attrs({})<{ $active: boolean }>`
	.MuiStepIcon-root {
		color: ${({ theme, $active }) => ($active ? theme.palette.secondary.main : theme.palette.action.disabled)};
	}
`;

const DownloadCCSyncBanner = () => (
	<Paper
		css={`
			width: 863px;
			padding: ${({ theme }) => `${theme.spacing(2)}px`};
			background-color: ${theme.backgroundOpaque};
			margin-bottom: ${({ theme }) => theme.spacing(2)}px;
		`}
	>
		<Grid container justifyContent='space-between'>
			<Grid item xs={10}>
				<Grid container direction='column'>
					<Grid item>
						<Typography variant='body1'>ComboCurve Sync (Recommended)</Typography>
					</Grid>
					<Grid item>
						<Typography variant='body2'>
							Get started with our no-code solution for automating syncing your database with ComboCurve.
							<Link
								href='mailto:contact@combocurve.com?subject=ComboCurve Sync'
								target='_blank'
								color='secondary'
							>
								Learn More
							</Link>
						</Typography>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	</Paper>
);

const CredentialsTable = ({ credentials, handleCredentialRevoke, isLoading }) => {
	return (
		<TableContainer
			css={`
				background-color: transparent;
				.MuiTableCell-head,
				.MuiTableCell-body {
					padding: 1em 0 1em 0;
				}
			`}
		>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Created By</TableCell>
						<TableCell>Created At</TableCell>
						<TableCell />
					</TableRow>
				</TableHead>
				<TableBody>
					{credentials.map((row) => {
						return (
							<TableRow
								key={row.apiKeyName}
								css={`
									&:last-child td,
									&:last-child th {
										border: 0;
									}
								`}
							>
								<TableCell>
									{row.createdBy.firstName} {row.createdBy.lastName}
								</TableCell>
								<TableCell>{format(parseISO(row.createdAt), 'MM/dd/yyyy, HH:mm aa')}</TableCell>
								<TableCell align='right'>
									<Button
										color='secondary'
										onClick={() =>
											handleCredentialRevoke({
												apiKeyName: row.apiKeyName,
												serviceAccountKeyId: row.serviceAccountKeyId,
											})
										}
										disabled={isLoading}
									>
										Revoke
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const InformationSection = () => (
	<Grid
		container
		direction='column'
		css={`
			margin-top: ${({ theme }) => theme.spacing(2)}px;
			width: 863px;
			gap: ${({ theme }) => theme.spacing(1)}px;
		`}
	>
		<Grid item>
			<Typography
				variant='body1'
				css={`
					font-weight: bold;
				`}
			>
				Additional Information
			</Typography>
		</Grid>
		<Divider />
		{ADDITIONAL_INFORMATION_LINKS.map((link) => (
			<Grid item key={link.href}>
				<Typography variant='body2'>
					<Link href={link.href} target='_blank' color='secondary'>
						{link.text}
					</Link>
				</Typography>
			</Grid>
		))}
	</Grid>
);

export const APISync = () => {
	const { initialStep, enableProvision, createCredential, credentials, revokeCredential, isLoading } =
		useApiProvision();
	const [activeStep, setActiveStep] = useState(-1);
	const { canView } = usePermissions(SUBJECTS.API);

	const handleEnableProvision = async () => {
		await enableProvision();
		setActiveStep(activeStep + 1);
	};
	const handleNext = [handleEnableProvision, createCredential];

	const handleCredentialRevoke = async ({ apiKeyName, serviceAccountKeyId }) => {
		await revokeCredential({ apiKeyName, serviceAccountKeyId });
	};

	useEffect(() => {
		setActiveStep(initialStep);
	}, [initialStep]);

	useLoadingBar(isLoading);

	const hideCredentialsMessage = useMemo(() => activeStep === 1 && credentials.length, [activeStep, credentials]);
	const hasProvisionedAPI = useMemo(() => activeStep >= 1, [activeStep]);
	const stepTexts = useMemo(() => getStepLabels(hasProvisionedAPI), [hasProvisionedAPI]);

	if (!canView) return <NotFound />;

	return (
		<Container
			maxWidth='xl'
			css={css`
				width: 100%;
				display: flex;
				flex-direction: column;
				align-items: center;
			`}
		>
			<StyledStepper activeStep={activeStep} orientation='vertical' component={Paper}>
				{stepTexts.map((step, index) => (
					<Step key={step.label}>
						<StyledStepLabel
							$active={activeStep === index}
							optional={
								index === activeStep ? (
									<Typography>
										{(index !== 1 || !hideCredentialsMessage) && step.description}
									</Typography>
								) : (
									<Typography
										css={`
											opacity: 70%;
										`}
									>
										{(index !== 1 || !hideCredentialsMessage) && step.description}
									</Typography>
								)
							}
						>
							{step.label}
						</StyledStepLabel>

						<StepContent>
							<Typography variant='caption'>
								{(index !== 1 || !hideCredentialsMessage) && step.description2}
							</Typography>
							{!!credentials.length && activeStep === 1 && (
								<CredentialsTable
									credentials={credentials}
									handleCredentialRevoke={handleCredentialRevoke}
									isLoading={isLoading}
								/>
							)}
							<Grid
								container
								css={`
									padding-top: 2em;
								`}
							>
								{hasProvisionedAPI && (
									<Grid item xs={9}>
										<Typography variant='caption' color='textSecondary'>
											You can create up to 3 set of credentials. After that, you’ll need to revoke
											the existing credentials in order to create new credentials.
										</Typography>
									</Grid>
								)}
								<Grid item container xs={hasProvisionedAPI ? 3 : 12} justifyContent='flex-end'>
									<Grid item>
										<Button
											variant='contained'
											color='secondary'
											size='small'
											onClick={handleNext[activeStep]}
											disabled={(hasProvisionedAPI && credentials.length >= 3) || isLoading}
										>
											{step.button}
										</Button>
									</Grid>
								</Grid>
							</Grid>
						</StepContent>
					</Step>
				))}
			</StyledStepper>
			<DownloadCCSyncBanner />
			<InformationSection />
		</Container>
	);
};
