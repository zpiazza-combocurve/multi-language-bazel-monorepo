import { faTrash } from '@fortawesome/pro-regular-svg-icons';

import { Button } from '@/components/v2';
import { useDialog } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';

import CopyDialog from './components/CopyDialog';
import DeleteDialog from './components/DeleteDialog';

import './module-list.scss';

export { DeleteDialog, CopyDialog };

interface MassDeleteButtonProps {
	/** Name of the model being deleted */
	feat: string;
	/** Plural name of the model being deleted */
	feats?: string;
	length: number;
	/** Will be called after success */
	refresh: () => void;
	/** Function to call to delete the documents */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDelete: (options?: any) => void;
	/** If true will prompt the user to enter a validation text */
	requireName?: boolean;
	/** Text to overwrite the button's tooltip */
	tooltipLabel?: string;
	disabled?: boolean | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	extraOption?: any;
}

export const MassDeleteButton = ({
	feat,
	feats = `${feat}s`,
	length,
	refresh,
	onDelete,
	requireName,
	disabled,
	tooltipLabel,
	extraOption = {},
}: MassDeleteButtonProps) => {
	const valueToConfirm = `Delete ${pluralize(length, feat, feats)}`;
	const text = `${valueToConfirm}?`;
	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog, {
		requireName,
		onDelete,
		valueToConfirm,
		title: text,
		extraOption,
	});

	return (
		<>
			{deleteDialog}
			<Button
				tooltipTitle={tooltipLabel || text}
				disabled={disabled}
				onClick={async () => {
					const deleted = await promptDeleteDialog();
					if (deleted) {
						refresh();
					}
				}}
				startIcon={faTrash}
			>
				Delete
			</Button>
		</>
	);
};
