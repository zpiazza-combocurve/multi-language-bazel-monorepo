import { rest } from 'msw';

import { getApiUrl } from '@/helpers/testing';

export const handlers = [
	rest.post(getApiUrl('/economics/genEconCsvExport'), (req, res, ctx) => {
		return res(ctx.status(200));
	}),
	rest.post(getApiUrl('/economics/genEconReportByWell'), (req, res, ctx) => {
		return res(ctx.status(200));
	}),
	rest.post(getApiUrl('/economics/genEconReport'), (req, res, ctx) => {
		return res(ctx.status(200));
	}),
	rest.post(getApiUrl('/economics/buildGHGReport'), (req, res, ctx) => {
		return res(
			ctx.status(200),
			ctx.json({
				gcpName: 'gcpName',
				name: 'name',
			})
		);
	}),

	rest.get(getApiUrl('/files/downloadFile/:gcpName/:name'), (req, res, ctx) => {
		return res(ctx.status(200), ctx.text('url'));
	}),
];
export default handlers;
