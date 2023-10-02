const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../config');
const { createWellsPayload, createProjectsPayload } = require('../../../helpers/data-generator');
const { connectToDb } = require('../../database');
const { testHeadMethod } = require('../../helpers/test/head-methods');
const { toApiProject } = require('../fields');

const WELL_COUNT = 2;

let app;
let connection;
let project;

describe('/v1/projects/{projectId}/wells', () => {
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
	});

	test('Get project wells', async () => {
		const wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(wells).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(wells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(wells.length);

		const wellsResponse = await Promise.all(
			wells.map(
				async (w) =>
					await app.get(`/v1/projects/${project.id}/wells?chosenID=${w.chosenID}`).set(config.headers),
			),
		);

		for (let index = 0; index < wellsResponse.length; index++) {
			expect(wellsResponse[index].status).toBe(200);
			expect(wellsResponse[index].body[0]).toMatchObject(wells[index]);
		}

		expect(wellsResponse.length).toBe(wells.length);
	});

	test('Get project well by id', async () => {
		const [well] = createWellsPayload(1);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(well).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const [postedWell] = response.body.results;

		const wellResponse = await app.get(`/v1/projects/${project.id}/wells/${postedWell.id}`).set(config.headers);

		expect(wellResponse.status).toBe(200);
		expect(wellResponse.body).toMatchObject(well);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD project wells', async () => {
		const wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(wells).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(wells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(wells.length);

		// TODO: test more than 1, should be easier after multi filter is allowed
		await testHeadMethod(app, `/v1/projects/${project.id}/wells`, config.headers, WELL_COUNT);
	});

	test('DELETE wells by chosenID', async () => {
		// Insert wells
		const wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(wells).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(wells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(wells.length);

		// Delete wells
		response = await app
			.delete(
				`/v1/projects/${project.id}/wells?dataSource=${wells[0].dataSource}&chosenID=${wells[0].chosenID}&chosenID=${wells[1].chosenID}`,
			)
			.set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('2');

		// Check if deleted
		response = await app
			.head(`/v1/projects/${project.id}/wells?dataSource=${wells[0].dataSource}&chosenID=${wells[0].chosenID}`)
			.set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');

		response = await app
			.head(`/v1/projects/${project.id}/wells?dataSource=${wells[0].dataSource}&chosenID=${wells[1].chosenID}`)
			.set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe('0');
	});

	test('DELETE wells by Id', async () => {
		// Insert wells
		const wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(wells).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(wells.length);

		const postedWells = response.body.results;

		expect(postedWells.length).toBe(wells.length);

		// Delete wells
		response = await app.delete(`/v1/projects/${project.id}/wells?id=${postedWells[0].id}`).set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('1');

		// Check if deleted
		response = await app.get(`/v1/projects/${project.id}/wells/${postedWells[0].id}`).set(config.headers);

		expect(response.status).toBe(404);

		response = await app.head(`/v1/projects/${project.id}/wells`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.headers['x-query-count']).toBe((WELL_COUNT - 1).toString());
	});

	test('DELETE wells/:id', async () => {
		// Insert well
		const [well] = createWellsPayload(1);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(well).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(1);

		const [postedWell] = response.body.results;

		// Delete well
		response = await app.delete(`/v1/projects/${project.id}/wells/${postedWell.id}`).set(config.headers);

		expect(response.status).toBe(204);

		expect(response.body).toMatchObject({});

		expect(response.headers['x-delete-count']).toBe('1');

		// Check if deleted
		response = await app.get(`/v1/projects/${project.id}/wells/${postedWell.id}`).set(config.headers);

		expect(response.status).toBe(404);
	});

	test('PATCH well', async () => {
		const [well] = createWellsPayload(1);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(well).set(config.headers);

		const [postedWell] = response.body.results;

		const { chosenID, dataSource } = postedWell;
		let wellResponse = await app
			.patch(`/v1/projects/${project.id}/wells/${postedWell.id}`)
			.send({ chosenID, dataSource, wellName: 'TEST', firstProdDate: '2022-03-23T00:00:00.000Z' })
			.set(config.headers);

		expect(wellResponse.status).toBe(200);

		wellResponse = await app.get(`/v1/projects/${project.id}/wells/${postedWell.id}`).set(config.headers);

		expect(wellResponse.body).toMatchObject({
			...well,
			wellName: 'TEST',
			firstProdDate: '2022-03-23T00:00:00.000Z',
		});

		const dbWell = await connection.collection('wells').findOne({ _id: ObjectId(postedWell.id) });
		expect(dbWell).toMatchObject({
			_id: ObjectId(postedWell.id),
			chosenID: postedWell.chosenID,
			dataSource: postedWell.dataSource,
			well_name: 'TEST',
			first_prod_date: new Date('2022-03-23T00:00:00.000Z'),
		});
	});

	test('PATCH wells', async () => {
		const wells = createWellsPayload(WELL_COUNT);

		let response = await app.post(`/v1/projects/${project.id}/wells`).send(wells).set(config.headers);

		const postedWells = response.body.results;

		const patchResponse = await app
			.patch(`/v1/projects/${project.id}/wells`)
			.send(
				postedWells.map(({ chosenID, dataSource }, index) => ({
					chosenID,
					dataSource,
					wellName: 'TEST' + index,
					firstProdDate: '2022-03-23T00:00:00.000Z',
				})),
			)
			.set(config.headers);

		expect(patchResponse.status).toBe(207);
		expect(patchResponse.body.successCount).toBe(WELL_COUNT);

		const wellsResponse = await Promise.all(
			wells.map(
				async (w) =>
					await app.get(`/v1/projects/${project.id}/wells?chosenID=${w.chosenID}`).set(config.headers),
			),
		);

		for (let index = 0; index < wellsResponse.length; index++) {
			expect(wellsResponse[index].body[0]).toMatchObject({
				...wells[index],
				wellName: 'TEST' + index,
				firstProdDate: '2022-03-23T00:00:00.000Z',
			});
		}

		const dbWells = await Promise.all(
			postedWells.map(async (w) => await connection.collection('wells').findOne({ _id: ObjectId(w.id) })),
		);
		for (let index = 0; index < dbWells.length; index++) {
			expect(dbWells[index]).toMatchObject({
				_id: ObjectId(postedWells[index].id),
				chosenID: postedWells[index].chosenID,
				dataSource: postedWells[index].dataSource,
				well_name: 'TEST' + index,
				first_prod_date: new Date('2022-03-23T00:00:00.000Z'),
			});
		}
	});
});
