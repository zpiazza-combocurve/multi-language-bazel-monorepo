// Allows using history object outside of react components
// https://stackoverflow.com/questions/51192811/how-to-use-history-using-withrouter-outside-component
// https://github.com/remix-run/react-router/issues/2740
// https://github.com/remix-run/react-router/issues/5237
// NOTE none of the above worked so following this https://stackoverflow.com/a/68636112/6051261
// Updated this approach with https://combocurve.atlassian.net/browse/CC-11309 by replacing history with navigate
import { createRef } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';

const navigateRef = createRef<NavigateFunction>();

export function NavigationHandler() {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	navigateRef.current = useNavigate();
	return null;
}

/** Global alias to useNavigate() */
export function navigate(path: string) {
	navigateRef.current?.(path);
}
