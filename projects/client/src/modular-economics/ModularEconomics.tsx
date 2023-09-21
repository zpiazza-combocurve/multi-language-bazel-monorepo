import { faSackDollar } from '@fortawesome/pro-regular-svg-icons';

import { IconButton } from '@/components/v2';
import { useDialog } from '@/helpers/dialog';

import { ModularScenarioDialog } from './ModularScenarioDialog';

// Only forecast, type-curve coming soon
export const ModularEconomics = ({
	forecastId,
	wellId,
}: {
	forecastId: Inpt.ObjectId<'forecast'>;
	wellId: Inpt.ObjectId<'well'>;
}) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [modularScenarioDialog, promptModularScenarioDialog] = useDialog(ModularScenarioDialog, {
		forecastId,
		wellId,
	});

	return (
		<>
			<IconButton
				onClick={() => promptModularScenarioDialog()}
				color='primary'
				size='small'
				tooltipPlacement='left'
				tooltipTitle='Modular Economics'
			>
				{faSackDollar}
			</IconButton>
			{modularScenarioDialog}
		</>
	);
};
