const request = require('supertest');
const { omit } = require('lodash');

const { createOwnershipQualifiersPayload, createWellsPayload } = require('../../helpers/data-generator');
const config = require('../config');
const { testHeadMethod } = require('../helpers/test/head-methods');

const OWNERSHIP_QUALIFIER_COUNT = 2;
//lease nri calculation, netRevenueInterest , workingInterest and leaseNetRevenueInterest in that order for each array
const LEASE_NRI_CALCULATIONS = [
	[10, 20, 50],
	[0, 0, 100],
	[10, 5, 100],
	[3, 0, 100],
	[20, 50, 40, 40],
];

let app;
let well;

describe('ownership-qualifiers test', () => {
	beforeAll(() => {
		app = request(config.apiUrl);
	});
	beforeEach(async () => {
		const [wellPayload] = createWellsPayload(1);

		const response = await app.post('/v1/wells').send(wellPayload).set(config.headers);

		const [postedWell] = response.body.results;

		well = postedWell;
	});
	test('Post and get ownershipQualifiers using wellId', async () => {
		const ownershipQualifiers = createOwnershipQualifiersPayload(OWNERSHIP_QUALIFIER_COUNT, {
			well: well.id,
			chosenID: well.chosenID,
			dataSource: well.dataSource,
		});

		let response = await app.post('/v1/ownership-qualifiers').send(ownershipQualifiers).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipQualifiers.length);

		const postedOwnershipQualifiers = response.body.results;

		expect(postedOwnershipQualifiers.length).toBe(ownershipQualifiers.length);

		response = await app.get(`/v1/ownership-qualifiers?well=${well.id}`).set(config.headers);

		expect(response.status).toBe(200);

		expect(response.body.length).toBe(ownershipQualifiers.length);

		const compareFunction = (a, b) => a.qualifierKey.localeCompare(b.qualifierKey);
		expect(response.body.map((doc) => omit(doc, ['id', 'createdAt', 'updatedAt'])).sort(compareFunction)).toEqual(
			ownershipQualifiers.sort(compareFunction),
		);
	});

	test('Check leaseNetRevenueInterest calculation', async () => {
		const ownershipQualifiers = LEASE_NRI_CALCULATIONS.map(([netRevenueInterest, workingInterest], index) => ({
			qualifierKey: `q${index}`,
			well: well.id,
			chosenID: well.chosenID,
			dataSource: well.dataSource,
			ownership: {
				initialOwnership: {
					workingInterest,
					netRevenueInterest,
				},
			},
		}));

		let response = await app.put('/v1/ownership-qualifiers').send(ownershipQualifiers).set(config.headers);

		expect(response.status).toBe(207);

		const ownershipQualifierResponse = await Promise.all(
			ownershipQualifiers.map(
				async ({ well, qualifierKey }) =>
					await app
						.get(`/v1/ownership-qualifiers?well=${well}&qualifierKey=${qualifierKey}`)
						.set(config.headers),
			),
		);

		for (let index = 0; index < ownershipQualifierResponse.length; index++) {
			const {
				ownership: {
					initialOwnership: { leaseNetRevenueInterest },
				},
			} = ownershipQualifierResponse[index].body[0];
			const [, , calculation] = LEASE_NRI_CALCULATIONS[index];
			expect(ownershipQualifierResponse[index].status).toBe(200);
			expect(leaseNetRevenueInterest).toBe(calculation);
		}
	});

	test('HEAD ownership-qualifiers', async () => {
		const ownershipQualifiers = createOwnershipQualifiersPayload(OWNERSHIP_QUALIFIER_COUNT, {
			well: well.id,
			chosenID: well.chosenID,
			dataSource: well.dataSource,
		});

		let response = await app.post('/v1/ownership-qualifiers').send(ownershipQualifiers).set(config.headers);

		expect(response.status).toBe(207);

		expect(response.body.successCount).toBe(ownershipQualifiers.length);

		const postedOwnershipQualifiers = response.body.results;

		expect(postedOwnershipQualifiers.length).toBe(ownershipQualifiers.length);

		await testHeadMethod(app, `/v1/ownership-qualifiers`, config.headers, OWNERSHIP_QUALIFIER_COUNT, {
			well: well.id,
		});
	});
});
