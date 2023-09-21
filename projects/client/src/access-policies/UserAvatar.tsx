import Avatar from '@material-ui/core/Avatar';

const UserAvatar = ({ user }) => {
	const firstNameInitial = user?.firstName?.[0];
	const lastNameInitial = user?.lastName?.[0];

	return (
		<Avatar>
			{firstNameInitial}
			{lastNameInitial}
		</Avatar>
	);
};

export default UserAvatar;
