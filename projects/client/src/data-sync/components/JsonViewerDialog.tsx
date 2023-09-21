import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { failureAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';

import { dumpJsonAsYaml } from '../data-flows/pipelines/DataPipeline.hooks';
import { Editor } from './Editor';

export interface JsonViewerDialogProps extends DialogProps {
	title: string;
	value: string;
	className?: string;
}

function JsonViewerDialog(props: JsonViewerDialogProps) {
	const { visible, onHide, value, title } = props;

	const tryParseValue = (value) => {
		try {
			return JSON.parse(value);
		} catch (error) {
			failureAlert('Value has an invalid format.');
			return {};
		}
	};

	const parsedValue = tryParseValue(value);

	return (
		<Dialog fullWidth maxWidth='sm' open={visible} onClose={onHide}>
			<DialogTitle>{title}</DialogTitle>

			<DialogContent>
				<Box>
					<Editor value={dumpJsonAsYaml(parsedValue)} readOnly />
				</Box>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

export default JsonViewerDialog;
