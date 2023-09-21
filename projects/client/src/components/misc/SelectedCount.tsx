import { Box, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';

export interface SelectedCountProps {
	count: number;
	total: number;
	direction?: string;
	itemName?: string;
	align?: 'left' | 'right';
	withLabel?: boolean;
}
// from scenario page https://github.com/insidepetroleum/main-combocurve/blob/master/client/src/scenarios/Scenario/Toolbar.tsx#L21-L44
// TODO remove duplicated code
export default function SelectedCount({
	count,
	total,
	direction = 'column',
	itemName = '',
	align = 'right',
	withLabel = true,
}: SelectedCountProps) {
	const trimmedItemName = itemName.trim();
	return (
		<Box flex='0 0 auto' display='inline-flex' flexDirection={direction}>
			<div
				css={`
					text-align: ${align};
				`}
			>
				<span
					css={`
						color: ${theme.secondaryColor};
					`}
				>
					{count.toLocaleString()}
				</span>{' '}
				/ {total.toLocaleString()}
			</div>
			{withLabel && (
				<Typography
					css={`
						color: ${theme.textColorDisabled} !important;
						margin-left: ${direction === 'row' ? '1ch' : '0'};
						font-size: 0.875rem;
						line-height: 1rem;
						text-align: right;
					`}
				>
					{trimmedItemName ? `${trimmedItemName} ` : ''}selected
				</Typography>
			)}
		</Box>
	);
}
