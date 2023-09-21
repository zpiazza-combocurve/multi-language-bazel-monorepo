import { Placeholder } from '@/components';
import { Box, Paper } from '@/components/v2';

export function LoadingEconomicRun({ className }: { className?: string }) {
	return (
		<Box className={className} display='flex' flexDirection='column' component={Paper}>
			<Placeholder main loading />
		</Box>
	);
}
