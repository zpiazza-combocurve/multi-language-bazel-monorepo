const request = require('supertest');

const config = require('../../config');
const { createWellsPayload, createProjectsPayload } = require('../../../helpers/data-generator');
const { connectToDb } = require('../../database');
const { testHeadMethod } = require('../../helpers/test/head-methods');
const { toApiProject } = require('../fields');

const WELL_COUNT = 2;

let app;
let apiProjectCompanyWells;
let connection;
let project;
let wells;

describe('/v1/projects/{projectId}/company-wells', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	afterAll(() => {
		connection.close();
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);

		project = toApiProject(project);

		// Create company wells
		wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/wells`).send(wells).set(config.headers);

		apiProjectCompanyWells = response.body.results.map(({ id, chosenID, dataSource }) => ({
			id,
			chosenID,
			dataSource,
		}));
	});

	test('Get project company wells', async () => {
		let response = await app
			.post(`/v1/projects/${project.id}/company-wells`)
			.send(apiProjectCompanyWells)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(apiProjectCompanyWells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(apiProjectCompanyWells.length);

		const wellsResponse = await Promise.all(
			apiProjectCompanyWells.map(
				async (w) =>
					await app
						.get(`/v1/projects/${project.id}/company-wells?chosenID=${w.chosenID}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < wellsResponse.length; index++) {
			expect(wellsResponse[index].status).toBe(200);
			expect(wellsResponse[index].body[0]).toMatchObject({ ...wells[index], ...apiProjectCompanyWells[index] });
		}

		expect(wellsResponse.length).toBe(apiProjectCompanyWells.length);
	});

	test('Get project company well by id', async () => {
		const [well] = apiProjectCompanyWells;

		let response = await app.post(`/v1/projects/${project.id}/company-wells`).send(well).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const [postedWell] = response.body.results;

		const wellResponse = await app
			.get(`/v1/projects/${project.id}/company-wells/${postedWell.id}`)
			.set(config.headers);

		expect(wellResponse.status).toBe(200);
		expect(wellResponse.body).toMatchObject({ ...wells[0], ...well });
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD project company wells', async () => {
		let response = await app
			.post(`/v1/projects/${project.id}/company-wells`)
			.send(apiProjectCompanyWells)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(apiProjectCompanyWells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(apiProjectCompanyWells.length);

		await testHeadMethod(app, `/v1/projects/${project.id}/company-wells`, config.headers, WELL_COUNT);
	});

	test('DELETE wells', async () => {
		let response = await app
			.post(`/v1/projects/${project.id}/company-wells`)
			.send(apiProjectCompanyWells)
			.set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(apiProjectCompanyWells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(apiProjectCompanyWells.length);

		// Delete wells
		response = await app
			.delete(
				`/v1/projects/${project.id}/company-wells?dataSource=${apiProjectCompanyWells[0].dataSource}&chosenID=${apiProjectCompanyWells[0].chosenID}&chosenID=${apiProjectCompanyWells[1].chosenID}`,
			)
			.set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('2');

		// Check if deleted
		response = await app
			.head(
				`/v1/projects/${project.id}/company-wells?dataSource=${apiProjectCompanyWells[0].dataSource}&chosenID=${apiProjectCompanyWells[0].chosenID}`,
			)
			.set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');

		response = await app
			.head(
				`/v1/projects/${project.id}/company-wells?dataSource=${apiProjectCompanyWells[0].dataSource}&chosenID=${apiProjectCompanyWells[1].chosenID}`,
			)
			.set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');
	});
});
