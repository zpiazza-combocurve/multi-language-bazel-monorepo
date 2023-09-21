import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterMultiCheckbox } from './filterMultiCheck';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: {},
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Multiselect', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterMultiCheckbox
					values={new Set()}
					options={[]}
					showNull
					inputName='Data Pool'
					projectHeader={false}
					inputKey='dataPool'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
