import { faCompress, faExpand } from '@fortawesome/pro-regular-svg-icons';
import { Children, ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Toolbar } from '@/components/Toolbar';
import { useDerivedState, useOnWillUnmount } from '@/components/hooks';
import { IconButton, Paper } from '@/components/v2';
import { excludeProps, ifProp, unlessProp } from '@/helpers/styled';

import { SectionAIO } from './Section';

const MAXIMIZED_SYMBOL = Symbol('ChartLayoutElement maximized value');

const SPACE = 0.5;

const FULL_GRID = `100%`;
const HALF_GRID = (elementsPerRow, verticalGap) =>
	`calc(${100 / elementsPerRow}% - ${verticalGap / elementsPerRow}rem)`;

const Container = styled.div<{
	halfWidth?: boolean;
	halfHeight?: boolean;
	elementsPerRow?: number;
	verticalGap?;
	padding?: number;
}>`
	width: 100%;
	height: 100%;
	${unlessProp('noOverflow', 'overflow: auto;')}
	display: grid;
	${({ halfWidth, halfHeight, elementsPerRow = 2, verticalGap = SPACE, padding = 2 }) => `
		grid-template-columns: ${
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			halfWidth ? `repeat(${elementsPerRow}, minmax(0, ${HALF_GRID(elementsPerRow, verticalGap)}))` : FULL_GRID
		};

		grid-auto-rows: ${
			halfHeight
				? // eslint-disable-next-line new-cap -- TODO eslint fix later
				  HALF_GRID(2, verticalGap)
				: FULL_GRID
		};
		gap: ${SPACE}rem ${verticalGap}rem;
		padding: ${padding}px;
	`}
	${ifProp('padded', `padding: ${SPACE}rem;`)}
`;

const CardContainer = styled(Paper).withConfig({ shouldForwardProp: excludeProps(['noPadding', 'hidden']) })<{
	$standalone?: boolean;
	noPadding?: boolean;
	hidden?: boolean;
	opaque?: boolean;
}>`
	${({ $standalone }) => $standalone && 'width: 100%; height: 100%;'}
	padding: 0.5rem;
	${ifProp('noPadding', 'padding: 0;')}
	${({ hidden }) => hidden && 'display: none;'}
	transition: all 0.3s ease;
	${({ opaque }) => opaque && 'background-color: var(--background-opaque);'}
`;

export const CardsLayoutContext = createContext<{
	maximized: symbol | null;
	toggleMaximized: (value: symbol | null) => void;
	inverted?;
	toggleInverted?;
	count: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
}>({} as any);

interface CardsLayoutProps {
	children?: ReactNode;
	halfWidth?: boolean;
	halfHeight?: boolean;
	elementsPerRow?: number;
	inverted?: boolean;
	className?: string;
	count?: number;
	padding?: number;
	forceMaximized?: boolean;
}

export function CardsLayout({
	children,
	elementsPerRow = 2,
	halfHeight,
	halfWidth,
	inverted: initInverted,
	padding,
	forceMaximized = false,

	// HACK: use inputCount to enforce a size
	count: inputCount,
	...props
}: CardsLayoutProps) {
	const count = inputCount ?? Children.count(children); // TODO check if this is safe, will a phony children mess up the count?
	const [inverted, setInverted] = useState(initInverted);
	const [maximized, setMaximized] = useDerivedState(!forceMaximized ? null : MAXIMIZED_SYMBOL, [count]);

	const toggleInverted = useCallback(() => setInverted((prev) => !prev), []);
	const toggleMaximized = useCallback(
		(value) => setMaximized((prev) => (prev === value ? null : value)),
		[setMaximized]
	);

	let isHalfWidth;
	let isHalfHeight;
	if (count >= 2) {
		if (inverted) {
			isHalfHeight = true;
		} else {
			isHalfWidth = true;
		}
	}
	if (count >= 3) {
		if (inverted) {
			isHalfWidth = true;
		} else {
			isHalfHeight = true;
		}
	}

	isHalfWidth = halfWidth ?? isHalfWidth;
	isHalfHeight = halfHeight ?? isHalfHeight;

	return (
		// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
		<CardsLayoutContext.Provider value={{ maximized, toggleMaximized, inverted, toggleInverted, count }}>
			<Container
				elementsPerRow={elementsPerRow}
				halfWidth={!maximized && isHalfWidth}
				halfHeight={!maximized && isHalfHeight}
				padding={padding}
				{...props}
			>
				{children}
			</Container>
		</CardsLayoutContext.Provider>
	);
}

