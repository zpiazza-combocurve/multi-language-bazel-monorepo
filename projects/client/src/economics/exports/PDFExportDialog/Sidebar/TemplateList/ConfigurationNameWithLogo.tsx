import CCLogo from '@/economics/exports/CSVExportDialog/Sidebar/ConfigurationNameWithLogo/CCLogo';
import { isSuggestedTemplate } from '@/economics/exports/PDFExportDialog/shared/helpers';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function ConfigurationNameWithLogo(template: PDFExportTemplate) {
	const { name } = template;
	if (isSuggestedTemplate(template)) {
		return (
			<>
				<CCLogo />
				<span css='margin-left: 0.25rem;'>{name}</span>
			</>
		);
	}
	return name;
}
