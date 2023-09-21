import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useState } from 'react';

import { Button, TextField } from '@/components/v2';
import { hasNonWhitespace } from '@/helpers/text';

const NAME_MAX_LENGTH = 16;

function QualifierSaveDialog({ resolve, initialName, onHide, visible, onSave = resolve, umbrellas = [] }) {
	const [name, setName] = useState(initialName || '');
	const existingNames = umbrellas.map((qualifier) => qualifier.name);
	const error = (() => {
		if (existingNames.includes(name)) {
			return 'Qualifier with that name already exists';
		}
		if (!name || !hasNonWhitespace(name)) {
			return 'Name is Required';
		}
		if (name.length > NAME_MAX_LENGTH) {
			return 'Name is too long';
		}
		return '';
	})();

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			<DialogTitle>Create Qualifier</DialogTitle>
			<DialogContent>
				<TextField
					error={!!error}
					helperText={error}
					label='Name'
					variant='filled'
					onChange={(event) => setName(event.target.value)}
					placeholder='Name'
					type='text'
					defaultValue={name}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={() => !error && onSave(name)}
					color='primary'
					disabled={!name || error || !hasNonWhitespace(name)}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default QualifierSaveDialog;
