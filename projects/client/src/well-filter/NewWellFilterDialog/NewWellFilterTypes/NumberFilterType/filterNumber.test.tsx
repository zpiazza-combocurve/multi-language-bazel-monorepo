import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterNumber } from './filterNumber';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: '',
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Number', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterNumber
					maxValue=''
					minValue=''
					showNull
					inputName='Additive Vol (All Jobs)'
					projectHeader={false}
					inputKey='total_additive_volume'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
