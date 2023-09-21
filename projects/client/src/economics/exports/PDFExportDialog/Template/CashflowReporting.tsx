import { Typography } from '@mui/material';

import { RadioGroup } from '@/economics/exports/PDFExportDialog/shared/rhf';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function CashflowReporting() {
	return (
		<div>
			<Typography>Cash Flow Reporting</Typography>
			<RadioGroup<PDFExportTemplate> name='cashflowOptions.type' />
		</div>
	);
}
