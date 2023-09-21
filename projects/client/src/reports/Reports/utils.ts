import { PowerBIRefresh, PowerBIRefreshStatus, PowerBITemplate } from '@/inpt-shared/powerbi';

export enum ReportStates {
	/*
    Does not cover the following states:
        - data being loaded
        - feature not enabled for tenant
    Those need to be handled before even getting to this logic
    */
	NOT_RUN = 'NOT_RUN', // econ not run yet
	RUNNING = 'RUNNING', // econ is running
	NOT_SUPPORTED = 'NOT_SUPPORTED', // econ run doesn't support reports
	NOT_GENERATED = 'NOT_GENERATED', // report not generated for this econ run
	TIMED_OUT = 'TIMED_OUT', // report generation started, but didn't finish
	WAITING = 'WAITING', // report is waiting/queued
	GENERATING = 'GENERATING', // report is being "generated"
	FAILED = 'FAILED', // report generation finished unsuccessfully
	EXPIRED = 'EXPIRED', // report was generated, but it has expired
	READY = 'READY', // report is ready to view
}

export const ALTERNATIVE_GHG_DESCRIPTION: { [K in ReportStates]?: string } = {
	// top level ghg
	[ReportStates.NOT_RUN]: 'You need to run Carbon first in order to generate reports',
	[ReportStates.RUNNING]: 'Your GHG run is in progress',
};

export const REPORT_STATE_DESCRIPTIONS: { [K in ReportStates]: string } = {
	// top level
	[ReportStates.NOT_RUN]: 'You need to run economics first in order to generate reports',
	[ReportStates.RUNNING]: 'Your economics run is in progress',
	[ReportStates.NOT_SUPPORTED]:
		'Economics was run using an older ComboCurve version. Run economics again in order to generate reports',
	// individual report level
	[ReportStates.NOT_GENERATED]: 'Report has not been generated yet',
	[ReportStates.WAITING]: 'Report is waiting to be generated',
	[ReportStates.TIMED_OUT]: 'Report generation timed out',
	[ReportStates.GENERATING]: 'The report is being generated. It may take a few minutes',
	[ReportStates.FAILED]: 'Report generation failed',
	[ReportStates.EXPIRED]: 'The generated report expired',
	[ReportStates.READY]: 'Report is ready to view',
};

export enum ReportActions {
	GENERATE = 'GENERATE',
	VIEW = 'VIEW',
}

const AllowedActions = {
	[ReportStates.NOT_GENERATED]: [ReportActions.GENERATE],
	[ReportStates.TIMED_OUT]: [ReportActions.GENERATE],
	[ReportStates.FAILED]: [ReportActions.GENERATE],
	[ReportStates.EXPIRED]: [ReportActions.GENERATE],
	[ReportStates.READY]: [ReportActions.VIEW],
};

const ECON_RUN_V4_INCREMENTALS = 4;

const REFRESH_STATUS_MAP: { [K in PowerBIRefreshStatus]: ReportStates } = {
	[PowerBIRefreshStatus.failed]: ReportStates.FAILED,
	[PowerBIRefreshStatus.queued]: ReportStates.WAITING,
	[PowerBIRefreshStatus.running]: ReportStates.GENERATING,
	[PowerBIRefreshStatus.completed]: ReportStates.READY,
};

export const getReportState = (
	template: PowerBITemplate,
	run: Inpt.GhgRun | Inpt.EconRun | undefined,
	refresh: PowerBIRefresh | undefined
): ReportStates => {
	if (!run) {
		return ReportStates.NOT_RUN;
	}
	if (run.status === 'pending') {
		return ReportStates.RUNNING;
	}
	if (template !== PowerBITemplate.ghg) {
		const { outputVersion } = run as Inpt.EconRun;
		if (!(Number.isFinite(outputVersion) && outputVersion >= ECON_RUN_V4_INCREMENTALS)) {
			return ReportStates.NOT_SUPPORTED;
		}
	}

	if (!refresh) {
		return ReportStates.NOT_GENERATED;
	}

	return REFRESH_STATUS_MAP[refresh.status];
};

export const getReportStateDescription = (template: PowerBITemplate, reportState: ReportStates): string => {
	if (template === PowerBITemplate.ghg) {
		return ALTERNATIVE_GHG_DESCRIPTION[reportState] ?? REPORT_STATE_DESCRIPTIONS[reportState];
	}
	return REPORT_STATE_DESCRIPTIONS[reportState];
};

export const canPerform = (state: ReportStates, action: ReportActions) => {
	const allowed = AllowedActions[state] || [];
	return allowed.indexOf(action) >= 0;
};
