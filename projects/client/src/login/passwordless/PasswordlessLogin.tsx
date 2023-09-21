import { Formik } from 'formik';
import { useEffect } from 'react';
import styled from 'styled-components';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormikFields } from '@/components/v2';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { isEmail } from '@/helpers/text';
import { getTenant } from '@/helpers/utilities';

function validateEmail(value) {
	let error;
	if (!value) {
		error = 'Required';
	} else if (!isEmail(value)) {
		error = 'Invalid email address';
	}
	return error;
}

const LoginDialog = ({ resolve }: DialogProps<{ email: string }>) => {
	return (
		<Formik initialValues={{ email: '' }} onSubmit={(values) => resolve(values)}>
			{({ handleSubmit }) => (
				<Dialog open fullWidth maxWidth='sm'>
					<DialogTitle>Log in to ComboCurve</DialogTitle>
					<DialogContent>
						<FormikFields.TextField label='Email' name='email' fullWidth validate={validateEmail} />
					</DialogContent>
					<DialogActions>
						<Button color='primary' onClick={() => handleSubmit()}>
							Login
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	);
};

const Text = styled.div`
	margin: auto;
`;

const Container = styled.div`
	width: 100vw;
	height: 100vh;
	display: flex;
	flex-direction: column;
`;

const PasswordlessLogin = () => {
	const [loginDialog, promptLoginDialog] = useDialog(LoginDialog);

	useEffect(() => {
		const handleLogin = async () => {
			const results = await promptLoginDialog();
			if (!results) {
				return;
			}
			const { email } = results;
			await postApi('/user/sendPasswordlessToken', { user: email, delivery: getTenant() });
		};
		handleLogin();
	}, [promptLoginDialog]);

	return <Container>{loginDialog || <Text>A login link has been sent to your email</Text>}</Container>;
};

export default PasswordlessLogin;
