import { makeStyles } from '@material-ui/core/styles';
import { AutocompleteInputChangeReason } from '@material-ui/lab';
import _ from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import * as uuid from 'uuid';

import { Autocomplete } from '@/components/v2/misc';
import { getApi } from '@/helpers/routing';

import { FiltersContext } from './shared';

const anyUser = {
	_id: '' as Inpt.ObjectId,
	tenantId: '',
	description: 'Any DataSync Agent',
	registrationKey: '',
	instanceCount: 0,
};

const useAutocompleteStyles = makeStyles({
	listbox: {
		maxHeight: '10rem',
	},
});

const PERMISSIONS_QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minute(s) in milliseconds
const PERMISSIONS_QUERY_STALE_TIME = 1 * 60 * 1000; // 1 minute(s) in milliseconds

const makeKey = (query?: string) => (query ? ['agents', query] : ['agents']);

export const useGetAgents = (searchQuery = '', opts) => {
	return useQuery<Inpt.Agent[]>(
		makeKey(searchQuery),
		() => getApi('/data-sync/agents', { sort: 'description', sortDir: 1, agentName: searchQuery }),
		{
			cacheTime: PERMISSIONS_QUERY_CACHE_TIME,
			staleTime: PERMISSIONS_QUERY_STALE_TIME,
			...opts,
		}
	);
};

export default function AgentNames() {
	const {
		filters: { dataSyncAgentId },
		setFilters,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	} = useContext(FiltersContext)!;
	const [options, setOptions] = useState<Inpt.Agent[]>([]);
	const [searchQuery, setSearch] = useState('');
	const id = useMemo(() => uuid.v4(), []);

	const { data: users } = useGetAgents(searchQuery, {
		placeholderData: [anyUser],
		select: (data) => {
			if (!data.items) return []; // TODO check this test is needed
			const newUsers = data.items.filter((agent) => agent?.description);

			const sortedUsers = _.sortBy(newUsers, (user) => user.description.toLowerCase());

			sortedUsers.unshift(anyUser);

			return sortedUsers;
		},
	});

	const onInputChange = _.debounce((value: string, reason: AutocompleteInputChangeReason) => {
		if (reason === 'input') {
			setSearch(value);
		}
	});

	useEffect(() => {
		if (users) {
			setOptions(users);
		}
	}, [users]);

	const selectedUser = useMemo(() => _.find(options, { _id: dataSyncAgentId }), [dataSyncAgentId, options]);

	const styles = useAutocompleteStyles();

	return (
		<Autocomplete
			id={id}
			label='Agent Name'
			classes={styles}
			options={options ?? []}
			getOptionLabel={(agent) => agent.description}
			value={selectedUser || anyUser}
			onChange={(_ev, user) => setFilters({ dataSyncAgentId: user?._id || anyUser?._id })}
			onInputChange={(_ev, value, reason) => onInputChange(value, reason)}
			blurOnSelect
		/>
	);
}
