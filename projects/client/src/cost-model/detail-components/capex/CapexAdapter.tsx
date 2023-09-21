import { useCallback, useEffect, useState } from 'react';

import { useLocalStorageState } from '@/components/hooks';

import { EconModelStateCache, SharedEconModelProps } from '../EconModelV2';
import CapexAdvancedView from './CapexAdvancedView';
import CapexStandardView from './CapexStandardView';

/**
 * Component to manage old vs new version of the expenses model
 *
 * @todo Find a better name for it
 */
function CapexAdapter(props: SharedEconModelProps) {
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
		setStateCache(undefined);
	}, [props.wellAssignment]);

	if (usingV2) {
		return <CapexAdvancedView onToggleV2={handleToggleV2} {...props} />;
	}

	return (
		<CapexStandardView
			{...props}
			onToggleV2={handleToggleV2}
			stateCache={stateCache}
			clearStateCache={clearStateCache}
		/>
	);
}

export default CapexAdapter;
