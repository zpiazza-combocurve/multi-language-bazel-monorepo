import { Box, MenuItem } from '@material-ui/core';
import { ReactNode } from 'react';

import { InfoTooltipWrapper, SwitchField as MUISwitchField, TextField as MUITextField } from '@/components/v2';

export const TCInfoTooltip = ({ labelTooltip, ...props }) => (
	<Box marginRight='0.5rem'>
		<InfoTooltipWrapper tooltipTitle={labelTooltip} {...props} />
	</Box>
);

export const SHARED_SWITCH_PROPS: { labelPlacement: 'start'; size: 'small' } = {
	labelPlacement: 'start',
	size: 'small',
};

export const TCTooltippedField = ({
	tooltip,
	tooltipEnd,
	children,
}: {
	tooltip?: string;
	tooltipEnd?: boolean;
	children?: ReactNode;
}) => (
	<Box alignItems='center' display='flex' flexDirection={tooltipEnd ? 'row-reverse' : 'row'}>
		{tooltip && <TCInfoTooltip labelTooltip={tooltip} />}

		<Box flexGrow={1}>{children}</Box>
	</Box>
);

export const SimpleSwitchField = ({ tooltip, label, ...rest }) => (
	<TCTooltippedField tooltip={tooltip}>
		<MUISwitchField {...SHARED_SWITCH_PROPS} {...rest} label={label} />
	</TCTooltippedField>
);

export const TCSelectField = ({ menuItems, ...rest }) => (
	<MUITextField select {...rest}>
		{menuItems.map(({ label, value, tooltip }) => (
			<MenuItem key={value} value={value}>
				<Box alignItems='center' display='flex'>
					<TCTooltippedField tooltip={tooltip}>{label}</TCTooltippedField>
				</Box>
			</MenuItem>
		))}
	</MUITextField>
);
