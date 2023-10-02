import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';

import { ApiContextV1 } from '../../context';

import { WellIdentifierRequest, WellIdentifierService } from './service';

let service: WellIdentifierService;

jest.mock('@src/helpers/cloud-caller');
describe('v1/wells/identifier/service', () => {
	beforeAll(async () => {
		service = new WellIdentifierService({ headers: {} } as unknown as ApiContextV1);
	});
	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();
	});
	test('well-service is not called if there are not valid items in changeWellIdentifiers', async () => {
		await expect(service.changeWellIdentifiers([undefined], 'test-user-id')).resolves.toStrictEqual({
			results: [undefined],
		});
		expect(callCloudFunction).not.toHaveBeenCalled();
	});
	test('well-service is called with the user-id header if there are valid items in changeWellIdentifiers', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({ updated: [], notUpdated: [] }));
		service.changeWellIdentifiers(
			[{ wellId: '632240de72c6010512780753', newInfo: { companyScope: true } }],
			'test-user-id',
		);
		expect(callCloudFunction).toHaveBeenCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/wells-identifier`,
			body: [{ wellId: '632240de72c6010512780753', newInfo: { companyScope: true } }],
			headers: { 'USER-ID': 'test-user-id' },
		});
	});
	test('changeWellIdentifiers service returns updated result when request is valid', async () => {
		const updatedWellId = '632240de72c6010512780753';
		const request = [{ wellId: updatedWellId, newInfo: { companyScope: true } }];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			updated: [updatedWellId],
			notUpdated: [],
		}));
		await expect(service.changeWellIdentifiers(request, 'test-user-id')).resolves.toStrictEqual({
			results: [{ status: 'UPDATED', code: 200, wellId: updatedWellId }],
		});
		expect(callCloudFunction).toHaveBeenCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/wells-identifier`,
			body: request,
			headers: { 'USER-ID': 'test-user-id' },
		});
	});
	test('changeWellIdentifiers service returns error response when request has collisions errors', async () => {
		const updatedWellId = '632240de72c6010512780753';
		const notUpdatedWell = '632240de72c6010512780754';
		const notUpdatedResult = {
			collisions: {
				[notUpdatedWell]: ['630ce026f3615200c944e938', '630ce026f3615200c944e939'],
			},
			missingIdentifier: [],
		};
		const request: WellIdentifierRequest[] = [
			{ wellId: updatedWellId, newInfo: { companyScope: true } },
			{ wellId: notUpdatedWell, newInfo: { chosenKeyID: 'api14' } },
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			updated: [updatedWellId],
			notUpdated: [
				{
					wellId: notUpdatedWell,
					results: notUpdatedResult,
				},
			],
		}));

		await expect(service.changeWellIdentifiers(request, 'test-user-id')).resolves.toStrictEqual({
			results: [
				{ status: 'UPDATED', code: 200, wellId: updatedWellId },
				{
					status: 'Failed',
					code: 400,
					errors: [
						{
							name: 'BadRequest',
							message: `Collisions with 630ce026f3615200c944e938, 630ce026f3615200c944e939`,
							location: `[1]`,
						},
					],
					wellId: notUpdatedWell,
				},
			],
		});
		expect(callCloudFunction).toHaveBeenCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/wells-identifier`,
			body: request,
			headers: { 'USER-ID': 'test-user-id' },
		});
	});
	test('changeWellIdentifiers service returns error response when request has missing identifier errors', async () => {
		const updatedWellId = '632240de72c6010512780753';
		const notUpdatedWell = '632240de72c6010512780754';
		const notUpdatedResult = {
			collisions: {},
			missingIdentifier: [notUpdatedWell],
		};
		const request: WellIdentifierRequest[] = [
			{ wellId: updatedWellId, newInfo: { companyScope: true } },
			{ wellId: notUpdatedWell, newInfo: { chosenKeyID: 'api14' } },
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			updated: [updatedWellId],
			notUpdated: [
				{
					wellId: notUpdatedWell,
					results: notUpdatedResult,
				},
			],
		}));

		await expect(service.changeWellIdentifiers(request, 'test-user-id')).resolves.toStrictEqual({
			results: [
				{ status: 'UPDATED', code: 200, wellId: updatedWellId },
				{
					status: 'Failed',
					code: 400,
					errors: [
						{
							name: 'BadRequest',
							message: `Missing Identifier ${notUpdatedWell}`,
							location: `[1]`,
						},
					],
					wellId: notUpdatedWell,
				},
			],
		});
		expect(callCloudFunction).toHaveBeenCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/wells-identifier`,
			body: request,
			headers: { 'USER-ID': 'test-user-id' },
		});
	});
});
