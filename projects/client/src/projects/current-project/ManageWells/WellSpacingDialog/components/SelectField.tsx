import { Typography } from '@material-ui/core';

import { InfoTooltipWrapper, RHFSelectField } from '@/components/v2';
import { LabeledFieldContainer } from '@/components/v2/misc';

import { MenuItem, StyledInputFieldContainer } from './common';

interface InputFieldProps {
	label: string;
	name: string;
	tooltipTitle?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	validate?: any;
}

interface FieldProps extends InputFieldProps {
	menuItems: MenuItem[];
}

export const SelectField = ({ label, tooltipTitle, name, menuItems, validate }: FieldProps) => (
	<StyledInputFieldContainer>
		<LabeledFieldContainer fullWidth>
			<div style={{ marginBottom: '8px' }}>
				<InfoTooltipWrapper tooltipTitle={tooltipTitle} placeIconAfter>
					<Typography variant='body2'>{label}</Typography>
				</InfoTooltipWrapper>
			</div>
			<RHFSelectField
				variant='outlined'
				color='secondary'
				required
				inputProps={{ 'aria-label': name }}
				name={name}
				label='Select'
				type='select'
				menuItems={menuItems}
				rules={{ validate }}
				size='small'
			/>
		</LabeledFieldContainer>
	</StyledInputFieldContainer>
);
