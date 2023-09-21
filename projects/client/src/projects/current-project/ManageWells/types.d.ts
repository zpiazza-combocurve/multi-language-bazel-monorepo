export interface ScenarioEconRun {
	_id: string;
	wells: string[];
	batchSize: number;
	outputParams: {
		runMode: string;
		suggestedHeaders: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		generalOptions: any;
		columns: {
			key: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			selected_options: any;
		}[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		columnFields: any;
		projectName: string;
		scenarioName: string;
		userName: string;
		generalOptionsName: string;
		combos?: {
			name: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			qualifiers: any;
		}[];
	};
	outputVersion: number;
	project: string;
	runDate: string;
	scenario: { name: string };
	status: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	usedUmbrellas: any[];
	user: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	files: any[];
	createdAt: string;
	updatedAt: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	outputGroups: any;
}
