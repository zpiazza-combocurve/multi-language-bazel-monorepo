import { Skeleton, Stack, Typography } from '@mui/material';

export function Preview() {
	return (
		<Stack height='100%'>
			<Typography>PDF Preview</Typography>
			<Skeleton animation={false} height='100%' />
		</Stack>
	);
}
