import { rest } from 'msw';

import { getApiUrl } from '@/helpers/testing';

import * as mockApi from './api';

export function getReportTemplateRoute(suffix = '') {
	return `/economics/reports/pdf/${suffix}`;
}

const getUrl = (suffix?) => getApiUrl(getReportTemplateRoute(suffix));

export const handlers = [
	rest.get(getUrl(), async (req, res, ctx) => {
		const project = req.url.searchParams.get('project');
		const type = req.url.searchParams.get('type');

		return res(ctx.status(200), ctx.json(await mockApi.getTemplates({ project, type })));
	}),

	rest.get(getUrl('default'), async (req, res, ctx) => {
		const project = req.url.searchParams.get('project');
		const type = req.url.searchParams.get('type');
		const user = req.url.searchParams.get('user');

		return res(ctx.status(200), ctx.json(await mockApi.getDefaultTemplate({ user, project, type })));
	}),

	rest.put(getUrl('default'), async (req, res, ctx) => {
		const body = await req.json();
		const { _id, project, type, user } = body;

		await mockApi.setDefaultTemplate({ _id, project, type, user });

		return res(
			ctx.status(200),
			ctx.json(
				await mockApi.getDefaultTemplate({
					user,
					project,
					type,
				})
			)
		);
	}),

	rest.get(getUrl(':id'), async (req, res, ctx) => {
		const { id } = req.params;

		return res(ctx.status(200), ctx.json(await mockApi.getTemplate(id)));
	}),

	rest.post(getUrl(), async (req, res, ctx) => {
		const template = await req.json();

		const result = await mockApi.createTemplate(template);

		return res(ctx.status(200), ctx.json(result));
	}),

	rest.delete(getUrl(':id'), async (req, res, ctx) => {
		const { id } = await req.params;

		await mockApi.deleteTemplate(id);

		return res(ctx.status(200), ctx.json(null));
	}),

	rest.put(getUrl(), async (req, res, ctx) => {
		const template = await req.json();

		await mockApi.updateTemplate(template);

		return res(ctx.status(200), ctx.json(template));
	}),

	rest.post(getUrl('getSuggested'), async (req, res, ctx) => {
		// const { runId, wellHeaders } = await req.json();

		return res(ctx.status(200), ctx.json(await mockApi.getSuggestedTemplates()));
	}),

	rest.post(getApiUrl('/projects/getProjectNames'), async (req, res, ctx) => {
		const { projectIds } = await req.json();

		return res(ctx.status(200), ctx.json(await mockApi.getProjectNames(projectIds)));
	}),
];

export default handlers;
