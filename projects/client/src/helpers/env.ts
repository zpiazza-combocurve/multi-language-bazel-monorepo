/** Env check functions @module */

export function isDevelopmentRoute() {
	const hostname = window.location.hostname;
	return (
		hostname.match(/^.*\d?test\.combocurve\.com/) ||
		hostname.match(/^localhost/) ||
		hostname.match(/^.*dev\d+\.combocurve\.com/)
	);
}

function isStageRoute() {
	const hostname = window.location.hostname;
	return hostname.match(/^.*\d?stage\d*\.combocurve\.com/);
}

function isInternalGenericLoginPage() {
	const hostname = window.location.hostname;
	return (
		hostname.match(/^appdev\d+\.combocurve\.com/) ||
		hostname.match(/^apptest\.combocurve\.com/) ||
		hostname.match(/^appstage\.combocurve\.com/)
	);
}

export function isNotProductionRoute() {
	return isDevelopmentRoute() || isStageRoute() || isInternalGenericLoginPage();
}

export function isIpRoute() {
	const hostname = window.location.hostname;
	return hostname.match(/^ip\.combocurve\.com/) || isStageRoute() || hostname.match(/^dev\d+\.combocurve\.com/);
}

export function isGenericLoginPage() {
	const hostname = window.location.hostname;
	return hostname.match(/^app\.combocurve\.com/) || isInternalGenericLoginPage();
}
