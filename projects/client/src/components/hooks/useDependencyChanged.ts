import { useEffect } from 'react';

import { ColorCSS, coloredDebug } from '@/helpers/utilities';

/** This hook is using for debugging, it prints debug message in console every time when dependency has changed */

export const useDependencyChanged = ({
	name,
	value,
	color = 'pink',
}: {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	color?: string | ColorCSS;
}) => {
	useEffect(() => {
		coloredDebug({
			message: `${name} has changed!`,
			bgColor: color,
			payload: value,
		});
	}, [value, name, color]);
};
