import { Box, Divider, Stack } from '@mui/material';

import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { CashflowReporting } from './Template/CashflowReporting';
import { Configuration } from './Template/Configuration';
import { HybridReporting } from './Template/HybridReporting';
import { Preview } from './Template/Preview';
import { Settings } from './Template/Settings';

export function Template() {
	return (
		<Section>
			<SectionHeader>
				<Box
					display='flex'
					sx={{
						'& > *': {
							flex: '1 1 0',
							'&:not(:first-child)': {
								paddingLeft: '1rem',
							},
						},
					}}
				>
					<Settings />
					<CashflowReporting />
					<HybridReporting />
				</Box>
				<hr />
			</SectionHeader>
			<SectionContent>
				<Stack
					height='100%'
					justifyContent='space-between'
					direction='row'
					spacing={1}
					divider={<Divider orientation='vertical' flexItem />}
				>
					<Box flexGrow={1} minWidth='25rem' maxWidth='25rem'>
						<Preview />
					</Box>
					<Box flexGrow={2}>
						<Configuration />
					</Box>
				</Stack>
			</SectionContent>
		</Section>
	);
}
