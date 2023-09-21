import { Stack, Typography } from '@mui/material';

import { RadioGroup, TextField } from '@/economics/exports/PDFExportDialog/shared/rhf';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function HybridReporting() {
	return (
		<div>
			<Typography>Hybrid Reporting</Typography>
			<Stack direction='column'>
				<TextField<PDFExportTemplate> name='cashflowOptions.hybridOptions.months' />
				<RadioGroup<PDFExportTemplate> name='cashflowOptions.hybridOptions.yearType' row />
			</Stack>
		</div>
	);
}
