import { useContext, useEffect, useMemo, useState } from 'react';

import { LinearProgressWithLabel } from '@/components/v2/misc';
import { ProgressBarContext } from '@/helpers/alerts';

function cleanProgress(progress: number | undefined | null | false) {
	if (!progress) {
		return undefined;
	}

	if (progress <= 0 || 100 < progress) {
		return undefined;
	}

	return progress;
}

export function WithProgress({ children }) {
	const [progress, setProgress] = useState<number | undefined | null>(null);
	return (
		<ProgressBarContext.Provider value={useMemo(() => ({ progress, setProgress }), [progress])}>
			{typeof progress === 'number' && (
				<LinearProgressWithLabel value={progress} css={{ position: 'absolute', width: '100vw', zIndex: 5 }} />
			)}
			{children}
		</ProgressBarContext.Provider>
	);
}

export function useProgressBar(progress?: number | false | undefined | null) {
	const { setProgress } = useContext(ProgressBarContext);
	useEffect(() => {
		setProgress?.(cleanProgress(progress));
	}, [progress, setProgress]);
	useEffect(() => () => setProgress?.(null), [setProgress]);
}
