import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { useConfigurations, useDefaultConfiguration } from '@/components/hooks';
import { alerts } from '@/components/v2';
import { isCompanyCustomHeaderKey, isProjectCustomHeaderKey } from '@/economics/exports/CSVExportDialog/helpers';
import { assert } from '@/helpers/utilities';
import { pdfSchema } from '@/inpt-shared/economics/pdf-reports/shared';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectId } from '@/projects/routes';

import {
	createTemplate,
	deleteTemplate,
	getDefaultTemplate,
	getProjectNames,
	getSuggestedTemplates,
	getTemplates,
	setDefaultTemplate,
	updateTemplate,
} from './api';
import { useForm } from './rhf';
import {
	Option,
	PDFExportTemplate,
	PDFExportTemplateBase,
	PDFExportTemplateDB,
	PDFOptionKeyTypes,
	ReportType,
	SuggestedTemplateSymbol,
} from './types';

type PDFOptionsArgs = {
	keyType: PDFOptionKeyTypes;
	keysAndLabels: Record<string, string>;
	selectedItems: Option[];
};

const getCircleColor = (key) => {
	if (isProjectCustomHeaderKey(key)) return '#fdcc59';
	if (isCompanyCustomHeaderKey(key)) return '#12c498';
	return null;
};

export const getPDFOptions = ({ keyType, keysAndLabels, selectedItems }: PDFOptionsArgs): Option[] => {
	return Object.entries(keysAndLabels).map(([key, label]) => ({
		key,
		label,
		selected: !!_.find(selectedItems, { key }),
		keyType,
		withCircle: isProjectCustomHeaderKey(key),
		circleColor: getCircleColor(key),
		sortingOptions: null,
	}));
};

const userTemplatesKey = ['pdf-report-template'];
const suggestedTemplatesKey = [...userTemplatesKey, 'suggested'];

function adjustSuggestedTemplate(template) {
	return { [SuggestedTemplateSymbol]: true, _id: `${template.type}-${template.name}`, ...template };
}

export function useUserTemplates({ project, type }: { project?; type? } = {}) {
	const currentProjectId = useCurrentProjectId();
	const queryClient = useQueryClient();
	return useConfigurations<PDFExportTemplateDB>({
		queryKey: [...userTemplatesKey, { project, type }],
		createConfiguration: (template) => createTemplate(_.omit({ ...template, project: currentProjectId }, '_id')),
		deleteConfiguration: ({ _id }) => deleteTemplate(_id),
		getConfigurations: () => getTemplates({ project, type }),
		updateConfiguration: updateTemplate,
		invalidateQueries() {
			queryClient.invalidateQueries(userTemplatesKey);
		},
	});
}

export function useDefaultTemplate(project: string, type: ReportType, queryOptions?) {
	return useDefaultConfiguration(
		{
			getDefaultConfiguration: () => getDefaultTemplate({ project, type }),
			queryKey: [...userTemplatesKey, project, type, 'default'],
			updateDefaultConfiguration: (template) =>
				setDefaultTemplate({
					_id: template?._id ?? null,
					project,
					type,
				}),
		},
		queryOptions
	);
}

export function useSuggestedTemplates(type: ReportType) {
	const {
		data: allSuggestedTemplates,
		isLoading: isLoadingSuggestedTemplates,
		isFetching: isFetchingSuggestedTemplates,
	} = useQuery([...suggestedTemplatesKey, type], () => getSuggestedTemplates());

	return {
		suggestedTemplates: allSuggestedTemplates?.[type]?.map(
			adjustSuggestedTemplate
		) as Required<PDFExportTemplate>[],
		isLoadingSuggestedTemplates,
		isFetchingSuggestedTemplates,
	};
}

export function useTemplates(project, reportType) {
	const {
		configurations: userTemplates,
		isLoadingConfigurations,
		...restQueryUserTemplates
	} = useUserTemplates({
		project,
		type: reportType,
	});

	const { suggestedTemplates, isLoadingSuggestedTemplates, ...restQuerySuggestedTemplates } =
		useSuggestedTemplates(reportType);

	const isLoading = isLoadingConfigurations || isLoadingSuggestedTemplates;

	const templates = useMemo(
		() => [...(suggestedTemplates ?? []).map(adjustSuggestedTemplate), ...(userTemplates ?? [])],
		[suggestedTemplates, userTemplates]
	);

	return {
		templates,
		isLoading,
		...restQueryUserTemplates,
		...restQuerySuggestedTemplates,
	};
}

