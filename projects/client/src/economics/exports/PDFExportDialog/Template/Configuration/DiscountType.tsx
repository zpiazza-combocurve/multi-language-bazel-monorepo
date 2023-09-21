import { Typography } from '@mui/material';

import { RadioGroup } from '@/economics/exports/PDFExportDialog/shared/rhf';
import { PDFExportTemplate } from '@/economics/exports/PDFExportDialog/shared/types';

export function DiscountType() {
	return (
		<div>
			<Typography>Discount Type</Typography>
			<RadioGroup<PDFExportTemplate> name='discCashflowOptions' row />
		</div>
	);
}

export default DiscountType;
