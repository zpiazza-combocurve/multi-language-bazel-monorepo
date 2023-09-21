import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { cloneDeep, groupBy, omit } from 'lodash';

import { econPDFReportExportConfigurationFactory } from '@/factories/econ-pdf-report-export-configuration/build';
import { templatesKey } from '@/factories/econ-pdf-report-export-configuration/client';
import { templatesKey as defaultTemplatesKey } from '@/factories/econ-pdf-report-export-default-user-configuration/client';
import { counter } from '@/helpers/Counter';
import { local } from '@/helpers/storage';

import {
	PDFExportTemplate,
	SuggestedTemplates,
	UserDefaultPDFExportTemplate,
	UserDefaultPDFExportTemplateDB,
} from '../types';

export function getReportTemplateRoute(suffix = '') {
	return `/economics/reports/pdf/${suffix}`;
}

const checkForObjectIdRegex = new RegExp('^[0-9a-fA-F]{24}$');

const isValidObjectId = (id) => id && checkForObjectIdRegex.test(id);

const TemplateFactory = Factory.define<Omit<PDFExportTemplate, 'project' | 'createdBy'>>((props) =>
	omit(econPDFReportExportConfigurationFactory(props), 'project', 'createdBy')
);

const cashflow = { ...TemplateFactory.build({ name: 'Well Cash Flow' }), type: 'cashflow-pdf' as const };
const aggregate = { ...TemplateFactory.build({ name: 'Aggregate Cash Flow' }), type: 'cashflow-agg-pdf' as const };
const SUGGESTED_TEMPLATES: SuggestedTemplates = {
	'cashflow-pdf': [cashflow],
	'cashflow-agg-pdf': [aggregate],
};

export async function getTemplates({ project, type }: { project?; type? } = {}) {
	if (project && !isValidObjectId(project)) throw new Error();

	const templates = local.getItem(templatesKey);

	const projectTemplates = project ? groupBy(templates, 'project')[project] : templates;
	return type ? groupBy(projectTemplates, 'type')[type] : projectTemplates;
}

export function getDefaultTemplate({ project, type, user }) {
	const defaultConfigs: UserDefaultPDFExportTemplateDB[] = local.getItem(defaultTemplatesKey) ?? [];
	const defaultConfig = defaultConfigs?.find((config) => {
		return (
			String(project) === String(config.project ?? undefined) &&
			type === config.type &&
			String(user) === String(config.user ?? undefined)
		);
	});
	if (defaultConfig == null) return null;
	const templates = local.getItem(templatesKey) ?? [];
	const { econPDFReportExportConfiguration, suggestedConfiguration } = defaultConfig ?? {};
	const template = templates.find(({ _id }) =>
		[String(econPDFReportExportConfiguration), String(suggestedConfiguration)].includes(String(_id))
	);
	return template ?? { _id: defaultConfig.suggestedConfiguration };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setDefaultTemplate({ _id, project, type, user }: any) {
	let defaultConfigs: UserDefaultPDFExportTemplate[] = local.getItem(defaultTemplatesKey) ?? [];

	defaultConfigs = defaultConfigs.filter(
		(config) => !(String(project === config.project) && type === config.type && String(user === config.user))
	);

	local.setItem(defaultTemplatesKey, defaultConfigs);

	if (_id == null) return null;

	const isSuggestedConfig = !isValidObjectId(_id) && typeof _id === 'string';
	defaultConfigs.push({
		econPDFReportExportConfiguration: isSuggestedConfig ? null : _id,
		suggestedConfiguration: isSuggestedConfig ? _id : null,
		user,
		project,
		type,
	});

	local.setItem(defaultTemplatesKey, defaultConfigs);
	return null;
}

export function getTemplate(id) {
	const templates = local.getItem(templatesKey);
	return templates.find(({ _id }) => _id === id);
}

export async function createTemplate(template) {
	const templates = (await getTemplates()) ?? [];
	const newTemplate = { ...template, _id: counter.nextId() };
	templates.push(newTemplate);
	local.setItem(templatesKey, templates);
	return newTemplate;
}

export async function deleteTemplate(id) {
	const templates = await getTemplates();

	local.setItem(
		templatesKey,
		templates.filter(({ _id }) => _id !== id)
	);
}

export async function updateTemplate(template) {
	const templates = (await getTemplates()) ?? [];
	local.setItem(
		templatesKey,
		templates.map((t) => (t._id === template._id ? template : t))
	);
	return { nModified: 1, n: 0 };
}

export async function getSuggestedTemplates() {
	return cloneDeep(SUGGESTED_TEMPLATES);
}

export async function getProjectNames(projectIds) {
	return projectIds.map((_id) => ({ _id, name: faker.name.fullName() }));
}
