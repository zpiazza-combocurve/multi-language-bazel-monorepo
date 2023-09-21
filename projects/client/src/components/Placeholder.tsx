import { useState } from 'react';
import styled, { css } from 'styled-components';

import { Centered } from './Centered';
import Doggo from './Doggo';
import { useLoadingShown } from './hooks/index';

const EmptyText = styled.span<{ size?: number }>`
	${({ size }) => css`
		font-size: ${size || 1}rem;
	`}
`;

interface PlaceholderProps {
	children?: React.ReactNode;
	className?: string;
	/** If it is empty (`loading` state takes precedence from `empty`) */
	empty?: boolean;
	emptySize?: number;
	/** Error text to show takes precedence from `empty`, but not from `loading` */
	error?: string;
	/**
	 * When true, will force the placeholder to run its minShow and minHide time regardless of loading status on first
	 * render
	 */
	forceOnFirstRender?: boolean;
	/** If it is loading */
	loading?: boolean;
	/** Min time before hide */
	loadingIndicator?: React.ComponentType<{ small?: boolean; medium?: boolean; underDog?: string }>;
	/** Text to show when loading */
	loadingText?: string;
	/** If it is a big doggo or not */
	main?: boolean;
	/** Min time before show */
	minHide?: number;
	/** Min time before hide */
	minShow?: number;
	/** Text to show when it is empty */
	text?: string;
}

/**
 * Centered placeholder when loading/empty data.
 *
 * @todo Make a better placeholder component
 */
export function Placeholder({
	children = null,
	className,
	empty,
	emptySize,
	error,
	forceOnFirstRender = false,
	loading,
	loadingIndicator: LoadingIndicator = Doggo,
	loadingText,
	main,
	minHide,
	minShow,
	text,
}: PlaceholderProps) {
	const [hasRun, setHasRun] = useState(false);
	const shouldShowTheDog = useLoadingShown({
		loading,
		minShow,
		minHide,
		forceOnFirstRender,
		setHasRun,
	});
	if (loading || (forceOnFirstRender && !hasRun)) {
		if (!shouldShowTheDog) {
			return null;
		}
		return (
			<Centered className={className} horizontal vertical>
				<LoadingIndicator small={!main} medium={main} underDog={loadingText} />
			</Centered>
		);
	}
	if (error) {
		return (
			<Centered className={className} horizontal vertical>
				<h5>{error}</h5>
			</Centered>
		);
	}
	if (empty) {
		return (
			<Centered className={className} horizontal vertical>
				<EmptyText size={emptySize}>{text ?? 'There is no data'}</EmptyText>
			</Centered>
		);
	}

	// We need to return a React fragment wrapped children to satisfy TS return type of JSX.Element
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
}
