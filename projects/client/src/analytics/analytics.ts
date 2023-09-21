import { AnalyticsBrowser } from '@segment/analytics-next';

import { isDevelopmentRoute } from '@/helpers/env';
import { userAgentInfo } from '@/helpers/userAgent';
import { getScreenResolutionInfo, getViewport } from '@/helpers/utilities';

const devPublicWriteKey = '6YPU6yJVj5TfTGW3Zec1KtIxja9FXytV';
const prodPublicWriteKey = 'iFUXC9dzF1hGTtebKP81rqrgXfCj15KD';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
let analytics: AnalyticsBrowser = null!;

if (process.env.NODE_ENV !== 'development') {
	const writeKey = isDevelopmentRoute() ? devPublicWriteKey : prodPublicWriteKey;
	analytics = AnalyticsBrowser.load({ writeKey });
}
if (process.env.NODE_ENV === 'development') {
	const noop = () => {
		// noop
	};
	// bypass analytics for development
	analytics = {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		identify: noop,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		group: noop,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		page: noop,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		reset: noop,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		track: noop,
	};
}

const updateGainsightPXGlobalContext = (additionalData: Record<string, unknown> = {}) => {
	// @ts-expect-error aptrinsic is gainsightpx call to update global context
	if (window?.aptrinsic) {
		const deviceType = userAgentInfo?.device?.type ?? 'Desktop';

		// @ts-expect-error aptrinsic is gainsightpx call to update global context
		window.aptrinsic('set', 'globalContext', {
			deviceType,
			...getScreenResolutionInfo(),
			...getViewport(),
			...additionalData,
		});
	}
};

const resetGainsightPXSession = () => {
	// Must be in if check since dev environments are not communicating with segment/gainstight
	// @ts-expect-error aptrinsic is gainsightpx call to reset session
	if (window?.aptrinsic) {
		// @ts-expect-error aptrinsic is gainsightpx call to reset session
		window.aptrinsic('reset');
	}
};

export { analytics, updateGainsightPXGlobalContext, resetGainsightPXSession };
