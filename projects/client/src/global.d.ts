/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Alias for string but with stricter type checking
 *
 * @example
 * 	function saveWell(wellId: ObjectId<'well'>) {}
 * 	const projectId: ObjectId<'project'> = project._id;
 * 	saveWell(projectId); // Error ObjectId<'project'> !== ObjectId<'well'>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type SpecialString<T = any> = {
	/** Phony variable for further type checking, it doesn't exist at runtime, don't try to use it */
	___type: T;
} & string;

// https://github.com/LeDDGroup/ts-types-utils/blob/master/src/assign.ts
type Assign<T, K> = Pick<T, Exclude<keyof T, keyof K>> & K;

/**
 * Useful when set of properties need to either be included or not at the same time
 *
 * @example
 * 	const getWellInfo = (wellInfo: OptionalTogether<{ wellName; wellNumber }>) =>
 * 		wellInfo.wellName ? `${wellInfo.wellName} ${wellInfo.wellNumber}` : 'N/A';
 *
 * 	getWellInfo({}); // all good didn't pass wellName nor wellNumber
 * 	getWellInfo({ wellName: 'Foo' }); // ERROR expected wellNumber too
 * 	getWellInfo({ wellNumber: '13' }); // ERROR expected wellName too
 * 	getWellInfo({ wellName: 'Foo', wellNumber: '13' }); // passed both well name and well number all good now
 */
type OptionalTogether<T> = T | { [k in keyof T]?: never };

namespace Inpt {
	type StringDate = SpecialString<'type-date'>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	type ObjectId<T = any> = SpecialString<T>;

	interface Project {
		_id: ObjectId<'project'>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		history: { nameChange: any[]; scenarioDeleted: any[]; permChange: any[] };
		wells: ObjectId<'well'>[];
		scenarios: ObjectId<'scenario'>[];
		forecasts: ObjectId<'forecast'>[];
		typeCurves: ObjectId<'type-curve'>[];
		schedules: ObjectId<'schedule'>[];
		scenarioLookupTables: ObjectId<'lookup-table'>[];
		typeCurveLookupTables: ObjectId<'type-curve-lookup-table'>[];
		embeddedLookupTables: ObjectId<'embedded-lookup-table'>[];
		name: string;
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		updatedAt: StringDate;
		tags: ObjectId[];
	}

	interface Scenario {
		// TODO: complete schema
		_id: ObjectId<'scenario'>;
		wells: ObjectId<'well'>[];
		project: ObjectId<'project'>;
		name: string;
		general_options: ObjectId<'assumption'> | null;
		columns: Record<
			Assumption['assumptionKey'] | 'forecast' | 'scheduling', // TODO add the others
			{ activeQualifier: string; qualifiers: Record<string, { name: string; createdAt: StringDate }> }
		>;
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		tags: ObjectId[];
	}

	type ScenarioWellAssignment = {
		_id: ObjectId<'scenario-well-assignment'>;
		well: ObjectId<'well'>;
		index?: number;
	} & Record<string, Record<string, null | ObjectId<'assumption'>>>;

	interface User {
		_id: ObjectId<'user'>;
		bootstrap: { theme: string };
		email: string;
		role: string;
		displayRole: string;
		company: string;
		firstName: string;
		lastName: string;
		createdAt: StringDate;
		updatedAt: StringDate;
		isEnterpriseConnection: boolean;
	}

	interface FileImport {
		_id: ObjectId<'file-import'>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		stats: any;

		status:
			| 'created'
			| 'mapping'
			| 'mapped'
			| 'preprocessing'
			| 'queued'
			| 'failed'
			| 'started'
			| 'complete'
			| 'aries_started'
			| 'phdwin_started'
			| 'phdwin_complete'
			| 'aries_complete';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		events: [type: string, date: any];
		ariesSetting?: {
			allScenarios: ObjectId<'scenario'>[];
			wellCount: number;
			onlyForecast: boolean;
			createElts: boolean;
			scenarios: ObjectId<'scenario'>[];
			errorReportId: ObjectId;
		};
		project: ObjectId<'project'>;
	}

	type Well = {
		_id: ObjectId<'well'>;
		well_name: string;
		well_number: string;
		project: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} & Record<string, any>;

	interface Assumption {
		_id: ObjectId<'assumption'>;
		project: ObjectId<'project'>;
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		name: string;
		unique: boolean;
		assumptionKey:
			| 'reserves_category'
			| 'general_options'
			| 'dates'
			| 'ownership_reversion'
			| 'capex'
			| 'pricing'
			| 'differentials'
			| 'stream_properties'
			| 'expenses'
			| 'production_taxes'
			| 'production_vs_fit'
			| 'risking'
			| 'depreciation'
			| 'escalation'
			| 'emission';
		assumptionName: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		options: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		econ_function: any;
		embeddedLookupTables?: ObjectId<'embedded-lookup-table'>[];
	}

