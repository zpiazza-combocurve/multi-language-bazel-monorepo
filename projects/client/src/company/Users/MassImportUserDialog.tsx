import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import * as yup from 'yup';

import { useImportUsersMutation } from '@/access-policies/mutations';
import { PERMISSIONS_QUERY_KEYS } from '@/access-policies/queries';
import { FileUpload } from '@/components/FileUpload';
import { useCallbackRef } from '@/components/hooks';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { getDownloadLink } from '@/data-import/FileImport/CSVImport/UploadStep';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { FileType } from '@/helpers/fileHelper';
import { queryClient } from '@/helpers/query-cache';
import { getObjectSchemaValidationErrors } from '@/helpers/yup-helpers';
import { COMPANY_PERMISSION_ID_BY_LABELS, COMPANY_PERMISSION_LABELS } from '@/inpt-shared/access-policies/shared';
import { MASS_IMPORT_USERS_LIMIT } from '@/inpt-shared/constants';

import ImportUserErrors from './ImportUserErrors';

interface UserImportRow {
	'Email Address': string;
	'First Name': string;
	'Last Name': string;
	Roles: string;
}

interface FormattedUserImportRow {
	email: string;
	firstName: string;
	lastName: string;
	roles: string[];
}

export interface UserImportLineError {
	errors: Record<string, string>;
	line: string;
}

const acceptable = new Set(['.csv']);
const acceptableFileTypeNames = new Set(['CSV']);

const MassAddUsersSchema = yup.object().shape({
	'Email Address': yup.string().email('Invalid Email').required('Missing Email').lowercase().trim(),
	'First Name': yup.string().trim().required('Missing First Name'),
	'Last Name': yup.string().trim().required('Missing Last Name'),
	Roles: yup
		.array()
		.of(yup.string().trim().oneOf(Object.values(COMPANY_PERMISSION_LABELS), 'Invalid Role'))
		.required('Missing Role'),
});

const downloadTemplateLink = getDownloadLink('1u5i4S8LDWaEE2j8_ywAwqVpBkbVvobSP');

const MassImportUserDialog = ({ onHide, visible }: DialogProps) => {
	const [uploadedFile, setFile] = useState<FileType>();
	const [invalidFileType, setInvalidFileType] = useState(true);
	const [overAllowedLimit, setOverAllowedLimit] = useState(false);
	const [errors, setErrors] = useState<UserImportLineError[]>([]);
	const [clientErrors, setClientErrors] = useState<{ name: string; message: string }[]>([]);

	const importUserMutation = useImportUsersMutation({
		onSuccess: (value) => {
			const { inserted, total, errors } = value;
			setClientErrors(errors);
			if (inserted === total) {
				confirmationAlert('All Users Imported');
			} else {
				confirmationAlert(`${inserted} of ${total} Users Imported`);
			}
			queryClient.invalidateQueries(PERMISSIONS_QUERY_KEYS.all);
		},
	});

	useEffect(() => {
		if (uploadedFile) {
			let invalid = false;
			if (uploadedFile.extensionError) {
				invalid = true;
			}
			setInvalidFileType(invalid);
		}
	}, [uploadedFile]);

	const validateCSV = (csvData) => {
		const generatedErrors = csvData
			.map((row: UserImportRow, i) => {
				const yupRow = row['Roles'] ? { ...row, Roles: row['Roles'].split(';') } : { ...row };
				return { errors: getObjectSchemaValidationErrors(MassAddUsersSchema, yupRow), line: `User-${i + 1}` };
			})
			.filter((error) => {
				return error.errors !== null;
			})
			.map((error) => {
				const roleErrors = Object.keys(error.errors).filter((key) => key.includes('Roles'));
				roleErrors.forEach((roleError) => {
					const split = roleError.split('[').pop()?.split(']')[0];
					if (split) {
						error.errors[roleError] = `Role ${+split + 1} is invalid`;
					}
				});
				return { ...error };
			});
		return generatedErrors;
	};

	const formatUsers = (users): FormattedUserImportRow[] => {
		const formattedUsers = users.map((user) => {
			const modifiedRoles = user['Roles'].split(';').map((role) => {
				return COMPANY_PERMISSION_ID_BY_LABELS[role.trim()];
			});
			return {
				email: user['Email Address'].trim(),
				firstName: user['First Name'].trim(),
				lastName: user['Last Name'].trim(),
				roles: modifiedRoles,
			};
		});
		return formattedUsers;
	};

	const handleSubmit = useCallbackRef(() => {
		if (uploadedFile) {
			Papa.parse(uploadedFile.contents, {
				delimiter: ',',
				header: true,
				complete: (results) => {
					const overLimit = results.data.length > MASS_IMPORT_USERS_LIMIT;
					// checks if theres a least one value set in a column;
					const data = results.data.filter((row) => Object.values(row).some((val) => val));
					const errors = validateCSV(data);
					setErrors(errors);
					setOverAllowedLimit(overLimit);
					if (!errors?.length && !overLimit) {
						const users = formatUsers(data);
						importUserMutation.mutate({
							record: {
								users,
							},
						});
					}
				},
			});
		}
	});

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Import Users from CSV</DialogTitle>
			<DialogContent>
				<FileUpload
					acceptableFileType={acceptable}
					onUpload={(file: FileType) => setFile(file)}
					acceptableFileTypeNames={acceptableFileTypeNames}
					templateLink={downloadTemplateLink}
					sheetNameTooltip={`Limited to ${MASS_IMPORT_USERS_LIMIT} users at a time`}
				/>
				<ImportUserErrors
					errors={errors}
					overLimit={overAllowedLimit}
					limit={MASS_IMPORT_USERS_LIMIT}
					clientErrors={clientErrors}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					disabled={!uploadedFile || (!!uploadedFile && invalidFileType)}
					onClick={() => handleSubmit()}
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default MassImportUserDialog;
