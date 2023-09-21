import { Box, InfoTooltipWrapper } from '@/components/v2';
import { ControlFieldLabel } from '@/forecasts/deterministic/manual/layout';
import { theme } from '@/helpers/styled';

const KeyboardModeIndicator = ({ editAreaFocused }) => (
	<Box display='flex' alignItems='center' justifyContent='space-between' px='0.5rem'>
		<InfoTooltipWrapper tooltipTitle='Indicates whether keyboard mode is active or inactive'>
			<ControlFieldLabel>Keyboard Mode</ControlFieldLabel>
		</InfoTooltipWrapper>

		<Box color={editAreaFocused ? theme.primaryColor : theme.warningAlternativeColor} fontSize='1rem'>
			{editAreaFocused ? 'Active' : 'Disabled'}
		</Box>
	</Box>
);

export default KeyboardModeIndicator;
