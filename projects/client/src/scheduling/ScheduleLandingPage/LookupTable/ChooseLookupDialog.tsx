import { PropsWithChildren, useState } from 'react';

import { Autocomplete, Button } from '@/components/v2';
import { DialogLikeProps } from '@/helpers/dialog';
import { getCurrentTheme } from '@/helpers/theme';

import { GenericDialog } from '../components/GenericDialog/GenericDialog';

type ChooseLookupDialog = PropsWithChildren<DialogLikeProps> & { lookupTables: [] };

export const ChooseLookupDialog = ({ visible, onHide, resolve, lookupTables }: ChooseLookupDialog) => {
	const theme = getCurrentTheme();
	const [selectedLookup, setSelectedLookup] = useState<{ _id: Inpt.ObjectId } | null>(null);

	return (
		<GenericDialog
			title='Choose Lookup Table'
			visible={visible || false}
			onHide={onHide || resolve}
			maxWidth='xs'
			disableMinHeight
			actions={
				<>
					<Button variant='text' color='secondary' onClick={onHide}>
						Cancel
					</Button>
					<Button
						variant='contained'
						color='secondary'
						onClick={() => resolve(selectedLookup?._id)}
						disabled={!selectedLookup}
						style={{ color: theme.background }}
					>
						Apply
					</Button>
				</>
			}
		>
			<Autocomplete
				variant='outlined'
				color='secondary'
				InputProps={{ color: 'secondary' }}
				InputLabelProps={{ color: 'secondary' }}
				label='Lookup Name'
				placeholder='Search'
				size='small'
				options={lookupTables ?? []}
				getOptionLabel={(option) => {
					return option.name ?? '';
				}}
				value={selectedLookup}
				onChange={(_, project) => {
					setSelectedLookup(project);
				}}
				clearOnBlur={false}
				disableClearable
				blurOnSelect
			/>
		</GenericDialog>
	);
};
