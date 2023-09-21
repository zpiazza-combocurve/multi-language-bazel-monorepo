// https://github.com/react-ga/react-ga
// https://developers.google.com/analytics/devguides/collection/gtagjs/cookies-user-id#cookie_domain_configuration
import ReactGA from 'react-ga';

const GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID;
const NODE_ENV = process.env.NODE_ENV;

const USER_DIMENSION = 'dimension1';
const COMPANY_DIMENSION = 'dimension2';

// TODO assert for GOOGLE_ANALYTICS_ID
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
ReactGA.initialize(GOOGLE_ANALYTICS_ID!, {
	debug: NODE_ENV === 'development',
});

export const setDimensions = (user, tenant) => {
	const userInfo = `${user.firstName} ${user.lastName} <${user.email}>`;
	ReactGA.set({
		[USER_DIMENSION]: userInfo,
		// TODO revert this after fixed in db
		// company is always comming from the backend as Inside Petroleum
		// [COMPANY_DIMENSION]: user.company,
		[COMPANY_DIMENSION]: tenant,
	});
};

export { ReactGA };
