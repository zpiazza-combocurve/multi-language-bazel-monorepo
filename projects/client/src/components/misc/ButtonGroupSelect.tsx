import { ButtonGroup } from '@material-ui/core';

import Button from '@/components/v2/Button';

/**
 * Alternative to select or radio buttons
 *
 * @example
 * 	import React, { useState } from 'react';
 * 	import { ButtonGroupSelect } from '@/components/misc/ButtonGroupSelect';
 *
 * 	function Component() {
 * 		const [selected, setSelected] = useState('item-1');
 *
 * 		return (
 * 			<ButtonGroupSelect
 * 				value={value}
 * 				onChange={setSelected}
 * 				items={[
 * 					{ label: 'Item 1', value: 'item-1' },
 * 					{ label: 'Item 2', value: 'item-2' },
 * 				]}
 * 			/>
 * 		);
 * 	}
 */
export function ButtonGroupSelect<T extends string>(props: {
	value: T;
	onChange: (newValue: T) => void;
	items: { value: T; label: string; tooltipTitle?: string }[];
	fullWidth?: boolean;
	disabled?: boolean;
	disabledOptions?: Record<string, boolean | string>;
}) {
	const { items = [], onChange, value: actual, fullWidth, disabled = false, disabledOptions = {} } = props;

	return (
		<ButtonGroup fullWidth={fullWidth}>
			{items.map(({ value, label, tooltipTitle }) => (
				<Button
					key={value}
					onClick={() => onChange(value)}
					disabled={actual === value || disabled || disabledOptions[value]}
					color={actual === value ? 'secondary' : 'default'}
					tooltipTitle={tooltipTitle}
				>
					{label}
				</Button>
			))}
		</ButtonGroup>
	);
}
