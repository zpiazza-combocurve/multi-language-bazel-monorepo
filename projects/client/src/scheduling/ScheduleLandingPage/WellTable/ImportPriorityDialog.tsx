import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { DropBoxFileInput } from '@/components';
import { Button } from '@/components/v2';
import { withDialog } from '@/helpers/dialog';

export const showImportPriorityDialog = withDialog(({ visible = false, resolve, onHide }) => {
	const [files, setFiles] = useState<File[] | null | undefined>([]);

	const handleImport = () => resolve(files?.[0]);

	return (
		<Dialog
			css={`
				display: flex;
				flex-direction: column;
			`}
			onClose={onHide}
			open={visible}
		>
			<DialogTitle>Upload Sorting</DialogTitle>
			<DialogContent
				css={`
					flex: 1 1;
					overflow: auto;
					padding: 1rem;
				`}
			>
				<DropBoxFileInput onChange={(newFiles) => setFiles(newFiles)} />
			</DialogContent>
			<DialogActions
				css={`
					display: flex;
					justify-content: space-between;
				`}
			>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					disabled={!files?.[0]}
					onClick={handleImport}
					{...getTaggingProp('schedule', 'importPrioritization')}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
});
