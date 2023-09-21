import { useState } from 'react';

import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export const CCExportDialog = ({
	assumptionName,
	resolve,
	visible,
	onHide,
}: DialogProps<{ includeDefault: boolean }> & { assumptionName: string }) => {
	const [includeDefault, setIncludeDefault] = useState(false);

	const toggleIncludeDefault = () => setIncludeDefault((prevState) => !prevState);

	return (
		<Dialog maxWidth='xs' fullWidth open={visible} onClose={onHide}>
			<DialogTitle>CSV Export - {assumptionName}</DialogTitle>

			<DialogContent>
				<CheckboxField label='Include Default' checked={includeDefault} onChange={toggleIncludeDefault} />
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={() => resolve({ includeDefault })}>
					Start Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default CCExportDialog;