	type EconRunReports = {
		[K in import('@/inpt-shared/powerbi').PowerBITemplate]?: { lastRefreshUserRequestId?: string };
	};

	interface GhgRun {
		_id: ObjectId<'econ-run'>;
		outputParams: {
			combos: { _id: string; selected: boolean; invalid: boolean; name: string }[];
		};
		reports: EconRunReports;
		project: ObjectId<'project'>;
		runDate: string;
		scenario: ObjectId<'scenario'>;
		status: 'pending' | 'complete'; // TODO add other statuses
		user: ObjectId<'user'>;
		scenarioWellAssignments: ObjectId<'scenario-well-assignment'>;
	}

	interface EconRun {
		econFiles: { byWellMonthlyCsv: ObjectId<'file'> };
		_id: ObjectId<'econ-run'>;
		project: ObjectId<'project'>;
		scenario: ObjectId<'scenario'>;
		user: ObjectId<'user'>;
		runDate: string;
		status: 'pending' | 'complete'; // TODO add other statuses
		scenarioWellAssignments: ObjectId<'scenario-well-assignment'>[];
		econGroups: ObjectId<'econ-group'>[];
		outputVersion: number;
		reports: EconRunReports;
		// TODO add all econ run fields
		outputParams: {
			runMode: string;
			columns: { key: string; selected_options: { monthly: boolean; runMode: string; one_liner: boolean } }[];
			columnFields: Record<
				string,
				{ type; unit: string | undefined; label: string; hide: boolean; category: string }
			>;
			combos: { _id: string; selected: boolean; invalid: boolean; name: string }[];
			headersArr: string[];
		};
		outputGroups: {
			all: {
				key: string;
				name: string;
				order: number;
				total: number;
				type: string;
				unit: string;
				years: {
					months: (string | number)[]; // string if date, else number
					order: number;
					total: number;
					year: string;
				}[];
			}[];
		};
		reports: Record<string, { generationStart?: string; generationEnd?: string; generationSuccess?: string }>;
	}

	interface EconRunData {
		_id: ObjectId<'econ-run-data'>;
		run: ObjectId<'econ-run'>;
		project: ObjectId<'project'>;
		scenario: ObjectId<'scenario'>;
		user: ObjectId<'user'>;
		well: ObjectId<'well'>;
		incrementalIndex: number;
		oneLinerData: Record<
			string,
			{
				key: string;
				name: string;
				unit: string;
				type: string;
				value: number;
				order: number;
			}
		>;
	}

	interface EconRunGroupingData {
		[key: ObjectId<'well'>]: Record<string, string>;
	}

	interface Task {
		_id: ObjectId<'task'>;
		title: string;
		description: string;
		kind: string;
		kindId: string;
		progress: {
			complete: number;
			failed: number;
			total: number;
			emitter: string;
		};
		status: 'queued' | 'pending' | 'complete' | 'failed';
	}

	interface Forecast {
		_id: ObjectId<'forecast'>;
		name: string;
		runDate: StringDate;
		type?: 'deterministic' | 'probabilistic';
		project: ObjectId<'project'>;
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		updatedAt: StringDate;
		diagDate?: StringDate;
		tags: ObjectId[];
		wells: string[];
	}

	interface ScheduleQualifier {
		inputField: 'status';
		qualifier: Inpt.ObjectId<'schedule-input-qualifiers'>;
		qualifierName: string;
	}

	interface Schedule {
		_id: ObjectId<'schedule'>;
		name: string;
		createdBy: ObjectId<'user'>;
		project: ObjectId<'project'>;
		wells: ObjectId<'well'>[];
		createdAt: StringDate;
		method: string;
		setting: {
			name: string;
			updatedAt: StringDate;
			_id: ObjectId<'setting'>;
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		assignments: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		qualifiers: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		assumptions: any;
	}

	interface TypeCurve {
		_id: ObjectId<'type-curve'>;
		name: string;
		basePhase?: string;
		phaseType?: Record<string, 'rate' | 'ratio'>;
		tcType: 'rate' | 'ratio';
		project: ObjectId<'project'>;
		forecast: ObjectId<'forecast'>;
		wells: ObjectId<'well'>[];
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		updatedAt: StringDate;
	}

	interface LookupTable {
		_id: ObjectId<'lookup-table'>;
		name: string;
	}

	interface Tag {
		_id: ObjectId<'tag'>;
		name: string;
		description: string;
		color: number;
		createdBy: ObjectId<'user'>;
		createdAt: Date;
		updatedAt: Date;
	}

	interface ArchivedProject {
		_id: ObjectId<'archived-project'>;
		projectId: ObjectId<'project'>;
	}

	interface DataSource {
		_id: ObjectId<'dataSource'>;
		dataSourceTypeId: number;
		name: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		configuration: any;
		allDataSyncAgentsAllowed: boolean;
	}

	interface DataSourceType {
		_id: ObjectId<'dataSourceType'>;
		id: ObjectId<'dataSourceTypeId'>;
		key: string;
		name: string;
		isReadOnly: boolean;
	}

