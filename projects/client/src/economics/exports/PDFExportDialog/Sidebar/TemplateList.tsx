import { useFormContext } from 'react-hook-form';

import ConfigurationList from '@/components/v2/misc/ConfigurationDialog/ConfigurationList';
import { useCurrentProjectDefaultTemplate, useTemplates } from '@/economics/exports/PDFExportDialog/shared/helpers';
import {
	PDFExportTemplate,
	PDFExportTemplateDB,
	SuggestedTemplateSymbol,
} from '@/economics/exports/PDFExportDialog/shared/types';

import { ConfigurationNameWithLogo } from './TemplateList/ConfigurationNameWithLogo';

export function isSuggestedTemplate(c: PDFExportTemplate) {
	return c?.[SuggestedTemplateSymbol];
}

export function TemplateList() {
	const { watch, reset } = useFormContext<PDFExportTemplate>();

	const name = watch('name');
	const type = watch('type');
	const project = watch('project');
	const {
		handleDeleteConfiguration,
		isCreatingConfiguration,
		isLoading: isLoadingTemplates,
		templates,
	} = useTemplates(project, type);

	const {
		defaultConfiguration: defaultTemplate,
		isLoadingDefaultConfiguration,
		setDefaultConfiguration,
	} = useCurrentProjectDefaultTemplate(type);

	const canDeleteConfiguration = (c: PDFExportTemplateDB) => !isCreatingConfiguration(c) && !isSuggestedTemplate(c);
	const canSetDefaultConfiguration = (c: PDFExportTemplateDB) => !isCreatingConfiguration(c);

	const isLoading = isLoadingDefaultConfiguration || isLoadingTemplates;

	return (
		<ConfigurationList
			configurations={templates}
			deleteConfiguration={handleDeleteConfiguration}
			getConfigurationKey={({ _id, name }, index) => _id ?? `${name}-${index}`}
			getConfigurationName={ConfigurationNameWithLogo}
			isDefaultConfiguration={(c) => c._id === defaultTemplate?._id}
			isDeleteDisabled={(c) => !canDeleteConfiguration(c)}
			isLoading={isLoading}
			isSelected={(c) => name === c.name}
			isSetDefaultDisabled={(c) => !canSetDefaultConfiguration(c)}
			onSelect={(t) => reset({ project, ...t })}
			setDefaultConfiguration={setDefaultConfiguration}
		/>
	);
}
