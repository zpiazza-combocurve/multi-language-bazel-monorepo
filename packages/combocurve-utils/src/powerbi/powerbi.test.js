// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires -- TODO eslint fix later
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires -- TODO eslint fix later
const fetchMock = require('node-fetch');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { PowerBI } = require('./powerbi');
const {
	DATASET_ID,
	DATASET_LIST,
	IMPORT_DETAILS,
	IMPORT_ID,
	PBI_CLIENT_ID,
	PBI_CLIENT_SECRET,
	PBI_WORKSPACE_ID,
	REFRESH_LIST,
	REPORT_DETAILS,
	REPORT_ID,
	REPORT_LIST,
	mockEndpoints,
	// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
} = require('./mocks/pbi-api');

describe('powerbi/powerbi', () => {
	let client;

	beforeAll(() => {
		mockEndpoints(fetchMock);
	});

	afterAll(() => {
		fetchMock.mockReset();
	});

	beforeEach(() => {
		client = new PowerBI(PBI_CLIENT_ID, PBI_CLIENT_SECRET);
	});

	afterEach(() => {
		fetchMock.mockClear();
	});

	test('getDatasets()', async () => {
		const datasets = await client.getDatasets(PBI_WORKSPACE_ID);

		expect(datasets).toEqual(DATASET_LIST);
	});

	test('getDatasetRefreshHistory()', async () => {
		const history = await client.getDatasetRefreshHistory(PBI_WORKSPACE_ID, DATASET_ID);

		expect(history).toEqual(REFRESH_LIST);
	});

	test('refreshDataset()', async () => {
		await client.refreshDataset(PBI_WORKSPACE_ID, DATASET_ID);
	});

	test('updateDatasetParameters()', async () => {
		await client.updateDatasetParameters(PBI_WORKSPACE_ID, DATASET_ID);
	});

	test('getReports()', async () => {
		const reports = await client.getReports(PBI_WORKSPACE_ID);

		expect(reports).toEqual(REPORT_LIST);
	});

	test('getReportDetails()', async () => {
		const report = await client.getReportDetails(PBI_WORKSPACE_ID, REPORT_ID);

		expect(report).toEqual(REPORT_DETAILS);
	});

	test('getImportDetails()', async () => {
		const importDetails = await client.getImportDetails(PBI_WORKSPACE_ID, IMPORT_ID);

		expect(importDetails).toEqual(IMPORT_DETAILS);
	});
});
