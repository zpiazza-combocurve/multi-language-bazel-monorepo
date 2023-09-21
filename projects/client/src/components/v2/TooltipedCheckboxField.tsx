import { CheckboxField, Tooltip } from '@/components/v2/index';

const TooltipedCheckboxField = (props: TooltipedCheckboxFieldProps) => {
	const { tooltip, label, onChange, checked, disabled } = props;
	return tooltip ? (
		<Tooltip title={tooltip}>
			{
				// This div is here to make a tooltip showing on hovering label too,
				// deleting it will make tooltip show only on checkbox
			}
			<div>
				<CheckboxField
					label={label}
					onChange={onChange ?? (() => null)}
					checked={checked ?? false}
					disabled={disabled}
				/>
			</div>
		</Tooltip>
	) : (
		<CheckboxField
			label={label}
			onChange={onChange ?? (() => null)}
			checked={checked ?? false}
			disabled={disabled}
		/>
	);
};

export type TooltipedCheckboxFieldProps = {
	tooltip?: string | undefined;
	label: string | undefined;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	checked?: boolean;
	disabled?: boolean;
};

export default TooltipedCheckboxField;
