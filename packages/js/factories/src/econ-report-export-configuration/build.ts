import { faker } from '@faker-js/faker';

import { CSVExportTemplate } from '@/inpt-shared/economics/reports/types/shared';
import { getObjectID } from '@/inpt-shared/economics/shared';

export const econReportExportConfigurationFactory = ({
	associations: { project, createdBy },
}: {
	associations: Partial<CSVExportTemplate>;
}): CSVExportTemplate => ({
	createdBy: getObjectID(createdBy),
	project: getObjectID(project),
	columns: [],
	name: faker.name.jobTitle(),
	type: 'cashflow-csv',
	cashflowOptions: {
		hybridOptions: { months: 1, yearType: 'calendar' },
		timePeriods: 1,
		type: 'yearly',
		useTimePeriods: false,
	},
});
