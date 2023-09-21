export const importingStatus: Inpt.FileImport['status'][] = ['preprocessing', 'queued', 'started'];
export const ariesImportingStatus: Inpt.FileImport['status'][] = [...importingStatus, 'complete', 'aries_started'];
export const phdwinImportingStatus: Inpt.FileImport['status'][] = [...importingStatus, 'complete', 'phdwin_started'];
export const statuses: Partial<Record<Inpt.FileImport['status'], { loadingMessage: string }>> = {
	preprocessing: {
		loadingMessage: 'Preprocessing Import Files',
	},
	queued: {
		loadingMessage: 'Import in queue',
	},
	started: {
		loadingMessage: 'Importing well headers and production data',
	},
	complete: {
		loadingMessage: 'Retrieving Stats',
	},
};

export const phdwinStatuses: Partial<Record<Inpt.FileImport['status'], { loadingMessage: string }>> = {
	...statuses,
	complete: {
		loadingMessage: 'Starting PHDWIN Import',
	},
	phdwin_started: {
		loadingMessage: 'Importing PHDWIN Database',
	},
	phdwin_complete: {
		loadingMessage: 'Retrieving Stats',
	},
};

export const ariesStatuses: Partial<Record<Inpt.FileImport['status'], { loadingMessage: string }>> = {
	...statuses,
	complete: {
		loadingMessage: 'Starting ARIES Import',
	},
	aries_started: {
		loadingMessage: 'Importing AC_ECONOMIC',
	},
	aries_complete: {
		loadingMessage: 'Retrieving Stats',
	},
};

export function getImportMessage(status: Inpt.FileImport['status']) {
	return statuses[status]?.loadingMessage;
}

export function getAriesImportMessage(status: Inpt.FileImport['status']) {
	return ariesStatuses[status]?.loadingMessage;
}

export function getPhdwinImportMessage(status: Inpt.FileImport['status']) {
	return phdwinStatuses[status]?.loadingMessage;
}
