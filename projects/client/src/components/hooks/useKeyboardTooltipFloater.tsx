import { faKeyboard } from '@fortawesome/pro-regular-svg-icons';
import { assign } from 'lodash-es';
import { useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { Floater } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { Box, Divider, IconButton } from '@/components/v2';
import { IconButtonProps } from '@/components/v2/IconButton';
import { ifProp, theme } from '@/helpers/styled';

const TooltipContainer = styled.span<{ minimized?: boolean }>`
	display: flex;
	flex-direction: column;
	height: ${ifProp('minimized', '28rem', 'none')};
	overflow-y: auto;
`;

const Shortcut = styled.div`
	align-items: center;
	display: flex;
	font-size: 0.8rem;
	justify-content: space-between;
	margin: 0.5rem 0;
`;

const Actions = styled.div`
	font-family: Consolas, monaco, monospace;
	border-radius: 5px;
	border: 1px solid ${theme.warningAlternativeColor};
	color: ${theme.warningAlternativeColor};
	padding: 0.15rem 0.5rem;
`;

const StyledFloater = styled(Floater)<{ visible?: boolean; leftStart?: string; topStart?: string }>`
	left: ${({ leftStart }) => leftStart ?? '2rem'};
	top: ${({ topStart }) => topStart ?? '2rem'};
	visibility: ${ifProp('visible', 'visible', 'hidden')};
`;

export interface BlockItem {
	itemLabel: string;
	key: string;
	showInMinimized: boolean;
}

export interface Block {
	blockTitle: string;
	blockItems: Array<BlockItem>;
}

export interface ShortcutItem {
	blocks: Array<Block>;
	hasMinimizedVersion: boolean;
}

const FloatingTooltip = ({
	onToggle,
	visible,
	shortcutItem,
	title = 'Keyboard Shortcuts',
}: {
	onToggle?: () => void;
	visible?: boolean;
	shortcutItem: ShortcutItem;
	title?: string;
}) => {
	const position = useRef({ top: '2rem', left: '80%' });

	const setPosition = (newPosition: { top?: string; left?: string }) => {
		position.current = assign(position.current, newPosition);
	};

	if (!shortcutItem) {
		return null;
	}

	const { blocks, hasMinimizedVersion } = shortcutItem;

	return (
		<StyledFloater
			detached
			left={<Box fontSize='1rem'>{title}</Box>}
			leftStart={position.current?.left}
			minimal={false}
			onToggle={onToggle}
			setPosition={setPosition}
			topStart={position.current?.top}
			visible={visible}
			width='22.5rem'
		>
			<Divider
				css={`
					margin-bottom: 1rem;
				`}
			/>
			<TooltipContainer minimized={hasMinimizedVersion}>
				{blocks.map((block) => {
					const { blockTitle, blockItems } = block;
					return (
						<div
							css={`
								&:not(:last-child) {
									margin-bottom: 1rem;
								}
							`}
							key={blockTitle}
						>
							<span
								css={`
									font-weight: bold;
									font-size: 0.8rem;
								`}
							>
								{blockTitle}
							</span>

							<Divider css='margin: 0.25rem 0' />

							{blockItems.map(({ itemLabel, key }) => (
								<Shortcut key={itemLabel}>
									<span>{itemLabel}</span>
									<Actions>{key}</Actions>
								</Shortcut>
							))}
						</div>
					);
				})}
			</TooltipContainer>
		</StyledFloater>
	);
};

const useKeyboardTooltipFloater = ({
	shortcutItem,
	setVisible: parentSetVisible,
	visible: parentVisible,
	title = 'Keyboard Shortcuts',
	...buttonProps
}: IconButtonProps & {
	shortcutItem: ShortcutItem;
	setVisible?: () => void;
	visible?: boolean;
	title?: string;
}) => {
	const [visible, setVisible] = useDerivedState(parentVisible);

	const toggleVisible = useCallback(
		() => (parentSetVisible ?? setVisible)((u) => !u),
		[parentSetVisible, setVisible]
	);

	const keyboardTooltipButton = useMemo(
		() => (
			<IconButton
				color='secondary'
				onClick={toggleVisible}
				tooltipPlacement='left'
				tooltipTitle='Show Shortcuts'
				{...buttonProps}
			>
				{faKeyboard}
			</IconButton>
		),
		[buttonProps, toggleVisible]
	);

	const keyboardTooltipFloater = useMemo(
		() => <FloatingTooltip onToggle={toggleVisible} visible={visible} shortcutItem={shortcutItem} title={title} />,
		[shortcutItem, toggleVisible, visible, title]
	);

	return { keyboardTooltipButton, keyboardTooltipFloater, toggleVisible };
};

export { useKeyboardTooltipFloater };
