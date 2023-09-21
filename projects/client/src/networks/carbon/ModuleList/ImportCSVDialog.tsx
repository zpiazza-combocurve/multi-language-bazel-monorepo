import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import { useMutation } from 'react-query';

import { DropBoxFileInput } from '@/components/DropBoxFileInput';
import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { sanitizeFile } from '@/helpers/fileHelper';
import { localize } from '@/helpers/i18n';
import { downloadFile, uploadFile } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { useCurrentProject } from '@/projects/api';

import { importNetworkCSV } from '../api';

export const OVERWRITE = [
	{ label: 'Create New', value: 'create_new' },
	{ label: 'Overwrite', value: 'overwrite' },
];

export const DEFAULT_OVERWRITE = OVERWRITE[0].value;

function ImportCSVDialog(props: DialogProps<void>) {
	const { project } = useCurrentProject();
	const [file, setFile] = useState<File | null | undefined>(null);
	const [identifier, setIdentifier] = useState(DEFAULT_IDENTIFIER);
	const [overwrite, setOverwrite] = useState(DEFAULT_OVERWRITE);

	const { isLoading: isSubmitting, mutate: handleSubmit } = useMutation(async () => {
		assert(project, 'expected project');
		assert(file, 'expected file');
		assert(identifier, 'expected identifier');

		const sanitizedFile = sanitizeFile(file);
		const fileDoc = await uploadFile(sanitizedFile, undefined, project?._id);

		const result = await importNetworkCSV({
			project: project._id,
			fileId: fileDoc._id,
			identifier,
			overwrite,
		});

		if (result.success) {
			if (result.message) {
				confirmationAlert(result.message);
			}
		} else {
			if (result.message) {
				failureAlert(result.message, 8000);
			}
			if (result.fileId) {
				downloadFile(result.fileId);
			}
		}

		props.onHide();
	});

	return (
		<Dialog open={props.visible} onClose={props.onHide}>
			<div
				css={`
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: 100%;
					padding-right: 1rem;
				`}
			>
				<DialogTitle>{localize.network.dialogs.import.title()}</DialogTitle>
				<IconButton
					onClick={() =>
						window.open(
							'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview#Import',
							'_blank'
						)
					}
				>
					{faQuestion}
				</IconButton>
			</div>
			<DialogContent css='display: flex; flex-direction: column; row-gap: 1rem;'>
				<DropBoxFileInput
					label='Network Import'
					onChange={(files) => setFile(files?.[0])}
					disabled={isSubmitting}
					accept='.xlsx'
					fullWidth
				/>
				<WellIdentifierSelect value={identifier} onChange={setIdentifier} />
				<OverwriteSelect value={overwrite} onChange={setOverwrite} />
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onHide}>Cancel</Button>
				<Button onClick={() => handleSubmit()} disabled={isSubmitting} color='primary' variant='contained'>
					Submit
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ImportCSVDialog;

export function OverwriteSelect({
	value,
	onChange,
	className,
	disabled = false,
	label = 'Handle Duplicate Facility Names',
}: {
	value: string;
	onChange: (newValue: string) => void;
	className?: string;
	disabled?: boolean;
	label?: string;
}) {
	return (
		<RadioGroupField
			className={className}
			value={value}
			onChange={(ev) => onChange(ev.target.value)}
			disabled={disabled}
			options={OVERWRITE}
			label={label}
			tooltipTitle={
				<div>
					<p>If a facility name already exists in the network, this setting determines how to handle it:</p>
					<p>• Create New: Create a new facility model with a suffix &apos;_1&apos; added to the name.</p>
					<p>
						• Overwrite: Replace the existing facility with the new one. Any networks that use this facility
						node will be affected. Edges that were connected to this facility node will be deleted.
					</p>
				</div>
			}
			row
		/>
	);
}
