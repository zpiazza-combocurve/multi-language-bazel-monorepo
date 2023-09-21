import { Typography } from '@mui/material';

import { TextField } from '@/economics/exports/PDFExportDialog/shared/rhf';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function Settings() {
	return (
		<div>
			<Typography>Settings</Typography>
			<TextField<PDFExportTemplate> name='name' />
		</div>
	);
}
