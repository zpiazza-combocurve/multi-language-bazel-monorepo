import { Box } from '@/components/v2';

export const LabelChip = ({ el }) => {
	return (
		<Box
			sx={{
				color: '#228ADA',
				fontSize: '0.6rem',
				border: '1px solid  #228ADA ',
				padding: 10,
				borderRadius: '16px',
			}}
		>
			{el.name}
		</Box>
	);
};
