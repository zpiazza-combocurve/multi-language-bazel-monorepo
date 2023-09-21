import { ClickAwayListener, Paper, Popper, PopperProps } from '@material-ui/core';
import * as React from 'react';

type PopperMenuProps = PopperProps & {
	children: React.ReactNode;
	onClose?(): void;
	customZIndex?: number | undefined;
	customMaxHeight?: string;
	customPadding?: string;
	customMaxWidth?: string;
};

function PopperMenu({
	children,
	onClose,
	customMaxHeight,
	customPadding,
	customMaxWidth,
	// Popper doesn't need customZIndex property, if passed through will show a warning
	customZIndex: _customZIndex,
	...props
}: PopperMenuProps) {
	return (
		<Popper {...props}>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
			<ClickAwayListener onClickAway={onClose as any}>
				<Paper
					elevation={10}
					css={`
						min-width: 5rem;
						max-height: ${customMaxHeight ?? '70vh'};
						padding: ${customPadding ?? 0};
						max-width: ${customMaxWidth ?? 'none'};
						overflow-y: auto;
					`}
				>
					{children}
				</Paper>
			</ClickAwayListener>
		</Popper>
	);
}
export default PopperMenu;
