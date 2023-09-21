import { useCallback, useEffect, useState } from 'react';

import { useLocalStorageState } from '@/components/hooks';

import { EconModelStateCache, SharedEconModelProps } from '../EconModelV2';
import ExpensesAdvancedView from './ExpensesAdvancedView';
import ExpensesStandardView from './ExpensesStandardView';

/**
 * Component to manage old vs new version of the expenses model
 *
 * @todo Find a better name for it
 */
function ExpensesAdapter(props: SharedEconModelProps) {
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
			<ExpensesAdvancedView
				{...props}
				onToggleV2={handleToggleV2}
				stateCache={stateCache}
				clearStateCache={clearStateCache}
			/>
		);
	}

	return (
		<ExpensesStandardView
			{...props}
			onToggleV2={handleToggleV2}
			stateCache={stateCache}
			clearStateCache={clearStateCache}
		/>
	);
}

export default ExpensesAdapter;
