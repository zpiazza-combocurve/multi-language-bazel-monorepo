import { useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@/components/v2';
import { withDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { hasNonWhitespace } from '@/helpers/text';

import { confirmationAlert, withLoadingBar } from '../helpers/alerts';
import { postApi } from '../helpers/routing';
import { WELL_FILTERS_QUERY_KEY } from './utils';

export function WellFilterSave({ visible, resolve, appliedFilters, project, updateSaveFilters }) {
	const [name, setName] = useState('');

	const saveFilter = async () => {
		const body = {
			projectId: project?._id,
			name,
			filter: appliedFilters[appliedFilters.length - 1],
		};

		const newFilter = await withLoadingBar(postApi('/filters/saveFilter', body));

		queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
		updateSaveFilters(newFilter);
		confirmationAlert(`${body.name} Saved`);

		resolve();
	};

	return (
		<Dialog open={visible} onClose={resolve} fullWidth maxWidth='xs'>
			<DialogTitle>Save Filter</DialogTitle>
			<DialogContent>
				<TextField
					type='text'
					value={name}
					label='New Filter Name'
					onChange={(event) => {
						setName(event.target.value.toString());
					}}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button
					id='save-current-btn'
					disabled={!name || !hasNonWhitespace(name)}
					onClick={saveFilter}
					color='primary'
				>
					Save New
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export const showFilterSaveDialog = withDialog(WellFilterSave);
