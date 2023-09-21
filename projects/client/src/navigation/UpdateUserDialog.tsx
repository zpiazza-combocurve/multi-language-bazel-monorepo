import { Formik } from 'formik';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormikFields } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { hasNonWhitespace } from '@/helpers/text';

const UpdateUserDialog = ({
	resolve,
	onHide,
	visible,
	user,
}: DialogProps<{
	firstName: string;
	lastName: string;
	email: string;
}> & { user: Inpt.User }) => {
	return (
		<Formik
			initialValues={{
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
			}}
			validate={(values) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const errors: any = {};

				if (!values.firstName) {
					errors.firstName = 'Required';
				} else if (!hasNonWhitespace(values.firstName)) {
					errors.firstName = 'Please enter a first name';
				}

				if (!values.lastName) {
					errors.lastName = 'Required';
				} else if (!hasNonWhitespace(values.lastName)) {
					errors.lastName = 'Please enter a last name';
				}

				return errors;
			}}
			onSubmit={(values) => resolve(values)}
		>
			{({ isValid, handleSubmit }) => (
				<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
					<DialogTitle>Update Name</DialogTitle>
					<DialogContent>
						<Box mb={2}>
							<FormikFields.TextField
								label='First Name'
								name='firstName'
								required
								fullWidth
								inputProps={{ readOnly: user.isEnterpriseConnection }}
							/>
						</Box>
						<Box mb={2}>
							<FormikFields.TextField
								label='Last Name'
								name='lastName'
								required
								fullWidth
								inputProps={{ readOnly: user.isEnterpriseConnection }}
							/>
						</Box>
						<Box mb={2}>
							<FormikFields.TextField
								label='Email'
								name='email'
								fullWidth
								inputProps={{ readOnly: true }}
							/>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={onHide}>Cancel</Button>
						<Button color='primary' disabled={!isValid} onClick={() => handleSubmit()}>
							Save
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	);
};

export default UpdateUserDialog;
