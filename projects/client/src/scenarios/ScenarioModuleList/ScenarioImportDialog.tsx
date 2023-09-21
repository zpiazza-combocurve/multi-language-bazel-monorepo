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
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { DialogProps } from '@/helpers/dialog';

const WellIdentifierSelectField = withRHFControl(WellIdentifierSelect);

export default function ScenarioImportDialog({
	resolve,
	onHide,
	visible,
}: DialogProps<{
	id: string;
	importOverlapOnly: boolean;
	importEconModels: boolean;
	importForecasts: boolean;
	importSchedules: boolean;
	importNetworks: boolean;
	importLookups: boolean;
}>) {
	const { control, handleSubmit } = useForm({
		mode: 'all',
		defaultValues: {
			id: DEFAULT_IDENTIFIER,
			importOverlapOnly: true,
			importEconModels: true,
			importForecasts: true,
			importSchedules: true,
			importNetworks: false,
			importLookups: true,
		},
	});

	const { isCarbonEnabled } = useLDFeatureFlags();

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='xs' onDoubleClick={(ev) => ev.stopPropagation()}>
			<DialogTitle>Import Scenario</DialogTitle>
			<DialogContent>
				<WellIdentifierSelectField control={control} name='id' />
				<FormGroup>
					<RHFCheckboxField
						control={control}
						name='importOverlapOnly'
						label='Import overlapping wells only'
					/>
					<RHFCheckboxField control={control} name='importEconModels' label='Import econ models' />
					<RHFCheckboxField control={control} name='importForecasts' label='Import forecasts' />
					<RHFCheckboxField control={control} name='importSchedules' label='Import schedules' />
					<RHFCheckboxField control={control} name='importLookups' label='Import lookup tables' />
					{isCarbonEnabled && (
						<RHFCheckboxField control={control} name='importNetworks' label='Import networks' />
					)}
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
