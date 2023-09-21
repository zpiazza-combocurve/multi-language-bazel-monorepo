import { cloneDeep, groupBy } from 'lodash';
import { rest } from 'msw';

import { templatesKey } from '@/factories/econ-report-export-configuration/client';
import { templatesKey as defaultTemplatesKey } from '@/factories/econ-report-export-default-user-configuration/client';
import { counter } from '@/helpers/Counter';
import { API_BASE_URL } from '@/helpers/routing/routing-shared';
import { local } from '@/helpers/storage';

import { getDefaultTemplate, getReportTemplateRoute, getTemplates } from './api';
import { SUGGESTED_TEMPLATES } from './suggested-templates';
import { UserDefaultCSVExportTemplate, UserDefaultCSVExportTemplateDB } from './types';

const getUrl = (suffix?) => `${API_BASE_URL}${getReportTemplateRoute(suffix)}`;

const checkForObjectIdRegex = new RegExp('^[0-9a-fA-F]{24}$');

const isValidObjectId = (id) => id && checkForObjectIdRegex.test(id);

export const handlers = [
	rest.get(getUrl(), (req, res, ctx) => {
		const project = req.url.searchParams.get('project');
		const type = req.url.searchParams.get('type');
		if (project && !isValidObjectId(project)) throw new Error();

		const templates = local.getItem(templatesKey);

		const projectTemplates = project ? groupBy(templates, 'project')[project] : templates;
		const result = type ? groupBy(projectTemplates, 'type')[type] : projectTemplates;

		return res(ctx.status(200), ctx.json(result));
	}),

	rest.get(getUrl('default'), async (req, res, ctx) => {
		const project = req.url.searchParams.get('project');
		const type = req.url.searchParams.get('type');
		const user = req.url.searchParams.get('user');

		const defaultConfigs: UserDefaultCSVExportTemplateDB[] = local.getItem(defaultTemplatesKey) ?? [];

		const defaultConfig = defaultConfigs?.find(
			(config) => project === config.project && type === config.type && user === config.user
		);

		if (defaultConfig == null) return res(ctx.status(200), ctx.json(null));

		const templates = local.getItem(templatesKey) ?? [];

		const template = templates.find(({ _id }) => _id === defaultConfig?.econReportExportConfiguration);

		return res(ctx.status(200), ctx.json(template));
	}),

	rest.put(getUrl('default'), async (req, res, ctx) => {
		const body = await req.json();
		const { _id, project, type, user } = body;

		let defaultConfigs: UserDefaultCSVExportTemplate[] = local.getItem(defaultTemplatesKey) ?? [];

		defaultConfigs = defaultConfigs.filter(
			(config) => !(project === config.project && type === config.type && user === config.user)
		);

		local.setItem(defaultTemplatesKey, defaultConfigs);

		if (_id == null) {
			return res(ctx.status(200), ctx.json(null));
		}

		const isSuggestedConfig = !isValidObjectId(_id) && typeof _id === 'string';
		defaultConfigs.push({
			econReportExportConfiguration: isSuggestedConfig ? null : _id,
			suggestedConfiguration: isSuggestedConfig ? _id : null,
			user,
			project,
			type,
		});

		local.setItem(defaultTemplatesKey, defaultConfigs);

		const template = await getDefaultTemplate({
			user,
			project,
			type,
		});

		return res(ctx.status(200), ctx.json(template));
	}),

	rest.get(getUrl(':id'), (req, res, ctx) => {
		const { id } = req.params;

		const templates = local.getItem(templatesKey);
		const template = templates.find(({ _id }) => _id === id);

		return res(ctx.status(200), ctx.json(template));
	}),

	rest.post(getUrl(), async (req, res, ctx) => {
		const template = await req.json();

		const templates = (await getTemplates()) ?? [];

		const newTemplate = { ...template, _id: counter.nextId() };
		templates.push(newTemplate);
		local.setItem(templatesKey, templates);

		return res(ctx.status(200), ctx.json(newTemplate));
	}),

	rest.delete(getUrl(':id'), async (req, res, ctx) => {
		const { id } = await req.params;

		const templates = await getTemplates();

		local.setItem(
			templatesKey,
			templates.filter(({ _id }) => _id !== id)
		);

		return res(ctx.status(200), ctx.json(null));
	}),

	rest.put(getUrl(), async (req, res, ctx) => {
		const template = await req.json();

		const templates = (await getTemplates()) ?? [];
		local.setItem(
			templatesKey,
			templates.map((t) => (t._id === template._id ? template : t))
		);

		return res(ctx.status(200), ctx.json(template));
	}),

	rest.post(getUrl('getSuggested/:runId'), async (req, res, ctx) => {
		const suggestedTemplates = cloneDeep(SUGGESTED_TEMPLATES);

		return res(ctx.status(200), ctx.json(suggestedTemplates));
	}),
];

export default handlers;
