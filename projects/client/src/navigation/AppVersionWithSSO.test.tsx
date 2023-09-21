import { render, screen } from '@testing-library/react';

import { TestWrapper, mockFlags } from '@/helpers/testing';
import { LDFeatureFlagKey } from '@/inpt-shared/feature-flags/shared';

import { AppVersionWithSSO } from './AppVersionWithSSO';

describe('AppVersionWithSSO', () => {
	beforeEach(() => {
		mockFlags({
			[LDFeatureFlagKey.releaseInfo]: {
				version: 'V1',
				portalUrl: 'http://v1-release-notes.com',
			},
		});
	});

	it('shows the right version number', async () => {
		render(
			<TestWrapper>
				<AppVersionWithSSO />
			</TestWrapper>
		);

		screen.getByText('V1');
	});

	it('shows the right portal url', async () => {
		render(
			<TestWrapper>
				<AppVersionWithSSO />
			</TestWrapper>
		);

		expect(screen.getByText('V1')).toHaveAttribute('href', 'http://v1-release-notes.com');
	});

	it('shows SSO if the user is enterprise', async () => {
		render(
			<TestWrapper store={{ user: { isEnterpriseConnection: true } }}>
				<AppVersionWithSSO />
			</TestWrapper>
		);

		screen.getByText('SSO', {
			exact: false,
		});
	});

	it('does not show SSO if the user is not enterprise', async () => {
		render(
			<TestWrapper>
				<AppVersionWithSSO />
			</TestWrapper>
		);

		expect(screen.queryByText('SSO')).not.toBeInTheDocument();
	});
});
