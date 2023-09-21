import { getAxisKey, getStartFeatureAxis } from './utils';

describe('getAxisKey', () => {
	it('only startFeature', () => {
		expect(getAxisKey({ startFeature: 'perf_lateral_length', opChain: [] })).toBe('perf_lateral_length');
	});
	it('length=2 chain', () => {
		expect(
			getAxisKey({
				startFeature: 'perf_lateral_length',
				opChain: [{ op: '/', opFeature: 'first_prop_weight' }],
			})
		).toBe('perf_lateral_length/first_prop_weight');
	});
});

describe('getStartFeatureAxis', () => {
	it('only startFeature', () => {
		expect(getStartFeatureAxis({ startFeature: 'perf_lateral_length', opChain: [] })).toStrictEqual({
			startFeature: 'perf_lateral_length',
			opChain: [],
		});
	});
	it('length=2 chain', () => {
		expect(
			getStartFeatureAxis({
				startFeature: 'perf_lateral_length',
				opChain: [{ op: '/', opFeature: 'first_prop_weight' }],
			})
		).toStrictEqual({
			startFeature: 'perf_lateral_length/first_prop_weight',
			opChain: [{ op: '*', opFeature: 'first_prop_weight' }],
		});
	});
});
