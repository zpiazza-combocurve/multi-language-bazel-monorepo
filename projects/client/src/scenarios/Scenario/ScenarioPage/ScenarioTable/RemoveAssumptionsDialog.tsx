import { Button, Dialog, DialogActions, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

type RemoveAssumptionsDialogProps = DialogProps<boolean> & { selectedWellCount: number };

export default function RemoveAssumptionsDialog({
	onHide,
	resolve,
	visible,
	selectedWellCount,
}: RemoveAssumptionsDialogProps) {
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			<DialogTitle>Are you sure you want to remove {selectedWellCount} models from assignment?</DialogTitle>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button onClick={() => resolve(true)} color='error'>
					Remove
				</Button>
			</DialogActions>
		</Dialog>
	);
}
