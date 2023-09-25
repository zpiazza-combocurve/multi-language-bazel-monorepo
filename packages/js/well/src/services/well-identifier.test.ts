import { BaseContext } from '@combocurve/shared';
import { Types } from 'mongoose';

import { WellIdentifierOperations, WellIdentifierService } from './';

const service = new WellIdentifierService({ models: { WellModel: {} } } as unknown as BaseContext);
const objectId = Types.ObjectId;

describe('packages/well/src/services/well-identifier', () => {
	test(`${service.validateOperations.name} returns operations collisions and missing identifiers as Validation Results structure`, async () => {
		const validateOperations: WellIdentifierOperations = {
			changeChosenIdOperations: [{ wellId: ['5e272d38b78910dd2a1bd6b5'], newChosenID: 'api10' }],
			changeDataSourceOperations: [{ wellId: ['5e272d38b78910dd2a1bd6b6'], dataSource: 'internal' }],
			changeWellScopeToCompanyOperations: { wellId: ['5e272d38b78910dd2a1bd6b7'], project: null },
		};
		service.getWellsWithMissingIdentifier = jest.fn(
			() =>
				new Promise((res) => {
					res([objectId('5e272d38b78910dd2a1bd6b5')]);
				})
		);
		service.checkCollisions = jest.fn(
			() =>
				new Promise((res) => {
					res({ '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] });
				})
		);

		await expect(service.validateOperations(validateOperations)).resolves.toStrictEqual([
			[
				{
					collisions: { '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] },
					missingIdentifier: ['5e272d38b78910dd2a1bd6b5'],
				},
			],
			[
				{
					collisions: { '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] },
				},
			],
			{
				collisions: { '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] },
			},
		]);
	});

	test(`${service.validateOperations.name} returns changeWellScopeToCompanyOperations operation Validation Results as null when is not provided`, async () => {
		const validateOperations: WellIdentifierOperations = {
			changeChosenIdOperations: [{ wellId: ['5e272d38b78910dd2a1bd6b5'], newChosenID: 'api10' }],
			changeDataSourceOperations: [{ wellId: ['5e272d38b78910dd2a1bd6b6'], dataSource: 'internal' }],
		};
		service.getWellsWithMissingIdentifier = jest.fn(
			() =>
				new Promise((res) => {
					res([objectId('5e272d38b78910dd2a1bd6b5')]);
				})
		);
		service.checkCollisions = jest.fn(
			() =>
				new Promise((res) => {
					res({ '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] });
				})
		);

		await expect(service.validateOperations(validateOperations)).resolves.toStrictEqual([
			[
				{
					collisions: { '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] },
					missingIdentifier: ['5e272d38b78910dd2a1bd6b5'],
				},
			],
			[
				{
					collisions: { '5e272d38b78910dd2a1bd6b6': ['5e272d38b78910dd2a1bd6b5'] },
				},
			],
			null,
		]);
	});
});
