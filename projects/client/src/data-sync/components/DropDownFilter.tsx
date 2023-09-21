import { faFilter } from '@fortawesome/pro-regular-svg-icons';
import { createRef, useRef, useState } from 'react';

import { Dialog, DialogActions, DialogContent, IconButton } from '@/components/v2';

import styles from './DropDownFilter.module.scss';
import { MainButton } from './MainButton';
import { TextButton } from './TextButton';

const buttonRef = createRef<HTMLButtonElement>();

export const DropdownFilter = ({ children, clear, apply }) => {
	const [isOpen, setOpen] = useState(false);
	const positionStyles = useRef({ left: '20%' });

	const onClick = () => {
		if (!isOpen) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const left = buttonRef.current!.getBoundingClientRect().left;
			positionStyles.current.left = left - 105 + 'px';
		}
		setOpen(!isOpen);
	};
	const onApply = () => {
		onClick();
		apply();
	};

	// <Box sx={{  position: "absolute", left: "10px", width: 281 } } >
	return (
		<>
			<IconButton ref={buttonRef} onClick={onClick}>
				{faFilter}
			</IconButton>
			<Dialog
				style={{ left: positionStyles.current.left, top: '20px' }}
				maxWidth='xs'
				open={isOpen}
				onClose={onClick}
				className={styles.dialog}
			>
				<DialogContent>{children}</DialogContent>
				<DialogActions>
					<TextButton onClick={clear}>Clear</TextButton>

					<MainButton onClick={onApply}>Apply</MainButton>
				</DialogActions>
			</Dialog>
		</>
	);
};
