/* eslint-disable jest/expect-expect */
import { renderHookExt } from './hook-test-helper';
import { useNewValueOnChange } from './useNewValueOnChange';

describe('hooks/useNewValueOnChange', () => {
	function useTest({ initial, deps }) {
		const value = useNewValueOnChange(initial, deps);
		return { value };
	}
	test('change on changed dependencies', () => {
		const { check, rerender } = renderHookExt(useTest, { initialProps: { initial: 3, deps: [] } });
		check({ value: 3 });
		rerender({ initial: 5, deps: [] });
		check({ value: 3 });
	});
	test("same if dependencies don't change", () => {
		const { check, rerender } = renderHookExt(useTest, { initialProps: { initial: 3, deps: [1] } });
		check({ value: 3 });
		rerender({ initial: 5, deps: [1] });
		check({ value: 3 });
		rerender({ initial: 5, deps: [2] });
		check({ value: 5 });
	});
});
