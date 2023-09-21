import { Paper } from '@material-ui/core';
import Autocomplete from '@mui/material/Autocomplete';
import { styled } from '@mui/material/styles';
import { MouseEventHandler, memo } from 'react';

import { ColoredCircle } from '@/components/misc';
import { Checkbox, TextField, Typography } from '@/components/v2';
import { Option } from '@/inpt-shared/economics/reports/types/base';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

const PaperForAutocomplete = (props) => {
	return (
		<Paper
			{...props}
			css={`
				background-color: ${({ theme }) => theme.palette.background.default};
				margin: 1rem 0;
				.MuiAutocomplete-noOptions {
					color: ${({ theme }) => theme.palette.text.secondary};
				}
			`}
		/>
	);
};

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
	isDisabled: boolean;
}

const ListItem = styled('li')<ListItemProps>(({ isDisabled, theme }) => ({
	color: isDisabled ? theme.palette.grey['500'] : theme.palette.text.primary,
}));

export const AutocompleteWithCheckboxes = memo(
	(props: {
		placeholder: string;
		type: string;
		options: Option[];
		onOptionClick: (
			key: string,
			type: string,
			isDisabled?: boolean
		) => MouseEventHandler<HTMLLIElement> | undefined;
		title?: string;
		className?: string;
		circleColor?: string;
		selectedItemsLimit?: number;
	}) => {
		const {
			placeholder,
			type,
			options,
			onOptionClick,
			title,
			className,
			circleColor: _circleColor = projectCustomHeaderColor,
			selectedItemsLimit,
		} = props;

		const selectedCount = options.filter(({ selected }) => selected).length;
		const isAboveLimit = selectedItemsLimit ? selectedCount >= selectedItemsLimit : false;

		return (
			<div className={className}>
				{title ? <Typography variant='subtitle1'>{title}</Typography> : ''}
				<Autocomplete
					fullWidth
					renderInput={(params) => (
						<TextField
							{...params}
							label={placeholder}
							css={`
								> label {
									color: ${({ theme }) => theme.palette.text.secondary};
								}
								.MuiInputBase-input {
									color: ${({ theme }) => theme.palette.text.secondary};
								}
								.MuiAutocomplete-popupIndicator {
									color: ${({ theme }) => theme.palette.text.hint};
								}
								&:hover fieldset.MuiOutlinedInput-notchedOutline {
									border-color: ${({ theme }) => theme.palette.text.primary};
								}
								.MuiOutlinedInput-notchedOutline {
									border-color: ${({ theme }) => theme.palette.text.secondary};
								}
							`}
						/>
					)}
					options={options}
					PaperComponent={PaperForAutocomplete}
					getOptionLabel={({ label }) => label}
					componentsProps={{
						popper: {
							sx: {
								// HACK to override default MUI styles for popper element
								marginBottom: '1rem!important',
							},
						},
					}}
					renderOption={(props, { selected, label, key, withCircle, circleColor = _circleColor }) => {
						const isDisabled = !selected && isAboveLimit;

						return (
							<ListItem
								onClick={onOptionClick(key, type, isDisabled)}
								css={`
									display: flex;
									align-items: center;
								`}
								isDisabled={isDisabled}
								key={key}
							>
								<Checkbox checked={selected} disabled={isDisabled} />
								{withCircle && <ColoredCircle $color={circleColor} />}
								{label}
							</ListItem>
						);
					}}
				/>
			</div>
		);
	}
);

export default AutocompleteWithCheckboxes;
