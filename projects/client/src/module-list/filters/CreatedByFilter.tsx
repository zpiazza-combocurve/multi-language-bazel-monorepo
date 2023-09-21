import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import { useContext } from 'react';

import { useGetUsersQuery } from '@/access-policies/queries';
import { Box, CheckboxField } from '@/components/v2';
import { Autocomplete } from '@/components/v2/misc';
import { useAlfa } from '@/helpers/alfa';
import { getFullName } from '@/helpers/user';

import { FiltersContext } from './shared';

const anyUser = {
	_id: '' as Inpt.ObjectId,
	name: 'Any User',
	firstName: '',
	lastName: '',
	email: '',
	locked: false,
	isEnterpriseConnection: false,
};

const useAutocompleteStyles = makeStyles({
	listbox: {
		maxHeight: '10rem',
	},
});

export default function CreatedByFilter() {
	const { user: currentUser } = useAlfa();
	const {
		filters: { createdBy },
		setFilters,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	} = useContext(FiltersContext)!;

	const { data: users } = useGetUsersQuery({
		placeholderData: [anyUser],
		select: (data) => {
			const newUsers = data
				.filter((user) => user?.firstName)
				.map((user) => ({ ...user, name: getFullName(user) }));

			const sortedUsers = _.sortBy(newUsers, (user) => user.name.toLowerCase());

			sortedUsers.unshift(anyUser);

			return sortedUsers;
		},
	});

	const selectedUser = _.find(users, { _id: createdBy });

	const filteredByCurrentUser = createdBy === currentUser._id;

	const styles = useAutocompleteStyles();

	return (
		<>
			<Autocomplete
				label='Created By'
				classes={styles}
				options={users ?? []}
				getOptionLabel={(user) => user.name}
				value={selectedUser || anyUser}
				onChange={(ev, user) => setFilters({ createdBy: user?._id || anyUser?._id })}
				blurOnSelect
			/>

			<Box display='block'>
				<CheckboxField
					checked={filteredByCurrentUser}
					onChange={() => setFilters({ createdBy: filteredByCurrentUser ? '' : currentUser?._id })}
					label={filteredByCurrentUser ? 'Clear User Filter' : 'Filter By Current User'}
				/>
			</Box>
		</>
	);
}
