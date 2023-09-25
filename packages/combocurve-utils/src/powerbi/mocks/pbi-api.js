const PBI_CLIENT_ID = '_clientId_';
const PBI_CLIENT_SECRET = '_clientSecret_';

const PBI_WORKSPACE_ID = '_workspaceId_';

const DATASET_ID = '_datasetId_';
const REPORT_ID = '_reportId_';
const IMPORT_ID = '_importId_';

const DATASET_LIST = [{ id: '_id_' }];
const REFRESH_LIST = [{ id: '_id_' }];
const REPORT_LIST = [{ id: '_id_' }];
const IMPORT_LIST = [{ id: '_id_' }];

const REPORT_DETAILS = REPORT_LIST[0];
const IMPORT_DETAILS = IMPORT_LIST[0];

const mockEndpoints = (fetchMock) => {
	fetchMock
		.get(`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/datasets`, {
			value: DATASET_LIST,
		})
		.get(`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/datasets/${DATASET_ID}/refreshes`, {
			value: REFRESH_LIST,
		})
		.post(
			`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/datasets/${DATASET_ID}/refreshes`,
			() => 200
		)
		.post(
			`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/datasets/${DATASET_ID}/Default.UpdateParameters`,
			() => 200
		)
		.get(`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/reports`, {
			value: REPORT_LIST,
		})
		.get(`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/reports/${REPORT_ID}`, REPORT_DETAILS)
		.get(`https://api.powerbi.com/v1.0/myorg/groups/${PBI_WORKSPACE_ID}/imports/${IMPORT_ID}`, IMPORT_DETAILS);
};

module.exports = {
	DATASET_ID,
	DATASET_LIST,
	IMPORT_DETAILS,
	IMPORT_ID,
	IMPORT_LIST,
	PBI_CLIENT_ID,
	PBI_CLIENT_SECRET,
	PBI_WORKSPACE_ID,
	REFRESH_LIST,
	REPORT_DETAILS,
	REPORT_ID,
	REPORT_LIST,
	mockEndpoints,
};
