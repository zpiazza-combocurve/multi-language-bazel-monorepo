import type { Model } from 'mongoose';

import { PDFExportTemplateDB } from '@/inpt-shared/economics/pdf-reports/types/internal';
import type {
	CSVExportTemplateDB,
	UserDefaultCSVExportTemplateDB,
} from '@/inpt-shared/economics/reports/types/internal';

declare global {
	declare const window: Window;
	export interface Context {
		models: {
			EconReportExportConfigurationModel: Model<CSVExportTemplateDB>;
			EconReportExportDefaultUserConfigurationModel: Model<UserDefaultCSVExportTemplateDB>;
			EconPDFReportExportConfigurationModel: Model<PDFExportTemplateDB>;
			EconPDFReportExportDefaultUserConfigurationModel: Model<UserDefaultPDFExportTemplateDB>;
		};
	}
}
