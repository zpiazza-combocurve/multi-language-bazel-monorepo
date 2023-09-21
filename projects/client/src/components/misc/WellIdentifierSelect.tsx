import RadioGroupField from '@/components/v2/misc/RadioGroupField';

export const IDENTIFIERS = [
	{ label: 'INPT ID', value: 'inptID' },
	{ label: 'API 10', value: 'api10' },
	{ label: 'API 12', value: 'api12' },
	{ label: 'API 14', value: 'api14' },
	{ label: 'Chosen ID', value: 'chosenID' },
	{ label: 'ARIES ID', value: 'aries_id' },
	{ label: 'PhdWin ID', value: 'phdwin_id' },
];

export const DEFAULT_IDENTIFIER = IDENTIFIERS[0].value;

export function WellIdentifierSelect({
	value,
	onChange,
	className,
	disabled = false,
	label = 'Well Identifier',
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
			options={IDENTIFIERS}
			label={label}
			row
		/>
	);
}
