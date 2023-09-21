// TODO rename this file, it is no longer a hook
import { Button, Dialog, DialogActions, DialogTitle } from '@/components/v2';

interface UnsavedWorkProps {
	saveUnsaved: () => Promise<void>;
	visible: boolean;
	resolve: (value: boolean) => void;
	options?: {
		includeSaveAndContinue?: boolean;
		saveAndContinue?: {
			tooltipLabel?: string;
			disabled?: boolean;
		};
	};
}

const UnsavedWorkDialog = ({
	saveUnsaved,
	visible,
	resolve,
	// possible bug here, passing any value to `options` will make includeSaveAndContinue falsy (undefined) by default
	options = { includeSaveAndContinue: true },
}: UnsavedWorkProps) => {
	return (
		<Dialog open={visible} onClose={() => resolve(false)} maxWidth='sm' fullWidth>
			<DialogTitle>You have unsaved work, continue?</DialogTitle>
			<DialogActions>
				<Button onClick={() => resolve(false)}>CANCEL</Button>
				<Button onClick={() => resolve(true)}>CONTINUE UNSAVED</Button>
				{options?.includeSaveAndContinue && (
					<Button
						id='save-and-continue-btn'
						color='primary'
						tooltipTitle={options?.saveAndContinue?.tooltipLabel}
						disabled={options?.saveAndContinue?.disabled}
						onClick={async () => {
							await saveUnsaved();
							resolve(true);
						}}
					>
						SAVE AND CONTINUE
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export { UnsavedWorkDialog };
