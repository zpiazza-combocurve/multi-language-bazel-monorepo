/* eslint react/jsx-key: warn */
import { memo } from 'react';
import styled, { keyframes } from 'styled-components';

import { Paper } from '@/components';

const dotKeyframes = keyframes`
	0% {
		opacity: 0;
	}
	50% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
`;

// used this as base https://jsfiddle.net/DkcD4/94/
const LoadingDot = styled.span`
	opacity: 0;
	animation: ${dotKeyframes} 1.3s infinite;
	animation-delay: ${({ delay }) => delay || 0}ms;
`;

// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
const LoadingDots3 = memo(() => [0, 100, 200].map((delay) => <LoadingDot delay={delay}>.</LoadingDot>));

export const MarginPaper = styled(Paper)`
	padding: 1rem;
	margin-top: 1rem;
	min-height: 10rem;
`;

const ImportingMessage = ({ message = 'Importing Files' }) => (
	<h3>
		{message}
		<LoadingDots3 />
	</h3>
);

export const ImportData = ({ stats, importing, importingMessage }) => {
	if (importing || stats) {
		return <MarginPaper>{stats || <ImportingMessage message={importingMessage} />}</MarginPaper>;
	}
	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	return <></>;
};
