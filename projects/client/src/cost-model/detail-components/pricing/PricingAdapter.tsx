import { useCallback, useEffect, useState } from 'react';

import { useLocalStorageState } from '@/components/hooks';
import { EconModelStateCache, SharedEconModelProps } from '@/cost-model/detail-components/EconModelV2';

import PricingAdvancedView from './PricingAdvancedView';
import Pricing from './PricingStandardView';

function PricingAdapter(props: SharedEconModelProps) {
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
			<PricingAdvancedView
				{...props}
				onToggleV2={handleToggleV2}
				stateCache={stateCache}
				clearStateCache={clearStateCache}
			/>
		);
	}

	return <Pricing {...props} onToggleV2={handleToggleV2} stateCache={stateCache} clearStateCache={clearStateCache} />;
}

export default PricingAdapter;
