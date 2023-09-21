import { Box, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';

const CollapseHeader = ({ label, children }) => {
	return (
		<Box
			display='flex'
			alignItems='center'
			justify-content='space-between'
			style={{
				borderRadius: '3px',
				background: theme.backgroundOpaque,
				padding: '0.25rem 1rem 0.25rem 1rem',
			}}
		>
			<Typography variant='subtitle1'>{label}</Typography>
			<Box marginLeft='auto'>{children}</Box>
		</Box>
	);
};

export default CollapseHeader;
