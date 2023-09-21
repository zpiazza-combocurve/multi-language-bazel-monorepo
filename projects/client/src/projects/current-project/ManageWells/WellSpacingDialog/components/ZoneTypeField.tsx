import { FormLabel, Typography } from '@material-ui/core';

import { RHFRadioGroupField } from '@/components/v2';

import { MenuItem, StyledInputFieldContainer } from './common';

const zoneItems: MenuItem[] = [
	{ label: 'Any Landing Zone', value: 'any' },
	{ label: 'Same Landing Zone', value: 'same' },
];

export const ZoneTypeField = () => (
	<StyledInputFieldContainer>
		<FormLabel style={{ display: 'block', marginBottom: '8px' }}>
			<Typography variant='body2'>Calculate Well Spacing Distance for:</Typography>
		</FormLabel>
		<RHFRadioGroupField required name='zoneType' options={zoneItems} size='small' />
	</StyledInputFieldContainer>
);
