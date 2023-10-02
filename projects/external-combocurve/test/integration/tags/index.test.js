const request = require('supertest');

const config = require('../config');
const { connectToDb } = require('../database');
const { createTagsPayload } = require('../../helpers/data-generator');

const { toApiTag } = require('./fields');

const TAGS_COUNT = 2;

let app;
let connection;
let tags;

describe('/v1/tags', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		tags = createTagsPayload(TAGS_COUNT);
		await connection.collection('tags').insertMany(tags);
		tags = tags.map(toApiTag);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get tags', async () => {
		const tagsResponse = await Promise.all(
			tags.map(async (c) => await app.get(`/v1/tags?name=${c.name}`).set(config.headers)),
		);

		for (let index = 0; index < tagsResponse.length; index++) {
			expect(tagsResponse[index].status).toBe(200);
			expect(tagsResponse[index].body[0]).toMatchObject(tags[index]);
		}

		expect(tags.length).toBe(tagsResponse.length);
	});
});
