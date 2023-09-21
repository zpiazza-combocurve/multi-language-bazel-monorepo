import TextField from '@/components/v2/TextField';

/**
 * `TextField` helper when the user is required to confirm important operations (like deleting)
 *
 * @example
 * 	const [confirmed, setConfirmed] = React.useState(false);
 *
 * 	<>
 * 		<ConfirmTextField confirmText='DELETE 25 wells' onConfirmationChange={setConfirmed} />;
 * 		<Button disabled={!confirmed} onClick={handleDeleteWells}>
 * 			Delete
 * 		</Button>
 * 	</>;
 */
export default function ConfirmTextField(props: {
	label?: string;
	confirmText: string;
	onConfirmationChange: (confirmMatch: boolean) => void;
}) {
	const { confirmText, label = `Type ${confirmText.toUpperCase()} to confirm`, onConfirmationChange } = props;
	return (
		<TextField
			css={`
				.MuiOutlinedInput-input {
					text-transform: uppercase;
					padding: 10.5px 14px;
				}
				.MuiInputLabel-outlined {
					transform: translate(14px, 12px) scale(1);

					&.MuiInputLabel-shrink {
						transform: translate(14px, -6px) scale(0.75);
					}
				}
			`}
			label={label}
			placeholder={confirmText.toUpperCase()}
			onChange={(ev) => {
				onConfirmationChange(ev.target.value.toLowerCase() === confirmText.toLowerCase());
			}}
			fullWidth
			variant='outlined'
		/>
	);
}
