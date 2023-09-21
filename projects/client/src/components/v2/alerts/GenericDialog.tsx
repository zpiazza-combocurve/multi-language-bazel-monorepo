import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import * as React from 'react';

import { DialogProps } from '@/helpers/dialog';

import Button, { ButtonProps } from '../Button';
import { getMaxZIndex } from '../helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface Action<T = any> extends Omit<ButtonProps, 'value'> {
	key?: string;
	value?: T;
	children: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface GenericDialogProps extends DialogProps<any> {
	title?: string;
	children?: React.ReactNode;
	actions?: Action[];
}

export default function GenericDialog({ title, visible, children, onHide, resolve, actions = [] }: GenericDialogProps) {
	// highestZ guarantees that this dialog will always be on top whenever its triggered
	const highestZ = getMaxZIndex();
	return (
		<Dialog open={visible} onClose={onHide} style={{ zIndex: highestZ }}>
			{title && <DialogTitle>{title}</DialogTitle>}
			{children && <DialogContent>{children}</DialogContent>}
			<DialogActions>
				{actions.map(({ value, key, ...props }, i) => (
					<Button key={key ?? i.toString()} {...props} onClick={() => resolve(value)} />
				))}
			</DialogActions>
		</Dialog>
	);
}
