import { faCheck, faDownload, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Grid, GridSize } from '@material-ui/core';
import { AgGridColumn } from 'ag-grid-react';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';

import AgGrid from '@/components/AgGrid';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Typography,
} from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';

import { generateCollisionReport, generateMissingIdReport } from './editWellIdentifierApi';

type CollisionDialogProps = DialogProps<boolean> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	collisionsData: any;
	missingIds?: string[];
	selectionNumber: number;
	operation: 'scopeToCompany' | 'chosenId' | 'dataSource' | 'scopeToProject';
};

const DividerStyled = styled(Divider)`
	margin-top: ${({ theme }) => theme.spacing(1)}px;
	margin-bottom: ${({ theme }) => theme.spacing(1)}px;
`;

const HighlightedText = styled(Box).attrs({
	component: 'div',
})`
	display: inline-block;
	margin-right: 1ch;
	font-weight: bold;
`;
const TABLE_HEADERS = {
	collisions: {
		well_name: 'Well Name',
		well_number: 'Well Number',
		chosenID: 'Chosen ID',
		dataSource: 'Source',
	},
	missingIds: {
		well_name: 'Well Name',
		well_number: 'Well Number',
		chosenID: 'Previous ID',
		newID: 'New ID',
	},
};

const getDialogLabels = (operation, collisionsCount) => {
	const initialValues = {
		title: '',
		description: 'All wells will be converted. No conflicts found.',
		readyCountLabel: '',
		collisionsCountLabel: '',
		missingIdCountLabel: '',
		applyButton: 'Apply',
		cancelButton: 'Cancel',
	};

	if (operation === 'scopeToCompany') {
		return {
			...initialValues,
			title: 'Changing Wells to Company Scope',
			readyCountLabel: '| Ready to convert',
			collisionsCountLabel: "| The Scope won't be changed for the following wells",
			...(collisionsCount && {
				description:
					'Wells with a matching Chosen ID, Source and Scope will not be converted. Please review the results below:',
			}),
		};
	}
	if (operation === 'chosenId') {
		return {
			...initialValues,
			title: 'Changing Wells Chosen ID',
			readyCountLabel: '| Ready to convert',
			collisionsCountLabel: '| The following wells Chosen ID will not be changed',
			missingIdCountLabel: '| The following wells Chosen ID will not be changed',
			...(collisionsCount && {
				description:
					'Wells with a matching Chosen ID, Source and Scope will not be converted. Please review the results below:',
			}),
		};
	}
	if (operation === 'dataSource') {
		return {
			...initialValues,
			title: 'Changing Wells Data Source',
			readyCountLabel: '| Ready to convert',
			collisionsCountLabel: '| The following wells Data Source will not be changed',
			...(collisionsCount && {
				description:
					'Wells with a matching Chosen ID, Source and Scope will not be converted. Please review the results below:',
			}),
		};
	}
	if (operation === 'scopeToProject') {
		return {
			...initialValues,
			title: 'Changing Wells to Project Scope',
			readyCountLabel: '| Ready to convert',
			collisionsCountLabel: '| The following wells prevent changes in Scope',
			...(collisionsCount && {
				description:
					'Cannot complete the copy action due to conflicts from wells with a matching Chosen ID, Source and Scope. Please review the results below:',
			}),
		};
	}
	return initialValues;
};

const missingIdRenderer = ({ value, formattedValue }) => {
	if (!value && !formattedValue)
		return (
			<Box
				css={`
					display: flex;
					align-items: center;
					gap: ${({ theme }) => theme.spacing(1)}px;
				`}
			>
				<Avatar
					css={`
						background-color: ${({ theme }) => theme.palette.warning.main};
						width: 14px !important;
						height: 14px !important;
					`}
				>
					{' '}
				</Avatar>
				<Typography>Null</Typography>
			</Box>
		);
	return (value || formattedValue) ?? null;
};

