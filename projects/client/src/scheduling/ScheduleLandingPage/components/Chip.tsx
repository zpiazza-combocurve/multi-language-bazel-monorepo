import { ChipProps } from '@material-ui/core';

import { Chip as MuiChip } from '@/components/v2';
import { withTooltip } from '@/components/v2/helpers';

interface MuiChipProps extends ChipProps {
	isDraft: boolean;
}

const TooltipChip = withTooltip(MuiChip as React.FC<MuiChipProps>);

export const Chip = ({ name, isDraft }) => {
	const tooltip = isDraft ? 'Configuration needs to be updated' : 'Configuration is up to date';

	if (name)
		return (
			<TooltipChip
				tooltipTitle={tooltip}
				isDraft={isDraft}
				css={`
					background-color: ${({ theme, isDraft }) => {
						return isDraft ? theme.palette.warning.main : theme.palette.secondary.main;
					}};
					color: #242426;
					margin-right: 0.5rem;
					font-size: 0.75rem;
					font-weight: 600;
				`}
				size='small'
				label={name}
			/>
		);

	return null;
};
