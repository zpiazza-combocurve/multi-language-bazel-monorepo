import { act, renderHook } from '@testing-library/react-hooks';

import { useTableSelection } from './shared';

describe('cost-model/detail-components/shared.test.tsx', () => {
	describe('useTableSelection', () => {
		const inputArray = ['tableKey1', 'tableKey2', 'tableKey3'];

		describe('initial state - selected is instantiated by emptySelection function', () => {
			test('returns selected as an object where all the input array values becomes keys and their values are null', () => {
				const expectedReturn = { tableKey1: null, tableKey2: null, tableKey3: null };
				const { result } = renderHook(() => useTableSelection(inputArray));
				expect(result.current.selected).toStrictEqual(expectedReturn);
			});
		});

		describe('mutated state - onSelect can be used to mutate the state', () => {
			test('returns onSelect as a function that mutates the state', async () => {
				const expectedReturn = { tableKey1: 'changed value', tableKey2: null, tableKey3: null };
				const { result } = renderHook(() => useTableSelection(inputArray));
				act(() => result.current.onSelect('tableKey1', 'changed value'));
				expect(result.current.selected).toEqual(expectedReturn);
			});
		});
	});
});
