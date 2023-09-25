import { faker } from '@faker-js/faker';

import { pdfSchema } from '@/inpt-shared/economics/pdf-reports/shared';
import { PDFExportTemplate } from '@/inpt-shared/economics/pdf-reports/types/shared';
import { getObjectID } from '@/inpt-shared/economics/shared';

export const econPDFReportExportConfigurationFactory = ({
	associations: { project, createdBy },
}: {
	associations: Partial<PDFExportTemplate>;
}): PDFExportTemplate => ({
	...pdfSchema.validateSync({
		name: faker.name.jobTitle(),
		project: getObjectID(project),
	}),
	project: getObjectID(project),
	createdBy: getObjectID(createdBy),
});
