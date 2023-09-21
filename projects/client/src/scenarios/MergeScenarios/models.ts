export interface Qualifier {
	key: string;
	originalKey: string;
	name: string;
	prior: boolean;
	scenarioName: string;
	scenarioId: string;
}

export interface MergedQualifier {
	key: string;
	name: string;
	color: string;
	assumption: string;
	qualifiers: Qualifier[];
}

export interface Assumption {
	qualifiers: MergedQualifier[];
}

export interface Assumptions {
	[key: string]: Assumption;
}

export interface MergeScenariosModel {
	assumptions: Assumptions;
	name: string;
	projectId: string;
	scenarios: string[];
}

export interface AssumptionWithQualifiers {
	key: string;
	expanded: boolean;
	wasExpanded: boolean; // for faster initial page load if there are a lot of qualifiers
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	firstScenario: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	secondScenario: any;
}
