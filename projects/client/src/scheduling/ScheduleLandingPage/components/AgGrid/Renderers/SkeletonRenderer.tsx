import { useEffect, useMemo, useState } from 'react';

function getRandomNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const SkeletonRenderer = () => {
	const [opacity, setOpacity] = useState(1);
	const width = useMemo(() => getRandomNumber(100, 10), []);

	useEffect(() => {
		const timer = setTimeout(() => setOpacity((previous) => (previous === 1 ? 0 : 1)), 1000);

		return () => {
			clearTimeout(timer);
		};
	}, [opacity]);

	return (
		<div
			css={`
				margin-top: 8px;
				height: 24px;
				width: ${width}px;
				background: #525252;
				border-radius: 6px;
				opacity: ${opacity};
				transition: opacity 0.5s ease-in-out;
			`}
		/>
	);
};