export const CardContext = createContext<{
	toggleButton: React.ReactNode;
	isMaximized: boolean;
	toggleMaximize: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
}>({} as any);

interface CardProps {
	left?: ReactNode;
	right?: ReactNode;
	center?: ReactNode;
	leftHeader?: ReactNode;
	rightHeader?: ReactNode;
	centerHeader?: ReactNode;
	children?: ReactNode;
	disableHeader?: boolean;
	disableOverflow?: boolean;
	minimal?: boolean;
	className?: string;
	noPadding?: boolean;
	toolbarCss?: string;
	rightCss?: string;
	opaque?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	iconsColor?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	iconsSize?: any;
	forceMaximized?: boolean;
	forceHideToggleButton?: boolean;
}

export function Card({
	children,
	left,
	center,
	right,
	leftHeader = left,
	centerHeader = center,
	rightHeader = right,
	disableHeader,
	minimal,
	disableOverflow,
	noPadding,
	toolbarCss,
	rightCss,
	opaque,
	iconsColor = 'secondary',
	iconsSize,
	forceMaximized = false,
	forceHideToggleButton = false,
	...props
}: CardProps) {
	// must use Symbol('ChartLayoutElement maximized value') instead of MAXIMIZED_SYMBOL because each child would
	// share the same maximize instance
	const value = useMemo(() => Symbol('ChartLayoutElement maximized value'), []);
	const { maximized, toggleMaximized, count } = useContext(CardsLayoutContext) ?? {};
	const maximize = useCallback(() => toggleMaximized(value), [toggleMaximized, value]);
	const isMaximized = maximized === value || forceMaximized;
	const showToggleButton = count > 1 && !forceMaximized;
	const toggleButton = useMemo(
		() =>
			!forceHideToggleButton &&
			showToggleButton && (
				<IconButton
					tooltipTitle={isMaximized ? 'Minimize' : 'Maximize'}
					tooltipPlacement='left'
					onClick={maximize}
					iconSize={iconsSize}
					size='small'
					color={iconsColor}
				>
					{isMaximized ? faCompress : faExpand}
				</IconButton>
			),
		[forceHideToggleButton, showToggleButton, isMaximized, maximize, iconsSize, iconsColor]
	);
	// HACK for when unmounting and mounting a card it doens't appear
	// if removing a maximized cards unmaximize it
	useOnWillUnmount(() => {
		if (isMaximized) {
			toggleMaximized(null);
		}
	});

	const contextValue = useMemo(
		() => ({ toggleButton, isMaximized, toggleMaximize: maximize }),
		[isMaximized, toggleButton, maximize]
	);

	return (
		<CardContext.Provider value={contextValue}>
			<CardContainer
				$standalone={count === undefined}
				hidden={!isMaximized && !!maximized}
				noPadding={noPadding}
				opaque={opaque}
				{...props}
			>
				<SectionAIO
					opaque={opaque}
					header={
						!disableHeader && (
							<Toolbar
								minimal={minimal}
								left={leftHeader}
								center={centerHeader}
								right={
									<>
										{rightHeader}
										{toggleButton}
									</>
								}
								toolbarCss={toolbarCss}
								rightCss={rightCss}
							/>
						)
					}
					disableOverflow={disableOverflow}
				>
					{children}
				</SectionAIO>
			</CardContainer>
		</CardContext.Provider>
	);
}
