/* eslint react/jsx-key: warn */
import { Avatar, Chip } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import _ from 'lodash';

import { MultiSelectFieldProps } from '@/components/v2/misc/MultiSelectField';
import { numberToHex } from '@/helpers/color';

import Checkbox from '../Checkbox';
import TextField from '../TextField';

type TagsMultiSelectFieldProps = Omit<MultiSelectFieldProps, 'menuItems'> & {
	menuItems: { value: string; label: string; color: number }[];
};

const TagsMultiSelectField = ({
	menuItems,
	label,
	onChange,
	required = false,
	fixedOptions = [],
	error,
	helperText,
	...rest
}: TagsMultiSelectFieldProps) => {
	const menuItemMap = _.keyBy<{ value: string; label: string; color: number }>(menuItems, 'value');
	return (
		<Autocomplete
			{...rest}
			multiple
			options={menuItems.map(({ value: itemValue }) => itemValue)}
			getOptionLabel={(itemValue: string) => menuItemMap[itemValue].label}
			onChange={(_event, newValue) => onChange?.(_.uniq([...fixedOptions, ...newValue]))}
			disableCloseOnSelect
			renderOption={(itemValue, { selected }) => (
				<>
					<Checkbox
						style={{ marginRight: 8 }}
						disabled={fixedOptions.indexOf(itemValue) !== -1}
						checked={selected}
					/>
					{menuItemMap[itemValue].label}
				</>
			)}
			renderTags={(tagValue, getTagProps) =>
				tagValue.map((itemValue, index) => (
					<Chip
						key={index}
						css={`
							margin-right: 4px;
						`}
						size='small'
						avatar={
							<Avatar
								css={`
									background-color: ${numberToHex(menuItemMap[itemValue].color)};
									width: 14px !important;
									height: 14px !important;
								`}
							>
								{' '}
							</Avatar>
						}
						label={menuItemMap[itemValue].label}
						{...getTagProps({ index })}
						disabled={fixedOptions.indexOf(itemValue) !== -1}
					/>
				))
			}
			renderInput={(params) => (
				<TextField label={label} required={required} error={error} helperText={helperText} {...params} />
			)}
		/>
	);
};

export default TagsMultiSelectField;
