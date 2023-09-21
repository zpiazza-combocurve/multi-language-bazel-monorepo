import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';

import NewWellFilterDialog from './NewWellFilterDialog';
import WellFilterDialog from './WellFilterDialog';
import { WellFilterDialogProps } from './types';

const WellFilterDialogWrapper = (props: WellFilterDialogProps) => {
	const { isNewWellsFilteringEnabled: newWellsFilteringEnabled } = useLDFeatureFlags();

	if (newWellsFilteringEnabled) {
		return <NewWellFilterDialog {...props} />;
	}

	return <WellFilterDialog {...props} />;
};

export default WellFilterDialogWrapper;
