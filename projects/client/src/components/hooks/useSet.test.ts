import { renderHookExt } from './hook-test-helper';
import { useSet } from './useSet';

describe('hooks/useSet', () => {
	test('initial state', () => {
		const { check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		check({ set: new Set([1, 2, 3, 4]) });
	});
	test('add', () => {
		const { act, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		act(({ add }) => add(6));
		check({ set: new Set([1, 2, 3, 4, 6]) });
		act(({ add }) => add([7]));
		check({ set: new Set([1, 2, 3, 4, 6, 7]) });
		act(({ add }) => add(new Set([8])));
		check({ set: new Set([1, 2, 3, 4, 6, 7, 8]) });
	});
	test('remove', () => {
		const { act, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		act(({ remove }) => remove(3));
		check({ set: new Set([1, 2, 4]) });
	});
	test('toggle', () => {
		const { act, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		act(({ toggle }) => toggle(3));
		check({ set: new Set([1, 2, 4]) });
		act(({ toggle }) => toggle(5));
		check({ set: new Set([1, 2, 4, 5]) });
	});
	test('clear', () => {
		const { act, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		act(({ clear }) => clear());
		check({ set: new Set([]) });
	});
	test('setSet', () => {
		const { act, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		act(({ setSet }) => setSet([7, 8, 9]));
		check({ set: new Set([7, 8, 9]) });
		act(({ setSet }) => setSet(new Set([10, 11])));
		check({ set: new Set([10, 11]) });
	});
	test('derived set', () => {
		const { rerender, check } = renderHookExt(useSet, { initialProps: new Set([1, 2, 3, 4]) });
		check({ set: new Set([1, 2, 3, 4]) });
		rerender(new Set([6, 7, 8]));
		check({ set: new Set([6, 7, 8]) });
	});
	test('initial state from array', () => {
		const { check } = renderHookExt(useSet, { initialProps: [1, 2, 3, 4] });
		check({ set: new Set([1, 2, 3, 4]) });
	});
});
