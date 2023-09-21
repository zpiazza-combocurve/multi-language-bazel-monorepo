import { faker } from '@faker-js/faker';
import { rest } from 'msw';

import { getApiUrl } from '@/helpers/testing';
import { mswServer, setupMSW } from '@/helpers/testing/msw';

import { handlers as apiMocks } from '../__mocks__/api.msw';

// TODO move out PDF tree
type WellHeaders = Record<string, string>;
function getCustomHeaders(): WellHeaders {
	return {};
}

export const handlers = [
	rest.get(getApiUrl('/dt/getCustomHeaders'), (req, res, ctx) => {
		return res(ctx.status(200), ctx.json(getCustomHeaders()));
	}),
	rest.get(getApiUrl('/projects/getProject/:id'), (req, res, ctx) => {
		const { id } = req.params;
		return res(ctx.status(200), ctx.json({ _id: id, name: faker.name.fullName() }));
	}),
	...apiMocks,
];

export function setupMocks() {
	setupMSW();
	beforeEach(() => {
		mswServer.resetHandlers(...handlers);
	});
}

export default handlers;
