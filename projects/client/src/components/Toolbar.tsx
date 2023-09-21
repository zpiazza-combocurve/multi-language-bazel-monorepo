import { ReactNode } from 'react';
import styled from 'styled-components';

import { excludeProps, ifProp, unlessProp } from '@/helpers/styled';
import { isValidChildren } from '@/helpers/utilities';

const Styled = styled.div<{ minimal?: boolean }>`
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	${unlessProp('minimal', 'min-height: 3rem;')}
`;

export const ToolbarItem = styled.div<{ minimal?: boolean }>`
	display: flex;
	align-items: center;
	& > * {
		margin-left: 0;
	}
`;
const ToolbarItemLeft = styled(ToolbarItem)`
	flex: 1 1 0;
`;
const ToolbarItemCenter = styled(ToolbarItem)`
	flex: 0 0 auto;
`;
const ToolbarItemRight = styled(ToolbarItem)`
	margin-left: 1rem;
	flex: 1 1 0;
	justify-content: flex-end;
`;

interface ToolbarProps {
	className?: string;
	left?: ReactNode;
	right?: ReactNode;
	center?: ReactNode;
	minimal?: boolean;
	toolbarCss?: string;
	leftCss?: string;
	centerCss?: string;
	rightCss?: string;
}

/**
 * Toolbar with perfectly positioned elements
 *
 * @param {object} props
 * @param {any} [props.className] Classname for the toolbar component
 * @param {any} [props.left] What to put in the left side
 * @param {any} [props.center] What to put in the center
 * @param {any} [props.right] What to put in the right side
 * @param {any} [props.toolbarCss] Additional css to apply to the toolbar
 * @param {any} [props.leftCss] Additional css to apply to the left header wrapper
 * @param {any} [props.centerCss] Additional css to apply to the center header wrapper
 * @param {any} [props.rightCss] Additional css to apply to the right header wrapper
 * @param {boolean} [props.minimal] Smaller version
 */
export function Toolbar({
	left,
	right,
	center,
	minimal,
	toolbarCss,
	leftCss,
	centerCss,
	rightCss,
	...props
}: ToolbarProps) {
	if (!isValidChildren(center)) {
		return (
			<Styled minimal={minimal} css={toolbarCss} {...props}>
				<ToolbarItem minimal={minimal} css={leftCss}>
					{left}
				</ToolbarItem>
				<ToolbarItem minimal={minimal} css={rightCss}>
					{right}
				</ToolbarItem>
			</Styled>
		);
	}
	return (
		<Styled minimal={minimal} css={toolbarCss} {...props}>
			<ToolbarItemLeft minimal={minimal} css={leftCss}>
				{left}
			</ToolbarItemLeft>
			<ToolbarItemCenter minimal={minimal} css={centerCss}>
				{center}
			</ToolbarItemCenter>
			<ToolbarItemRight minimal={minimal} css={rightCss}>
				{right}
			</ToolbarItemRight>
		</Styled>
	);
}

const WithToolbarContainer = styled.div.withConfig({ shouldForwardProp: excludeProps(['fullWidth', 'fullHeight']) })<{
	fullWidth?: boolean;
	fullHeight?: boolean;
}>`
	${ifProp('fullWidth', 'width: 100%;')}
	${ifProp('fullHeight', 'height: 100%;')}
	display: flex;
	flex-direction: column;
	& > *:nth-child(2) {
		flex: 1;
	}
`;

interface WithToolbarProps extends ToolbarProps {
	className?: string;
	fullWidth?: boolean;
	fullHeight?: boolean;
	children?: ReactNode;
	toolbarCss?: string;
	leftCss?: string;
	centerCss?: string;
	rightCss?: string;
}

/**
 * Just a helper to add a toolbar to the container
 *
 * @param {any} props
 */
export function WithToolbar({
	fullWidth,
	fullHeight,
	left,
	right,
	center,
	children,
	leftCss,
	centerCss,
	rightCss,
	toolbarCss,
	...props
}: WithToolbarProps) {
	return (
		<WithToolbarContainer {...{ fullWidth, fullHeight }} {...props}>
			<Toolbar {...{ left, right, center, leftCss, centerCss, rightCss, toolbarCss }} />
			<div>{children}</div>
		</WithToolbarContainer>
	);
}
