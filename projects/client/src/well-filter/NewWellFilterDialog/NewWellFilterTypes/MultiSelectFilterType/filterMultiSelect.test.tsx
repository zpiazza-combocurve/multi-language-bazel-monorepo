import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterMultiSelect } from './filterMultiSelect';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: '',
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Multiselect', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterMultiSelect
					appliedFilters={[]}
					values={new Set()}
					collapsed={false}
					inputValue=''
					showNull
					inputName='API 14'
					projectHeader={false}
					inputKey='api14'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
