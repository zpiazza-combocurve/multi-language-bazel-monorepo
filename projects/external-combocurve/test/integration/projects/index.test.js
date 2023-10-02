const request = require('supertest');

const config = require('../config');
const { createProjectsPayload } = require('../../helpers/data-generator');
const { connectToDb } = require('../database');
const { testHeadMethod } = require('../helpers/test/head-methods');

const { toApiProject } = require('./fields');

const PROJECT_COUNT = 2;

let app;
let connection;
let projects;

describe('/v1/projects', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		projects = createProjectsPayload(PROJECT_COUNT);
		await connection.collection('projects').insertMany(projects);
		projects = projects.map(toApiProject);
		// Create projects in db
	});

	afterAll(() => {
		connection.close();
	});

	test('Get projects', async () => {
		const projectsResponse = await Promise.all(
			projects.map(async (p) => await app.get(`/v1/projects?name=${p.name}`).set(config.headers)),
		);

		for (let index = 0; index < projectsResponse.length; index++) {
			expect(projectsResponse[index].status).toBe(200);
			expect(projectsResponse[index].body[0]).toEqual(projects[index]);
		}

		expect(projectsResponse.length).toBe(projects.length);
	});

	test('Get project by id', async () => {
		const [project] = projects;

		const projectResponse = await app.get(`/v1/projects/${project.id}`).set(config.headers);

		expect(projectResponse.status).toBe(200);
		expect(projectResponse.body).toEqual(project);
	});

	// eslint-disable-next-line jest/expect-expect
	test('HEAD projects', async () => {
		// TODO: test more than 1, should be easier after multi filter is allowed
		await testHeadMethod(app, `/v1/projects`, config.headers, 1, { name: projects[0].name });
	});

	test('Post and get projects', async () => {
		projects = createProjectsPayload(PROJECT_COUNT).map(({ name }) => ({
			name,
		}));

		let response = await app.post('/v1/projects').send(projects).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(projects.length);

		const postedProjects = response.body.results;

		expect(postedProjects.length).toBe(projects.length);

		const projectResponse = await Promise.all(
			projects.map(async (p) => await app.get(`/v1/projects?name=${p.name}`).set(config.headers)),
		);

		for (let index = 1; index < projectResponse.length; index++) {
			expect(projectResponse[index].status).toBe(200);
			expect(projectResponse[index].body[0]).toMatchObject(projects[index]);
		}

		expect(projectResponse.length).toBe(projects.length);
	});
});