export function CollisionsDialog({
	visible,
	resolve,
	collisionsData,
	missingIds = [],
	selectionNumber,
	operation,
}: CollisionDialogProps) {
	const { project } = useAlfa();
	const collisions = useMemo(() => Object.keys(collisionsData), [collisionsData]);
	const readyCount = useMemo(
		() => selectionNumber - collisions.length - (missingIds?.length || 0),
		[missingIds, selectionNumber, collisions]
	);
	const tablesToShow = useMemo(
		() => [collisions, missingIds].reduce((prev, cur) => (!_.isEmpty(cur) ? Number(prev) + 1 : Number(prev)), 0),
		[collisions, missingIds]
	);

	const handleGenerateCollisionReport = async () => {
		if (collisions) {
			const response = await generateCollisionReport({ collisions: collisionsData });
			if (response.message) {
				confirmationAlert(response.message);
			}
		}
	};

	const handleGenerateMissingIdReport = async () => {
		if (missingIds) {
			const response = await generateMissingIdReport({ wells: missingIds });
			if (response.message) {
				confirmationAlert(response.message);
			}
		}
	};

	const labels = useMemo(() => getDialogLabels(operation, collisions.length), [operation, collisions]);

	const getMissingIdRows = useMemo(
		() => ({
			getRows: async (params) => {
				try {
					const { rowData, rowCount = missingIds.length } = await (postApi(`/well/agGrid`, {
						companyOnly: false,
						extraFilters: [
							{
								excludeAll: true,
								include: missingIds,
							},
						],
						fields: Object.keys(TABLE_HEADERS.missingIds),
						getCount: false,
						project: project?._id,
						request: params.request,
					}) as Promise<{
						ids: string[];
						rowData: object[];
						rowCount: number;
					}>);
					params.success({ rowData, rowCount });
					// eslint-disable-next-line no-useless-return -- TODO eslint fix later
					return;
				} catch (err) {
					params.fail();
				}
			},
		}),
		[project, missingIds]
	);

	const getCollisionRows = useMemo(
		() => ({
			getRows: async (params) => {
				try {
					const { rowData, rowCount = collisions.length } = await (postApi(`/well/agGrid`, {
						companyOnly: false,
						extraFilters: [
							{
								excludeAll: true,
								include: collisions,
							},
						],
						fields: Object.keys(TABLE_HEADERS.collisions),
						getCount: false,
						project: project?._id,
						request: params.request,
					}) as Promise<{
						ids: string[];
						rowData: object[];
						rowCount: number;
					}>);
					params.success({ rowData, rowCount });
					// eslint-disable-next-line no-useless-return -- TODO eslint fix later
					return;
				} catch (err) {
					params.fail();
				}
			},
		}),
		[project, collisions]
	);

	const canRun = useMemo(
		() => (operation === 'scopeToProject' ? !collisions.length : !!readyCount),
		[operation, collisions.length, readyCount]
	);

	return (
		// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
		<Dialog open={visible} onClose={() => {}} maxWidth={tablesToShow > 1 ? 'lg' : 'md'} fullWidth>
			<DialogTitle>{labels.title}</DialogTitle>
			<DialogContent>
				<Typography
					variant='subtitle1'
					css={`
						font-weight: 500;
					`}
				>
					{labels.description}
				</Typography>
				<Typography
					variant='body2'
					css={`
						margin-top: ${({ theme }) => theme.spacing(2)}px;
					`}
				>
					<HighlightedText
						css={`
							color: ${({ theme }) => theme.palette.primary.main};
						`}
					>
						<FontAwesomeIcon
							size='1x'
							icon={faCheck}
							css={`
								margin-right: 1ch;
							`}
						/>
						{pluralize(readyCount, 'well', 'wells')}
					</HighlightedText>
					{labels.readyCountLabel}
				</Typography>
				<DividerStyled />
				{!!tablesToShow && (
					<Grid container spacing={2}>
						{!!missingIds?.length && (
							<Grid item xs={(12 / tablesToShow) as GridSize}>
								<Box
									component='div'
									display='flex'
									width='100%'
									justifyContent='space-between'
									alignItems='center'
								>
									<Typography variant='body2'>
										<HighlightedText
											css={`
												color: ${({ theme }) => theme.palette.warning.main};
											`}
										>
											<FontAwesomeIcon
												icon={faExclamationTriangle}
												css={`
													margin-right: 1ch;
												`}
											/>
											{missingIds.length
												? `${pluralize(missingIds.length, 'well', 'wells')} with missing data`
												: 'No conflicts found.'}
										</HighlightedText>
										{!!missingIds.length && labels.missingIdCountLabel}
									</Typography>
									{!!missingIds.length && (
										<IconButton
											size='small'
											color='default'
											onClick={handleGenerateMissingIdReport}
										>
											{faDownload}
										</IconButton>
									)}
								</Box>
								<AgGrid
									css='height: 30rem; margin-top: 1rem;'
									rowModelType='serverSide'
									serverSideStoreType='partial'
									getRowNodeId='_id'
									defaultColDef={{ flex: 1 }}
									columnDefs={Object.keys(TABLE_HEADERS.missingIds).map((h) => ({
										headerName: TABLE_HEADERS.missingIds[h],
										field: h,
										cellRenderer: h === 'newID' ? missingIdRenderer : undefined,
									}))}
									serverSideDatasource={getMissingIdRows}
								>
									{Object.keys(TABLE_HEADERS.missingIds).map((h) => (
										<AgGridColumn key={h} field={h} headerName={TABLE_HEADERS.missingIds[h]} />
									))}
								</AgGrid>
							</Grid>
						)}
						{!!collisions.length && (
							<Grid item xs={(12 / tablesToShow) as GridSize}>
								<Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
									<Typography variant='body2'>
										<HighlightedText
											css={`
												color: ${({ theme }) => theme.palette.warning.main};
											`}
										>
											<FontAwesomeIcon
												icon={faExclamationTriangle}
												css={`
													margin-right: 1ch;
												`}
											/>
											{collisions.length
												? pluralize(collisions.length, 'conflict', 'conflicts')
												: 'No conflicts found.'}
										</HighlightedText>
										{!!collisions.length && labels.collisionsCountLabel}
									</Typography>
									{!!collisions.length && (
										<IconButton
											size='small'
											color='default'
											onClick={handleGenerateCollisionReport}
										>
											{faDownload}
										</IconButton>
									)}
								</Box>
								<AgGrid
									css='height: 30rem; margin-top: 1rem;'
									rowModelType='serverSide'
									serverSideStoreType='partial'
									getRowNodeId='_id'
									defaultColDef={{ flex: 1 }}
									serverSideDatasource={getCollisionRows}
								>
									{Object.keys(TABLE_HEADERS.collisions).map((h) => (
										<AgGridColumn key={h} field={h} headerName={TABLE_HEADERS.collisions[h]} />
									))}
								</AgGrid>
							</Grid>
						)}
					</Grid>
				)}
			</DialogContent>
			<DialogActions
				css={`
					padding: ${({ theme }) => `${theme.spacing(2)}px ${theme.spacing(3)}px`};
				`}
			>
				<Button onClick={() => resolve(false)} color='secondary' variant={canRun ? 'text' : 'contained'}>
					{labels.cancelButton}
				</Button>
				{canRun && (
					<Button color='secondary' variant='contained' onClick={() => resolve(true)}>
						{labels.applyButton}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
