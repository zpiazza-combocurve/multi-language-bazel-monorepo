import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

interface AgentCreateModalProps extends DialogProps<void> {
	className?: string;
	item?: string;
}

function AgentKeyDialog(props: AgentCreateModalProps) {
	const { visible, onHide, item } = props;

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>Registration Key</DialogTitle>
			<DialogContent>
				<span>{item}</span>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AgentKeyDialog;
