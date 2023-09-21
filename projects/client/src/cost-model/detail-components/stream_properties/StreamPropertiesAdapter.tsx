import { useCallback, useEffect, useState } from 'react';

import { useLocalStorageState } from '@/components/hooks';
import { EconModelStateCache, SharedEconModelProps } from '@/cost-model/detail-components/EconModelV2';

import StreamPropertiesAdvancedView from './StreamPropertiesAdvancedView';
import StreamPropertiesStandardView from './StreamPropertiesStandardView';

/**
 * Component to manage old vs new version of the Stream Properties model, based on Expenses model.
 *
 * Renamed to "Adapter" as this is the proper pattern for this type of component and there was a TODO in the Expenses
 * code.
 */
function StreamPropertiesAdapter(props: SharedEconModelProps) {
	const [usingV2, setUsingV2] = useLocalStorageState('CC_USE_ECON_MODEL_V2', false);

	const [stateCache, setStateCache] = useState<EconModelStateCache | undefined>();

	const clearStateCache = useCallback(() => {
		setStateCache(undefined);
	}, []);

	const handleToggleV2 = async (stateCache?: EconModelStateCache) => {
		setStateCache(stateCache);
		setUsingV2((p) => !p);
	};

	useEffect(() => {
		// clear the state cache when changing well assumption
		clearStateCache();
	}, [clearStateCache, props.wellAssignment]);

	if (usingV2) {
		return (
			<StreamPropertiesAdvancedView
				{...props}
				onToggleV2={handleToggleV2}
				stateCache={stateCache}
				clearStateCache={clearStateCache}
			/>
		);
	}

	return (
		<StreamPropertiesStandardView
			{...props}
			onToggleV2={handleToggleV2}
			stateCache={stateCache}
			clearStateCache={clearStateCache}
		/>
	);
}

export default StreamPropertiesAdapter;
