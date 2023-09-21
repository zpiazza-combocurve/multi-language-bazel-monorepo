import { Select } from '@/economics/exports/PDFExportDialog/shared/rhf';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function ProjectSelect() {
	return <Select<PDFExportTemplate> name='project' />;
}
