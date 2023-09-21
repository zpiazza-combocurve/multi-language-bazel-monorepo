import { useForm } from 'react-hook-form';

import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { withRHFControl } from '@/components/react-hook-form-helpers';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormGroup,
	RHFCheckboxField,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

const WellIdentifierSelectField = withRHFControl(WellIdentifierSelect);

export default function ForecastLookupTableImportDialog({
	resolve,
	onHide,
	visible,
}: DialogProps<{
	id: string;
	importOverlapOnly: boolean;
	importTypeCurves: boolean;
	importForecasts: boolean;
}>) {
	const { control, handleSubmit, watch } = useForm({
		mode: 'all',
		defaultValues: {
			id: DEFAULT_IDENTIFIER,
			importOverlapOnly: true,
			importTypeCurves: true,
			importForecasts: true,
		},
	});

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='xs' onDoubleClick={(ev) => ev.stopPropagation()}>
			<DialogTitle>Import Type Curve Lookup Table</DialogTitle>
			<DialogContent>
				<WellIdentifierSelectField control={control} name='id' />
				<FormGroup>
					<RHFCheckboxField control={control} name='importTypeCurves' label='Import type curves' />
					<RHFCheckboxField
						control={control}
						name='importOverlapOnly'
						label='Import type curves overlapping wells only'
						disabled={!watch('importTypeCurves')}
					/>
					<RHFCheckboxField
						control={control}
						name='importForecasts'
						label='Import type curves associated forecasts'
						disabled={!watch('importTypeCurves')}
					/>
				</FormGroup>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					variant='contained'
					onClick={handleSubmit((values) => {
						resolve(values);
					})}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
}
