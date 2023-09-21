import { render } from '@testing-library/react';

import { TestWrapper } from '@/helpers/testing';

import { HeaderSelect } from './NewHeaderSelect';

describe('Header Select', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<HeaderSelect
					selectedHeaders={[]}
					wellHeaders={[]}
					projectHeaders={[]}
					onHeaderSelectChange={() => ''}
				/>
			</TestWrapper>
		);
	});
});
