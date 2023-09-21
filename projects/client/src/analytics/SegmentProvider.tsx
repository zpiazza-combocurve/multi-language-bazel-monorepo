import { AnalyticsBrowser } from '@segment/analytics-next';
import { createContext } from 'react';

import { analytics } from './analytics';

// Source https://github.com/segmentio/analytics-next#using-react-advanced-w-react-context
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
export const AnalyticsContext = createContext<AnalyticsBrowser>(undefined!);

type Props = {
	children: React.ReactNode;
};

export const AnalyticsProvider = ({ children }: Props) => {
	return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>;
};
