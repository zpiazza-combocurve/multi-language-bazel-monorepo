type Status = 'created' | 'mapping' | 'mapped';

export type File = {
	_id: string;
	name: string;
	gcpName: string;
	type: string;
	bSize: number;
	mbSize: number;
	createdAt: Date; // TODO make sure it is in date format
};

export type FileInfo = {
	mapping: Record<string, string>;
	headers: string[];
	file: File;
};

export interface FileImport {
	_id: string;
	user: string;
	project: string;
	description: string;
	dataPool: string; // external | ?
	dataSource: string; // di | ?
	status: Status;
	stats: {
		totalWells: number;
		importedWells: number;
		foundWells: number;
		updatedWells: number;
		insertedWells: number;
		totalBatches: number;
		finishedBatches: number;
	};
	events: { type: Status; date: number }[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	errors: any[];
	createdAt: number;
}

export interface FileImportDI extends FileImport {
	headerFile?: FileInfo;
	productionMonthlyFile?: FileInfo;
	productionDailyFile?: FileInfo;
}
