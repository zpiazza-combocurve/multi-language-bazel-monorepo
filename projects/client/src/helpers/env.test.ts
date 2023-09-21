import { isDevelopmentRoute, isGenericLoginPage, isIpRoute, isNotProductionRoute } from './env';

function setHostname(hostname) {
	Object.defineProperty(window, 'location', {
		get() {
			return { hostname };
		},
	});
}

describe('helpers/env', () => {
	let originalHostname;
	beforeAll(() => {
		originalHostname = window.location.hostname;
	});

	afterEach(() => {
		setHostname(originalHostname);
	});

	test.each([
		'ip.combocurve.com',
		'stage.combocurve.com',
		'stage1.combocurve.com',
		'dev8.combocurve.com',
		'dev10.combocurve.com',
	])('isIpRoute Truthy - %s', (hostname) => {
		setHostname(hostname);
		expect(isIpRoute()).toBeTruthy();
	});

	test.each(['', 'my-test.combocurve.com', 'dev-03.combocurve.com', 'localhost'])(
		'isIpRoute Falsy - %s',
		(hostname) => {
			setHostname(hostname);
			expect(isIpRoute()).toBeFalsy();
		}
	);

	test.each([
		'test.combocurve.com',
		'dev1.combocurve.com',
		'dev10.combocurve.com',
		'my-test.combocurve.com',
		'localhost',
		'qa4dev1.combocurve.com',
		'fixtures4dev1.combocurve.com',
		'qa4test.combocurve.com',
		'fixtures4test.combocurve.com',
	])('isDevelopmentRoute() Truthy - %s', (hostname) => {
		setHostname(hostname);
		expect(isDevelopmentRoute()).toBeTruthy();
	});

	test.each(['', 'dev-03.combocurve.com'])('isDevelopmentRoute() Falsy - %s', (hostname) => {
		setHostname(hostname);
		expect(isDevelopmentRoute()).toBeFalsy();
	});

	test.each([
		'test.combocurve.com',
		'localhost',
		'stage.combocurve.com',
		'stage1.combocurve.com',
		'dev8.combocurve.com',
		'dev10.combocurve.com',
		'appdev1.combocurve.com',
		'appstage.combocurve.com',
		'apptest.combocurve.com',
		'appdev10.combocurve.com',
	])('isNotProductionRoute() Truthy - %s', (hostname) => {
		setHostname(hostname);
		expect(isNotProductionRoute()).toBeTruthy();
	});

	test.each(['', 'ip.combocurve.com', 'dev-03.combocurve.com', 'app.combocurve.com'])(
		'isNotProductionRoute() Falsy - %s',
		(hostname) => {
			setHostname(hostname);
			expect(isNotProductionRoute()).toBeFalsy();
		}
	);

	test.each([
		'',
		'ip.combocurve.com',
		'stage.combocurve.com',
		'test.combocurve.com',
		'support.a.combocurve.com',
		'dev8.combocurve.com',
		'dev10.combocurve.com',
		'dev-03.combocurve.com',
		'devapp.combocurve.com',
	])('isGenericLoginPage() Falsy - %s', (hostname) => {
		setHostname(hostname);
		expect(isGenericLoginPage()).toBeFalsy();
	});

	test.each([
		'app.combocurve.com',
		'appdev1.combocurve.com',
		'appstage.combocurve.com',
		'apptest.combocurve.com',
		'appdev10.combocurve.com',
	])('isGenericLoginPage() Truthy - %s', (hostname) => {
		setHostname(hostname);
		expect(isGenericLoginPage()).toBeTruthy();
	});
});
