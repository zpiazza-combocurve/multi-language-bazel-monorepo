import { faUser } from '@fortawesome/pro-regular-svg-icons';
import { Menu, MenuItem } from '@material-ui/core';
import React, { useState } from 'react';

import { useAnalytics } from '@/analytics/useAnalytics';
import { IconButton } from '@/components/v2';
import { confirmationAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import authClient from '@/login/authClient';

import UpdateUserDialog from './UpdateUserDialog';

export const Account = () => {
	const { user, set } = useAlfa(['user', 'set']);
	const analytics = useAnalytics();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const [updateUserDialog, promptUpdateUserDialog] = useDialog(UpdateUserDialog);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = () => {
		analytics.reset();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		authClient.signOut();
	};

	const handleUpdateUser = async () => {
		handleClose();

		const result = await promptUpdateUserDialog({ user });

		if (!result) {
			return;
		}

		try {
			// TODO Use a react-query mutation
			const updatedUser = await withLoadingBar(
				postApi('/user/changeName', {
					_id: user._id,
					firstName: result.firstName,
					lastName: result.lastName,
				})
			);

			set('user', updatedUser);

			confirmationAlert('Name Updated');
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	const handleChangePassword = async () => {
		handleClose();

		try {
			// TODO Use a react-query mutation
			await withLoadingBar(
				postApi('/user/changePasswordEmail', {
					email: user.email,
				})
			);

			confirmationAlert('An email with a password reset link was sent to you');
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	return (
		<div>
			{updateUserDialog}
			<IconButton
				css={`
					padding: 8px;
				`}
				onClick={handleClick}
			>
				{faUser}
			</IconButton>
			<Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
				<MenuItem onClick={handleUpdateUser}>Change Name</MenuItem>
				<MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
				<MenuItem onClick={handleLogout}>Log Out</MenuItem>
			</Menu>
		</div>
	);
};
