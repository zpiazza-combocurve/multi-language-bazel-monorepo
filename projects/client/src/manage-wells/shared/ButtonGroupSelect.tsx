import { SelectField } from '@/components';
import { ButtonGroupSelect } from '@/components/misc/ButtonGroupSelect';
import { Button } from '@/components/v2';

/** Uses button or a select field depending on the amount of items */
export function FlexibleSelect<T extends string>({
	value,
	onChange,
	items,
	separate = false,
}: {
	value: T;
	onChange: (newValue: T) => void;
	items: { value: T; label: string; smallLabel?: string }[];
	separate?: boolean;
}) {
	if (separate) {
		return (
			<>
				{items.map((item) => (
					<Button
						css='text-transform: unset;'
						key={item.value}
						color={item.value === value ? 'secondary' : undefined}
						onClick={() => onChange(item.value)}
					>
						{item.smallLabel ?? item.label}
					</Button>
				))}
			</>
		);
	}

	if (items.length <= 3) {
		return (
			<ButtonGroupSelect
				value={value}
				items={items.map(({ label, smallLabel, ...rest }) => ({ label: smallLabel ?? label, ...rest }))}
				onChange={onChange}
			/>
		);
	}

	return (
		<SelectField
			bigger
			secondary
			value={value}
			menuItems={items}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			onChange={onChange}
		/>
	);
}
