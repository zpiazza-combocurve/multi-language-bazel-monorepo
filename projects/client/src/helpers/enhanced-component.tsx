import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export type RouteGuardResultType = boolean | Promise<boolean>;

export interface RouteGuard {
	shouldRoute: () => RouteGuardResultType;
}

export interface EnhancedComponentProps {
	routeGuard: RouteGuard;
	redirectToPathWhenFail?: string;
	componentWhenFail?: JSX.Element;
}

export const EnhancedComponent: React.FC<EnhancedComponentProps> = ({
	children,
	routeGuard,
	redirectToPathWhenFail,
	componentWhenFail,
}) => {
	const [routeGuardFinished, setRouteGuardFinished] = useState(false);
	const [routeGuardResult, setRouteGuardResult] = useState<boolean | null>(null);

	const initGuardRouteCheck = useCallback(async () => {
		const tempRouteGuardResult = routeGuard?.shouldRoute();
		if (typeof tempRouteGuardResult === 'boolean') {
			setRouteGuardFinished(true);
			setRouteGuardResult(tempRouteGuardResult);
			return;
		}
		if (tempRouteGuardResult instanceof Promise) {
			try {
				const routeGuardResult = await tempRouteGuardResult;
				setRouteGuardFinished(true);
				setRouteGuardResult(routeGuardResult);
			} catch {
				setRouteGuardFinished(true);
			}
		}
	}, [routeGuard]);

	useEffect(() => {
		initGuardRouteCheck();
	}, [initGuardRouteCheck]);

	const navigatePath = redirectToPathWhenFail ?? '/';
	const failNavigate = <Navigate to={navigatePath} replace />;

	// `componentWhenFail` got higher priority than `redirectToPathWhenFail`
	const failScenarioComponent = componentWhenFail ?? failNavigate;

	// Resolves if route guard has already finished and it's result has been updated to `false`
	if (routeGuardFinished && routeGuardResult === false) {
		// React Router's `element` requires us to return a React Node at all times, which is not always so with `children`
		// Hence we add a React fragment to wrap it up.
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <>{failScenarioComponent}</>;
	}

	if (routeGuardFinished) {
		if (routeGuardResult) {
			// React Router's `element` requires us to return a React Node at all times, which is not always so with `children`
			// Hence we add a React fragment to wrap it up.
			// eslint-disable-next-line react/jsx-no-useless-fragment
			return <>{children}</>;
		} else {
			return null;
		}
	} else {
		return null;
	}
};
