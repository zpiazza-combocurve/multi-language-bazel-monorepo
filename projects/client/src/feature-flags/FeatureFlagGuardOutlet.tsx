import { Outlet } from 'react-router-dom';

import FeatureFlagGuard from './FeatureFlagGuard';
import type { FeatureFlags } from './shared';

/**
 * @example
 * 	const routes = {
 * 		element: <FeatureFlagGuardOutlet flag='isCarbonEnabled' />,
 * 		children: [{ path: '/', element: <CarbonComponent /> }],
 * 	};
 */
export default function FeatureFlagGuardOutlet(props: { flag: keyof FeatureFlags }) {
	return (
		<FeatureFlagGuard flag={props.flag}>
			<Outlet />
		</FeatureFlagGuard>
	);
}
