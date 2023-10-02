const {
	Types: { ObjectId },
} = require('mongoose');
const request = require('supertest');

const config = require('../config');
const { connectToDb } = require('../database');
const { createWellComments } = require('../../helpers/data-generator');

const { toApiWellComment } = require('./fields');

const WELL_COMMENT_COUNT = 2;

let app;
let connection;
let wellComments;

describe('/v1/well-comments', () => {
	beforeAll(async () => {
		app = request(config.apiUrl);
		connection = await connectToDb(config.dbConnectionString);
	});

	beforeEach(async () => {
		wellComments = [...Array(WELL_COMMENT_COUNT)].map(() => {
			const [wellComment] = createWellComments(1, ObjectId());
			return wellComment;
		});
		await connection.collection('well-comments').insertMany(wellComments);

		wellComments = wellComments.reduce((acc, curr) => {
			const { comments, ...rest } = curr;
			const result = comments.map((comment) => ({ ...rest, ...comment }));
			acc.push(result.map(toApiWellComment));
			return acc;
		}, []);
	});

	afterAll(() => {
		connection.close();
	});

	test('Get wellComments', async () => {
		const wellCommentsResponse = await Promise.all(
			wellComments.map(async (c) => await app.get(`/v1/well-comments?well=${c[0].well}`).set(config.headers)),
		);

		for (let index = 0; index < wellCommentsResponse.length; index++) {
			expect(wellCommentsResponse[index].status).toBe(200);
			expect(wellCommentsResponse[index].body).toMatchObject(wellComments[index]);
		}

		expect(wellComments.length).toBe(wellCommentsResponse.length);
	});
});
