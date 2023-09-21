import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { TextField } from '@/components/v2';
import { listMappings } from '@/data-import/FileImport/api';
import { DialogProps } from '@/helpers/dialog';

type SaveMappingDialogProps = DialogProps<string> & {
	defaultName: string;
};

function SaveMappingDialog({ defaultName, resolve, visible, onHide, ..._props }: SaveMappingDialogProps) {
	const [name, setName] = useState<string>(defaultName);
	const { data: importMappings, isLoading: loadingMappings } = useQuery(['data-import', 'mappings'], () =>
		listMappings()
	);
	const handleConfirm = useCallback(() => {
		resolve(name || defaultName);
	}, [defaultName, name, resolve]);

	const invalidName = useMemo(
		() => importMappings?.some(({ description }) => description === name),
		[importMappings, name]
	);

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Save Mappings</DialogTitle>
			<DialogContent>
				<TextField
					type='text'
					label='Mappings Name'
					onChange={(e) => setName(e.target.value)}
					value={name}
					placeholder={defaultName}
					error={invalidName}
					tooltipTitle={invalidName && 'Duplicated Name'}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} color='secondary' variant='contained'>
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					color='primary'
					variant='contained'
					disabled={loadingMappings || invalidName}
				>
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SaveMappingDialog;
