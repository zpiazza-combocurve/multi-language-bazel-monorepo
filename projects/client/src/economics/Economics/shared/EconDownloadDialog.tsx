import { useState } from 'react';

import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { fileNameMap, isPDFReport } from '@/economics/shared/shared';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { addDateTime } from '@/helpers/timestamp';

export function EconDownloadDialog({
	visible,
	onHide,
	resolve,
	type,
	name,
	discCashflowOptions,
}: DialogProps<{ fileName: string; bfitReport?: boolean; afitReport?: boolean }> & {
	name?: string;
	type: keyof typeof fileNameMap;
	discCashflowOptions?;
}) {
	const { isCustomPDFEditorEnabled } = useLDFeatureFlags();
	const [afit, bfit] = (() => {
		if (isCustomPDFEditorEnabled) {
			if (discCashflowOptions === 'both') return [true, true];
			if (discCashflowOptions === 'afit') return [true, false];
			if (discCashflowOptions === 'bfit') return [false, true];
		}
		return [false, false];
	})();
	const defaultName = name ?? fileNameMap[type];
	const [fileName, setName] = useState(defaultName);
	const [bfitReport, setBfitReport] = useState(afit);
	const [afitReport, setAfitReport] = useState(bfit);
	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Enter File Name</DialogTitle>
			<DialogContent>
				<TextField value={fileName} onChange={(ev) => setName(ev.target.value)} label='File Name' fullWidth />
				{!isCustomPDFEditorEnabled && isPDFReport(type) && (
					<>
						<CheckboxField
							label='BFIT'
							checked={bfitReport}
							onChange={(ev) => setBfitReport(ev.target.checked)}
						/>
						<CheckboxField
							label='AFIT'
							checked={afitReport}
							onChange={(ev) => setAfitReport(ev.target.checked)}
						/>
						If neither selected, defaults to BFIT
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					id='file-download'
					color='primary'
					onClick={() => resolve({ fileName: addDateTime(fileName), bfitReport, afitReport })}
					variant='contained'
					disabled={!fileName}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export function useEconDownloadDialog() {
	return useDialog(EconDownloadDialog);
}
