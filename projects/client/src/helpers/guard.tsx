import { NavigateFunction } from 'react-router-dom';

import { failureAlert } from './alerts';
import { session } from './storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type GuardCheck<P = any> = (props: { target: GuardCheck<P> } & P) => Promise<boolean>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface GuardProps<P = any> {
	checks: GuardCheck<P>[];
	navigate: NavigateFunction;
}

async function doChecks(checks: GuardCheck[], props: GuardProps) {
	for (const check of checks) {
		const result = await check({ ...props, target: check });
		if (!result) return false;
	}
	return true;
}

export default class Guard {
	props: GuardProps;

	constructor(props: GuardProps) {
		this.props = props;
	}

	async shouldRoute() {
		const { checks, navigate } = this.props;

		const passed = await doChecks(checks, this.props);

		// explicit check, do not change to if (passed)
		if (passed === true) {
			return true;
		}

		session.setItem('loginError', { permission: true });

		navigate('/login-error');

		return false;
	}

	async navigate() {
		const { checks } = this.props;

		const passed = await doChecks(checks, this.props);

		// explicit check, do not change to if (passed)
		if (passed === true) {
			return true;
		}

		// TODO what message to show if there's an error
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		await failureAlert(passed as any, 3000);

		return false;
	}
}
