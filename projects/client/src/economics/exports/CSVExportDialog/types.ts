import { DialogProps } from '@/helpers/dialog';
import {
	CashFlowReportType,
	HybridYearType,
	ReportType,
	ScenarioTableColumn,
} from '@/inpt-shared/economics/reports/types/client';

export * from '@/inpt-shared/economics/reports/types/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type CSVExportDialogProps<T = any> = DialogProps<T> & {
	runId?: string;
	scenarioTableHeaders?: ScenarioTableColumn[];
	hasReservesGroups?: boolean;
};

export type DataToTrack = {
	reportType: ReportType;
	templateName: string;
	cashflowOptionsReportType?: CashFlowReportType;
	useTimePeriodsChecked?: boolean;
	hybridOptionsYearType?: HybridYearType;
};
