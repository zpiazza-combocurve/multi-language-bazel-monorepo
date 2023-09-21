import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, AbilityContext, SUBJECTS, subject } from '@/access-policies/Can';
import { useAlfa } from '@/helpers/alfa';

import authClient from '../login/authClient';
import { establishSession } from '../login/callback';
import { EnhancedComponent } from './enhanced-component';
import Guard from './guard';

async function handleAuthenticated({ user, bootstrap }) {
	if (!(await authClient.isAuthenticated())) {
		// TODO check why not passing history to signIn function with @adam
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const silentLogin = await authClient.signIn();
		if (!silentLogin) {
			return 'Login expired. Please refresh the page.';
		}
		await establishSession(bootstrap);
	}
	if (!user) {
		return 'User missing. Please try again or refresh the page.';
	}
	return true;
}

async function projectAccess({ user, ability, project, bootstrap }) {
	const authed = await handleAuthenticated({ user, bootstrap });

	if (authed !== true) {
		return authed;
	}

	if (!project) {
		return 'Select A Project';
	}

	return ability.can(ACTIONS.View, subject(SUBJECTS.Projects, { _id: project._id }));
}

async function scenarioAccess({ user, scenario, bootstrap, ability }) {
	const authed = await handleAuthenticated({ user, bootstrap });

	if (authed !== true) {
		return authed;
	}

	if (!scenario) {
		return 'Select A Scenario';
	}

	return ability.can(ACTIONS.View, subject(SUBJECTS.Scenarios, { project: scenario.project._id }));
}

const Perms = {
	isLoggedIn: handleAuthenticated,
	projectAccess,
	scenarioAccess,
};

export default function createGuard({ checks, ...props }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return new Guard({ ...props, checks: (checks ?? []).map((check) => Perms[check]) } as any); // TODO improve types
}

type RouteGuardProps = {
	checks?: string[];
};

export const RouteGuard: React.FC<RouteGuardProps> = ({ checks, children }) => {
	const { bootstrapFn: bootstrap, ...props } = useAlfa();
	const navigate = useNavigate();
	const ability = useContext(AbilityContext);
	const guard = createGuard({ ...props, navigate, checks, bootstrap, ability });

	return <EnhancedComponent routeGuard={guard}>{children}</EnhancedComponent>;
};
