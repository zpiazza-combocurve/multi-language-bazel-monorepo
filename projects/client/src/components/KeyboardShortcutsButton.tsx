// most of the code taken from hooks/useKeyboardTooltipFloater
import { faKeyboard } from '@fortawesome/pro-regular-svg-icons';
import { assign } from 'lodash-es';
import { ForwardedRef, forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import styled from 'styled-components';

import { Floater } from '@/components/Floater';
import { Box, Divider, IconButton } from '@/components/v2';
import { IconButtonProps } from '@/components/v2/IconButton';
import { theme } from '@/helpers/styled';

const TooltipContainer = styled.span<{ minimized?: boolean }>`
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	height: ${({ minimized }) => (minimized ? '28rem' : 'none')};
	::-webkit-scrollbar {
		width: 5px;
	}
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
	visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
	max-height: 80vh;
	overflow: auto;
`;

export interface BlockItem {
	itemLabel: string;
	key?: string;
	keys?: string[];
	showInMinimized?: boolean;
}

export interface Block {
	blockTitle: string;
	blockItems: Array<BlockItem>;
}

interface KeyboardShortcutsFloatingTooltipProps {
	onToggle?: () => void;
	visible?: boolean;
	blocks: Array<Block>;
	hasMinimizedVersion?: boolean;
	/** In rems ('22.5rem') */
	panelWidth?: string;
	portal?: boolean;
	titlePostfix?: string;
}

/**
 * @example
 * 	const [visible, setVisible] = useState(false);
 *
 * 	<KeyboardShortcutsFloatingTooltip
 * 		visible={visible}
 * 		onToggle={() => setVisible(false)}
 * 		blocks={[
 * 			{
 * 				blockTitle: 'General',
 * 				blockItems: [
 * 					{ itemLabel: 'Select All', key: 'Ctrl + A' },
 * 					{ itemLabel: 'Insert Time Series Below', key: 'Ctrl + I' },
 * 					{ itemLabel: 'Add Row', key: 'Ctrl + Enter' },
 * 				],
 * 			},
 * 			{
 * 				blockTitle: 'Editing',
 * 				blockItems: [
 * 					{ itemLabel: 'Copy', key: 'Ctrl + C' },
 * 					{ itemLabel: 'Copy Row(s)', key: 'Ctrl + Shift + C' },
 * 					{ itemLabel: 'Paste', key: 'Ctrl + V' },
 * 					{ itemLabel: 'Undo', key: 'Ctrl + Z' },
 * 					{ itemLabel: 'Redo', key: 'Ctrl + Y' },
 * 				],
 * 			},
 * 		]}
 * 	/>;
 */
export function KeyboardShortcutsFloatingTooltip({
	onToggle,
	visible,
	blocks,
	hasMinimizedVersion,
	panelWidth = '22.5rem',
	portal,
	titlePostfix,
}: KeyboardShortcutsFloatingTooltipProps) {
	const position = useRef({ top: '2rem', left: '65%' });

	const setPosition = (newPosition: { top?: string; left?: string }) => {
		position.current = assign(position.current, newPosition);
	};

	return (
		<StyledFloater
			detached
			left={<Box fontSize='1rem'>Keyboard Shortcuts {titlePostfix}</Box>}
			leftStart={position.current?.left}
			minimal={false}
			onToggle={onToggle}
			portal={portal}
			setPosition={setPosition}
			topStart={position.current?.top}
			visible={visible}
			width={panelWidth}
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

							{blockItems.map(({ itemLabel, key, keys }) => {
								const hotkeys = keys?.length ? keys : [key];

								return (
									<Shortcut key={itemLabel}>
										<span>{itemLabel}</span>
										<div
											css={`
												display: flex;
												gap: 4px;
											`}
										>
											{hotkeys.map((key) => (
												<Actions key={key}>{key}</Actions>
											))}
										</div>
									</Shortcut>
								);
							})}
						</div>
					);
				})}
			</TooltipContainer>
		</StyledFloater>
	);
}

export interface KeyboardShortcutsButtonRef {
	toggleMenu(): void;
}

type KeyboardShortcutsButtonProps = IconButtonProps &
	Pick<
		KeyboardShortcutsFloatingTooltipProps,
		'blocks' | 'hasMinimizedVersion' | 'portal' | 'panelWidth' | 'titlePostfix'
	>;

/**
 * @example
 * 	<KeyboardShortcutsButton
 * 		blocks={[
 * 			{
 * 				blockTitle: 'General',
 * 				blockItems: [
 * 					{ itemLabel: 'Select All', key: 'Ctrl + A' },
 * 					{ itemLabel: 'Insert Time Series Below', key: 'Ctrl + I' },
 * 					{ itemLabel: 'Add Row', key: 'Ctrl + Enter' },
 * 				],
 * 			},
 * 			{
 * 				blockTitle: 'Editing',
 * 				blockItems: [
 * 					{ itemLabel: 'Copy', key: 'Ctrl + C' },
 * 					{ itemLabel: 'Copy Row(s)', key: 'Ctrl + Shift + C' },
 * 					{ itemLabel: 'Paste', key: 'Ctrl + V' },
 * 					{ itemLabel: 'Undo', key: 'Ctrl + Z' },
 * 					{ itemLabel: 'Redo', key: 'Ctrl + Y' },
 * 				],
 * 			},
 * 		]}
 * 	/>;
 */
function KeyboardShortcutsButton(props: KeyboardShortcutsButtonProps, ref: ForwardedRef<KeyboardShortcutsButtonRef>) {
	const { blocks, hasMinimizedVersion, panelWidth, portal, titlePostfix, ...buttonProps } = props;
	const [visible, setVisible] = useState(false);

	useImperativeHandle(ref, () => ({ toggleMenu: () => setVisible((p) => !p) }));

	const toggleVisible = useCallback(() => setVisible((u) => !u), []);

	return (
		<>
			<IconButton
				color='secondary'
				onClick={toggleVisible}
				tooltipPlacement='left'
				tooltipTitle='Show Shortcuts'
				{...buttonProps}
			>
				{faKeyboard}
			</IconButton>
			<KeyboardShortcutsFloatingTooltip
				blocks={blocks}
				hasMinimizedVersion={hasMinimizedVersion}
				onToggle={toggleVisible}
				panelWidth={panelWidth}
				portal={portal}
				visible={visible}
				titlePostfix={titlePostfix}
			/>
		</>
	);
}

export default forwardRef(KeyboardShortcutsButton);
