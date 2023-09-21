import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterDateRange } from './filterDateRange';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: {},
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Date Range', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterDateRange
					start_date=''
					end_date=''
					showNull
					inputName='Updated At'
					projectHeader={false}
					inputKey='updatedAt'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
