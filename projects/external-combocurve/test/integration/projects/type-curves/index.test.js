const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../../config');
const { connectToDb } = require('../../database');
const {
	createTypeCurvePayload,
	createProjectsPayload,
	generateTypeCurveFit,
} = require('../../../helpers/data-generator');
const { toApiProject } = require('../fields');

const { toApiTypeCurve } = require('./fields');

const TYPE_CURVES_COUNT = 2;

let app;
let connection;
let typeCurves;
let typeCurveFits;
let project;

describe('/v1/projects/{projectId}/type-curves', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		// Create project in db
		[project] = createProjectsPayload(1);
		await connection.collection('projects').insertOne(project);
		project = toApiProject(project);

		// Create type curve scoped to this project in db
		typeCurves = createTypeCurvePayload(TYPE_CURVES_COUNT, { project: ObjectId(project.id) });
		await connection.collection('type-curves').insertMany(typeCurves);

		// Create type curve fits scoped to these type curves
		typeCurveFits = typeCurves.reduce((acc, { _id }) => {
			acc[_id] = {
				gas: generateTypeCurveFit({ typeCurve: _id, phase: 'gas' }),
				oil: generateTypeCurveFit({ typeCurve: _id, phase: 'oil' }),
				water: generateTypeCurveFit({ typeCurve: _id, phase: 'water' }),
			};

			return acc;
		}, {});
		await connection.collection('type-curve-fits').insertMany(
			Object.values(typeCurveFits)
				.map((typeCurveFit) => Object.values(typeCurveFit))
				.flat(),
		);

		const operations = Promise.all(
			typeCurves.map(
				async ({ _id }) =>
					await connection.collection('type-curves').updateOne(
						{ _id },
						{
							$set: {
								fits: {
									gas: typeCurveFits[_id].gas._id,
									oil: typeCurveFits[_id].oil._id,
									water: typeCurveFits[_id].water._id,
								},
							},
						},
					),
			),
		);

		await operations;

		typeCurves = typeCurves.map((typeCurve) => toApiTypeCurve(typeCurve, typeCurveFits));
	});

	afterAll(() => {
		connection.close();
	});

	test('Get type curves', async () => {
		const typeCurvesResponse = await Promise.all(
			typeCurves.map(
				async (s) => await app.get(`/v1/projects/${project.id}/type-curves?name=${s.name}`).set(config.headers),
			),
		);

		for (let index = 0; index < typeCurvesResponse.length; index++) {
			expect(typeCurvesResponse[index].status).toBe(200);
			expect(typeCurvesResponse[index].body[0]).toEqual(typeCurves[index]);
		}

		expect(typeCurvesResponse.length).toBe(typeCurves.length);
	});

	test('Get type curve by id', async () => {
		const [typeCurve] = typeCurves;

		const typeCurvesResponse = await app
			.get(`/v1/projects/${project.id}/type-curves/${typeCurve.id}`)
			.set(config.headers);

		expect(typeCurvesResponse.status).toBe(200);
		expect(typeCurvesResponse.body).toEqual(typeCurve);
	});
});
