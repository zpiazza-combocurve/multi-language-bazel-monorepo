import { PowerBIBaseClient } from './base';
import { IPowerBIAuth } from './utils/auth';

type RequestHeaders = Record<string, string> & { 'Content-Type'?: string; Authorization?: string };

let auth: IPowerBIAuth;
let client: PowerBIBaseClient;

// eslint-disable-next-line no-useless-escape -- TODO eslint fix later
const API_BASE_REGEX = /^https\:\/\/api\.powerbi\.com\//;

describe('base-client', () => {
	beforeAll(() => {
		auth = { getToken: () => Promise.resolve('abc123') };
	});

	beforeEach(() => {
		client = new PowerBIBaseClient(auth);
	});

	test('get() request is configured correctly', () => {
		const req = client.get('groups/abc/reports/123');
		expect(req.url).toMatch(API_BASE_REGEX);
		expect(req.options.method).toEqual('GET');
		expect((req.options.headers as RequestHeaders)['Content-Type']).toEqual('application/x-www-form-urlencoded');
	});

	test('post() request is configured correctly', () => {
		const req = client.post('groups/abc/reports/123/refreshes', { fieldA: 'valueA' });
		expect(req.url).toMatch(API_BASE_REGEX);
		expect(req.options.method).toEqual('POST');
		expect((req.options.headers as RequestHeaders)['Content-Type']).toEqual('application/json');
		expect(JSON.parse(String(req.options.body))).toHaveProperty('fieldA');
	});

	test('patch() request is configured correctly', () => {
		const req = client.patch('groups/abc/reports/123', { field1: 'value1' });
		expect(req.url).toMatch(API_BASE_REGEX);
		expect(req.options.method).toEqual('PATCH');
		expect((req.options.headers as RequestHeaders)['Content-Type']).toEqual('application/json');
		expect(JSON.parse(String(req.options.body))).toHaveProperty('field1');
	});
});
