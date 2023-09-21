import { useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	FormGroup,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

export default function ImportDialog({
	resolve,
	onHide,
	feat = '',
	visible,
	isTypecurve = false,
}: DialogProps<{ updateOnly: boolean; id: string; bringAssociatedForecast: boolean }> & {
	feat: string;
	isTypecurve?: boolean;
}) {
	const [id, setId] = useState(DEFAULT_IDENTIFIER);
	const [updateOnly, setUpdateOnly] = useState(true);
	const [bringAssociatedForecast, setBringAssociatedForecast] = useState(true);
	const getTagging = (feat) => {
		switch (feat) {
			case 'Forecast':
				return getTaggingProp('forecast', 'importToProject');
			default:
				return {};
		}
	};
	return (
		<Dialog onClose={onHide} open={visible} maxWidth='xs' onDoubleClick={(ev) => ev.stopPropagation()}>
			<DialogTitle>Import {feat}</DialogTitle>
			<DialogContent>
				<WellIdentifierSelect value={id} onChange={setId} />
				<FormGroup>
					<FormControlLabel
						control={<Checkbox checked={updateOnly} onChange={(ev) => setUpdateOnly(ev.target.checked)} />}
						label='Import overlapping wells only'
					/>
					{isTypecurve && (
						<FormControlLabel
							control={
								<Checkbox
									checked={bringAssociatedForecast}
									onChange={(ev) => setBringAssociatedForecast(ev.target.checked)}
								/>
							}
							label='Import Forecast'
						/>
					)}
				</FormGroup>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					variant='contained'
					onClick={() => {
						resolve({ updateOnly, id, bringAssociatedForecast });
					}}
					{...getTagging(feat)}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
}
