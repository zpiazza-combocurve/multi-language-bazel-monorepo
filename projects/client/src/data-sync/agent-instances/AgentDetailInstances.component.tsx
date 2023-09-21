import { faClock, faCompress, faExclamationTriangle, faExpand, faRedo } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import ErrorBoundary from '@/components/ErrorBoundary';
import { Box, IconButton, Typography } from '@/components/v2';
import { Layout } from '@/layouts/Layout';
import { makeField } from '@/module-list/ModuleList';
import ModuleList, { Fields, useModuleListRef } from '@/module-list/ModuleListV2';
import { Item, ItemsFetcher } from '@/module-list/types';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import { URLS } from '@/urls';

import { DetailSidebar } from '../components/DetailSidebar';
import { Expandable } from '../components/Expandable';
import { MainButton } from '../components/MainButton';
import { dataSyncRoutes } from '../data-flows/DataFlowDetail.hooks';

const buildRunParams = (dataFlowId: string, runId: string, pipelineId: string) =>
	`/data-sync/data-flows/${dataFlowId}/runs?runId=${runId}&pipelineId=${pipelineId}`;

type AgentState = Assign<Item, Inpt.AgentState>;
type AgentInstance = Assign<Item, Inpt.AgentInstance>;

type AgentInstancesDetailComponentType = {
	loading?: boolean;
	hasLatestVersion?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: any;
	promptChooseVersionDialog: () => Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	permissions: any;
	fetchAgentStates: ItemsFetcher<{ page; limit; getAll }, AgentState>;
	fetchAgentInstances: ItemsFetcher<{ page; limit; getAll }, AgentInstance>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handleStateMessageCellClicked: (a: { value: any }) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handlePartialResultCellClicked: (a: { value: any }) => any;
};

export const AgentInstancesDetailComponent: React.FC<AgentInstancesDetailComponentType> = ({
	loading,
	hasLatestVersion,
	data,
	promptChooseVersionDialog,
	permissions,
	fetchAgentStates,
	fetchAgentInstances,
	handleStateMessageCellClicked,
	handlePartialResultCellClicked,
}) => {
	const { canRequestUpdate } = permissions;
	const { moduleListProps: stateProps, runFilters: runStateFilters } = useModuleListRef({});
	const { moduleListProps: runProps, runFilters: runFlowFilters } = useModuleListRef({});

	const { isIdle, dataSyncAgentName, version } = data?.data ?? {};

	const [expanded, setExpanded] = useState({
		states: false,
		history: false,
	});

	if (loading) {
		return null;
	}

	return (
		<ErrorBoundary>
			<Breadcrumb url={URLS.agentInstances} label={dataSyncAgentName ?? 'Loading'} />
			<Layout
				padded={false}
				clean
				sidebar={
					<DetailSidebar>
						<DetailSidebar.Action>
							<Typography variant='h6'>Details</Typography>
							<MainButton
								onClick={async () => {
									await promptChooseVersionDialog();
								}}
								disabled={!canRequestUpdate}
							>
								Request update
							</MainButton>
						</DetailSidebar.Action>

						<DetailSidebar.Card
							title='Availability'
							label={
								<FontAwesomeIcon
									css={{ marginLeft: '5px' }}
									title='State'
									color={isIdle ? 'green' : 'red'}
									icon={faClock}
								/>
							}
						>
							{isIdle ? 'Idle' : 'In use'}
						</DetailSidebar.Card>

						<DetailSidebar.Card
							title='Version'
							label={
								!hasLatestVersion ? (
									<FontAwesomeIcon
										css={{ marginLeft: '5px' }}
										title='There is a new version available'
										color='orange'
										icon={faExclamationTriangle}
									/>
								) : null
							}
						>
							{version?.split('+')[0]}
						</DetailSidebar.Card>
					</DetailSidebar>
				}
			>
				<Box
					sx={{
						display: 'flex',
						flex: '1 1 auto',
						flexDirection: 'column',
					}}
				>
					<Expandable
						isExpanded={expanded.history}
						onChange={() => {
							setExpanded({
								states: false,
								history: !expanded.history,
							});
						}}
					>
						{({ expandStyles, isExpanded, toggleExpand }) => (
							<Box sx={{ flex: '0.45 1 auto', marginRight: 16, ...expandStyles }}>
								<ModuleList
									{...runProps}
									feat='runHistory'
									title={<Typography>Run history</Typography>}
									hideActions
									fetch={fetchAgentInstances}
									globalActions={
										<>
											<IconButton onClick={runFlowFilters}>{faRedo}</IconButton>

											<IconButton onClick={toggleExpand}>
												{isExpanded ? faCompress : faExpand}
											</IconButton>
										</>
									}
									itemDetails={[
										{
											key: 'dataFlowName',
											label: 'Data Flow Name',
											cellRenderer: 'link',
											value: (item) => ({
												url: dataSyncRoutes(item.dataFlowId).view('').root,
												label: item.dataFlowName,
											}),
											sort: true,
											width: 180,
										},
										{
											key: 'dataPipelineName',
											label: 'Data Pipeline Name',
											cellRenderer: 'link',
											value: (item) => ({
												url: `/data-sync/data-flows/${item.dataFlowId}/view/pipelines/${item.dataPipelineId}`,
												label: item.dataPipelineName,
											}),
											sort: true,
											width: 180,
										},
										makeField('dataPipelineOrder', 'Data Pipeline Order', true, 180),
										Fields.startedAt,
										Fields.endedAt,
										{
											key: 'isSuccess',
											label: 'Is Success',
											value: ({ isSuccess }) => (isSuccess ? 'True' : 'False'),
											title: ({ isSuccess }) => (isSuccess ? 'True' : 'False'),
											width: 120,
											sort: true,
										},
										makeField('pipelineProcessingState', 'Pipeline Processing State', true),
										{
											...makeField('partialResult', 'Partial Result', true),
											onCellClicked: handlePartialResultCellClicked,
										},
										{
											label: 'Logs',
											cellRenderer: 'link',
											value: (item: {
												dataFlowId: string;
												dataFlowRunId: string;
												id: string;
											}) => ({
												url: buildRunParams(item.dataFlowId, item.dataFlowRunId, item.id),
												label: 'Logs',
											}),
											width: 100,
										},
									]}
								/>
							</Box>
						)}
					</Expandable>

					<Expandable
						isExpanded={expanded.states}
						onChange={() => {
							setExpanded({
								states: !expanded.states,
								history: false,
							});
						}}
					>
						{({ isExpanded, expandStyles, toggleExpand }) => (
							<Box sx={{ flex: '0.55 1 auto', marginRight: 16, ...expandStyles }}>
								<ModuleList
									{...stateProps}
									title={<Typography>States</Typography>}
									feat='states'
									globalActions={
										<>
											<IconButton onClick={runStateFilters}>{faRedo}</IconButton>

											<IconButton onClick={toggleExpand}>
												{isExpanded ? faCompress : faExpand}
											</IconButton>
										</>
									}
									fetch={fetchAgentStates}
									itemDetails={[
										{ ...Fields.createdAt, width: 180 },
										Fields.isIdle,
										{ ...Fields.message, onCellClicked: handleStateMessageCellClicked },
									]}
									hideActions
								/>
							</Box>
						)}
					</Expandable>
				</Box>
			</Layout>
		</ErrorBoundary>
	);
};
