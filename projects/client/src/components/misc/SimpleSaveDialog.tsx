import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';
import { useState } from 'react';

import { Button } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { hasNonWhitespace } from '@/helpers/text';

type SimpleSaveDialogProps = DialogProps<string> & {
	title: string;
	label: string;
};

function SimpleSaveDialog({ title, label, resolve, onHide, visible }: SimpleSaveDialogProps) {
	const [name, setName] = useState('');

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					margin='dense'
					label={label}
					fullWidth
					onChange={(event) => {
						setName(event.target.value);
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onHide()}>Cancel</Button>
				<Button color='primary' onClick={() => resolve(name)} disabled={!name || !hasNonWhitespace(name)}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SimpleSaveDialog;
