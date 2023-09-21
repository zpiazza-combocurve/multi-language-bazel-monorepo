import { useContext } from 'react';
import { useFormContext } from 'react-hook-form';

import { ActivityStep, Resource } from '@/inpt-shared/scheduling/shared';
import CacheContext from '@/scheduling/ScheduleCacheContext';

export const useSchedulingFormContext = () => {
	const context = useFormContext();
	const { setCacheEntry } = useContext(CacheContext);

	const setValue = (
		name: 'resources' | 'activitySteps',
		value: Resource[] | ActivityStep[],
		options?: { shouldValidate?: boolean; shouldDirty?: boolean; shouldTouch?: boolean }
	) => {
		context.setValue(name, value, options);
		setCacheEntry(name, value);
	};

	return { ...context, setValue };
};
