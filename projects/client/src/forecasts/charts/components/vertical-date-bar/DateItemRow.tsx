import { faEye, faEyeSlash, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import produce from 'immer';
import { useController } from 'react-hook-form';

import { Autocomplete, IconButton, RHFCircleColorPicker, RHFReactDatePicker } from '@/components/v2';
import { AutocompleteProps } from '@/components/v2/misc/Autocomplete';
import { colorsArray } from '@/helpers/zing';

import { useVerticalDateBarState } from './VerticalDateBarDialog';
import { VerticalDateItem } from './helpers';

type UseVerticalDateBarStateReturnType = ReturnType<typeof useVerticalDateBarState>;

function HeaderAutocompleteField({
	control,
	getOptionLabel,
	name: nameInput,
	onChange,
	options,
}: { control: UseVerticalDateBarStateReturnType['control']; name: string; onChange?: (value) => void } & Omit<
	AutocompleteProps,
	'onChange'
>) {
	const {
		field: { name, onChange: fieldOnChange, ref, value },
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} = useController({ name: nameInput as any, control });

	return (
		<Autocomplete
			css='grid-column: span 4;'
			disableClearable
			fullWidth
			getOptionLabel={getOptionLabel}
			label='Header'
			name={name}
			onChange={(_ev, newValue) => (onChange ?? fieldOnChange)(newValue)}
			options={options}
			ref={ref}
			size='small'
			value={value}
			variant='outlined'
		/>
	);
}

function DateItemRow({
	availableHeaderOptions,
	control,
	item,
	itemIndex,
	removeItem,
	updateItem,
}: {
	item: VerticalDateItem;
	itemIndex: number;
} & Pick<UseVerticalDateBarStateReturnType, 'availableHeaderOptions' | 'control' | 'removeItem' | 'updateItem'>) {
	const theme = useTheme();
	const { dateType, name, visible } = item;
	return (
		<div
			css={`
				align-items: center;
				background-color: ${theme.palette.action.selected};
				border-radius: 5px;
				display: flex;
				padding: 0.5rem;
				width: 100%;
			`}
		>
			<span
				css={`
					align-items: center;
					column-gap: 0.5rem;
					display: flex;
					flex-basis: 35%;
				`}
			>
				<IconButton
					onClick={() =>
						updateItem(
							itemIndex,
							produce(item, (draft) => {
								draft.visible = !draft.visible;
							})
						)
					}
					tooltipTitle='Toggle Visibility'
				>
					{visible ? faEye : faEyeSlash}
				</IconButton>
				{name}
			</span>

			<span
				css={`
					align-items: center;
					column-gap: 1rem;
					display: grid;
					flex-basis: 65%;
					grid-template-columns: repeat(7, minmax(0, 1fr));
					justify-items: end;
				`}
			>
				{dateType === 'custom' && (
					<RHFReactDatePicker
						control={control}
						css='grid-column: span 4;'
						fullWidth
						label='Date'
						name={`items.${itemIndex}.date`}
						size='small'
						variant='outlined'
					/>
				)}

				{dateType === 'header' && (
					<HeaderAutocompleteField
						control={control}
						name={`items.${itemIndex}.header`}
						onChange={(value) =>
							updateItem(
								itemIndex,
								produce(item, (draft) => {
									draft.header = value;
								})
							)
						}
						{...availableHeaderOptions}
					/>
				)}

				<span css='grid-column: 5 / span 2;'>
					<RHFCircleColorPicker
						control={control}
						name={`items.${itemIndex}.color`}
						presetColors={colorsArray}
					/>
				</span>

				<span css='grid-column: 7;'>
					<IconButton onClick={() => removeItem(itemIndex)} tooltipTitle='Remove Date Bar'>
						{faTrash}
					</IconButton>
				</span>
			</span>
		</div>
	);
}

export default DateItemRow;
