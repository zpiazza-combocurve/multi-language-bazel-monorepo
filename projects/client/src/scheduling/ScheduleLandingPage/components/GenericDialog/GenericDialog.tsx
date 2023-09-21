import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { DialogContent } from '@material-ui/core';
import * as React from 'react';

import Button, { ButtonProps } from '@/components/v2/Button';
import { DialogProps } from '@/helpers/dialog';

import { CloseButton, DialogActions, DialogContainer, DialogHeader, DialogTitle } from './styles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface Action<T = any> extends Omit<ButtonProps, 'value'> {
	key?: string;
	value?: T;
	children: string;
	getOnClickFunction?: (ref: React.RefObject<T>) => void;
	shouldResolve?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface PromptGenericDialogProps extends DialogProps<any> {
	title?: string;
	children?: React.ReactNode;
	actions: Action[];
	disableMinHeight?: boolean;
	maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export function PromptGenericDialog({
	title,
	visible,
	children,
	actions,
	onHide,
	resolve,
	disableMinHeight,
	maxWidth = 'sm',
}: PromptGenericDialogProps) {
	const contentRef = React.useRef(null);

	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			const childProps = { ref: contentRef };
			return React.cloneElement(child, childProps);
		}
		return child;
	});

	return (
		<DialogContainer open={visible} onClose={onHide} disableMinHeight={disableMinHeight} maxWidth={maxWidth}>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<CloseButton size='small' onClick={onHide}>
					{faTimes}
				</CloseButton>
			</DialogHeader>
			<DialogContent>{childrenWithProps}</DialogContent>
			<DialogActions>
				{actions?.map(
					({ value, key, getOnClickFunction = () => resolve(value), shouldResolve = false, ...props }, i) => (
						<Button
							key={key ?? i.toString()}
							onClick={() => {
								getOnClickFunction(contentRef);
								if (shouldResolve) resolve(value);
							}}
							{...props}
						/>
					)
				)}
			</DialogActions>
		</DialogContainer>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface GenericDialogProps extends Omit<DialogProps<any>, 'resolve'> {
	title?: string;
	children?: React.ReactNode;
	actions: React.ReactNode;
	disableMinHeight?: boolean;
	maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export function GenericDialog(props: GenericDialogProps) {
	const { title, visible, children, actions, onHide, disableMinHeight, maxWidth = 'sm' } = props;

	const contentRef = React.useRef(null);

	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			const childProps = { ref: contentRef };
			return React.cloneElement(child, childProps);
		}
		return child;
	});

	return (
		<DialogContainer open={visible} onClose={onHide} disableMinHeight={disableMinHeight} maxWidth={maxWidth}>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<CloseButton size='small' onClick={onHide}>
					{faTimes}
				</CloseButton>
			</DialogHeader>
			<DialogContent>{childrenWithProps}</DialogContent>
			<DialogActions>{actions}</DialogActions>
		</DialogContainer>
	);
}
