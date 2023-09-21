import { Button } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash';
import { Card, CardActions, CardText, CardTitle, Cell, Grid } from 'react-md';
import { useMutation, useQueryClient } from 'react-query';
import { Link, useMatch, useNavigate } from 'react-router-dom';

import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useUserRun } from '@/economics/Economics/shared/api';
import { LastGhgRunQuery, UserRunQuery } from '@/economics/shared/queries';
import { confirmationAlert, customErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useSocket } from '@/helpers/socket';
import { assert } from '@/helpers/utilities';
import { PowerBIRefresh, PowerBIRefreshStatus, PowerBITemplate } from '@/inpt-shared/powerbi';
import { projectRoutes } from '@/projects/routes';
import { useCurrentScenario } from '@/scenarios/api';

import { PowerBIRefreshQuery, generateReport, useReportAvailabilityQuery } from './api';
import { ReportActions, ReportStates, canPerform, getReportState, getReportStateDescription } from './utils';

const LOADING_STATE = Symbol('loading state');
type LOADING_STATE = typeof LOADING_STATE;
const LOADING_DESCRIPTION = 'Loading report state';

const getStateText = (template: PowerBITemplate, reportState: LOADING_STATE | ReportStates) => {
	if (reportState === LOADING_STATE) {
		return LOADING_DESCRIPTION;
	}

	return getReportStateDescription(template, reportState);
};

interface ReportCardProps {
	template: PowerBITemplate;
	viewPage: string;
	title: string;
	description: string;
	state: ReportStates;
	onGenerate: () => void;
	isLoading: boolean;
}

function ReportCard(props: ReportCardProps) {
	const { template, title, description, state, onGenerate, viewPage, isLoading } = props;

	const stateText = getStateText(template, isLoading ? LOADING_STATE : state);

	const canView = !isLoading && canPerform(state, ReportActions.VIEW);
	const canGenerate = !isLoading && (canPerform(state, ReportActions.GENERATE) || state === ReportStates.READY);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { pathname } = useMatch<any, any>(
		`${projectRoutes.project(':projectId').scenario(':scenarioId').reports}/*`
	)!;

	const getTaggingPropByTemplate = (templateType: PowerBITemplate) => {
		if (templateType === PowerBITemplate.oneliner) {
			return getTaggingProp('scenario', 'oneLine');
		} else if (templateType === PowerBITemplate.reservesGroup) {
			return getTaggingProp('scenario', 'resCat');
		} else if (templateType === PowerBITemplate.ghg) {
			return getTaggingProp('scenario', 'carbon');
		}

		return {};
	};

	return (
		<Cell>
			<Card
				css={`
					height: 100%;
				`}
				className='paper-1 on-hover-paper-2'
			>
				<CardTitle title={title} subtitle={description} />
				<CardText>{stateText}</CardText>
				<CardActions
					css={`
						display: flex;
						justify-content: flex-end;
					`}
				>
					<Button
						disabled={!canGenerate}
						onClick={onGenerate}
						color='primary'
						{...getTaggingPropByTemplate(template)}
					>
						Generate
					</Button>
					<Button disabled={!canView} color='primary' to={`${pathname}/${viewPage}`} component={Link}>
						View
					</Button>
				</CardActions>
			</Card>
		</Cell>
	);
}

const REPORT_INFO: { [K in PowerBITemplate]: { title: string; description: string; order: number } } = {
	[PowerBITemplate.ghg]: {
		title: 'Carbon Summary',
		description: 'Visualizations of emission results to make informed carbon planning',
		order: 4,
	},
	[PowerBITemplate.monthly]: {
		title: 'Monthly Well Data',
		description: 'Visualizations with monthly resolution for one, multiple, or all wells',
		order: 3,
	},
	[PowerBITemplate.oneliner]: {
		title: 'One-Line Summary',
		description: 'Visualizations using one liner report to make informed business decisions',
		order: 1,
	},
	[PowerBITemplate.reservesGroup]: {
		title: 'Res Cat Summary',
		description: 'Visualizations with monthly resolution aggregated by reserves category',
		order: 2,
	},
};

