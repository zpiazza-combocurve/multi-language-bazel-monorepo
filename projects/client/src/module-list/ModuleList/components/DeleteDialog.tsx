import { useState } from 'react';
import { useMutation } from 'react-query';

import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@/components/v2';
import ConfirmTextField from '@/components/v2/misc/ConfirmTextField';
import { useLoadingBar } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';

type DeleteDialogProps = DialogProps<boolean> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDelete: (options: any) => void;
	awaitAction?: boolean;
	feat?: string;
	name?: string;
	requireName?: boolean;
	title?: string;
	valueToConfirm?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	extraOption?: any;
	children?: React.ReactNode;
};

function DeleteDialog({
	resolve,
	name,
	onHide,
	onDelete,
	feat,
	requireName,
	awaitAction = true,
	title = `Delete ${feat}?`,
	valueToConfirm = `Delete ${feat}`,
	extraOption = {},
	visible,
	children,
	...props
}: DeleteDialogProps) {
	const [option, setOption] = useState(false);

	const [canDelete, setConfirmed] = useState(!requireName);
	const { enabled: optionEnabled, info: optionInfo } = extraOption;

	// Why isn't this using mutateAsync?
	const { isLoading, mutate: deleteDataImport } = useMutation(async () => {
		if (awaitAction) {
			await Promise.resolve(onDelete(option));
		} else {
			onDelete(option);
		}
		resolve(true);
	});

	useLoadingBar(isLoading);

	return (
		<Dialog open={visible} onClose={onHide} fullWidth maxWidth='sm' {...props}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent
				css={`
					width: 100%;
					overflow: hidden;
				`}
			>
				{name && (
					<Typography
						variant='body1'
						css={`
							margin-bottom: 20px;
							overflow-wrap: break-word;
						`}
					>
						{name}
					</Typography>
				)}
				{children && <div>{children}</div>}
				{requireName && (
					<ConfirmTextField
						label={`Type "${valueToConfirm}"`}
						confirmText={valueToConfirm}
						onConfirmationChange={setConfirmed}
					/>
				)}
				<Typography css='margin: 20px 0 5px 0;' variant='subtitle1'>
					This action cannot be undone!
				</Typography>
				{optionEnabled && (
					<CheckboxField
						label={optionInfo}
						checked={option}
						onChange={(ev) => setOption(ev.target.checked)}
					/>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} disabled={isLoading}>
					Cancel
				</Button>
				<Button
					color='error'
					css='margin-right: 7px;'
					disabled={isLoading || !canDelete}
					onClick={() => deleteDataImport()}
				>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DeleteDialog;
