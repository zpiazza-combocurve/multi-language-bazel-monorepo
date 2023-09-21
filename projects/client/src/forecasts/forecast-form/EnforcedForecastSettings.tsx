import _ from 'lodash-es';
import { createContext, useMemo } from 'react';
import { useQuery } from 'react-query';

import { FormPhase, WellLifeDict } from '@/forecasts/forecast-form/automatic-form/types';
import { getApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { useCurrentProject } from '@/projects/api';

interface EnforcedForecastConfiguration {
	settings: {
		[K in FormPhase]: {
			D_lim_eff?: number;
			enforce_sw?: boolean;
			q_final?: number;
			well_life_dict?: WellLifeDict;
		};
	};
}

// returns all nested paths as strings with dot notation
const getEnforcedPaths = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: Record<string, any>,
	prefixes: Array<string> = [],
	result: Array<string> = []
): Array<string> => {
	_.forEach(data, (value, key) => {
		if (typeof value === 'object') {
			result.push(...getEnforcedPaths(value, [...prefixes, key]));
		} else if (value !== 'undefined') {
			result.push(`${prefixes.length ? `${prefixes.join('.')}.` : ''}${key}`);
		}
	});

	return result;
};

function useEnforcedSettings(projectId) {
	const enforceCompanySettingsConfiguration = useQuery(['company-configuration-enforce-project', projectId], () =>
		getApi(`/company-forecast-settings/enforce/${projectId}`)
	);

	const enforcedSettingsQuery = useQuery(
		['company-configuration', 'forecast'],
		(): Promise<EnforcedForecastConfiguration> => getApi('/company-forecast-settings'),
		{
			select: (config) => config.settings,
			enabled:
				enforceCompanySettingsConfiguration.isSuccess &&
				!!enforceCompanySettingsConfiguration.data.companyForecastSetting,
		}
	);

	return enforcedSettingsQuery;
}

const EnforcedForecastSettingsContext = createContext<{
	enforcedData?: EnforcedForecastConfiguration['settings'];
	enforcedPaths: {
		[K in FormPhase]: Array<string>;
	};
	enforcedPathsArray?: Array<string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
}>({} as any);

function EnforcedForecastSettings({ children }) {
	const { project } = useCurrentProject();
	assert(project?._id, 'Expected projectId to be in context');

	const enforcedSettingsQuery = useEnforcedSettings(project._id);
	const { data } = enforcedSettingsQuery;

	const enforcedPaths = useMemo(
		() =>
			data
				? _.reduce(
						data,
						(acc, value, phase) => {
							acc[phase] = getEnforcedPaths(value);
							return acc;
						},
						{ oil: [], gas: [], water: [], shared: [] }
				  )
				: { oil: [], gas: [], water: [], shared: [] },
		[data]
	);

	const enforcedPathsArray = useMemo(() => (data ? getEnforcedPaths(data) : []), [data]);

	return (
		<EnforcedForecastSettingsContext.Provider
			value={useMemo(
				() => ({ enforcedData: data, enforcedPaths, enforcedPathsArray }),
				[data, enforcedPaths, enforcedPathsArray]
			)}
		>
			{children}
		</EnforcedForecastSettingsContext.Provider>
	);
}

export default EnforcedForecastSettings;
export { EnforcedForecastConfiguration, EnforcedForecastSettingsContext };
