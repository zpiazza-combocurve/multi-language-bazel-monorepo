import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';

// time to wait after loading becomes true before showing the indicator
// no indicator will be shown at all if the loading duration is shorter than this value
const MIN_INDICATOR_SHOW_DELAY = 1000;

// after showing the indicator wait at least this time before hiding it
const MIN_INDICATOR_DURATION = 350;

/** Adjusts the timing of transitions between loading/not loading states so it feels better to the user */
export function useLoadingShown({
	forceOnFirstRender = false,
	loading,
	minHide = MIN_INDICATOR_DURATION,
	minShow = MIN_INDICATOR_SHOW_DELAY,
	setHasRun = _.identity, // why using _.identity here? probably better to use _.noop instead
}: {
	forceOnFirstRender?: boolean;
	loading?: boolean;
	minHide?: number;
	minShow?: number;
	setHasRun?: (hasRun: boolean) => void;
}) {
	const [loadingShown, setLoadingShown] = useState(false);
	const loadingStart = useRef<null | number>(null);
	const firstRunComplete = useRef(false);

	useEffect(() => {
		let timeout;
		if (loading || (forceOnFirstRender && !firstRunComplete.current)) {
			firstRunComplete.current = true;
			if (!loadingShown) {
				timeout = setTimeout(() => {
					loadingStart.current = Date.now();
					setLoadingShown(true);
				}, minShow);
			}
		} else if (loadingShown) {
			const loadingDuration =
				Date.now() -
				// @ts-expect-error TODO investigate if this might cause an issue
				loadingStart.current;
			const remainingTime = Math.max(minHide - loadingDuration, 0);
			timeout = setTimeout(() => {
				loadingStart.current = null;
				setLoadingShown(false);
				setHasRun(true);
			}, remainingTime);
		}

		return () => clearTimeout(timeout);
	}, [loading, loadingShown, minShow, minHide, forceOnFirstRender, setHasRun]);

	return loadingShown;
}
