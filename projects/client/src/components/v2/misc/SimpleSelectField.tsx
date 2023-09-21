import { Box, MenuItem } from '@material-ui/core';

import { InfoTooltip } from '@/components/tooltipped';

import TextField, { TextFieldProps } from '../TextField';

export interface SimpleSelectFieldProps extends TextFieldProps {
	menuItems: { value: string; label: string; tooltip?: string }[];
}

export default function SimpleSelectField({ menuItems, ...rest }: SimpleSelectFieldProps) {
	return (
		<TextField select {...rest}>
			{menuItems.map(({ value, label, tooltip }) => (
				<MenuItem key={value} value={value}>
					<Box alignItems='center' display='flex'>
						{tooltip && (
							<Box marginRight='0.5rem'>
								<InfoTooltip labelTooltip={tooltip} />
							</Box>
						)}

						{label}
					</Box>
				</MenuItem>
			))}
		</TextField>
	);
}
