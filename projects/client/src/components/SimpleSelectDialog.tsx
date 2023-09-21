import { useState } from 'react';

import { SelectList, SelectListItem } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { Resolver } from '@/helpers/promise';

import { ButtonProps } from './v2/Button';

export function SimpleSelectDialog<T>({
	items,
	onHide,
	resolve,
	visible,
	title,
	applyButtonProps,
}: DialogProps<T> & {
	/** Options to choose from */
	items: Resolver<SelectListItem<T>[]>;
	title?: string;
	applyButtonProps?: Omit<ButtonProps, 'key' | 'value' | 'children'>;
}) {
	const [selected, setSelected] = useState<T | null>(null);

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<SelectList
					css='height: 100%; overflow-y: auto;'
					withSearch
					stickySearch
					listItems={items}
					onChange={setSelected}
					value={selected}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={() => resolve(selected)}
					color='primary'
					disabled={selected === null}
					{...applyButtonProps}
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
