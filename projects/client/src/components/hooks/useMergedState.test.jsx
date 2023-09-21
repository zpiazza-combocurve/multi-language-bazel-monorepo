/* eslint-disable jest/expect-expect */
import { renderHookExt } from './hook-test-helper';
import { useMergedState } from './useMergedState';

describe('hooks/useMergedState', () => {
	test('get state', () => {
		const { check } = renderHookExt(() => {
			const [state] = useMergedState({ foo: 'bar' });
			return { state };
		});
		check({ state: { foo: 'bar' } });
	});
	test('set state', () => {
		const { check, result, act } = renderHookExt(() => {
			const [state, setState] = useMergedState({ foo: 'bar' });
			return { state, setState };
		});
		check({ state: { foo: 'bar' } });
		act(() => result.current.setState({ hello: 'world' }));
		check({ state: { foo: 'bar', hello: 'world' } });
	});
});
