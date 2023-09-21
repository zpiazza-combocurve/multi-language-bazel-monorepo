import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { AbilityContext, UPDATE_ACCESS_POLICIES_EVENT_NAME, ability, updateAbility } from '@/access-policies/Can';
import { Placeholder } from '@/components';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';

const queryKey = ['ability'];

const getAbilityRules = () => getApi('/user/ability-rules');

export const useAbilityRules = () => {
	const queryClient = useQueryClient();
	const { data: abilityRules, ...rest } = useQuery(queryKey, () => getAbilityRules());

	useEffect(() => {
		if (abilityRules) {
			updateAbility(abilityRules);
		}
	}, [abilityRules]);

	const updateRules = useCallback(
		(newRules) => {
			queryClient.setQueryData(queryKey, newRules);
		},
		[queryClient]
	);

	const invalidateRules = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
	}, [queryClient]);

	return {
		...rest,
		invalidateRules,
		updateRules,
		queryKey,
	};
};

export const AbilityProvider = ({ children }) => {
	const { isLoading, invalidateRules } = useAbilityRules();
	const { Pusher: userPusherChannel } = useAlfa(['Pusher']);

	useEffect(() => {
		userPusherChannel.bind(UPDATE_ACCESS_POLICIES_EVENT_NAME, invalidateRules);

		return () => {
			userPusherChannel.unbind(UPDATE_ACCESS_POLICIES_EVENT_NAME, invalidateRules);
		};
	}, [userPusherChannel, invalidateRules]);

	if (isLoading) {
		return <Placeholder loading />;
	}

	return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
};
