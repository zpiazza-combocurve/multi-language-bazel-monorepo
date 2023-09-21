import { useMemo, useState } from 'react';

import { TextField } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { handleBackdropClose } from '@/helpers/dialog';
import { hasNonWhitespace } from '@/helpers/text';

export function EconSettingsSaveAsDialog({ initialName, resolve, invalidNames = [], visible, ...props }) {
	const [name, setName] = useState(initialName || '');

	const handleChangeName = (value) => setName(value);

	const nameIsInvalid = useMemo(() => invalidNames.some((invalidName) => invalidName === name), [name, invalidNames]);

	const nameError = (!name || !hasNonWhitespace(name)) && 'Name is required';
	const duplicatedError = nameIsInvalid && 'Duplicated Name';
	const error = nameError || duplicatedError;

	const handleSave = () => {
		if (!error) {
			resolve(name);
		}
	};

	const onClose = () => {
		resolve(null);
	};

	return (
		<Dialog
			id='econ-settings-save-as-dialog'
			open={visible}
			onClose={(e, reason) => handleBackdropClose(e, reason, onClose)}
			{...props}
		>
			<DialogTitle>Save As</DialogTitle>
			<DialogContent>
				<TextField
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					error={error}
					errorText={error}
					id='setting-name'
					label='Name'
					lineDirection='center'
					name='setting-name'
					onChange={handleChangeName}
					placeholder='Name'
					type='text'
					value={name}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => resolve(null)}>Cancel</Button>
				<Button color='primary' disabled={error} onClick={() => handleSave()}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
