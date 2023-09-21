// TODO move out of components root, perhaps under misc idk, doesn't feel right here
import { FormControl, Radio, RadioGroup, Select } from '@material-ui/core';
import { useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export const ChoosePSeriesDialog = ({
	resolve,
	visible,
	onHide,
	pSeries,
}: DialogProps<string> & { pSeries: string | null }) => {
	const [type, setType] = useState(pSeries === 'best' ? 'best' : 'percentile');
	const [percentile, setPercentile] = useState(pSeries === 'best' ? '' : pSeries ?? 'P50');

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='sm' fullWidth>
			<DialogTitle>Choose P-Series</DialogTitle>
			<DialogContent>
				<FormControl fullWidth>
					<RadioGroup name='type' value={type} onChange={(event) => setType(event.target.value)}>
						<FormControlLabel value='best' control={<Radio />} label='Best' />
						<FormControlLabel value='percentile' control={<Radio />} label='Percentile' />
					</RadioGroup>
				</FormControl>
				<FormControl fullWidth>
					<Select
						value={percentile}
						onChange={(event) => setPercentile(event.target.value as string)}
						disabled={type !== 'percentile'}
					>
						<MenuItem value='P10'>P10</MenuItem>
						<MenuItem value='P50'>P50</MenuItem>
						<MenuItem value='P90'>P90</MenuItem>
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={() => resolve(type === 'best' ? 'best' : percentile)}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ChoosePSeriesDialog;