function Report(props: { template: PowerBITemplate }) {
	const { template } = props;
	const { scenario } = useCurrentScenario();

	assert(scenario, 'Expected scenario');

	const scenarioId = scenario._id;

	// it is fine to use a hook conditionally since the condition will never change between rerender, this could be improved...
	const RunQuery = template === PowerBITemplate.ghg ? LastGhgRunQuery : UserRunQuery;

	const runQuery = RunQuery.useQuery(scenarioId);

	const run = runQuery.data;

	const refreshUserRequestId = run?.reports?.[template]?.lastRefreshUserRequestId;
	const runId = run?._id;

	const socketName = `powerbi-refresh-${runId}-${template}`;

	const queryClient = useQueryClient();

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const reportStatusQuery = PowerBIRefreshQuery.useQuery(template, refreshUserRequestId!, {
		enabled: Boolean(refreshUserRequestId),
	});

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const generateReportMutation = useMutation(() => generateReport({ runId: runId!, socketName, template }), {
		onSettled: (refresh) => {
			if (!refresh) {
				return;
			}
			RunQuery.invalidate(scenarioId);
			queryClient.setQueryData(
				RunQuery.key(scenarioId),
				produce<Inpt.EconRun | Inpt.GhgRun>((draft) => {
					draft.reports ??= {};
					draft.reports[template] ??= {};
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					draft.reports[template]!.lastRefreshUserRequestId = refresh.userRequestId;
				})
			);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			queryClient.setQueryData(PowerBIRefreshQuery.key(template, refreshUserRequestId!), refresh);
		},
	});

	const isLoading = runQuery.isLoading || reportStatusQuery.isLoading || generateReportMutation.isLoading;

	const state = getReportState(template, run, reportStatusQuery.data);

	useLoadingBar(
		isLoading ||
			[PowerBIRefreshStatus.queued, PowerBIRefreshStatus.running].includes(
				reportStatusQuery.data?.status as PowerBIRefreshStatus
			)
	);
	const navigate = useNavigate();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { pathname } = useMatch<any, any>(
		`${projectRoutes.project(':projectId').scenario(':scenarioId').reports}/*`
	)!;

	useSocket(
		socketName,
		(refresh: PowerBIRefresh) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			queryClient.setQueryData(PowerBIRefreshQuery.key(template, refreshUserRequestId!), refresh);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			PowerBIRefreshQuery.invalidate(template, refreshUserRequestId!);
			if (refresh.status === PowerBIRefreshStatus.completed) {
				confirmationAlert('Report successfully generated');
				navigate(`${pathname}/${template}`); // redirects to reports view page
			} else if (refresh.status === PowerBIRefreshStatus.failed) {
				customErrorAlert('Error', 'Report generation failed');
			}
		},
		true
	);

	return (
		<ReportCard
			template={template}
			title={REPORT_INFO[template]?.title}
			description={REPORT_INFO[template]?.description}
			viewPage={template}
			state={state}
			onGenerate={() => generateReportMutation.mutate()}
			isLoading={isLoading}
		/>
	);
}

const classNames = {
	field: 'field-section',
	fieldItem: 'field-section-item',
};

export function ReportsList() {
	const { run, loading: loadingRun } = useUserRun(); // TODO this needs to be adjusted for carbon run

	const { isFetching: loadingReports, data: reports } = useReportAvailabilityQuery();

	return (
		<div
			css={`
				padding: 1rem;
				.${classNames.field} {
					display: flex;
					flex-direction: column;
					.${classNames.fieldItem} {
						display: flex;

						& > :first-child,
						& > :last-child {
							flex-basis: 50%;
						}
					}
				}
			`}
		>
			<Grid>
				<Cell>
					<Card>
						<CardTitle title='Reports' subtitle='From the last economics run' />
						<CardText className={classNames.field}>
							<Placeholder loading={loadingRun}>
								{run ? (
									<>
										{' '}
										<div className={classNames.fieldItem}>
											<span>Wells:</span>
											<span>{run.scenarioWellAssignments.length}</span>
										</div>
										<div className={classNames.fieldItem}>
											<span>Run At:</span>
											<span>{new Date(run.runDate).toLocaleString()}</span>
										</div>
									</>
								) : (
									getReportStateDescription(PowerBITemplate.monthly, ReportStates.NOT_RUN)
								)}
							</Placeholder>
						</CardText>
					</Card>
				</Cell>
			</Grid>
			<Placeholder loading={loadingReports} loadingText='Loading Reports'>
				<Grid>
					{_.sortBy(reports, (v) => REPORT_INFO[v.template].order)?.map((report) => (
						<Report key={report.template} template={report.template} />
					))}
				</Grid>
			</Placeholder>
		</div>
	);
}

export default ReportsList;
