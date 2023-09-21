interface ProjectInfo {
	archivedProjectId: string;
	projectName: string;
	versionName: string;
	wellsCount: number;
	scenarios: { name: string; updated: string }[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecasts: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	typecurves: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	assumptions: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	schedules: any[];
	userId: string;
	userFirstName: string;
	userLastName: string;
	createdAt: string;
}
export interface Archive {
	_id: string;
	projectId: string;
	archivedProjectId: string;
	projectName: string;
	versionName: string;
	wellsCount: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	scenarios: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecasts: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	typecurves: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	assumptions: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	schedules: any;
	userId: string;
	userFirstName: string;
	userLastName: string;
	createdAt: 1;
}

/** Module list result */
export interface ArchivedProjectItem {
	_id: string;
	name: string;
	filteredVersionsCount: 9;
	projectId: '5f7b8c6209ac3f40d0af5d82';
	archivedProject: Inpt.Project;
	allVersionsCount: number;
	lastVersion: Archive;
}
