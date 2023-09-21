import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';
import { useState } from 'react';

import { Button } from '@/components/v2';
import { hasNonWhitespace } from '@/helpers/text';

const SetNameDialog = ({ resolve, onHide, visible, label }) => {
	const [name, setName] = useState('');

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Save {label}</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					margin='dense'
					id='name'
					label={`${label} Name`}
					fullWidth
					onChange={(event) => {
						setName(event.target.value);
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button onClick={() => resolve(name)} color='primary' disabled={!name || !hasNonWhitespace(name)}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SetNameDialog;
