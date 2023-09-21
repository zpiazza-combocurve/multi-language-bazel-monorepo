import { faFilter } from '@fortawesome/pro-regular-svg-icons';

import { Box, faIcon } from '@/components/v2';

export default function Title({ children }: { children? }) {
	return (
		<div
			css={`
				display: flex;
				align-items: baseline;
				justify-content: space-between;
			`}
		>
			<Box display='flex' alignItems='center' fontSize='1.25rem'>
				{faIcon(faFilter)}
				<span css='margin-left: 0.5rem'>Filters</span>
			</Box>
			{children}
		</div>
	);
}
