import { renderHook } from '@testing-library/react-hooks';

import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { FeatureFlags, LDFeatureFlagKey } from '@/inpt-shared/feature-flags/shared';

import { mockFlags } from './helpers/testing';

describe('feature flags', () => {
	describe('isCustomPDFEditorEnabled', () => {
		const flagKey: keyof FeatureFlags = 'isCustomPDFEditorEnabled';
		const flag = LDFeatureFlagKey.isCustomPDFEditorEnabled;
		test('feature flag matches lanchdarkly feature flag', () => {
			expect(flag).toBe('roll-out-custom-pdf-generation');
		});
		test('is off', () => {
			mockFlags({ [flag]: false });
			const hook = renderHook(() => useLDFeatureFlags());
			expect(hook.result.current[flagKey]).toBe(false);
		});
		test('is on', () => {
			mockFlags({ [flag]: true });
			const hook = renderHook(() => useLDFeatureFlags());
			expect(hook.result.current[flagKey]).toBe(true);
		});
	});
});