	interface AgentInstance {
		_id: ObjectId<'agentInstance'>;
		tenantId: ObjectId<'tenant'>;
		agent: Agent;
		dataSyncAgentId: ObjectId<'dataSyncAgentId'>;
		dataSyncAgentName: string;
		connectionId: string;
		isAvailable: boolean;
		version: string;
	}

	interface Agent {
		_id: ObjectId<'agents'>;
		tenantId: ObjectId<'tenant'>;
		description: string;
		registrationKey: string;
	}

	interface AgentState {
		_id: ObjectId<'agent-state'>;
	}

	interface DataFlowSchedule {
		schedulePlan: string;
		lastSuccessRunEndedAt: Date;
		lastRunEndedAt: Date;
		currentRunStartedAt: Date;
		nextRunStartsAt: Date;
		priority: number;
		runImmediately: boolean;
	}

	interface DataSet {
		_id: ObjectId<'pipeline'>;
		name: string;
		description: string;
		dataDirectionId: string;
		dataSourceId: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		configuration: Record<string, any>;
	}

	interface DataPipeline {
		_id: ObjectId<'pipeline'>;
		name: string;
		description: string;
		dataFlowPipelineOrder: number;
		sourceDatasetId: string;
		targetDatasetId: string;
		loadDataTypeId: number;
		parameters: string;
		steps: string;
	}

	interface DataFlow {
		_id: ObjectId<'agents'>;
		tenantId: ObjectId<'tenant'>;
		name: string;
		createdAt: Date;
		description: string;
		isValid: boolean;
		dataFlowSchedule: DataFlowSchedule;
		validationErrorMessage?: string;
	}

	interface DataFlowRun {
		_id: ObjectId<'dataFlowRun'>;
		dataFlowId: string;
		dataFlowName?: string;
		startedAt: Date;
		endedAt?: Date;
		createdAt: Date;
		isSuccess: boolean;
	}

	interface DataSecret {
		_id: ObjectId<'data-secret'>;
		key: string;
		value: string;
		hidden: boolean;
		encryptionKeyName: string;
		encryptionKeyVersion: string;
	}

	interface EmbeddedLookupTableRuleCondition {
		key: string;
		operator: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		value?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		childrenValues?: any[];
	}

	interface EmbeddedLookupTableRuleValue {
		key: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		value?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		childrenValues?: any[];
	}

	interface EmbeddedLookupTableRule {
		conditions: EmbeddedLookupTableRuleCondition[];
		values: EmbeddedLookupTableRuleValue[];
	}

	interface EmbeddedLookupTableLine {
		key: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		value?: any;
		lookup?: string;
	}

	interface EmbeddedLookupTableConfiguration {
		caseInsensitiveMatching: boolean;
		selectedHeaders: string[];
		selectedHeadersMatchBehavior?: Record<string, string>;
	}

	interface EmbeddedLookupTable {
		_id: ObjectId<'embedded-lookup-table'>;
		project: ObjectId<'project'>;
		name: string;
		assumptionKey: string;
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		tags: ObjectId[];
		configuration: EmbeddedLookupTableConfiguration;
		lines: EmbeddedLookupTableLine[][];
		rules: EmbeddedLookupTableRule[];
	}

	interface WellsCollection {
		_id: ObjectId<'wells-collection'>;
		project?: ObjectId<'project'>;
		wells_collection_items: ObjectId<'well'>[];
		createdBy: ObjectId<'user'>;
		createdAt: StringDate;
		updatedAt?: StringDate;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		[key: string]: any;
	}

	/** Api contract with main-combocurve server */
	namespace Api {
		namespace Economics {
			/** `Inpt.EconRunData` with well data resolved, returned by `/economics/getRunSumByIds/:runId` */
			type RunSum = Assign<Inpt.EconRunData, { well: Pick<Inpt.Well, '_id' | 'well_name' | 'well_number'> }>;
		}
		namespace Scenario {
			/**
			 * `Inpt.ScenarioWellAssignment` with assumption and well data resolved, returned by
			 * `/scenarios/:scenarioId/build`
			 */
			type WellAssignmentBuild = {
				_id: Inpt.ObjectId<'scenario-well-assignment'>;
				well: Inpt.Well;
			} & Record<string, Record<string, null | Inpt.Assumption>>;
		}
		namespace Tags {
			type PopulatedTag = Assign<Inpt.Tag, { createdBy: CreatedBy }>;
		}
	}

	interface ExpectedError extends Error {
		expected?: boolean;
	}

	/** CreatedBy user info seeded from the api */
	interface CreatedBy {
		firstName: string;
		lastName: string;
	}
}

// https://stackoverflow.com/a/45887328
declare module '*.svg' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const ReactComponent: any;
}

declare module '*.scss?inline' {
	const exports: Record<string, string>;
	export default exports;
}

declare module '*?worker' {
	const workerConstructor: {
		new (): Worker;
	};
	export default workerConstructor;
}