export function useCurrentProjectDefaultTemplate(reportType) {
	const currentProjectId = useCurrentProjectId();
	return useDefaultTemplate(currentProjectId, reportType);
}

export function isSuggestedTemplate(c: PDFExportTemplateBase) {
	return c?.[SuggestedTemplateSymbol];
}

export function useCurrentTemplate() {
	const currentProjectId = useCurrentProjectId();
	const defaultValues = pdfSchema.validateSync({ project: currentProjectId });
	const formData = useForm<PDFExportTemplateDB>({
		defaultValues,
		resolver: yupResolver(pdfSchema),
		mode: 'onChange',
	});

	const { reset, handleSubmit, watch } = formData;
	const type = watch('type');
	const project = watch('project') ?? currentProjectId;
	const name = watch('name');

	const { defaultConfiguration } = useCurrentProjectDefaultTemplate(type);
	const { _id: defaultTemplateId } = defaultConfiguration ?? {};
	const { templates, isLoading, handleCreateConfiguration, handleUpdateConfiguration } = useTemplates(project, type);

	useEffect(() => {
		const defaultTemplate = _.find(templates, { _id: defaultTemplateId });
		if (!defaultTemplateId || isLoading || !defaultTemplate) return reset({ ...defaultValues, project, type });
		return reset({ project, ...defaultTemplate });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultTemplateId, isLoading, type]);

	const sameProject = currentProjectId === watch('project');

	const { configurations: userTemplates } = useUserTemplates({
		project: currentProjectId,
		type,
	});

	const selectedConfiguration = useMemo(() => _.find(userTemplates ?? [], { name }), [name, userTemplates]);

	const { suggestedTemplates } = useSuggestedTemplates(type);

	const saveDisabled = _.find(suggestedTemplates ?? [], { name }) && 'Name is reserved for Combocurve Templates';

	function confirmImportUpdate() {
		return alerts.confirm({
			title: `Confirm overwriting "${name}" template`,
			children: `Are you sure you want to overwrite template with name: "${name}"?`,
		});
	}

	const getTemplateToCreate = (template: PDFExportTemplateDB) =>
		_.omit({ ...template, project: currentProjectId }, '_id');
	const getTemplateToUpdate = (template: PDFExportTemplateDB) => ({
		...getTemplateToCreate(template),
		_id: selectedConfiguration?._id,
	});

	async function onSubmit(template: PDFExportTemplateDB) {
		const sameProject = currentProjectId === template.project;
		if (sameProject) {
			const canCreateTemplate = !selectedConfiguration;
			if (canCreateTemplate) {
				const templateToCreate = getTemplateToCreate(template);
				handleCreateConfiguration(templateToCreate);
				return templateToCreate;
			}
			const templateToUpdate = getTemplateToUpdate(template);
			handleUpdateConfiguration(templateToUpdate as PDFExportTemplateDB);
			return templateToUpdate;
		}
		if (await confirmImportUpdate()) {
			const newTemplate = await onSubmit({ ...template, project: currentProjectId });
			if (newTemplate) reset(newTemplate);
		}
	}

	const saveAction = (() => {
		if (!sameProject) return 'Import';
		if (selectedConfiguration) return 'Update';
		return 'Save';
	})();

	return { saveDisabled, save: handleSubmit(onSubmit), formData, saveAction };
}

export function useProjectNamesWithTemplates() {
	const currentProjectId = useCurrentProjectId();
	// TODO: avoid using all templates
	const { configurations: allProjectsTemplates, isLoadingConfigurations } = useUserTemplates();

	const allProjects = useMemo(
		() => _.uniq([currentProjectId, ...(_.map(allProjectsTemplates, 'project') ?? [])]),
		[allProjectsTemplates, currentProjectId]
	);

	const { project } = useCurrentProject();

	assert(project);

	return useQuery(['projects', 'names', allProjects], () => getProjectNames(allProjects), {
		enabled: !isLoadingConfigurations,
		placeholderData: [{ _id: project?._id, name: project?.name }],
		select: (d) =>
			d.map(({ _id, name }) => ({
				value: _id,
				label: name,
			})),
	});
}
